"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Crossfading background slides for the practice hero (slide 1 stays priority-loaded). */
export function PracticeHeroSlides({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  // Only the slides we have actually reached are mounted. The first paint
  // therefore downloads one hero image instead of all four; the next slide is
  // mounted (hidden) ahead of time so the crossfade still has something to
  // fade into.
  const [mounted, setMounted] = useState<number[]>([0]);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Let the hero image and the rest of the page settle first.
    const warm = window.setTimeout(
      () => setMounted((m) => (m.includes(1) ? m : [...m, 1])),
      1500,
    );
    const id = window.setInterval(() => setActive((a) => (a + 1) % images.length), 6000);
    return () => {
      window.clearTimeout(warm);
      window.clearInterval(id);
    };
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2) return;
    const next = (active + 1) % images.length;
    setMounted((m) => (m.includes(next) ? m : [...m, next]));
  }, [active, images.length]);

  return (
    <>
      {images.map((src, i) =>
        mounted.includes(i) ? (
          <Image
            key={`${i}-${src}`}
            src={src}
            alt=""
            fill
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
            unoptimized={/^https?:\/\//i.test(src)}
          />
        ) : null,
      )}
    </>
  );
}
