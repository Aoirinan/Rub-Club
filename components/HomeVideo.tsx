"use client";

import { useEffect, useRef, useState } from "react";

/** Loads the chiropractic intro video only after it scrolls into view. */
export function HomeVideo({ src, heading }: { src: string; heading: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ref.current || shouldLoad) return;
    const el = ref.current;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={ref} className="mx-auto max-w-[750px] text-center">
      <p className="text-sm font-bold text-[#173f3b] sm:text-base">{heading}</p>
      <div className="relative mt-4 aspect-video overflow-hidden bg-black shadow-lg ring-1 ring-stone-200">
        {shouldLoad ? (
          <video
            className="absolute inset-0 h-full w-full"
            controls
            playsInline
            preload="metadata"
            width={750}
            height={381}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support embedded video. Visit our YouTube or call to learn more.
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setShouldLoad(true)}
            className="focus-ring absolute inset-0 flex items-center justify-center bg-[#0f5f5c] text-white"
            aria-label="Play introduction video"
          >
            <span className="flex flex-col items-center gap-2">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f2d25d] text-[#173f3b]">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
                </svg>
              </span>
              <span className="text-sm font-bold uppercase tracking-wide">Play 30-second video</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
