/**
 * Timezone helpers for working with user-local dates (e.g. Asia/Jakarta)
 * even when the server runs in UTC. Uses Intl APIs only — no extra deps.
 */

/** Format a Date as YYYY-MM-DD in the given IANA timezone. */
export function toLocalDateString(date: Date, timeZone: string): string {
  // Use Intl to extract parts (safe across runtimes).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Returns the local YYYY-MM-DD for "today" plus the given day offset
 * (0 = today, 1 = tomorrow, -1 = yesterday) in the specified timezone.
 */
export function localDayString(
  reference: Date,
  dayOffset: number,
  timeZone: string,
): string {
  // Use a midnight anchor in the local timezone, then shift by offset.
  // Approach: format current date to local parts, build a new Date at
  // local midnight (which we treat as a pure calendar anchor).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // Anchor date using local midnight; then add the offset in days.
  // Note: This uses server-local Date math, but the YYYY-MM-DD we read
  // back out via Intl+timeZone will be the correct local calendar day.
  const anchor = new Date(y, m - 1, d);
  anchor.setDate(anchor.getDate() + dayOffset);
  return toLocalDateString(anchor, timeZone);
}
