import Link from "next/link";
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

/** Row of tappable shortcut cards (Meet Our Team, Patient Forms, Hours, Schedule). */
export function QuickActionsRow({ data }: { data: PracticeQuickActionsSection }) {
  if (!data.published) return null;
  const items = data.items.filter((i) => i.label.trim().length > 0 && i.url.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <section aria-label="Quick links" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Link
          key={`${item.label}-${item.url}`}
          href={item.url}
          className="group flex flex-col items-center gap-3 rounded-lg border-t-4 border-[var(--pp-accent)] bg-white p-5 text-center shadow-md transition hover:shadow-lg"
        >
          <span className="text-[var(--pp-accent)]">
            <QuickActionIcon icon={item.icon} />
          </span>
          <span className="text-sm font-black uppercase tracking-wide text-[var(--pp-heading)] group-hover:text-[var(--pp-accent)]">
            {item.label}
          </span>
        </Link>
      ))}
    </section>
  );
}
