/** Decorative icons for chiropractic treatment cards on the service page. */

export function ChiroTreatmentIcon({ name }: { name: string }) {
  switch (name) {
    case "Chiropractic Adjustments":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <path
            d="M24 4v6M18 12h12M16 20h16M14 28h20M12 36h24M10 44h28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="10" r="3" fill="currentColor" />
          <circle cx="24" cy="22" r="3" fill="currentColor" />
          <circle cx="24" cy="34" r="3" fill="currentColor" />
        </svg>
      );
    case "Electric Muscle Stimulation":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="currentColor" aria-hidden>
          <path d="M28 4L12 26h10l-2 18 18-28H26l2-12z" />
        </svg>
      );
    case "Heat & Cryotherapy":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <path
            d="M24 6c-4 6-8 10-8 18a8 8 0 0016 0c0-8-4-12-8-18z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M10 38h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M14 42h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        </svg>
      );
    case "Spinal Decompression":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <path d="M8 14h32M8 24h32M8 34h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M24 8v6M24 34v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 4"
          />
        </svg>
      );
    case "Therapeutic Massage":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <path
            d="M14 30c4-6 8-8 12-8s8 2 12 8M10 22c3-5 7-7 14-7s11 2 14 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse cx="24" cy="36" rx="10" ry="5" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "Acupuncture":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <line x1="24" y1="6" x2="24" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M20 38l4 6 4-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
        </svg>
      );
    case "Pediatric Care":
      return (
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
          <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M12 40c2-10 8-14 12-14s10 4 12 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
