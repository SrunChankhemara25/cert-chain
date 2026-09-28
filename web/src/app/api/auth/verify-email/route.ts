import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { compareCode, isExpired } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const lower = parsed.data.email.toLowerCase();
  const [org] = await db.select().from(organizations).where(eq(organizations.email, lower)).limit(1);
  if (!org) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  if (org.emailVerified) {
    // Already verified (e.g. the user clicked back and resubmitted) - let them straight in.
    await createSession({ orgId: org.id, name: org.name });
    return NextResponse.json({ ok: true });
  }

  if (!org.verificationCodeHash || isExpired(org.verificationCodeExpiresAt)) {
    return NextResponse.json({ error: "Invalid or expired code. Request a new one." }, { status: 400 });
  }

  const matches = await compareCode(parsed.data.code, org.verificationCodeHash);
  if (!matches) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  await db
    .update(organizations)
    .set({ emailVerified: true, verificationCodeHash: null, verificationCodeExpiresAt: null })
    .where(eq(organizations.id, org.id));

  await createSession({ orgId: org.id, name: org.name });
  return NextResponse.json({ ok: true });
}