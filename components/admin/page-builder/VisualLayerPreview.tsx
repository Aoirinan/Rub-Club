"use client";

import { HeaderBrandBlock } from "@/components/HeaderBrandBlock";
import { LOCATIONS } from "@/lib/constants";
import { renderRichText } from "@/lib/cms-registry";
import type { HeaderBrandKey } from "@/lib/header-branding-cms";
import { HERO_BLOCK_ID } from "@/lib/page-builder-cms";
import { blockDef, isPageLayoutId, type PageLayoutId } from "@/lib/page-layout";
import type { VisualLayer } from "@/lib/visual-page-layout";
import { SectionPreviewBody } from "./previews/SectionPreviewBody";
import type { PagePreviewData } from "./types";

type Props = {
  layer: VisualLayer;
  scopeId: string;
  preview: PagePreviewData;
  cms: Record<string, string>;
};

export function VisualLayerPreview({ layer, scopeId, preview, cms }: Props) {
  if (layer.brandKey && (layer.brandKey === "rub" || layer.brandKey === "chiro" || layer.brandKey === "ss")) {
    const key = layer.brandKey as HeaderBrandKey;
    return (
      <HeaderBrandBlock
        brandKey={key}
        box={{
          x: 0,
          y: 0,
          w: 100,
          h: 100,
          iconScale: layer.iconScale,
        }}
        paris={LOCATIONS.paris}
        sulphur={LOCATIONS.sulphur_springs}
        interactive={false}
        disableLinks
      />
    );
  }

  if (layer.type === "image") {
    const src = layer.src ?? (layer.cmsFieldId ? cms[layer.cmsFieldId] : "") ?? "";
    if (!src) {
      return (
        <div className="flex h-full items-center justify-center rounded border border-dashed border-slate-300 bg-stone-100 text-xs text-slate-500">
          Image
        </div>
      );
    }
    return (
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={layer.alt ?? ""} className="h-full w-full object-contain object-left" />
      </div>
    );
  }

  if (layer.type === "text" || layer.type === "richtext") {
    const raw = layer.content ?? (layer.cmsFieldId ? cms[layer.cmsFieldId] : "") ?? "";
    if (!raw) {
      return (
        <div className="flex h-full items-center justify-center rounded border border-dashed border-slate-300 bg-white p-2 text-xs text-slate-500">
          {layer.label ?? "Text"}
        </div>
      );
    }
    if (layer.type === "richtext") {
      return (
        <div
          className="h-full overflow-auto p-1 text-xs leading-relaxed text-stone-800"
          dangerouslySetInnerHTML={{ __html: renderRichText(raw) }}
        />
      );
    }
    return (
      <p className="h-full overflow-auto whitespace-pre-wrap p-1 text-xs leading-relaxed text-stone-800">
        {raw}
      </p>
    );
  }

  if (layer.type === "embed") {
    if (layer.embedKey === "hero" || layer.blockId === HERO_BLOCK_ID) {
      const heading =
        cms.massage_hero_heading ??
        cms.chiro_hero_heading ??
        cms.ss_hero_heading ??
        "Page hero";
      return (
        <div className="flex h-full flex-col justify-center rounded border border-[#0f5f5c]/30 bg-gradient-to-r from-[#0f5f5c]/10 to-white p-3">
          <p className="text-sm font-black text-[#173f3b]">{heading}</p>
          <p className="text-[10px] text-stone-600">Hero — edit fields in inspector</p>
        </div>
      );
    }

    if (isPageLayoutId(scopeId) && layer.blockId) {
      const block = blockDef(scopeId as PageLayoutId, layer.blockId);
      if (block) {
        return (
          <div className="h-full overflow-auto rounded border border-slate-200 bg-white p-2 shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">{block.label}</p>
            <SectionPreviewBody block={block} preview={preview} />
          </div>
        );
      }
    }

    return (
      <div className="flex h-full items-center justify-center rounded border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700">
        {layer.label ?? layer.blockId ?? "Section"}
      </div>
    );
  }

  return null;
}
