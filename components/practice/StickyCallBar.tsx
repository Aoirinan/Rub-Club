import Link from "next/link";
import { telHref } from "@/lib/constants";
import type { PracticeStickyBarSection } from "@/lib/practice-pages-shared";

/**
 * Mobile-only fixed bottom bar: Call + Book. Sits above the site-wide gift
 * card banner (z-50) on these pages.
 */
export function StickyCallBar({ data }: { data: PracticeStickyBarSection }) {
  if (!data.enabled || !data.phone.trim()) return null;

  return (
    <div
      role="region"
      aria-label="Call or book"
      className="fixed bottom-0 left-0 right-0 z-[60] grid min-h-[56px] grid-cols-2 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] md:hidden"
    >
      <a
        href={telHref(data.phone)}
        className="flex items-center justify-center gap-2 bg-[var(--pp-heading)] px-4 py-3 text-sm font-black uppercase tracking-wide text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
        </svg>
        {data.callLabel.trim() || "Call Us"}
      </a>
      {data.bookUrl.trim() ? (
        <Link
          href={data.bookUrl}
          className="flex items-center justify-center gap-2 bg-[var(--pp-accent)] px-4 py-3 text-sm font-black uppercase tracking-wide text-white"
        >
          {data.bookLabel.trim() || "Book Now"}
        </Link>
      ) : (
        <a
          href={telHref(data.phone)}
          className="flex items-center justify-center gap-2 bg-[var(--pp-accent)] px-4 py-3 text-sm font-black uppercase tracking-wide text-white"
        >
          {data.bookLabel.trim() || "Book Now"}
        </a>
      )}
    </div>
  );
}
