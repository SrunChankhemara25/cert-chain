import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, organizations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: { certId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select({ c: certificates, orgName: organizations.name })
    .from(certificates)
    .innerJoin(organizations, eq(certificates.orgId, organizations.id))
    .where(and(eq(certificates.certId, params.certId), eq(certificates.orgId, session.orgId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdf = await generateCertificatePdf({
    certId: row.c.certId,
    recipientName: row.c.recipientName,
    courseTitle: row.c.courseTitle,
    orgName: row.orgName,
    issueDate: row.c.issueDate,
    expiryDate: row.c.expiryDate,
    txHash: row.c.txHash,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.c.certId}.pdf"`,
    },
  });
}
