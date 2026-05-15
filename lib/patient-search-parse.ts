/** True if the string is only phone-like characters (digits, spaces, common separators). */
function isPhoneCharOnlyInput(raw: string): boolean {
  const t = raw.trim();
  return t.length > 0 && /^[\d\s\-()+.]+$/.test(t) && /\d/.test(t);
}

/** Prefix variants for Firestore range search (case variants; not exhaustive). */
export function nameSearchVariants(raw: string): string[] {
  const t = raw.trim();
  if (t.length < 2) return [];
  const lower = t.toLowerCase();
  const title = lower.replace(/\b\w/g, (c) => c.toUpperCase());
  const upper = t.toUpperCase();
  return [...new Set([t, lower, title, upper])].filter((s) => s.length >= 2);
}

export type PatientLookupParse =
  | { ok: true; mode: "phone"; digits: string }
  | { ok: true; mode: "name"; name: string }
  | { ok: false; error: string };

/** Reads `q` first, then legacy `phone` — same string rules as the patient UI and APIs. */
export function parsePatientLookupSearchParams(q: string | null, phone: string | null): PatientLookupParse {
  const qt = (q ?? "").trim();
  const pt = (phone ?? "").trim();
  const raw = qt || pt;
  const digits = raw.replace(/\D/g, "");

  if (isPhoneCharOnlyInput(raw) && digits.length > 0 && digits.length < 7) {
    return {
      ok: false,
      error: "Enter at least 7 digits for phone lookup, or at least 2 letters to search by name.",
    };
  }
  if (digits.length >= 7) {
    return { ok: true, mode: "phone", digits };
  }
  if (raw.length >= 2) {
    return { ok: true, mode: "name", name: raw };
  }
  return { ok: false, error: "Enter a phone number (7+ digits) or a name (2+ characters)." };
}

/** Client URL/search state: non-empty query when phone (7+ digits) or name (2+ chars). */
export function committedPatientSearchFromRaw(raw: string): string {
  const t = raw.trim();
  const d = t.replace(/\D/g, "");
  if (isPhoneCharOnlyInput(t) && d.length > 0 && d.length < 7) return "";
  if (d.length >= 7) return t;
  if (t.length >= 2) return t;
  return "";
}
