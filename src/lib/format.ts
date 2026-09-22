import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format as formatDate } from "date-fns";

/** The HOA's local timezone. Used so "today" means today for members, not for whatever timezone the server runs in. */
export const HOA_TIME_ZONE = "America/Chicago";

/**
 * Midnight today, in the HOA's local timezone, expressed as a real UTC Date.
 * Vercel's servers run in UTC, so a naive `startOfDay(new Date())` computes
 * midnight of the server's UTC calendar day, not the HOA's local day - which
 * can wrongly exclude "today's" events for several hours around the UTC
 * date rollover. This resolves the correct offset (DST-aware) for the
 * target date instead.
 */
export function startOfTodayLocal(): Date {
  const zonedNow = toZonedTime(new Date(), HOA_TIME_ZONE);
  const dateStr = formatDate(zonedNow, "yyyy-MM-dd");
  return fromZonedTime(`${dateStr}T00:00:00`, HOA_TIME_ZONE);
}

/**
 * Formats a date-only value (no meaningful time-of-day, e.g. a `<input type="date">` submission)
 * using its UTC calendar date, so display doesn't shift a day depending on the server's local
 * timezone - the same class of bug `startOfTodayLocal` guards against for "today".
 */
export function formatDateOnly(date: Date, pattern = "MMM d, yyyy"): string {
  return formatDate(toZonedTime(date, "UTC"), pattern);
}

/** Which local calendar day (in the HOA's timezone) a real timestamp instant falls on, as "yyyy-MM-dd". */
export function localDateKey(date: Date): string {
  return formatDate(toZonedTime(date, HOA_TIME_ZONE), "yyyy-MM-dd");
}

/** A specific local calendar day (in the HOA's timezone), expressed as a real UTC Date at local midnight. */
export function zonedDateFromParts(year: number, month: number, day: number): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  return fromZonedTime(`${year}-${pad(month)}-${pad(day)}T00:00:00`, HOA_TIME_ZONE);
}

/** Splits a free-text full name into a first-name portion and a last-name portion, using the final word as the last name. */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] ?? "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

/** "Tom Holm" -> "Holm, Tom". A single-word name is returned as-is. */
export function lastFirst(fullName: string): string {
  const { first, last } = splitName(fullName);
  return first ? `${last}, ${first}` : last;
}

/** Sort key so a list of full names sorts by last name, then first name. */
export function lastNameSortKey(fullName: string): string {
  const { first, last } = splitName(fullName);
  return `${last.toLowerCase()} ${first.toLowerCase()}`;
}

/** Formats a 10-digit US phone number as xxx-xxx-xxxx. Anything else is returned unchanged. */
export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}
