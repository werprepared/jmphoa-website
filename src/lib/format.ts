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
