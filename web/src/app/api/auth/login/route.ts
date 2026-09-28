import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { signPurposeToken } from "@/lib/auth";
import { generateCode, hashCode } from "@/lib/otp";
import { sendLoginCodeEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const lower = parsed.data.email.toLowerCase();
  const [org] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);
  const ok = org && (await bcrypt.compare(parsed.data.password, org.passwordHash));
  if (!org || !ok) return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });

  if (!org.emailVerified) {
    return NextResponse.json(
      { error: "EMAIL_NOT_VERIFIED", message: "Please verify your email before logging in.", email: org.email },
      { status: 403 }
    );
  }

  // Two-step login: password first, then a one-time code emailed to the account.
  const code = generateCode();
  const codeHash = await hashCode(code);
  const challenge = await signPurposeToken(
    { orgId: org.id, name: org.name, email: org.email, codeHash },
    "login",
    15
  );

  const emailSent = await sendLoginCodeEmail({ to: org.email, name: org.name, code });
  if (!emailSent) {
    return NextResponse.json(
      { error: "We could not send the login code. Please try again later." },
      { status: 503 }
    );
  }

  // No session yet - it is created only after the code is confirmed.
  return NextResponse.json({ ok: true, challenge, email: org.email });
}