export type DisplayStatus = "VALID" | "EXPIRED" | "REVOKED";

export function getDisplayStatus(c: {
  status: "active" | "revoked";
  expiryDate: Date | null;
}): DisplayStatus {
  if (c.status === "revoked") return "REVOKED";
  if (c.expiryDate && c.expiryDate.getTime() < Date.now()) return "EXPIRED";
  return "VALID";
}

export const STATUS_STYLES: Record<string, string> = {
  VALID: "bg-green-50 text-green-700 border-green-200",
  EXPIRED: "bg-amber-50 text-amber-700 border-amber-200",
  REVOKED: "bg-red-50 text-red-700 border-red-200",
  NOT_FOUND: "bg-slate-50 text-slate-600 border-slate-200",
};