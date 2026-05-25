"use client";

import {
  BRAND_LABELS,
  HEADER_BRANDING_LAYOUT_DEFAULT,
  normalizeHeaderBrandingLayout,
  serializeHeaderBrandingLayout,
  type HeaderBrandKey,
} from "@/lib/header-branding-cms";

type Props = {
  selectedBrand: HeaderBrandKey | null;
  busy: boolean;
  message: { kind: "ok" | "err"; text: string } | null;
  onReset: () => void;
  onSaveIconScale?: (value: number) => void;
  iconScale?: number;
};

export function HeaderBrandingInspector({
  selectedBrand,
  busy,
  message,
  onReset,
  onSaveIconScale,
  iconScale,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Click a logo on the canvas. <strong>Drag</strong> to move. <strong>Drag the corner</strong> to
        resize.
      </p>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-semibold text-[#0f5f5c] underline"
      >
        View live header ↗
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
      {selectedBrand ? (
        <p className="rounded-lg border border-[#0f5f5c]/30 bg-[#0f5f5c]/5 px-3 py-2 text-sm font-semibold text-slate-900">
          Selected: {BRAND_LABELS[selectedBrand]}
        </p>
      ) : (
        <p className="text-xs text-slate-500">No logo selected</p>
      )}
      {selectedBrand === "ss" && onSaveIconScale ? (
        <label className="block text-xs text-slate-700">
          <span className="font-semibold">Sulphur icon vs text</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={60}
              max={100}
              value={iconScale ?? 88}
              disabled={busy}
              onChange={(e) => onSaveIconScale(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono text-xs">{iconScale ?? 88}%</span>
          </div>
        </label>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={onReset}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
      >
        Reset to default layout
      </button>
    </div>
  );
}

export function resetHeaderLayoutValue(): string {
  return serializeHeaderBrandingLayout(
    normalizeHeaderBrandingLayout(HEADER_BRANDING_LAYOUT_DEFAULT),
  );
}
