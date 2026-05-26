"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import {
  BRAND_ALIGNMENTS,
  BRAND_LABELS,
  HEADER_BRAND_KEYS,
  HEADER_BRANDING_LAYOUT_DEFAULT,
  HEADER_BRANDING_LAYOUT_FIELD,
  HEADER_PRESETS,
  HEADER_PRESET_HEIGHT_PX,
  LOGO_HEIGHT_PX,
  LOGO_SIZES,
  normalizeHeaderBrandingLayoutV2,
  parseHeaderBrandingLayout,
  serializeHeaderBrandingLayout,
  type BrandAlignment,
  type HeaderBrandKey,
  type HeaderBrandSettings,
  type HeaderBrandingLayoutV2,
  type HeaderPreset,
  type LogoSize,
} from "@/lib/header-branding-cms";

const PRESET_LABELS: Record<HeaderPreset, string> = {
  compact: "Compact",
  standard: "Standard",
  tall: "Tall",
};

const SIZE_LABELS: Record<LogoSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const ALIGN_LABELS: Record<BrandAlignment, string> = {
  left: "Left",
  center: "Center",
};

type Props = {
  getIdToken: () => Promise<string | null>;
  cmsFields: SiteContentFieldRow[];
  cmsBusy: boolean;
  onSaveField: (id: string, value: string) => Promise<void>;
  onResetField: (id: string, label: string) => Promise<void>;
  onSaved: () => void;
};

function readLayoutFromFields(fields: SiteContentFieldRow[]): HeaderBrandingLayoutV2 {
  const map: Record<string, string> = {};
  for (const f of fields) map[f.id] = f.value;
  const parsed = parseHeaderBrandingLayout(map);
  if (parsed.version === 2) return parsed;
  // Coerce legacy data to v2 defaults — saving once promotes the field.
  return HEADER_BRANDING_LAYOUT_DEFAULT;
}

export function HeaderBrandingForm({
  cmsFields,
  cmsBusy,
  onSaveField,
  onResetField,
  onSaved,
}: Props) {
  const initial = useMemo(() => readLayoutFromFields(cmsFields), [cmsFields]);
  const [layout, setLayout] = useState<HeaderBrandingLayoutV2>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<HeaderBrandingLayoutV2>(initial);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [savingNow, setSavingNow] = useState(false);

  useEffect(() => {
    setLayout(initial);
    setSavedSnapshot(initial);
  }, [initial]);

  const dirty = useMemo(
    () => JSON.stringify(layout) !== JSON.stringify(savedSnapshot),
    [layout, savedSnapshot],
  );

  const setPreset = (preset: HeaderPreset) =>
    setLayout((prev) => normalizeHeaderBrandingLayoutV2({ ...prev, preset }));

  const setBrand = (key: HeaderBrandKey, patch: Partial<HeaderBrandSettings>) =>
    setLayout((prev) =>
      normalizeHeaderBrandingLayoutV2({
        ...prev,
        brands: { ...prev.brands, [key]: { ...prev.brands[key], ...patch } },
      }),
    );

  const handleSave = async () => {
    const normalized = normalizeHeaderBrandingLayoutV2(layout);
    setSavingNow(true);
    setFeedback(null);
    try {
      await onSaveField(HEADER_BRANDING_LAYOUT_FIELD, serializeHeaderBrandingLayout(normalized));
      setSavedSnapshot(normalized);
      setFeedback({ kind: "ok", text: "Saved" });
      onSaved();
    } catch (e) {
      setFeedback({
        kind: "err",
        text: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setSavingNow(false);
    }
  };

  const handleResetToDefault = () => {
    setLayout(HEADER_BRANDING_LAYOUT_DEFAULT);
  };

  const handleResetField = async () => {
    if (!window.confirm("Reset the saved header layout to the original default?")) return;
    await onResetField(HEADER_BRANDING_LAYOUT_FIELD, "Header layout");
    setFeedback({ kind: "ok", text: "Reset to default" });
    onSaved();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Header size</h3>
        <p className="mt-1 text-xs text-slate-500">
          Pick how tall the header should be on every page.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HEADER_PRESETS.map((preset) => {
            const selected = layout.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
                onClick={() => setPreset(preset)}
              >
                {PRESET_LABELS[preset]}
                <span className="ml-2 text-xs font-normal opacity-80">
                  {HEADER_PRESET_HEIGHT_PX[preset]}px
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {HEADER_BRAND_KEYS.map((key) => {
        const settings = layout.brands[key];
        return (
          <section
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900">{BRAND_LABELS[key]}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-600">Logo size</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {LOGO_SIZES.map((size) => {
                    const selected = settings.logoSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                          selected
                            ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => setBrand(key, { logoSize: size })}
                      >
                        {SIZE_LABELS[size]}
                        <span className="ml-1 opacity-70">
                          {LOGO_HEIGHT_PX[key][size]}px
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600">Alignment</p>
                <div className="mt-1 flex gap-1.5">
                  {BRAND_ALIGNMENTS.map((align) => {
                    const selected = settings.align === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                          selected
                            ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => setBrand(key, { align })}
                      >
                        {ALIGN_LABELS[align]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-[#0f5f5c] focus:ring-[#0f5f5c]"
                  checked={settings.showPhone}
                  onChange={(e) => setBrand(key, { showPhone: e.target.checked })}
                />
                Show phone number under logo
              </label>

              {key === "ss" ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600">
                    Sulphur Springs icon size ({settings.iconScale ?? 88}%)
                  </p>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={settings.iconScale ?? 88}
                    className="mt-1 w-full"
                    onChange={(e) =>
                      setBrand(key, { iconScale: Number(e.target.value) })
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <button
          type="button"
          disabled={cmsBusy || savingNow}
          className="rounded-lg bg-[#0f5f5c] px-4 py-2 text-sm font-bold text-white hover:bg-[#0c4f4c] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void handleSave()}
        >
          {savingNow ? "Saving…" : "Save header"}
        </button>
        <button
          type="button"
          disabled={cmsBusy || savingNow}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={handleResetToDefault}
        >
          Reset to default values
        </button>
        <button
          type="button"
          disabled={cmsBusy || savingNow}
          className="text-xs font-semibold text-slate-500 underline disabled:opacity-50"
          onClick={() => void handleResetField()}
        >
          Wipe saved header settings
        </button>
        {dirty ? (
          <span className="text-xs font-bold text-amber-800">Unsaved changes</span>
        ) : feedback ? (
          <span
            className={`text-xs font-bold ${
              feedback.kind === "ok" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {feedback.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}
