"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FACEBOOK_URL, INSTAGRAM_URL, telHref, type LocationInfo } from "@/lib/constants";
import { track } from "@/lib/analytics";
import type { NavItem } from "@/components/DesktopNav";
import { BookingCta } from "@/components/BookingCta";
import {
  GIFT_CARD_MOBILE_EXPANDED,
  useMassageGiftCardNavExpandedContext,
} from "@/lib/massage-gift-card-nav-context";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export function MobileNav({
  items,
  giftCardHref,
  paris,
  sulphur,
  businessContext: businessContextProp = "default",
}: {
  items: readonly NavItem[];
  giftCardHref: string;
  paris: LocationInfo;
  sulphur: LocationInfo;
  businessContext?: SiteBusinessContext;
}) {
  const businessContext = useSiteBusinessContext(businessContextProp);
  const hasGiftCardInNav = items.some((i) => i.label === "Gift cards");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const giftCardExpanded = useMassageGiftCardNavExpandedContext();

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

  const close = () => {
    setOpen(false);
    setExpanded(null);
  };

  const toggle = (label: string) => {
    setExpanded((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded border border-[#0f5f5c]/30 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#173f3b] lg:hidden"
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
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={close}
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">Menu</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="focus-ring rounded p-2 text-[#173f3b]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col">
              {items.map((item, idx) => {
                const hasChildren = !!item.children?.length || !!item.clinics?.length;
                const isExpanded = expanded === item.label;

                if (!hasChildren) {
                  if (item.external) {
                    return (
                      <a
                        key={`${idx}-${item.href}`}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring border-b border-stone-100 px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#173f3b] hover:bg-stone-50"
                        onClick={close}
                      >
                        {item.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={`${idx}-${item.href}`}
                      href={item.href}
                      className="focus-ring border-b border-stone-100 px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#173f3b] hover:bg-stone-50"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={`${idx}-${item.href}`} className="border-b border-stone-100">
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className="focus-ring flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#173f3b] hover:bg-stone-50"
                        onClick={close}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className="focus-ring px-4 py-3 text-[#0f5f5c]"
                        onClick={() => toggle(item.label)}
                        aria-expanded={isExpanded}
                        aria-label={`Expand ${item.label} submenu`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          <path
                            d="M3 5l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    {isExpanded ? (
                      <div className="bg-stone-50 pb-2">
                        {item.clinics?.length
                          ? item.clinics.map((clinic) => (
                              <div
                                key={clinic.name}
                                className="border-b border-stone-200/70 px-8 py-3 last:border-b-0"
                              >
                                <p className="text-xs font-black uppercase tracking-wide text-[#173f3b]">
                                  {clinic.name}
                                </p>
                                <address className="mt-1 not-italic text-xs leading-relaxed text-stone-600">
                                  {clinic.addressLines.map((line) => (
                                    <span key={line} className="block">
                                      {line}
                                    </span>
                                  ))}
                                </address>
                                <div className="mt-1 space-y-0.5">
                                  {clinic.phones.map((p) => (
                                    <a
                                      key={p.number}
                                      href={telHref(p.number)}
                                      className="block text-xs font-bold text-[#0f5f5c] underline"
                                      onClick={() =>
                                        track("phone_click", { location: clinic.name.toLowerCase() })
                                      }
                                    >
                                      {p.label}: {p.number}
                                    </a>
                                  ))}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                  <a
                                    href={clinic.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-xs font-bold text-[#0f5f5c] underline"
                                  >
                                    Get directions
                                  </a>
                                  {clinic.contactHref ? (
                                    <Link
                                      href={clinic.contactHref}
                                      className="inline-block text-xs font-bold text-[#0f5f5c] underline"
                                      onClick={close}
                                    >
                                      Contact page
                                    </Link>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          : item.children!.map((c) => (
                              <Link
                                key={c.href}
                                href={c.href}
                                className="focus-ring block px-8 py-2 text-xs font-bold uppercase tracking-wide text-[#173f3b]/80 hover:text-[#0f5f5c]"
                                onClick={close}
                              >
                                {c.label}
                              </Link>
                            ))}
                        {item.clinics?.length ? (
                          <Link
                            href={item.href}
                            className="focus-ring block px-8 py-2 text-xs font-black uppercase tracking-wide text-[#0f5f5c] underline"
                            onClick={close}
                          >
                            Send us a message
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!hasGiftCardInNav ? (
                <a
                  href={giftCardHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`focus-ring mx-4 mb-2 block border border-[#0f5f5c]/30 bg-white px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-[#0f5f5c] transition-all duration-300 ease-out hover:bg-stone-50 motion-reduce:transition-none ${
                    giftCardExpanded ? GIFT_CARD_MOBILE_EXPANDED : ""
                  }`}
                  onClick={close}
                >
                  Gift cards
                </a>
              ) : null}
              <BookingCta
                label="Book Now"
                className="focus-ring m-4 block bg-[#f2d25d] px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
              />
              <div className="border-t border-stone-200 p-4 text-sm">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-600">
                  Call us
                </p>
                {businessContext === "paris_chiro" ? (
                  <a
                    className="block py-1 font-bold text-[#0f5f5c] underline"
                    href={telHref(paris.phonePrimary)}
                    onClick={() => track("phone_click", { location: "paris" })}
                  >
                    Paris {paris.phonePrimary}
                  </a>
                ) : businessContext === "sulphur_springs" ? (
                  <a
                    className="block py-1 font-bold text-[#0f5f5c] underline"
                    href={telHref(sulphur.phonePrimary)}
                    onClick={() => track("phone_click", { location: "sulphur_springs" })}
                  >
                    Sulphur Springs {sulphur.phonePrimary}
                  </a>
                ) : (
                  <>
                    <a
                      className="block py-1 font-bold text-[#0f5f5c] underline"
                      href={telHref(paris.phonePrimary)}
                      onClick={() => track("phone_click", { location: "paris" })}
                    >
                      Paris {paris.phonePrimary}
                    </a>
                    {paris.phoneSecondary?.trim() ? (
                      <a
                        className="block py-1 font-bold text-[#0f5f5c] underline"
                        href={telHref(paris.phoneSecondary)}
                        onClick={() => track("phone_click", { location: "rub_club" })}
                      >
                        The Rub Club {paris.phoneSecondary}
                      </a>
                    ) : null}
                    <a
                      className="block py-1 font-bold text-[#0f5f5c] underline"
                      href={telHref(sulphur.phonePrimary)}
                      onClick={() => track("phone_click", { location: "sulphur_springs" })}
                    >
                      Sulphur Springs {sulphur.phonePrimary}
                    </a>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-4">
                  <a
                    className="inline-flex items-center gap-2 font-bold text-[#0f5f5c] underline"
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 shrink-0"
                      aria-hidden
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                  <a
                    className="inline-flex items-center gap-2 font-bold text-[#0f5f5c] underline"
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 shrink-0"
                      aria-hidden
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>
              <Link
                href="/admin/login"
                className="focus-ring border-t border-stone-100 px-4 py-3 text-xs text-stone-600 hover:bg-stone-50"
                onClick={close}
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
