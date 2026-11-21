/** Returns the local YYYY-MM-DD string for a given Date (defaults to now). */
export function toLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns the local date as an integer YYYYMMDD. */
export function localDateInt(d: Date = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Returns the local YYYY-MM-DD string for d offset by `offsetDays` calendar days. */
export function offsetLocalDate(d: Date, offsetDays: number): string {
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays);
  return toLocalDate(shifted);
}

/** True when `a` is exactly one calendar day before `b` (both local YYYY-MM-DD). */
export function isYesterday(a: string, b: string): boolean {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return db.getTime() - da.getTime() === 86400000;
}
