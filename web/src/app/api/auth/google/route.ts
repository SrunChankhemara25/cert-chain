import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { SignJWT } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

// Starts the OAuth flow: sends the browser to Google's consent screen.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${appUrl}/login?error=GOOGLE_NOT_CONFIGURED`);
  }

  // CSRF protection: signed state + matching httpOnly cookie nonce.
  const nonce = randomBytes(16).toString("hex");
  const state = await new SignJWT({ nonce, mode })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  res.cookies.set("oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}