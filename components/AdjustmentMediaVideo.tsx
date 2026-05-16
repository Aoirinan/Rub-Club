"use client";

import { useRef } from "react";

export function AdjustmentMediaVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <video
      ref={ref}
      src={src}
      className="w-full bg-black object-contain"
      controls
      muted
      playsInline
      preload="metadata"
      loop
      onMouseEnter={() => {
        void ref.current?.play();
      }}
      onMouseLeave={() => {
        ref.current?.pause();
      }}
    />
  );
}
