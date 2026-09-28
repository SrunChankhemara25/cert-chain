import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, organizations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { computeCertHash, generateCertId, unix } from "@/lib/hash";
import { issueOnChain } from "@/lib/blockchain";
import { generateCertificatePdf } from "@/lib/pdf";
import { sendIssuedEmail } from "@/lib/email";
import { endOfSelectedDay, isTodayOrEarlier } from "@/lib/datetime";

export const maxDuration = 60; // blockchain confirmation can take ~15-30 s

const schema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientEmail: z.string().email(),
  courseTitle: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  expiryDate: z.string().optional(), // YYYY-MM-DD or empty
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const input = parsed.data;

  // dates
  const issueDate = new Date(Math.floor(Date.now() / 1000) * 1000);
  let expiryDate: Date | null = null;
  if (input.expiryDate) {
  // End of the chosen day in local time so the displayed day always
  // matches the day the issuer selected (no UTC off-by-one).
  expiryDate = endOfSelectedDay(input.expiryDate);
  if (isNaN(expiryDate.getTime()) || isTodayOrEarlier(expiryDate)) {
    return NextResponse.json(
      { error: "Expiry date must be at least tomorrow" },
      { status: 400 }
    );
  }
}

  const [org] = await db.select().from(organizations).where(eq(organizations.id, session.orgId)).limit(1);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 401 });

  // 1) fingerprint  2) write it to the blockchain  3) save in DB
  const certId = generateCertId();
  const dataHash = computeCertHash({
    certId,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    courseTitle: input.courseTitle,
    issueDate,
    expiryDate,
  });

  let tx;
  try {
    tx = await issueOnChain(certId, dataHash, unix(expiryDate));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Blockchain transaction failed. Check wallet balance / RPC URL." },
      { status: 502 }
    );
  }

  const [row] = await db
    .insert(certificates)
    .values({
      certId,
      orgId: org.id,
      recipientName: input.recipientName.trim(),
      recipientEmail: input.recipientEmail.trim().toLowerCase(),
      courseTitle: input.courseTitle.trim(),
      description: input.description || null,
      issueDate,
      expiryDate,
      dataHash,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
    })
    .returning();

  // 4) PDF + email (a failure here must not undo the issued certificate)
  try {
    const pdf = await generateCertificatePdf({
      certId, recipientName: row.recipientName, courseTitle: row.courseTitle,
      orgName: org.name, issueDate, expiryDate, txHash: tx.txHash,
    });
    await sendIssuedEmail({
      certificateId: row.id, to: row.recipientEmail, name: row.recipientName,
      course: row.courseTitle, orgName: org.name, certId, pdf,
    });
  } catch (e) {
    console.error("PDF/email step failed:", e);
  }

  return NextResponse.json({ certificate: { certId, txHash: tx.txHash } });
}
