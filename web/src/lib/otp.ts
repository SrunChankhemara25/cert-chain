import bcrypt from "bcryptjs";

const CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;
export const RESEND_COOLDOWN_SECONDS = 60;

/** A random 6-digit numeric code, e.g. "042917". */
export function generateCode(): string {
  const n = Math.floor(Math.random() * 10 ** CODE_LENGTH);
  return n.toString().padStart(CODE_LENGTH, "0");
}

// Codes are hashed before storage, the same way passwords are - so a
// database leak alone never reveals a usable verification or reset code.
export function hashCode(code: string) {
  return bcrypt.hash(code, 10);
}

export function compareCode(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}

export function codeExpiryDate(minutes: number = OTP_EXPIRY_MINUTES): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isExpired(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() < Date.now();
}

/**
 * True if a code was already sent within the cooldown window - inferred
 * from the stored expiry (expiresAt - OTP_EXPIRY_MINUTES = when it was sent),
 * so no extra "last sent" column is needed.
 */
export function isInCooldown(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const sentAt = expiresAt.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000;
  return Date.now() - sentAt < RESEND_COOLDOWN_SECONDS * 1000;
}