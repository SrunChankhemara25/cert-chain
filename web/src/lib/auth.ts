import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export type Session = { orgId: string; name: string };

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { orgId: payload.orgId as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE);
}
// ---------------------------------------------------------------- purpose-bound tokens
// Short-lived signed tokens for two-step flows (login code & password reset).
// Each carries a "purpose" claim so a token from one flow can never be
// replayed in another flow.
export async function signPurposeToken(
  payload: Record<string, unknown>,
  purpose: string,
  minutes = 15
): Promise<string> {
  return new SignJWT({ ...payload, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${minutes}m`)
    .sign(secret());
}

export async function verifyPurposeToken(
  token: string,
  purpose: string
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== purpose) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
