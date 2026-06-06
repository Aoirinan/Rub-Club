"use client";

import type { HeaderBandColors, HeaderColorConfig } from "@/lib/header-colors";
import { isValidHexColor } from "@/lib/header-colors";

const BAND_FIELDS: { key: keyof HeaderBandColors; label: string }[] = [
  { key: "phoneBarBg", label: "Top phone bar" },
  { key: "logoRowBg", label: "Logo row" },
  { key: "navBg", label: "Navigation bar" },
  { key: "navHover", label: "Nav hover / dropdown" },
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const pickerValue = isValidHexColor(value) ? value : "#000000";

  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-sm"
          placeholder="#000000"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function HeaderPreview({ colors }: { colors: HeaderBandColors }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <div
        className="px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-white"
        style={{ backgroundColor: colors.phoneBarBg }}
      >
        Phone bar preview
      </div>
      <div
        className="px-3 py-3 text-center text-[10px] font-semibold text-[#173f3b]"
        style={{ backgroundColor: colors.logoRowBg }}
      >
        Logo row preview
      </div>
      <div
        className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-white"
        style={{ backgroundColor: colors.navBg }}
      >
        Navigation bar preview
      </div>
    </div>
  );
}

function BandEditor({
  title,
  description,
  colors,
  onChange,
}: {
  title: string;
  description: string;
  colors: HeaderBandColors;
  onChange: (next: HeaderBandColors) => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <HeaderPreview colors={colors} />
      <div className="grid gap-4 sm:grid-cols-2">
        {BAND_FIELDS.map(({ key, label }) => (
          <ColorField
            key={key}
            label={label}
            value={colors[key]}
            onChange={(value) => onChange({ ...colors, [key]: value })}
          />
        ))}
      </div>
    </section>
  );
}

export function HeaderColorsEditor({
  config,
  onChange,
  onSave,
  saving,
}: {
  config: HeaderColorConfig;
  onChange: (next: HeaderColorConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Header colors switch automatically by business section: Paris / massage / home use the first
        palette; Sulphur Springs pages use the second. Dark logo-row backgrounds may reduce text
        contrast — text colors stay fixed for now.
      </p>

      <BandEditor
        title="Paris / Massage / Home"
        description="Used on the main site, massage pages, and Paris chiropractic pages."
        colors={config.paris}
        onChange={(paris) => onChange({ ...config, paris })}
      />

      <BandEditor
        title="Sulphur Springs"
        description="Used on Sulphur Springs pages and when the Sulphur business context is active."
        colors={config.sulphurSprings}
        onChange={(sulphurSprings) => onChange({ ...config, sulphurSprings })}
      />

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="rounded-lg bg-[#0f5f5c] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d524f] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save header colors"}
      </button>
    </div>
  );
}
