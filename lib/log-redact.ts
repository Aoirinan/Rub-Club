/**
 * Mask patient contact details before they reach server logs.
 * Keeps just enough to tell messages apart when debugging.
 */

/** "903-555-0101" → "***0101". */
export function maskPhoneForLog(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 0) return "(none)";
  return `***${digits.slice(-4)}`;
}

/** "jane.doe@example.com" → "j***@example.com". */
export function maskEmailForLog(email: string | null | undefined): string {
  const s = (email ?? "").trim();
  if (!s) return "(none)";
  const at = s.lastIndexOf("@");
  if (at <= 0 || at === s.length - 1) return "***";
  return `${s[0]}***@${s.slice(at + 1)}`;
}
