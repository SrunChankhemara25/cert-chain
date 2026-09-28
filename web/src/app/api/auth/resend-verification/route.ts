import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { generateCode, hashCode, codeExpiryDate, isInCooldown } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const lower = parsed.data.email.toLowerCase();
  const [org] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);

  // Same response whether or not the account exists / is already verified,
  // so this endpoint can't be used to check which emails are registered.
  const generic = NextResponse.json({ ok: true, message: "If that account needs verifying, a new code has been sent." });

  if (!org || org.emailVerified) return generic;

  if (isInCooldown(org.verificationCodeExpiresAt)) {
    return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
  }

  const code = generateCode();
  const codeHash = await hashCode(code);
  const emailSent = await sendVerificationEmail({ to: org.email, name: org.name, code });
  if (!emailSent) {
    return NextResponse.json(
      { error: "We could not send the verification email. Please try again later." },
      { status: 503 }
    );
  }

  await db
    .update(organizations)
    .set({ verificationCodeHash: codeHash, verificationCodeExpiresAt: codeExpiryDate() })
    .where(eq(organizations.id, org.id));

  return generic;
}