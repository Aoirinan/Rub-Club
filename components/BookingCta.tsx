"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LOCATIONS, telHref } from "@/lib/constants";

const VARIANT_BASE = {
  default:
    "focus-ring px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
  compact: "focus-ring px-4 py-2 text-xs font-black uppercase tracking-wide text-white",
  nav: "focus-ring ml-2 px-5 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm xl:text-sm",
  teal: "focus-ring px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
  ss: "focus-ring px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow",
} as const;

/** Brand colors by site section: Paris red, Sulphur Springs blue. */
const BRAND_COLORS = {
  paris: {
    button: "bg-[#4a1515] hover:bg-[#341010]",
    heading: "text-[#4a1515]",
    phone: "bg-[#c0392b] hover:bg-[#962d22]",
  },
  sulphur: {
    button: "bg-[#0c2d3a] hover:bg-[#081f29]",
    heading: "text-[#0c2d3a]",
    phone: "bg-[#2980b9] hover:bg-[#1a6da3]",
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
};

type ContextPhone = { business: string; phone: string };

/** Phone number for the business the visitor has landed on, by URL path. */
function contextPhone(pathname: string): ContextPhone {
  if (pathname.startsWith("/sulphur-springs")) {
    return {
      business: "Chiropractic Associates of Sulphur Springs",
      phone: LOCATIONS.sulphur_springs.phonePrimary,
    };
  }
  if (pathname.startsWith("/services/massage") || pathname.startsWith("/massage-landing")) {
    return {
      business: "The Rub Club Massage — Paris",
      phone: LOCATIONS.paris.phoneSecondary ?? LOCATIONS.paris.phonePrimary,
    };
  }
  return {
    business: "Chiropractic Associates — Paris",
    phone: LOCATIONS.paris.phonePrimary,
  };
}

export function BookingCta({ label, className, variant = "default" }: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const brand = pathname.startsWith("/sulphur-springs") ? "sulphur" : "paris";
  const colors = BRAND_COLORS[brand];
  const classes = className ?? `${VARIANT_BASE[variant]} ${colors.button}`;
  const { business, phone } = contextPhone(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={classes} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Call to book your appointment"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className={`text-lg font-black ${colors.heading}`}>Call to book your visit</h2>
            <p className="mt-1 text-sm text-stone-600">{business}</p>
            <a
              href={telHref(phone)}
              className={`focus-ring mt-4 block rounded-lg px-4 py-4 text-2xl font-black tracking-wide text-white ${colors.phone}`}
            >
              {phone}
            </a>
            <p className="mt-3 text-xs text-stone-500">
              Give us a call and our front desk will find a time that works for you.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring mt-4 text-sm font-bold text-stone-600 underline"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
