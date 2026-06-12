"use client";

import Image from "next/image";
import { DoctorCardVideoAccordion } from "@/components/DoctorCardVideoAccordion";

export type DoctorActionVideo = {
  src: string;
  caption?: string;
};

export type ChiropracticDoctorCardProps = {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  /** Local intro clip at `/media/doctors/[videoFile]` when CMS stores a filename. */
  videoFile?: string | null;
  /** Full URL from CMS Storage — takes precedence over videoFile when set. */
  videoUrl?: string | null;
  /** Owner-uploaded adjustment clips from Firestore doctor media. */
  actionVideos?: DoctorActionVideo[];
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
  videoFile = null,
  videoUrl = null,
  actionVideos = [],
}: ChiropracticDoctorCardProps) {
  const introSrc = videoUrl?.trim()
    ? videoUrl.trim()
    : videoFile
      ? `/media/doctors/${videoFile}`
      : null;
  const remoteImage = /^https?:\/\//i.test(imageSrc);

  const videos = [
    ...(introSrc ? [{ src: introSrc, label: meetButtonLabel(name) }] : []),
    ...actionVideos.map((v) => ({
      src: v.src,
      label: v.caption?.trim() || "Adjustment in action",
    })),
  ];

  return (
    <article className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm">
      <div className="relative aspect-[3/4] w-full bg-stone-200">
        <Image
          src={imageSrc}
          alt={`Portrait of ${name}, ${role}`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized={remoteImage}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-black text-[#4a1515]">{name}</h3>
        <p className="text-sm font-bold text-stone-600">{role}</p>
        <DoctorCardVideoAccordion videos={videos} />
        <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{bio}</p>
      </div>
    </article>
  );
}
