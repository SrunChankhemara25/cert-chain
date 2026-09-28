import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protects every /dashboard page. API routes check the session themselves.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  try {
    if (!token) throw new Error("no session");
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET!));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/dashboard/:path*"] };
