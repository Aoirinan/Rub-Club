"use client";

import {
  PROVIDER_BG_COLOR_OPTIONS,
  PROVIDER_TEXT_COLOR_OPTIONS,
  resolveProviderColors,
  type ProviderBgColorId,
  type ProviderTextColorId,
} from "@/lib/provider-colors";

export function ProviderColorSchemeEditor({
  displayName,
  textColor,
  bgColor,
  onChange,
}: {
  displayName: string;
  textColor: ProviderTextColorId | null | undefined;
  bgColor: ProviderBgColorId | null | undefined;
  onChange: (patch: { textColor: ProviderTextColorId; bgColor: ProviderBgColorId }) => void;
}) {
  const resolved = resolveProviderColors({
    displayName,
    textColor: textColor ?? null,
    bgColor: bgColor ?? null,
  });

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold text-slate-900">Calendar color scheme</p>
      <div className="flex flex-wrap gap-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Text color</span>
          <select
            className="block w-full min-w-[10rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            value={resolved.textColor}
            onChange={(e) =>
              onChange({
                textColor: e.target.value as ProviderTextColorId,
                bgColor: resolved.bgColor,
              })
            }
          >
            {PROVIDER_TEXT_COLOR_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Background color</span>
          <select
            className="block w-full min-w-[10rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            value={resolved.bgColor}
            onChange={(e) =>
              onChange({
                textColor: resolved.textColor,
                bgColor: e.target.value as ProviderBgColorId,
              })
            }
          >
            {PROVIDER_BG_COLOR_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sample scheme</p>
        <div
          className="mt-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: resolved.bgHex, color: resolved.textHex }}
        >
          {displayName.trim() || "Provider name"} · Massage · 9:00 AM – 10:00 AM
        </div>
      </div>
    </div>
  );
}
