"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ParisLockup } from "@/components/ParisLockup";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import type { HeaderBrandKey } from "@/lib/brand-logos";
import {
  ALL_HEADER_LOGO_HEIGHT_FIELD_IDS,
  DEFAULT_HEADER_LOGO_HEIGHTS,
  HEADER_LOGO_HEIGHT_FIELDS,
  HEADER_LOGO_HEIGHT_MAX_PX,
  HEADER_LOGO_HEIGHT_MIN_PX,
  parseHeaderLogoHeightPx,
} from "@/lib/header-logo-sizes";

type Props = {
  fields: SiteContentFieldRow[];
  busy: boolean;
  onSave: (id: string, value: string) => Promise<void>;
};

type SlotKey = "nav" | "mobile";

type BrandEditorConfig = {
  key: HeaderBrandKey;
  label: string;
  navLabel: string;
  mobileLabel: string;
};

const BRANDS: BrandEditorConfig[] = [
  {
    key: "chiro",
    label: "Paris (Chiropractic)",
    navLabel: "Desktop nav center",
    mobileLabel: "Mobile header",
  },
  {
    key: "ss",
    label: "Sulphur Springs",
    navLabel: "Desktop nav center",
    mobileLabel: "Mobile header",
  },
];

function fieldValue(fields: SiteContentFieldRow[], id: string, fallback: string): string {
  const row = fields.find((f) => f.id === id);
  return row?.value?.trim() ? row.value : fallback;
}

function displayMarkPx(
  brand: HeaderBrandKey,
  slot: SlotKey,
  storedPx: number,
): number {
  if (slot === "nav") return storedPx;
  const mult = brand === "chiro" ? 1.25 : 1.35;
  return Math.round(storedPx * mult);
}

function ResizableLogoSlot({
  label,
  storedHeightPx,
  displayHeightPx,
  min,
  max,
  busy,
  onCommit,
  renderPreview,
}: {
  label: string;
  storedHeightPx: number;
  displayHeightPx: number;
  min: number;
  max: number;
  busy: boolean;
  onCommit: (px: number) => Promise<void>;
  renderPreview: (displayPx: number) => React.ReactNode;
}) {
  const [draftStored, setDraftStored] = useState(storedHeightPx);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startStored = useRef(0);
  const displayMult =
    storedHeightPx > 0 ? displayHeightPx / storedHeightPx : 1;

  useEffect(() => {
    if (!dragging) setDraftStored(storedHeightPx);
  }, [storedHeightPx, dragging]);

  const draftDisplay = Math.round(draftStored * displayMult);

  const clampStored = useCallback(
    (px: number) =>
      Math.min(max, Math.max(min, Math.round(px))),
    [min, max],
  );

  const onResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (busy) return;
    e.preventDefault();
    startY.current = e.clientY;
    startStored.current = draftStored;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const deltaDisplay = e.clientY - startY.current;
    const deltaStored = deltaDisplay / displayMult;
    setDraftStored(clampStored(startStored.current + deltaStored));
  };

  const onResizePointerUp = async (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    const next = clampStored(draftStored);
    setDraftStored(next);
    if (next !== storedHeightPx) await onCommit(next);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <label className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
          Size
          <input
            type="number"
            min={min}
            max={max}
            value={draftStored}
            disabled={busy}
            onChange={(e) => setDraftStored(clampStored(Number(e.target.value)))}
            onBlur={async () => {
              const next = clampStored(draftStored);
              setDraftStored(next);
              if (next !== storedHeightPx) await onCommit(next);
            }}
            className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right text-xs text-slate-900"
          />
          px
        </label>
      </div>
      <div
        className={`relative flex min-h-[120px] items-center justify-center rounded-md border border-dashed px-4 py-6 transition-colors ${
          dragging ? "border-[#c0392b] bg-[#c0392b]/5" : "border-slate-300 bg-slate-50"
        }`}
      >
        <div
          className="relative inline-flex max-w-full flex-col items-center"
          style={{ height: `${draftDisplay}px` }}
        >
          <div className="flex h-full max-w-full items-center justify-center overflow-visible">
            {renderPreview(draftDisplay)}
          </div>
          <button
            type="button"
            aria-label={`Drag to resize ${label}`}
            disabled={busy}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={(e) => void onResizePointerUp(e)}
            onPointerCancel={(e) => void onResizePointerUp(e)}
            className={`absolute -bottom-3 left-1/2 flex h-6 w-10 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full border bg-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              dragging
                ? "border-[#c0392b] text-[#c0392b]"
                : "border-slate-300 text-slate-500 hover:border-[#c0392b] hover:text-[#c0392b]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="opacity-80">
              <path d="M2 5h10M2 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Drag the handle below the logo to resize. Changes save when you release.
      </p>
    </div>
  );
}

function ParisLogoPreview({
  slot,
  displayPx,
  title,
  subtitle,
}: {
  slot: SlotKey;
  displayPx: number;
  title: string;
  subtitle: string;
}) {
  const markOnly = slot === "nav";
  const stacked = slot === "mobile";

  return (
    <ParisLockup
      heightPx={displayPx}
      markOnly={markOnly}
      stacked={stacked}
      title={title}
      subtitle={subtitle}
      className="max-w-full"
    />
  );
}

function SulphurLogoPreview({
  slot,
  displayPx,
  logoUrl,
}: {
  slot: SlotKey;
  displayPx: number;
  logoUrl: string;
}) {
  const markOnly = slot === "nav";
  const stacked = slot === "mobile";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={360}
        height={120}
        className="w-auto max-w-full object-contain mix-blend-multiply"
        style={{ height: `${displayPx}px` }}
        unoptimized
      />
    );
  }

  return (
    <SulphurSpringsLockup
      primary
      heightPx={displayPx}
      markOnly={markOnly}
      stacked={stacked}
      className="max-w-full"
    />
  );
}

export function HeaderLogoSizeEditor({ fields, busy, onSave }: Props) {
  const hasHeightFields = ALL_HEADER_LOGO_HEIGHT_FIELD_IDS.some((id) =>
    fields.some((f) => f.id === id),
  );

  const values = useMemo(() => {
    const out: Record<HeaderBrandKey, Record<SlotKey, number>> = {
      chiro: { nav: 0, mobile: 0 },
      ss: { nav: 0, mobile: 0 },
    };
    for (const brand of BRANDS) {
      const defs = HEADER_LOGO_HEIGHT_FIELDS[brand.key];
      const defaults = DEFAULT_HEADER_LOGO_HEIGHTS[brand.key];
      out[brand.key].nav = parseHeaderLogoHeightPx(
        fieldValue(fields, defs.nav, String(defaults.nav)),
        defaults.nav,
      );
      out[brand.key].mobile = parseHeaderLogoHeightPx(
        fieldValue(fields, defs.mobile, String(defaults.mobile)),
        defaults.mobile,
      );
    }
    return out;
  }, [fields]);

  const parisTitle = fieldValue(fields, "header_paris_lockup_title", "Chiropractic Associates");
  const parisSubtitle = fieldValue(
    fields,
    "header_paris_lockup_subtitle",
    "& The Rub Club · Paris, TX",
  );
  const ssLogoUrl = fieldValue(fields, "header_ss_logo", "");

  if (!hasHeightFields) return null;

  async function commitHeight(brand: HeaderBrandKey, slot: SlotKey, px: number) {
    const fieldId = HEADER_LOGO_HEIGHT_FIELDS[brand][slot];
    await onSave(fieldId, String(px));
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <header>
        <h3 className="text-sm font-bold text-slate-900">Logo size</h3>
        <p className="mt-1 text-xs text-slate-600">
          Drag each logo to resize it, or type an exact pixel size in the box. Width scales
          automatically so the logo keeps its aspect ratio. Changes preview live and save on release.
        </p>
      </header>

      {BRANDS.map((brand) => (
        <div key={brand.key} className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{brand.label}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResizableLogoSlot
              label={brand.navLabel}
              storedHeightPx={values[brand.key].nav}
              displayHeightPx={displayMarkPx(brand.key, "nav", values[brand.key].nav)}
              min={HEADER_LOGO_HEIGHT_MIN_PX}
              max={HEADER_LOGO_HEIGHT_MAX_PX}
              busy={busy}
              onCommit={(px) => commitHeight(brand.key, "nav", px)}
              renderPreview={(displayPx) =>
                brand.key === "chiro" ? (
                  <ParisLogoPreview
                    slot="nav"
                    displayPx={displayPx}
                    title={parisTitle}
                    subtitle={parisSubtitle}
                  />
                ) : (
                  <SulphurLogoPreview slot="nav" displayPx={displayPx} logoUrl={ssLogoUrl} />
                )
              }
            />
            <ResizableLogoSlot
              label={brand.mobileLabel}
              storedHeightPx={values[brand.key].mobile}
              displayHeightPx={displayMarkPx(brand.key, "mobile", values[brand.key].mobile)}
              min={HEADER_LOGO_HEIGHT_MIN_PX}
              max={HEADER_LOGO_HEIGHT_MAX_PX}
              busy={busy}
              onCommit={(px) => commitHeight(brand.key, "mobile", px)}
              renderPreview={(displayPx) =>
                brand.key === "chiro" ? (
                  <ParisLogoPreview
                    slot="mobile"
                    displayPx={displayPx}
                    title={parisTitle}
                    subtitle={parisSubtitle}
                  />
                ) : (
                  <SulphurLogoPreview slot="mobile" displayPx={displayPx} logoUrl={ssLogoUrl} />
                )
              }
            />
          </div>
        </div>
      ))}
    </section>
  );
}
