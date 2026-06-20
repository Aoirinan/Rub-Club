"use client";

import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { shouldQuickActionOpenCallToBook } from "@/lib/call-to-book";
import type { PracticeQuickActionsSection } from "@/lib/practice-pages-shared";

function QuickActionIcon({ icon }: { icon: string }) {
  const cls = "h-10 w-10";
  switch (icon.trim().toLowerCase()) {
    case "team":
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <circle cx="17" cy="17" r="6" />
          <path d="M6 38c1.5-7 6-10 11-10s9.5 3 11 10" strokeLinecap="round" />
          <circle cx="33" cy="19" r="5" />
          <path d="M30 27.5c5.5-.5 10 2.5 11.5 9" strokeLinecap="round" />
        </svg>
      );
    case "forms":
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <rect x="11" y="6" width="26" height="36" rx="2" />
          <path d="M17 16h14M17 24h14M17 32h9" strokeLinecap="round" />
        </svg>
      );
    case "hours":
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <circle cx="24" cy="24" r="17" />
          <path d="M24 13v11l8 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <rect x="7" y="10" width="34" height="32" rx="2" />
          <path d="M7 19h34M16 6v8M32 6v8" strokeLinecap="round" />
          <path d="M18 29l5 5 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <circle cx="24" cy="24" r="17" />
          <path d="M18 24h12m0 0l-5-5m5 5l-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

const CIRCLE_CLASS =
  "group flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full border-4 border-white bg-[var(--pp-accent)] p-4 text-center text-white shadow-lg transition group-hover:shadow-xl hover:scale-105 hover:bg-[var(--pp-accent-hover)] sm:h-52 sm:w-52 sm:gap-3";

/** Row of tappable shortcut cards (About Us, Patient Forms, Hours, Schedule). */
export function QuickActionsRow({ data }: { data: PracticeQuickActionsSection }) {
  if (!data.published) return null;
  const items = data.items.filter((i) => i.label.trim().length > 0 && i.url.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Quick links"
      className="flex flex-wrap items-start justify-center gap-6 sm:gap-10"
    >
      {items.map((item) =>
        shouldQuickActionOpenCallToBook(item) ? (
          <BookingCta key={`${item.label}-${item.url}`} label={item.label} className={CIRCLE_CLASS}>
            <QuickActionIcon icon={item.icon} />
            <span className="text-xs font-bold uppercase leading-snug tracking-wide sm:text-sm">
              {item.label}
            </span>
          </BookingCta>
        ) : (
          <Link
            key={`${item.label}-${item.url}`}
            href={item.url}
            className={CIRCLE_CLASS}
          >
            <QuickActionIcon icon={item.icon} />
            <span className="text-xs font-bold uppercase leading-snug tracking-wide sm:text-sm">
              {item.label}
            </span>
          </Link>
        ),
      )}
    </section>
  );
}
