"use client";

import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import { HEADER_BRANDING_DEFAULTS, type HeaderBrandingFieldId } from "@/lib/header-branding-cms";

type BrandCard = {
  title: string;
  sideId: HeaderBrandingFieldId;
  centerId: HeaderBrandingFieldId;
  iconScaleId?: HeaderBrandingFieldId;
};

const BRAND_CARDS: BrandCard[] = [
  {
    title: "Rub Club (massage)",
    sideId: "rub_logo_height_side",
    centerId: "rub_logo_height_center",
  },
  {
    title: "Chiropractic — Paris",
    sideId: "chiro_logo_height_side",
    centerId: "chiro_logo_height_center",
  },
  {
    title: "Sulphur Springs",
    sideId: "ss_logo_height_side",
    centerId: "ss_logo_height_center",
    iconScaleId: "ss_logo_icon_scale",
  },
];

type Props = {
  fields: SiteContentFieldRow[];
  busy: boolean;
  message: { kind: "ok" | "err"; text: string } | null;
  onSave: (id: string, value: string) => Promise<void>;
};

function fieldValue(fields: SiteContentFieldRow[], id: HeaderBrandingFieldId): number {
  const raw = fields.find((f) => f.id === id)?.value;
  const fallback = parseInt(HEADER_BRANDING_DEFAULTS[id], 10);
  const n = parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function HeaderBrandingInspector({ fields, busy, message, onSave }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        Adjust how large each logo appears in the site header. Center size applies when that brand is
        the main logo on the page.
      </p>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs font-semibold text-[#0f5f5c] underline"
      >
        View site header ↗
      </a>
      {message ? (
        <p
          className={`rounded-lg px-2 py-1.5 text-xs ${
            message.kind === "ok" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"
          }`}
        >
          {message.text}
        </p>
      ) : null}
      {BRAND_CARDS.map((card) => (
        <div
          key={card.title}
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
        >
          <h4 className="text-sm font-bold text-slate-900">{card.title}</h4>
          <label className="block text-xs text-slate-700">
            <span className="font-semibold">Left/right size</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min={20}
                max={120}
                value={fieldValue(fields, card.sideId)}
                disabled={busy}
                onChange={(e) => void onSave(card.sideId, e.target.value)}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-xs">{fieldValue(fields, card.sideId)}</span>
            </div>
          </label>
          <label className="block text-xs text-slate-700">
            <span className="font-semibold">Center size (highlighted)</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min={20}
                max={120}
                value={fieldValue(fields, card.centerId)}
                disabled={busy}
                onChange={(e) => void onSave(card.centerId, e.target.value)}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-xs">
                {fieldValue(fields, card.centerId)}
              </span>
            </div>
          </label>
          {card.iconScaleId ? (
            <label className="block text-xs text-slate-700">
              <span className="font-semibold">Icon vs text</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={fieldValue(fields, card.iconScaleId)}
                  disabled={busy}
                  onChange={(e) => void onSave(card.iconScaleId!, e.target.value)}
                  className="flex-1"
                />
                <span className="w-10 text-right font-mono text-xs">
                  {fieldValue(fields, card.iconScaleId)}%
                </span>
              </div>
            </label>
          ) : null}
        </div>
      ))}
    </div>
  );
}
