"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Crossfading background slides for the practice hero (slide 1 stays priority-loaded). */
export function PracticeHeroSlides({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % images.length), 6000);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => (
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
      ))}
    </>
  );
}
