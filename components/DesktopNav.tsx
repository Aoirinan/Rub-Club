"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookingCta } from "@/components/BookingCta";
import { useHeaderCompact } from "@/components/HeaderThemeProvider";
import { telHref } from "@/lib/constants";
import {
  GIFT_CARD_DESKTOP_EXPANDED,
  useMassageGiftCardNavExpandedContext,
} from "@/lib/massage-gift-card-nav-context";

export type NavChild = { href: string; label: string; group?: string };

/** Per-clinic contact details rendered inside the Contact dropdown. */
export type ContactClinicInfo = {
  name: string;
  addressLines: readonly string[];
  phones: { label: string; number: string }[];
  mapsUrl: string;
  /** Dedicated contact page for this clinic. */
  contactHref?: string;
};

export type NavItem = {
  href: string;
  label: string;
  external?: boolean;
  children?: NavChild[];
  mega?: boolean;
  /** When set, the dropdown renders clinic contact blocks instead of links. */
  clinics?: ContactClinicInfo[];
};

function groupChildren(children: NavChild[]): Map<string, NavChild[]> {
  const map = new Map<string, NavChild[]>();
  for (const c of children) {
    const g = c.group ?? "";
    const arr = map.get(g);
    if (arr) arr.push(c);
    else map.set(g, [c]);
  }
  return map;
}

type PanelAlign = "left" | "center" | "right";

/** Keep wide dropdown panels on-screen: anchor by the item's side of the bar. */
function panelAlignClass(align: PanelAlign): string {
  if (align === "left") return "left-0";
  if (align === "right") return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function DropdownItem({
  item,
  onClose,
  align = "center",
}: {
  item: NavItem;
  onClose: () => void;
  align?: PanelAlign;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      {item.clinics?.length ? (
        <ContactPanel item={item} onClose={onClose} align={align} />
      ) : item.mega ? (
        <MegaPanel item={item} onClose={onClose} align={align} />
      ) : (
        <StandardPanel item={item} onClose={onClose} align={align} />
      )}
    </div>
  );
}

function ContactPanel({
  item,
  onClose,
  align = "center",
}: {
  item: NavItem;
  onClose: () => void;
  align?: PanelAlign;
}) {
  return (
    <div className={`absolute top-full z-50 w-[460px] pt-1 lg:w-[540px] ${panelAlignClass(align)}`}>
      <div className="bg-[var(--header-nav-hover)] p-5 shadow-xl">
        <div className="grid grid-cols-2 gap-x-6">
          {item.clinics!.map((clinic) => (
            <div key={clinic.name} className="text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em]">{clinic.name}</p>
              <address className="mt-2 not-italic text-xs font-semibold leading-relaxed text-white/85">
                {clinic.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <div className="mt-2 space-y-1">
                {clinic.phones.map((p) => (
                  <a
                    key={p.number}
                    href={telHref(p.number)}
                    className="block text-xs font-bold hover:underline"
                  >
                    <span className="text-white/70">{p.label}: </span>
                    {p.number}
                  </a>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href={clinic.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-bold underline hover:text-white/80"
                >
                  Get directions
                </a>
                {clinic.contactHref ? (
                  <Link
                    href={clinic.contactHref}
                    className="inline-block text-xs font-bold underline hover:text-white/80"
                    onClick={onClose}
                  >
                    Contact page &rarr;
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/20 pt-3">
          <Link
            href={item.href}
            className="text-xs font-black uppercase tracking-widest text-white hover:underline"
            onClick={onClose}
          >
            Send us a message &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function StandardPanel({
  item,
  onClose,
  align = "left",
}: {
  item: NavItem;
  onClose: () => void;
  align?: PanelAlign;
}) {
  return (
    <div
      className={`absolute top-full z-50 min-w-[220px] pt-1 ${align === "right" ? "right-0" : "left-0"}`}
    >
      <div className="bg-white shadow-xl">
        {item.children!.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#4a5a58] hover:bg-stone-100 hover:text-[var(--header-nav-hover)]"
            onClick={onClose}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MegaPanel({
  item,
  onClose,
  align = "center",
}: {
  item: NavItem;
  onClose: () => void;
  align?: PanelAlign;
}) {
  const groups = groupChildren(item.children!);
  return (
    <div
      className={`absolute top-full z-50 w-[600px] max-w-[calc(100vw-2rem)] pt-1 lg:w-[720px] ${panelAlignClass(align)}`}
    >
      {/* Backpro-style white services panel with dark uppercase links. */}
      <div className="bg-white p-5 shadow-xl">
        <div className="mb-3 border-b border-stone-200 pb-3">
          <Link
            href={item.href}
            className="text-xs font-black uppercase tracking-widest text-[var(--header-nav-hover)] hover:underline"
            onClick={onClose}
          >
            Overview &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-3">
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group || "__default"} className="mb-3">
              {group && (
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  {group}
                </p>
              )}
              {items.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="block py-1.5 text-xs font-bold uppercase tracking-wide text-[#4a5a58] hover:text-[var(--header-nav-hover)]"
                  onClick={onClose}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesktopNav({
  items,
  showBookCta = true,
  centerSlot,
}: {
  items: readonly NavItem[];
  showBookCta?: boolean;
  /** Backpro-style centered logo: nav links split around this node. */
  centerSlot?: ReactNode;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const giftCardExpanded = useMassageGiftCardNavExpandedContext();
  const compact = useHeaderCompact();
  const pathname = usePathname() ?? "/";
  // Backpro-style shrink: nav links lose vertical padding once scrolled.
  const itemPad = `transition-[padding] duration-300 ease-out motion-reduce:transition-none ${
    compact ? "px-2 py-1.5" : "px-2 py-2"
  }`;

  useEffect(() => {
    if (openIdx === null) return;
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openIdx]);

  const handleEnter = (idx: number, hasChildren: boolean) => {
    if (!hasChildren) return;
    clearTimeout(timerRef.current);
    setOpenIdx(idx);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => setOpenIdx(null), 150);
  };

  // Backpro look: the current page's link sits in a solid color box.
  const itemColors = (active: boolean) =>
    active
      ? "bg-[var(--header-nav-hover)] text-white"
      : "text-[var(--header-nav-hover)] hover:bg-[var(--header-nav-hover)] hover:text-white";

  const renderItem = (item: NavItem, idx: number, align: PanelAlign = "center") => {
    const hasChildren = !!item.children?.length || !!item.clinics?.length;
    const isOpen = openIdx === idx;
    const active = pathname === item.href;

    return (
      <div
        key={`${idx}-${item.href}`}
        className="relative"
        onMouseEnter={() => handleEnter(idx, hasChildren)}
        onMouseLeave={handleLeave}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`focus-ring inline-flex items-center gap-1 ${itemPad} text-xs font-bold uppercase tracking-wide ${itemColors(active)} xl:px-4 xl:text-sm`}
            onClick={() => setOpenIdx(isOpen ? null : idx)}
            aria-expanded={isOpen}
          >
            {item.label}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className={`ml-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path
                d="M2 4l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : item.external && item.label === "Gift cards" ? (
          <a
            className={`focus-ring block shrink-0 font-black uppercase tracking-wide transition-all duration-300 ease-out motion-reduce:transition-none ${
              giftCardExpanded
                ? GIFT_CARD_DESKTOP_EXPANDED
                : `${compact ? "px-3 py-1.5" : "px-3 py-2"} text-xs ${itemColors(active)} xl:px-4 xl:text-sm`
            }`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
          </a>
        ) : item.external ? (
          <a
            className={`focus-ring block ${itemPad} text-xs font-bold uppercase tracking-wide ${itemColors(active)} xl:px-4 xl:text-sm`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
          </a>
        ) : (
          <Link
            className={`focus-ring block ${itemPad} text-xs font-bold uppercase tracking-wide ${itemColors(active)} xl:px-4 xl:text-sm`}
            href={item.href}
          >
            {item.label}
          </Link>
        )}

        {hasChildren && isOpen ? (
          <DropdownItem
            item={item}
            onClose={() => setOpenIdx(null)}
            align={align}
          />
        ) : null}
      </div>
    );
  };

  const bookCta = showBookCta ? (
    <BookingCta
      label="Book Now"
      className="focus-ring ml-2 flex items-center self-stretch bg-[var(--header-nav-hover)] px-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-all duration-300 brightness-100 hover:brightness-90 xl:px-5 xl:text-sm"
    />
  ) : null;

  if (centerSlot) {
    // Backpro layout: nav links split around the centered logo.
    const mid = Math.ceil(items.length / 2);
    const left = items.slice(0, mid);
    const right = items.slice(mid);

    return (
      <nav
        ref={navRef}
        aria-label="Primary"
        className="hidden bg-[var(--header-nav-bg)] shadow-md lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4">
          <div className="flex flex-1 items-center justify-end">
            {left.map((item, idx) => renderItem(item, idx, "left"))}
          </div>
          {/* Backpro-style shrink: logo lands large, scales down once scrolled. */}
          <div
            className={`shrink-0 px-8 transition-[padding] duration-300 ease-out motion-reduce:transition-none xl:px-12 ${
              compact ? "py-1" : "py-5"
            }`}
          >
            <div
              className={`origin-center transition-transform duration-300 ease-out motion-reduce:transition-none ${
                compact ? "scale-100" : "scale-[1.35]"
              }`}
            >
              {centerSlot}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-start">
            {right.map((item, idx) => renderItem(item, mid + idx, "right"))}
            {bookCta}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="hidden bg-[var(--header-nav-bg)] shadow-md lg:block"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        {items.map((item, idx) => renderItem(item, idx))}
        {bookCta}
      </div>
    </nav>
  );
}
