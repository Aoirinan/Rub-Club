"use client";

import Image from "next/image";
import type { PageLayoutBlockDef } from "@/lib/page-layout";
import { IMAGES } from "@/lib/home-images";
import type { PagePreviewData } from "../types";
import { cmsExcerpt } from "../types";

type Props = {
  block: PageLayoutBlockDef;
  preview: PagePreviewData;
};

export function SectionPreviewBody({ block, preview }: Props) {
  const text = cmsExcerpt(preview.cms, block.cmsFieldIds);

  switch (block.previewKey) {
    case "introPhoto":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-xs leading-relaxed text-stone-600">
            {text || "Intro copy — edit in Site content"}
          </p>
          <div className="relative aspect-[4/3] overflow-hidden rounded bg-stone-100">
            <Image
              src={IMAGES.massagePatient}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          </div>
        </div>
      );
    case "servicesGrid":
      return (
        <div className="grid grid-cols-3 gap-2">
          {["Deep tissue", "Prenatal", "Sports"].map((s) => (
            <div key={s} className="rounded border border-stone-200 bg-stone-50 p-2 text-center text-[10px] font-bold text-[#173f3b]">
              {s}
            </div>
          ))}
          {text ? <p className="col-span-3 text-xs text-stone-600">{text}</p> : null}
        </div>
      );
    case "teamGrid":
      return (
        <div className="flex flex-wrap gap-2">
          {(preview.teamNames.length > 0 ? preview.teamNames : ["Team member"]).slice(0, 4).map((name) => (
            <span
              key={name}
              className="rounded-full bg-[#0f5f5c]/10 px-3 py-1 text-xs font-semibold text-[#173f3b]"
            >
              {name}
            </span>
          ))}
        </div>
      );
    case "doctorCards":
      return (
        <div className="flex flex-wrap gap-2">
          {(preview.doctorNames.length > 0 ? preview.doctorNames : ["Doctor"]).map((name) => (
            <div
              key={name}
              className="w-24 rounded border border-stone-200 bg-stone-50 p-2 text-center text-[10px] font-bold text-[#173f3b]"
            >
              {name}
            </div>
          ))}
        </div>
      );
    case "doctorSpotlight":
      return (
        <div className="flex gap-3">
          <div className="h-16 w-16 shrink-0 rounded-full bg-stone-200" />
          <p className="text-xs text-stone-600">
            {text || "Featured doctor — edit under Sulphur staff"}
          </p>
        </div>
      );
    case "testimonials":
      return (
        <p className="text-xs italic text-stone-600">
          {text || "Patient quotes — edit testimonial fields in Site content"}
        </p>
      );
    case "cta":
      return (
        <div className="rounded-lg bg-[#0f5f5c] px-4 py-3 text-center text-xs font-bold text-white">
          {text || block.label}
        </div>
      );
    case "locations":
      return (
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-[#173f3b]">
          <div className="rounded border border-stone-200 p-2">Paris, TX</div>
          <div className="rounded border border-stone-200 p-2">Sulphur Springs</div>
        </div>
      );
    case "featuredTiles":
      return (
        <div className="grid grid-cols-4 gap-1">
          {["Adjustments", "Auto injury", "Sports", "Resources"].map((t) => (
            <div key={t} className="rounded bg-[#2980b9]/15 p-2 text-center text-[9px] font-bold text-[#1a5276]">
              {t}
            </div>
          ))}
        </div>
      );
    case "hoursIntro":
      return (
        <div className="space-y-2">
          <p className="text-xs text-stone-600">{text || "Intro copy"}</p>
          <table className="w-full text-[10px] text-stone-600">
            <tbody>
              <tr>
                <td className="font-semibold">Mon–Fri</td>
                <td>Office hours</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    case "serviceLinks":
      return (
        <div className="flex flex-wrap gap-1">
          {["Services", "Conditions", "Forms", "Q&A"].map((l) => (
            <span key={l} className="rounded border border-stone-200 px-2 py-1 text-[10px] text-stone-700">
              {l}
            </span>
          ))}
        </div>
      );
    case "staticSection":
    default:
      return (
        <p className="text-xs text-stone-500">
          {block.description ?? "Fixed layout section — reorder or hide on the live page"}
        </p>
      );
  }
}
