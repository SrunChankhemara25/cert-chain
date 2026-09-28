import { NextResponse } from "next/server";
import { z } from "zod";
import { signPurposeToken, verifyPurposeToken } from "@/lib/auth";
import { generateCode, hashCode } from "@/lib/otp";
import { sendLoginCodeEmail } from "@/lib/email";

const schema = z.object({ challenge: z.string() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const payload = await verifyPurposeToken(parsed.data.challenge, "login");
  if (!payload) {
    return NextResponse.json(
      { error: "This verification session has expired. Please log in again." },
      { status: 400 }
    );
  }

  // Rate limit: no resend within 30s of the current challenge being issued.
  const iat = Number(payload.iat ?? 0);
  if (Date.now() / 1000 - iat < 30) {
    return NextResponse.json(
      { error: "Please wait a moment before requesting another code." },
      { status: 429 }
    );
  }

  const code = generateCode();
  const codeHash = await hashCode(code);
  const challenge = await signPurposeToken(
    { orgId: payload.orgId, name: payload.name, email: payload.email, codeHash },
    "login",
    15
  );

  const emailSent = await sendLoginCodeEmail({
    to: String(payload.email),
    name: String(payload.name),
    code,
  });
  if (!emailSent) {
    return NextResponse.json(
      { error: "We could not send the code. Please try again later." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, challenge });
}