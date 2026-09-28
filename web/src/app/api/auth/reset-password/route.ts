import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { verifyPurposeToken } from "@/lib/auth";

const schema = z.object({ token: z.string(), newPassword: z.string().min(8).max(100) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input (password needs 8+ characters)" }, { status: 400 });
  }

  const payload = await verifyPurposeToken(parsed.data.token, "reset");
  if (!payload) {
    return NextResponse.json(
      { error: "Your reset session is invalid or has expired. Please verify your code again." },
      { status: 400 }
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, String(payload.orgId)))
    .limit(1);
  if (!org) return NextResponse.json({ error: "Account not found" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db
    .update(organizations)
    .set({
      passwordHash,
      resetCodeHash: null,
      resetCodeExpiresAt: null,
      // Completing a reset also proves ownership of the email address.
      emailVerified: true,
    })
    .where(eq(organizations.id, org.id));

  // Deliberately no session here - require a fresh login with the new password.
  return NextResponse.json({ ok: true });
}