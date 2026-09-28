import { NextResponse } from "next/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { certificates, organizations } from "@/db/schema";
import { sendExpiryReminderEmail } from "@/lib/email";

export const maxDuration = 60;

// Runs once a day (see vercel.json). Emails recipients whose certificate expires within 30 days.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const due = await db
    .select({ c: certificates, orgName: organizations.name })
    .from(certificates)
    .innerJoin(organizations, eq(certificates.orgId, organizations.id))
    .where(
      and(
        eq(certificates.status, "active"),
        isNull(certificates.expiryReminderSentAt),
        gt(certificates.expiryDate, now),
        lt(certificates.expiryDate, in30Days)
      )
    );

  for (const { c, orgName } of due) {
    await sendExpiryReminderEmail({
      certificateId: c.id, to: c.recipientEmail, name: c.recipientName,
      course: c.courseTitle, orgName, certId: c.certId, expiryDate: c.expiryDate!,
    });
    await db.update(certificates).set({ expiryReminderSentAt: now }).where(eq(certificates.id, c.id));
  }

  return NextResponse.json({ reminded: due.length });
}
