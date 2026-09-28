import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { signPurposeToken } from "@/lib/auth";
import { generateCode, hashCode } from "@/lib/otp";
import { sendLoginCodeEmail } from "@/lib/email";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const fail = (code: string) =>
  NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${code}`);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const googleError = url.searchParams.get("error"); // user cancelled / Google blocked
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedNonce = cookies().get("oauth_state")?.value;

  if (googleError) {
    console.error("Google OAuth error:", googleError); // see real reason in dev terminal
    return fail("GOOGLE_DENIED");
  }
  if (!code || !state) return fail("GOOGLE_FAILED");

  let payload;
  try {
    ({ payload } = await jwtVerify(state, secret()));
  } catch {
    return fail("GOOGLE_FAILED");
  }
  if (!storedNonce || payload.nonce !== storedNonce) return fail("GOOGLE_FAILED");

  // 1) Exchange the code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return fail("GOOGLE_FAILED");
  }
  const tokens = await tokenRes.json();

  // 2) Fetch the Google profile
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) return fail("GOOGLE_FAILED");
  const profile = await userRes.json();
  if (!profile.email || profile.email_verified !== true) {
    return fail("GOOGLE_EMAIL_UNVERIFIED");
  }

  // 3) Link to the existing account (password OR google) or create a new one
  const email = String(profile.email).toLowerCase();
  const name = String(profile.name || email.split("@")[0]).slice(0, 100);

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.email, email))
    .limit(1);

  if (!org) {
    // Brand-new Google signup: unusable random password hash, Google vouches
    // for the address - but the 6-digit code step below still runs.
    [org] = await db
      .insert(organizations)
      .values({
        name,
        email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        emailVerified: true,
        authProvider: "google",
      })
      .returning();
  } else if (!org.emailVerified) {
    // Existing password account that never verified: completing Google OAuth
    // with this inbox proves ownership of the address.
    await db
      .update(organizations)
      .set({ emailVerified: true })
      .where(eq(organizations.id, org.id));
  }

  // 4) EVERY Google sign-in confirms with a 6-digit emailed code first
  const otp = generateCode();
  const codeHash = await hashCode(otp);
  const challenge = await signPurposeToken(
    { orgId: org.id, name: org.name, email: org.email, codeHash },
    "login",
    15
  );

  const sent = await sendLoginCodeEmail({ to: org.email, name: org.name, code: otp });
  if (!sent) return fail("EMAIL_SEND_FAILED");

  const res = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/verify-login?token=${encodeURIComponent(
      challenge
    )}&email=${encodeURIComponent(org.email)}`
  );
  res.cookies.delete("oauth_state");
  return res;
}