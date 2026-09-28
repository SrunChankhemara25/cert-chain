import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { generateCode, hashCode, codeExpiryDate, isInCooldown } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const lower = parsed.data.email.toLowerCase();
  const [org] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);

  // Always the same response - this endpoint must never reveal whether an
  // email is a registered organization.
  const generic = NextResponse.json({ ok: true, message: "If that email is registered, a reset code has been sent." });

  if (!org) return generic;
  if (isInCooldown(org.resetCodeExpiresAt)) return generic; // silently ignore rapid re-requests

  const code = generateCode();
  const codeHash = await hashCode(code);
  const emailSent = await sendPasswordResetEmail({ to: org.email, name: org.name, code });
  if (!emailSent) {
    return NextResponse.json(
      { error: "We could not send the reset email. Please try again later." },
      { status: 503 }
    );
  }

  await db
    .update(organizations)
    .set({ resetCodeHash: codeHash, resetCodeExpiresAt: codeExpiryDate() })
    .where(eq(organizations.id, org.id));

  return generic;
}