import { createHash, randomBytes } from "crypto";

export type HashInput = {
  certId: string;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  issueDate: Date;
  expiryDate: Date | null;
};

const toUnix = (d: Date | null) => (d ? Math.floor(d.getTime() / 1000) : 0);

/**
 * Builds the SHA-256 fingerprint of a certificate.
 * The field order is fixed, so the same data always gives the same hash.
 * Only this hash goes on the blockchain - no personal data is public.
 */
export function computeCertHash(c: HashInput): string {
  const canonical = JSON.stringify({
    certId: c.certId,
    recipientName: c.recipientName.trim(),
    recipientEmail: c.recipientEmail.trim().toLowerCase(),
    courseTitle: c.courseTitle.trim(),
    issuedAt: toUnix(c.issueDate),
    expiresAt: toUnix(c.expiryDate),
  });
  return "0x" + createHash("sha256").update(canonical).digest("hex");
}

export function generateCertId(): string {
  const year = new Date().getFullYear();
  return `CERT-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export const unix = toUnix;
