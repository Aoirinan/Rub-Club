import type { PracticeUtilityBar } from "@/lib/practice-pages-shared";

export function SocialIcon({ platform, large = false }: { platform: string; large?: boolean }) {
  const size = large ? "h-6 w-6" : "h-4 w-4";
  const p = platform.trim().toLowerCase();
  if (p === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={size} fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.3 1.2-3.3 3.4V11H8.5v3h2.7v7h2.3z" />
      </svg>
    );
  }
  if (p === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="16.8" cy="7.2" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
    </svg>
  );
}

/** Thin strip below header: social icons only (phones/address live in nav + contact pages). */
export function UtilityBar({ data }: { data: PracticeUtilityBar }) {
  if (!data.published) return null;
  if (data.socialLinks.length === 0) return null;

  return (
    <div className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2">
        <span className="inline-flex items-center gap-4">
          {data.socialLinks.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform || "Social link"}
              className="focus-ring text-white/90 hover:text-white"
            >
              <SocialIcon platform={s.platform} large />
            </a>
          ))}
        </span>
      </div>
    </div>
  );
}
