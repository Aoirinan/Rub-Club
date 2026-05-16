"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type ChiropracticDoctorCardProps = {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  /** When set, shows “Meet the doctor” and opens a lightbox with `/media/doctors/[videoFile]`. */
  videoFile: string | null;
};

function meetButtonLabel(fullName: string): string {
  const without = fullName.replace(/^Dr\.\s*/i, "").trim();
  const first = without.split(/\s+/)[0] ?? without;
  return `Meet Dr. ${first}`;
}

export function ChiropracticDoctorCard({
  name,
  role,
  bio,
  imageSrc,
  videoFile,
}: ChiropracticDoctorCardProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const list = [...focusables].filter((el) => !el.hasAttribute("disabled"));
    const first = list[0];
    const last = list[list.length - 1];
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || list.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    root.addEventListener("keydown", onTab);
    return () => root.removeEventListener("keydown", onTab);
  }, [open]);

  useEffect(() => {
    if (open && videoRef.current) {
      void videoRef.current.play();
    }
  }, [open]);

  return (
    <>
      <article className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm">
        <div className="relative aspect-[3/4] w-full bg-stone-200">
          <Image
            src={imageSrc}
            alt={`Portrait of ${name}, ${role}`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg font-black text-[#173f3b]">{name}</h3>
          <p className="text-sm font-bold text-stone-600">{role}</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{bio}</p>
          {videoFile ? (
            <button
              type="button"
              className="focus-ring mt-4 inline-flex items-center gap-1 self-start border-2 border-[#0f5f5c] px-4 py-2 text-sm font-black text-[#0f5f5c] hover:bg-[#0f5f5c]/10"
              onClick={() => setOpen(true)}
            >
              <span aria-hidden>▶</span> {meetButtonLabel(name)}
            </button>
          ) : null}
        </div>
      </article>

      {open && videoFile ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Meet ${name}`}
            className="relative w-full max-w-[800px] rounded-lg bg-black p-2 shadow-xl ring-1 ring-white/20"
          >
            <button
              ref={closeRef}
              type="button"
              className="focus-ring absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-[#173f3b] hover:bg-white"
              onClick={close}
              aria-label="Close video"
            >
              ×
            </button>
            <video
              ref={videoRef}
              src={`/media/doctors/${videoFile}`}
              className="max-h-[85vh] w-full rounded-md"
              controls
              playsInline
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
