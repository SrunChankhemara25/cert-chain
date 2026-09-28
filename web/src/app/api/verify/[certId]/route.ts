import { NextResponse } from "next/server";
import { getVerification } from "@/lib/verification";

// Public JSON API - anyone (or any other system) can verify a certificate.
export async function GET(_req: Request, { params }: { params: { certId: string } }) {
  const result = await getVerification(params.certId);
  return NextResponse.json(result, { status: result.found ? 200 : 404 });
}
