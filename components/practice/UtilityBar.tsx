import { telHref } from "@/lib/constants";
import type { PracticeUtilityBar } from "@/lib/practice-pages-shared";

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.trim().toLowerCase();
  if (p === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.3 1.2-3.3 3.4V11H8.5v3h2.7v7h2.3z" />
      </svg>
    );
  }
  if (p === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="16.8" cy="7.2" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
    </svg>
  );
}

/** Thin contact strip: click-to-call phones, address → maps, social icons. */
export function UtilityBar({ data }: { data: PracticeUtilityBar }) {
  if (!data.published) return null;
  const hasContent =
    data.phones.length > 0 || data.address.trim().length > 0 || data.socialLinks.length > 0;
  if (!hasContent) return null;

  return (
    <div className="bg-[var(--pp-heading)] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2 text-xs sm:text-sm">
        {data.phones.map((p) => (
          <a
            key={`${p.label}-${p.number}`}
            href={telHref(p.number)}
            className="focus-ring inline-flex items-center gap-1.5 font-bold hover:underline"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </svg>
            {p.label ? <span className="hidden sm:inline">{p.label}:</span> : null}
            <span>{p.number}</span>
          </a>
        ))}
        {data.address.trim() ? (
          <a
            href={data.mapsUrl.trim() || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 text-white/90 hover:underline"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
            </svg>
            <span>{data.address}</span>
          </a>
        ) : null}
        {data.socialLinks.length > 0 ? (
          <span className="ml-auto inline-flex items-center gap-3">
            {data.socialLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.platform || "Social link"}
                className="focus-ring text-white/90 hover:text-white"
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
