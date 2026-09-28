import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { signPurposeToken } from "@/lib/auth";
import { compareCode, isExpired } from "@/lib/otp";

const schema = z.object({ email: z.string().email(), code: z.string().length(6) });

// Step 2 of password reset: check the emailed code, hand back a short-lived
// reset token for step 3 (choosing the new password).
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const badCode = () => NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  const lower = parsed.data.email.toLowerCase();
  const [org] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);
  if (!org || !org.resetCodeHash || isExpired(org.resetCodeExpiresAt)) return badCode();

  const matches = await compareCode(parsed.data.code, org.resetCodeHash);
  if (!matches) return badCode();

  // Consume the code so it can't be reused.
  await db
    .update(organizations)
    .set({ resetCodeHash: null, resetCodeExpiresAt: null })
    .where(eq(organizations.id, org.id));

  const token = await signPurposeToken({ orgId: org.id }, "reset", 15);
  return NextResponse.json({ ok: true, token });
}