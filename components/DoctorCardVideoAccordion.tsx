"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";

type VideoItem = {
  src: string;
  label?: string;
};

export function DoctorCardVideoAccordion({ videos }: { videos: VideoItem[] }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const pathname = usePathname() ?? "/";
  // Brand-aware link color: page theme var if present, else red/blue by site section.
  const summaryColor = pathname.startsWith("/sulphur-springs")
    ? "text-[var(--pp-accent,var(--brand-ss-accent,#2980b9))] hover:text-[var(--pp-accent-hover,var(--brand-ss-accent-hover,#1a6da3))]"
    : "text-[var(--pp-accent,var(--brand-paris-accent,#c0392b))] hover:text-[var(--pp-accent-hover,var(--brand-paris-accent-hover,#962d22))]";

  if (videos.length === 0) return null;

  return (
    <details
      className="group mt-3 border-t border-stone-200 pt-3"
      onToggle={(e) => {
        if (!(e.currentTarget as HTMLDetailsElement).open) {
          refs.current.forEach((video) => video?.pause());
        }
      }}
    >
      <summary
        className={`focus-ring flex cursor-pointer list-none items-center gap-1 text-sm font-bold ${summaryColor} [&::-webkit-details-marker]:hidden`}
      >
        Video
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="ml-1 shrink-0 transition group-open:rotate-180"
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
      </summary>
      <div className="mt-2 space-y-2">
        {videos.map((video, idx) => (
          <div key={`${video.src}-${idx}`}>
            {video.label && videos.length > 1 ? (
              <p className="mb-1 text-xs font-semibold text-stone-500">{video.label}</p>
            ) : null}
            <video
              ref={(el) => {
                refs.current[idx] = el;
              }}
              src={video.src}
              className="w-full max-h-44 rounded-md bg-black object-contain ring-1 ring-stone-200"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        ))}
      </div>
    </details>
  );
}
