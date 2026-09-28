import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, organizations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { revokeOnChain } from "@/lib/blockchain";
import { sendRevokedEmail } from "@/lib/email";

export const maxDuration = 60;

const schema = z.object({ reason: z.string().min(3).max(200) });

export async function POST(req: Request, { params }: { params: { certId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "A reason is required" }, { status: 400 });

  // the certificate must belong to the logged-in organization
  const [cert] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.certId, params.certId), eq(certificates.orgId, session.orgId)))
    .limit(1);
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  if (cert.status === "revoked") return NextResponse.json({ error: "Already revoked" }, { status: 409 });

  let tx;
  try {
    tx = await revokeOnChain(cert.certId, parsed.data.reason);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Blockchain transaction failed" }, { status: 502 });
  }

  await db
    .update(certificates)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      revokeReason: parsed.data.reason,
      revokeTxHash: tx.txHash,
    })
    .where(eq(certificates.id, cert.id));

  const [org] = await db.select().from(organizations).where(eq(organizations.id, session.orgId)).limit(1);
  await sendRevokedEmail({
    certificateId: cert.id, to: cert.recipientEmail, name: cert.recipientName,
    course: cert.courseTitle, orgName: org.name, certId: cert.certId, reason: parsed.data.reason,
  });

  return NextResponse.json({ ok: true, txHash: tx.txHash });
}
