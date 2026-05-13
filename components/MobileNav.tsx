"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { telHref } from "@/lib/constants";
import { track } from "@/lib/analytics";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded border border-[#0f5f5c]/30 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-[#173f3b] md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Menu
      </button>

      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="focus-ring rounded p-2 text-[#173f3b]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="focus-ring border-b border-stone-100 px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#173f3b] hover:bg-stone-50"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/book"
                className="focus-ring m-4 bg-[#f2d25d] px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
                onClick={() => setOpen(false)}
              >
                Book online
              </Link>
              <div className="border-t border-stone-200 p-4 text-sm">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-600">
                  Call us
                </p>
                <a
                  className="block py-1 font-bold text-[#0f5f5c] underline"
                  href={telHref("903-785-5551")}
                  onClick={() => track("phone_click", { location: "paris" })}
                >
                  Paris 903-785-5551
                </a>
                <a
                  className="block py-1 font-bold text-[#0f5f5c] underline"
                  href={telHref("903-739-9959")}
                  onClick={() => track("phone_click", { location: "rub_club" })}
                >
                  The Rub Club 903-739-9959
                </a>
                <a
                  className="block py-1 font-bold text-[#0f5f5c] underline"
                  href={telHref("903-919-5020")}
                  onClick={() => track("phone_click", { location: "sulphur_springs" })}
                >
                  Sulphur Springs 903-919-5020
                </a>
              </div>
              <Link
                href="/admin/login"
                className="focus-ring border-t border-stone-100 px-4 py-3 text-xs text-stone-600 hover:bg-stone-50"
                onClick={() => setOpen(false)}
              >
                Staff sign-in
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
