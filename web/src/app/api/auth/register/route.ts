import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { generateCode, hashCode, codeExpiryDate } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input (password needs 8+ characters)" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const lower = email.toLowerCase();

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = codeExpiryDate();

  const [existing] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);
  if (existing?.emailVerified) {
    return NextResponse.json({ error: "Email already registered. Please log in instead." }, { status: 409 });
  }

  const emailSent = await sendVerificationEmail({ to: lower, name, code });
  if (!emailSent) {
    return NextResponse.json(
      { error: "We could not send the verification email. Check the mail configuration and try again." },
      { status: 503 }
    );
  }

  if (existing) {
    await db
      .update(organizations)
      .set({ name, passwordHash, verificationCodeHash: codeHash, verificationCodeExpiresAt: expiresAt })
      .where(eq(organizations.id, existing.id));
  } else {
    await db.insert(organizations).values({
      name,
      email: lower,
      passwordHash,
      emailVerified: false,
      verificationCodeHash: codeHash,
      verificationCodeExpiresAt: expiresAt,
    });
  }

  return NextResponse.json({ ok: true, email: lower }, { status: 201 });
}