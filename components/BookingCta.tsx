"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { telHref, type LocationId, type LocationInfo } from "@/lib/constants";
import { useSiteChrome } from "@/components/SiteChromeProvider";
import type { UiText } from "@/lib/ui-text-cms";

const VARIANT_BASE = {
  default:
    "focus-ring px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
  compact: "focus-ring px-4 py-2 text-xs font-black uppercase tracking-wide text-white",
  nav: "focus-ring ml-2 px-5 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm xl:text-sm",
  teal: "focus-ring px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
  ss: "focus-ring px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
} as const;

/**
 * Brand colors by site section: Paris red, Sulphur Springs blue.
 * Driven by CSS vars set on <body> (lib/brand-theme.ts) — manager-editable
 * via Practice pages -> Theme colors; hex fallbacks match the defaults.
 */
const BRAND_COLORS = {
  paris: {
    button:
      "bg-[var(--brand-paris-cta,#4a1515)] hover:bg-[var(--brand-paris-cta-hover,#341010)]",
    heading: "text-[var(--brand-paris-heading,#4a1515)]",
    phone:
      "bg-[var(--brand-paris-accent,#c0392b)] hover:bg-[var(--brand-paris-accent-hover,#962d22)]",
  },
  sulphur: {
    button: "bg-[var(--brand-ss-cta,#0c2d3a)] hover:bg-[var(--brand-ss-cta-hover,#081f29)]",
    heading: "text-[var(--brand-ss-heading,#0c2d3a)]",
    phone:
      "bg-[var(--brand-ss-accent,#2980b9)] hover:bg-[var(--brand-ss-accent-hover,#1a6da3)]",
  },
} as const;

type Props = {
  label: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  disabledLabel?: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  query?: string;
  className?: string;
  variant?: keyof typeof VARIANT_BASE;
  /** Force a brand (color + phone) instead of inferring it from the path. */
  brand?: "paris" | "sulphur";
  /** Optional custom trigger content (e.g. quick-action circle with icon). */
  children?: ReactNode;
};

type ContextPhone = { business: string; phone: string };

/**
 * Business name + phone for the site the visitor is on, from the CMS-resolved
 * offices (Office info & hours) and Site text labels.
 */
function contextPhone(
  pathname: string,
  brand: "paris" | "sulphur",
  locations: Record<LocationId, LocationInfo>,
  t: UiText,
): ContextPhone {
  if (brand === "sulphur" || pathname.startsWith("/sulphur-springs")) {
    return {
      business: t.ui_booking_modal_name_ss,
      phone: locations.sulphur_springs.phonePrimary,
    };
  }
  if (pathname.startsWith("/services/massage") || pathname.startsWith("/massage-landing")) {
    return {
      business: t.ui_booking_modal_name_paris_massage,
      phone: locations.paris.phoneSecondary ?? locations.paris.phonePrimary,
    };
  }
  return {
    business: t.ui_booking_modal_name_paris_chiro,
    phone: locations.paris.phonePrimary,
  };
}

export function BookingCta({ label, className, variant = "default", brand, children }: Props) {
  const pathname = usePathname() ?? "/";
  const { uiText: t, locations, bookUrl } = useSiteChrome();
  const [open, setOpen] = useState(false);
  const resolvedBrand =
    brand ?? (pathname.startsWith("/sulphur-springs") ? "sulphur" : "paris");
  const colors = BRAND_COLORS[resolvedBrand];
  const classes = className ?? `${VARIANT_BASE[variant]} ${colors.button}`;
  const { business, phone } = contextPhone(pathname, resolvedBrand, locations, t);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // "Book Now URL" (Site settings → Header links): when set, Book Now links
  // there instead of opening the call popup.
  if (bookUrl) {
    const content = children ?? label;
    if (bookUrl.startsWith("/")) {
      return (
        <Link href={bookUrl} className={classes} aria-label={label}>
          {content}
        </Link>
      );
    }
    return (
      <a
        href={bookUrl}
        className={classes}
        aria-label={label}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <>
      <button type="button" className={classes} onClick={() => setOpen(true)} aria-label={label}>
        {children ?? label}
      </button>
      {/* Portaled to <body>: the sticky header is a stacking context (z-40), so a
          modal rendered inside it would sit under body-level sticky bars. */}
      {open && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Call to book your appointment"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={t.ui_close}
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className={`text-lg font-black ${colors.heading}`}>{t.ui_booking_modal_title}</h2>
            <p className="mt-1 text-sm text-stone-600">{business}</p>
            <a
              href={telHref(phone)}
              className={`focus-ring mt-4 block rounded-lg px-4 py-4 text-2xl font-black tracking-wide text-white ${colors.phone}`}
            >
              {phone}
            </a>
            <p className="mt-3 text-xs text-stone-500">{t.ui_booking_modal_body}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring mt-4 text-sm font-bold text-stone-600 underline"
            >
              {t.ui_close}
            </button>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
