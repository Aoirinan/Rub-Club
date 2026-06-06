"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LOCATIONS, telHref } from "@/lib/constants";

const PRIMARY =
  "focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]";
const PRIMARY_COMPACT =
  "focus-ring bg-[#f2d25d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]";
const PRIMARY_NAV =
  "focus-ring ml-2 bg-[#f2d25d] px-5 py-2 text-xs font-black uppercase tracking-wide text-[#0c2d3a] shadow-sm hover:bg-[#e6c13d] xl:text-sm";
const PRIMARY_TEAL =
  "focus-ring bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#0f817b]";
const PRIMARY_SS =
  "focus-ring bg-[#2980b9] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#1a6da3]";

const VARIANT_CLASS = {
  default: PRIMARY,
  compact: PRIMARY_COMPACT,
  nav: PRIMARY_NAV,
  teal: PRIMARY_TEAL,
  ss: PRIMARY_SS,
} as const;

type Props = {
  label: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  disabledLabel?: string;
  /** Retained for backward compatibility; no longer used (online booking retired). */
  query?: string;
  className?: string;
  variant?: keyof typeof VARIANT_CLASS;
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
  const classes = className ?? VARIANT_CLASS[variant];
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
            <h2 className="text-lg font-black text-[#173f3b]">Call to book your visit</h2>
            <p className="mt-1 text-sm text-stone-600">{business}</p>
            <a
              href={telHref(phone)}
              className="focus-ring mt-4 block rounded-lg bg-[#0f5f5c] px-4 py-4 text-2xl font-black tracking-wide text-white hover:bg-[#0f817b]"
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
