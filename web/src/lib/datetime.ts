/**
 * All date handling is pinned to Cambodia time (Asia/Phnom_Penh, UTC+7,
 * no daylight saving), so displays are identical on localhost and Vercel.
 */
const TZ = "Asia/Phnom_Penh";

/** e.g. "24 Sep 2026" */
export function fmtDay(d: Date | null | undefined, fallback = "No expiry"): string {
  if (!d) return fallback;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
}

/** YYYY-MM-DD in Cambodia time (table columns) */
export function fmtDayISO(d: Date | null | undefined, fallback = "Never"): string {
  if (!d) return fallback;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** e.g. "24 Sep 2026, 19:15 GMT+7" */
export function fmtDateTime(d: Date | null | undefined, fallback = "—"): string {
  if (!d) return fallback;
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: TZ, timeZoneName: "short",
  });
}

export function fmtUnixDateTime(seconds: number): string {
  return fmtDateTime(new Date(seconds * 1000));
}

/** End of the chosen calendar day in CAMBODIA time (UTC+7, no DST). */
export function endOfSelectedDay(isoDay: string): Date {
  return new Date(`${isoDay}T23:59:59+07:00`);
}

/** Today's Cambodia date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Tomorrow's Cambodia date as YYYY-MM-DD (date input `min`) */
export function tomorrowISO(): string {
  const t = new Date(Date.now() + 86_400_000);
  return t.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** True when `d` is end-of-today (Cambodia) or earlier. */
export function isTodayOrEarlier(d: Date): boolean {
  return d.getTime() <= endOfSelectedDay(todayISO()).getTime();
}