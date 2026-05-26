"use client";

import { CmsFieldEditor } from "@/components/admin/cms/CmsFieldEditor";
import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import { getContentFieldMeta } from "@/lib/cms-registry";
import { HERO_BLOCK_ID, fieldMetaForIds, heroFieldIdsForLayoutPage } from "@/lib/page-builder-cms";
import { blockDef, isPageLayoutId, type PageLayoutId } from "@/lib/page-layout";
import { layerLabel, type VisualLayer } from "@/lib/visual-page-layout";

type Props = {
  scopeId: string;
  selectedLayer: VisualLayer | null;
  fields: SiteContentFieldRow[];
  cmsBusy: boolean;
  cmsMessage: { kind: "ok" | "err"; text: string } | null;
  onSaveField: (id: string, value: string, file?: File) => Promise<void>;
  onResetField: (id: string, label: string) => Promise<void>;
  onUpdateLayerContent: (layerId: string, content: string) => void;
  onUpdateLayerSrc: (layerId: string, src: string) => void;
  onHeaderIconScale?: (value: number) => void;
  headerIconScale?: number;
  onHeaderFrameHeight?: (value: number) => void;
  headerFrameHeight?: number;
};

function fieldRow(fields: SiteContentFieldRow[], id: string): SiteContentFieldRow | undefined {
  return fields.find((f) => f.id === id);
}

export function VisualLayoutInspector({
  scopeId,
  selectedLayer,
  fields,
  cmsBusy,
  cmsMessage,
  onSaveField,
  onResetField,
  onUpdateLayerContent,
  onUpdateLayerSrc,
  onHeaderIconScale,
  headerIconScale,
  onHeaderFrameHeight,
  headerFrameHeight,
}: Props) {
  const isHeaderScope = scopeId === "header-branding";

  const frameHeightControl =
    isHeaderScope && onHeaderFrameHeight !== undefined ? (
      <label className="block text-xs font-semibold text-slate-600">
        Header height ({headerFrameHeight ?? 132}px)
        <input
          type="range"
          min={56}
          max={220}
          value={headerFrameHeight ?? 132}
          className="mt-1 w-full"
          onChange={(e) => onHeaderFrameHeight(Number(e.target.value))}
        />
      </label>
    ) : null;

  if (!selectedLayer) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        {frameHeightControl}
        <p>Click a layer on the canvas to edit it, or use Add text / Add image above the canvas.</p>
      </div>
    );
  }

  const cmsMap = Object.fromEntries(fields.map((f) => [f.id, f.value]));

  if (selectedLayer.brandKey === "ss" && onHeaderIconScale !== undefined) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Sulphur Springs logo</h3>
        {frameHeightControl}
        <label className="block text-xs font-semibold text-slate-600">
          Icon vs text ({headerIconScale ?? 88}%)
          <input
            type="range"
            min={60}
            max={100}
            value={headerIconScale ?? 88}
            className="mt-1 w-full"
            onChange={(e) => onHeaderIconScale(Number(e.target.value))}
          />
        </label>
      </div>
    );
  }

  if (selectedLayer.type === "text" && !selectedLayer.cmsFieldId) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">{layerLabel(selectedLayer, cmsMap)}</h3>
        {frameHeightControl}
        <label className="block text-xs font-semibold text-slate-600">
          Text
          <textarea
            className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
            rows={5}
            value={selectedLayer.content ?? ""}
            onChange={(e) => onUpdateLayerContent(selectedLayer.id, e.target.value)}
          />
        </label>
      </div>
    );
  }

  if (selectedLayer.type === "image" && !selectedLayer.cmsFieldId) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Image layer</h3>
        {frameHeightControl}
        {selectedLayer.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selectedLayer.src} alt="" className="max-h-24 rounded border object-contain" />
        ) : null}
        <label className="block text-xs font-semibold text-slate-600">
          Image URL
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={selectedLayer.src ?? ""}
            onChange={(e) => onUpdateLayerSrc(selectedLayer.id, e.target.value)}
          />
        </label>
      </div>
    );
  }

  if (selectedLayer.cmsFieldId) {
    const row = fieldRow(fields, selectedLayer.cmsFieldId);
    const meta = getContentFieldMeta(selectedLayer.cmsFieldId);
    if (row && meta) {
      return (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">{meta.fieldLabel}</h3>
          <CmsFieldEditor field={row} busy={cmsBusy} onSave={onSaveField} onReset={onResetField} compact />
        </div>
      );
    }
  }

  if (selectedLayer.type === "embed" && selectedLayer.blockId === HERO_BLOCK_ID && isPageLayoutId(scopeId)) {
    const ids = heroFieldIdsForLayoutPage(scopeId as PageLayoutId);
    const metas = fieldMetaForIds(ids);
    return (
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Page hero</h3>
        {metas.map((meta) => {
          const row = fieldRow(fields, meta.id);
          if (!row) return null;
          return (
            <CmsFieldEditor
              key={meta.id}
              field={row}
              busy={cmsBusy}
              onSave={onSaveField}
              onReset={onResetField}
              compact
            />
          );
        })}
      </div>
    );
  }

  if (selectedLayer.type === "embed" && isPageLayoutId(scopeId) && selectedLayer.blockId) {
    const block = blockDef(scopeId as PageLayoutId, selectedLayer.blockId);
    if (block?.cmsFieldIds?.length) {
      const metas = fieldMetaForIds(block.cmsFieldIds);
      return (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">{block.label}</h3>
          {metas.map((meta) => {
            const row = fieldRow(fields, meta.id);
            if (!row) return null;
            return (
              <CmsFieldEditor
                key={meta.id}
                field={row}
                busy={cmsBusy}
                onSave={onSaveField}
                onReset={onResetField}
                compact
              />
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      {frameHeightControl}
      <p className="font-bold text-slate-900">{layerLabel(selectedLayer, cmsMap)}</p>
      <p className="mt-2">Drag to move, use handles to resize. Use the floating toolbar to duplicate or delete.</p>
      {cmsMessage ? (
        <p className={`mt-2 text-xs ${cmsMessage.kind === "ok" ? "text-emerald-800" : "text-rose-800"}`}>
          {cmsMessage.text}
        </p>
      ) : null}
    </div>
  );
}
