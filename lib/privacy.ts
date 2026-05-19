/**
 * Privacy / NPP helpers.
 *
 * Dedicated NPP: set NEXT_PUBLIC_NPP_PDF_URL to an attorney-approved PDF URL.
 * Otherwise /privacy links to the chiropractic intake packet (NPP is included in that PDF).
 */

export { PRIVACY_PRACTICES_PATH } from "@/lib/legal";

/** Printable chiropractic packet (includes NPP per in-office practice materials). */
export const CHIRO_INTAKE_PACKET_PDF = "/chiropractic-new-patient-packet.pdf" as const;

export const MASSAGE_NEW_CLIENT_PDF = "/the-rub-club-new-client-form-1.pdf" as const;

export type NppDownloadLink = {
  href: string;
  label: string;
  /** Shown under the button when using the bundled chiropractic packet. */
  note?: string;
};

/** Optional override: standalone Notice of Privacy Practices PDF only. */
export function getNppPdfUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_NPP_PDF_URL?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** PDF link for /privacy — dedicated NPP URL if set, else the chiropractic intake packet. */
export function getNppDownloadLink(): NppDownloadLink {
  const dedicated = getNppPdfUrl();
  if (dedicated) {
    return {
      href: dedicated,
      label: "Download Notice of Privacy Practices (PDF)",
    };
  }
  return {
    href: CHIRO_INTAKE_PACKET_PDF,
    label: "Download 9-page chiropractic intake packet (includes NPP)",
    note: "The Notice of Privacy Practices is included in our printable chiropractic new-patient packet. Massage-only clients: use the massage form on patient forms or ask the front desk for a printed copy.",
  };
}
