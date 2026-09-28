import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPurposeToken } from "@/lib/auth";
import { compareCode } from "@/lib/otp";

const schema = z.object({ challenge: z.string(), code: z.string().length(6) });

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

  const matches = await compareCode(parsed.data.code, String(payload.codeHash));
  if (!matches) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  // Only now does a session exist - password alone or Google alone is never enough.
  await createSession({ orgId: String(payload.orgId), name: String(payload.name) });
  return NextResponse.json({ ok: true });
}