"use client";

import type { PageLayoutId } from "@/lib/page-layout";
import type { PagePreviewData } from "./types";
import { cmsExcerpt } from "./types";
import { heroFieldIdsForLayoutPage } from "@/lib/page-builder-cms";

type Props = {
  pageId: PageLayoutId;
  preview: PagePreviewData;
  selected: boolean;
  onSelect: () => void;
};

export function HeroPreviewCard({ pageId, preview, selected, onSelect }: Props) {
  const heroIds = heroFieldIdsForLayoutPage(pageId);
  const heading = preview.cms[heroIds[0] ?? ""]?.trim() || "Hero heading";
  const sub =
    heroIds[1] && preview.cms[heroIds[1]]?.trim()
      ? cmsExcerpt({ [heroIds[1]]: preview.cms[heroIds[1]]! }, [heroIds[1]])
      : pageId === "sulphur-springs"
        ? "Your pain-free life, just around the corner."
        : "Hero subheading";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-xl border-2 bg-gradient-to-br from-[#173f3b] to-[#0f5f5c] p-6 text-white shadow-md transition-shadow ${
        selected ? "border-amber-300 ring-2 ring-amber-300/40" : "border-slate-600 hover:border-slate-400"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Hero (fixed)</p>
      <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">{heading}</h2>
      <p className="mt-2 text-sm text-white/85">{sub}</p>
      <p className="mt-3 text-[10px] text-white/60">Not draggable — edit text in the inspector</p>
    </div>
  );
}
