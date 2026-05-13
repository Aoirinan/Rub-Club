"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavChild = { href: string; label: string; group?: string };

export type NavItem = {
  href: string;
  label: string;
  children?: NavChild[];
  mega?: boolean;
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

function DropdownItem({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      {item.mega ? (
        <MegaPanel item={item} onClose={onClose} />
      ) : (
        <StandardPanel item={item} onClose={onClose} />
      )}
    </div>
  );
}

function StandardPanel({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-full z-50 min-w-[220px] pt-1">
      <div className="bg-[#2980b9] shadow-xl">
        {item.children!.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1a6da3]"
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
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const groups = groupChildren(item.children!);
  return (
    <div className="absolute left-1/2 top-full z-50 w-[600px] -translate-x-1/2 pt-1 lg:w-[720px]">
      <div className="bg-[#2980b9] p-5 shadow-xl">
        <div className="mb-3 border-b border-white/20 pb-3">
          <Link
            href={item.href}
            className="text-xs font-black uppercase tracking-widest text-white hover:underline"
            onClick={onClose}
          >
            Overview &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 lg:grid-cols-3">
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group || "__default"} className="mb-3">
              {group && (
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  {group}
                </p>
              )}
              {items.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="block py-1 text-xs font-bold text-white hover:underline"
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

export function DesktopNav({ items }: { items: readonly NavItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="hidden bg-[#2980b9] shadow-md lg:block"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        {items.map((item, idx) => {
          const hasChildren = !!item.children?.length;
          const isOpen = openIdx === idx;

          return (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => handleEnter(idx, hasChildren)}
              onMouseLeave={handleLeave}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="focus-ring inline-flex items-center gap-1 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15 xl:px-5 xl:text-sm"
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
              ) : (
                <Link
                  className="focus-ring block px-4 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/15 xl:px-5 xl:text-sm"
                  href={item.href}
                >
                  {item.label}
                </Link>
              )}

              {hasChildren && isOpen ? (
                <DropdownItem
                  item={item}
                  onClose={() => setOpenIdx(null)}
                />
              ) : null}
            </div>
          );
        })}
        <Link
          className="focus-ring ml-2 bg-[#f2d25d] px-5 py-2.5 text-xs font-black uppercase tracking-wide text-[#0c2d3a] shadow-sm hover:bg-[#e6c13d] xl:text-sm"
          href="/book"
        >
          Book Now
        </Link>
      </div>
    </nav>
  );
}
