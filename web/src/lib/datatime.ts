/**
 * Calendar-day helpers.
 * - Instants (issueDate, revokedAt) are shown in the VIEWER'S local day.
 * - Deadlines (expiryDate) are stored as end-of-day LOCAL time, so the day
 *   displayed always equals the day the issuer typed.
 */

export function fmtDay(d: Date | null | undefined, fallback = "No expiry"): string {
  if (!d) return fallback;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** YYYY-MM-DD in local time (table columns) */
export function fmtDayISO(d: Date | null | undefined, fallback = "Never"): string {
  if (!d) return fallback;
  return d.toLocaleDateString("en-CA");
}

/** e.g. "23 Sep 2026, 14:42" */
export function fmtDateTime(d: Date | null | undefined, fallback = "—"): string {
  if (!d) return fallback;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtUnixDateTime(seconds: number): string {
  return fmtDateTime(new Date(seconds * 1000));
}

/** End of the selected calendar day in SERVER-LOCAL time (no "Z"!). */
export function endOfSelectedDay(isoDay: string): Date {
  return new Date(`${isoDay}T23:59:59`);
}

/** True when `d` falls on today's local calendar day or earlier. */
export function isTodayOrEarlier(d: Date): boolean {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return d.getTime() <= endOfToday.getTime();
}

/** Tomorrow as YYYY-MM-DD (for the date input's `min`) */
export function tomorrowISO(): string {
  const t = new Date(Date.now() + 86_400_000);
  return t.toLocaleDateString("en-CA");
}