"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildDefaultVisualLayoutForScope,
  headerVisualToBrandingLayout,
} from "@/lib/visual-page-migrations";
import {
  layoutsEqualVisual,
  layerLabel,
  newLayerId,
  clamp,
  normalizeVisualPageLayout,
  type VisualLayer,
  type VisualPageLayout,
  type VisualSection,
  type VisualScopeId,
} from "@/lib/visual-page-layout";
import { FreeformCanvas } from "./FreeformCanvas";
import { VisualLayerPreview } from "./VisualLayerPreview";
import type { PagePreviewData } from "./types";

type Props = {
  scopeId: VisualScopeId;
  getIdToken: () => Promise<string | null>;
  preview: PagePreviewData;
  cms: Record<string, string>;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onLayoutChange?: (layout: VisualPageLayout) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSyncHeaderLayout?: (layout: import("@/lib/header-branding-cms").HeaderBrandingLayout) => void;
  registerSave?: (fn: () => Promise<void>) => void;
};

export function VisualPageEditorCanvas({
  scopeId,
  getIdToken,
  preview,
  cms,
  selectedLayerId,
  onSelectLayer,
  onLayoutChange,
  onDirtyChange,
  onSyncHeaderLayout,
  registerSave,
}: Props) {
  const [saved, setSaved] = useState<VisualPageLayout>(() =>
    buildDefaultVisualLayoutForScope(scopeId),
  );
  const [draft, setDraft] = useState<VisualPageLayout>(() =>
    buildDefaultVisualLayoutForScope(scopeId),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const dirty = !layoutsEqualVisual(draft, saved);
  const byId = useCallback(
    (sections: VisualSection[]) =>
      Object.fromEntries(sections.map((s) => [s.id, s])) as Record<string, VisualSection>,
    [],
  );

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onLayoutChange?.(draft);
    if (scopeId === "header-branding") {
      onSyncHeaderLayout?.(headerVisualToBrandingLayout(draft));
    }
  }, [draft, onLayoutChange, onSyncHeaderLayout, scopeId]);

  const load = useCallback(async () => {
    setLoading(true);
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/admin/visual-layout?scope=${encodeURIComponent(scopeId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      layout?: VisualPageLayout;
      defaultLayout?: VisualPageLayout;
      error?: string;
    };
    const layout = normalizeVisualPageLayout(
      data.layout ?? data.defaultLayout ?? buildDefaultVisualLayoutForScope(scopeId),
    );
    setSaved(layout);
    setDraft(layout);
    setLoading(false);
  }, [getIdToken, scopeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistLayout = useCallback(
    async (next: VisualPageLayout) => {
      const normalizedNext = normalizeVisualPageLayout(next);
      setDraft(normalizedNext);
      setBusy(true);
      const token = await getIdToken();
      if (!token) {
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/visual-layout", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ scope: scopeId, layout: normalizedNext }),
      });
      if (res.ok) {
        const data = (await res.json()) as { layout?: VisualPageLayout };
        const normalized = normalizeVisualPageLayout(data.layout ?? normalizedNext);
        setSaved(normalized);
        setDraft(normalized);
        if (scopeId === "header-branding") {
          onSyncHeaderLayout?.(headerVisualToBrandingLayout(normalized));
        }
      }
      setBusy(false);
    },
    [getIdToken, scopeId, onSyncHeaderLayout],
  );

  const persistLayers = useCallback(
    async (layers: VisualLayer[]) => {
      const next = normalizeVisualPageLayout({ ...draft, layers });
      await persistLayout(next);
    },
    [draft, persistLayout],
  );

  const saveAll = useCallback(async () => {
    await persistLayout(draft);
  }, [draft, persistLayout]);

  useEffect(() => {
    registerSave?.(saveAll);
  }, [registerSave, saveAll]);

  const setLayers = useCallback((layers: VisualLayer[]) => {
    setDraft((prev) => normalizeVisualPageLayout({ ...prev, layers }));
  }, []);

  const normalizeSectionsFlow = useCallback((sections: VisualSection[]): VisualSection[] => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    let y = 2;
    return sorted.map((s, i) => {
      const h = clamp(s.h, 6, 70);
      const out = { ...s, order: i, y, h };
      y += h + 1;
      return out;
    });
  }, []);

  const updateSections = useCallback(
    (mutator: (sections: VisualSection[]) => VisualSection[]) => {
      setDraft((prev) => {
        const currentSections = prev.sections ?? [];
        const oldById = byId(currentSections);
        const nextSections = normalizeSectionsFlow(mutator(currentSections));
        const newById = byId(nextSections);
        const nextLayers = prev.layers.map((layer) => {
          if (!layer.sectionId || !oldById[layer.sectionId] || !newById[layer.sectionId]) return layer;
          const dy = newById[layer.sectionId]!.y - oldById[layer.sectionId]!.y;
          return {
            ...layer,
            box: {
              ...layer.box,
              y: clamp(layer.box.y + dy, 0, 100 - layer.box.h),
            },
          };
        });
        const nextLayout = normalizeVisualPageLayout({
          ...prev,
          sections: nextSections,
          layers: nextLayers,
        });
        void persistLayout(nextLayout);
        return nextLayout;
      });
    },
    [byId, normalizeSectionsFlow, persistLayout],
  );

  const addTextLayer = () => {
    const id = newLayerId();
    const maxZ = draft.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const layer: VisualLayer = {
      id,
      type: "text",
      label: "New text",
      content: "New text",
      sectionId:
        draft.layers.find((l) => l.id === selectedLayerId)?.sectionId ??
        draft.sections?.[0]?.id,
      box: { x: 10, y: 10, w: 35, h: 10 },
      zIndex: maxZ + 1,
    };
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: [...draft.layers, layer],
    });
    setDraft(next);
    onSelectLayer(id);
    void persistLayout(next);
  };

  const addImageLayer = async (file: File) => {
    const id = newLayerId();
    const token = await getIdToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("scope", scopeId);
    fd.append("layerId", id);
    fd.append("file", file);
    const res = await fetch("/api/admin/visual-layout/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) return;
    const maxZ = draft.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const layer: VisualLayer = {
      id,
      type: "image",
      label: "New image",
      src: data.url,
      cmsFieldId: `visual_${scopeId}_${id}`.replace(/[^a-zA-Z0-9_]/g, "_"),
      sectionId:
        draft.layers.find((l) => l.id === selectedLayerId)?.sectionId ??
        draft.sections?.[0]?.id,
      box: { x: 15, y: 15, w: 30, h: 20 },
      zIndex: maxZ + 1,
    };
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: [...draft.layers, layer],
    });
    setDraft(next);
    onSelectLayer(id);
    await persistLayout(next);
  };

  const duplicateLayer = (layer: VisualLayer) => {
    const id = newLayerId();
    const maxZ = draft.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const copy: VisualLayer = {
      ...layer,
      id,
      label: `${layer.label ?? "Layer"} copy`,
      box: { ...layer.box, x: layer.box.x + 2, y: layer.box.y + 2 },
      zIndex: maxZ + 1,
    };
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: [...draft.layers, copy],
    });
    setDraft(next);
    onSelectLayer(id);
    void persistLayout(next);
  };

  const deleteLayer = (layerId: string) => {
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.filter((l) => l.id !== layerId),
    });
    setDraft(next);
    if (selectedLayerId === layerId) onSelectLayer(null);
    void persistLayout(next);
  };

  const bringForward = (layerId: string) => {
    const maxZ = draft.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.map((l) =>
        l.id === layerId ? { ...l, zIndex: maxZ + 1 } : l,
      ),
    });
    setDraft(next);
    void persistLayout(next);
  };

  const sendBackward = (layerId: string) => {
    const minZ = draft.layers.reduce((m, l) => Math.min(m, l.zIndex), 0);
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.map((l) =>
        l.id === layerId ? { ...l, zIndex: minZ - 1 } : l,
      ),
    });
    setDraft(next);
    void persistLayout(next);
  };

  const renameLayer = (layerId: string) => {
    const current = draft.layers.find((l) => l.id === layerId);
    const nextName = window.prompt("Layer name", current?.label ?? "");
    if (!nextName) return;
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.map((l) => (l.id === layerId ? { ...l, label: nextName.trim() } : l)),
    });
    setDraft(next);
    void persistLayout(next);
  };

  const moveSection = (sectionId: string, dir: -1 | 1) => {
    updateSections((sections) => {
      const sorted = [...sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= sorted.length) return sections;
      const next = [...sorted];
      const tmp = next[idx]!;
      next[idx] = next[to]!;
      next[to] = tmp;
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const resizeSection = (sectionId: string, delta: number) => {
    updateSections((sections) =>
      sections.map((s) => (s.id === sectionId ? { ...s, h: s.h + delta } : s)),
    );
  };

  const addSection = (sectionId: string, where: "above" | "below") => {
    updateSections((sections) => {
      const sorted = [...sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      const insertAt = where === "above" ? idx : idx + 1;
      const id = `section_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
      sorted.splice(insertAt, 0, {
        id,
        label: "New section",
        y: 0,
        h: 12,
        order: insertAt,
      });
      return sorted.map((s, i) => ({ ...s, order: i }));
    });
  };

  const toggleHidden = (layerId: string) => {
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.map((l) => (l.id === layerId ? { ...l, hidden: !l.hidden } : l)),
    });
    setDraft(next);
    void persistLayout(next);
  };

  const toggleLocked = (layerId: string) => {
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)),
    });
    setDraft(next);
    void persistLayout(next);
  };

  const resetLayout = async () => {
    const def = buildDefaultVisualLayoutForScope(scopeId);
    setDraft(def);
    await persistLayout(def);
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading visual canvas…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          onClick={addTextLayer}
        >
          Add text
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Add image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void addImageLayer(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          className="text-sm font-semibold text-slate-600 underline disabled:opacity-50"
          onClick={() => void resetLayout()}
        >
          Reset to default layout
        </button>
        {dirty ? (
          <span className="text-xs font-bold text-amber-800">Unsaved moves — auto-saves on release</span>
        ) : null}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Layers</p>
        <div className="max-h-40 space-y-1 overflow-auto">
          {[...draft.layers]
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((layer) => {
              const selected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                    selected ? "bg-[#0f5f5c]/10" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    className="truncate font-semibold text-slate-800"
                    onClick={() => onSelectLayer(layer.id)}
                  >
                    {layerLabel(layer, cms)}
                  </button>
                  <button type="button" className="ml-auto text-slate-500" onClick={() => toggleHidden(layer.id)}>
                    {layer.hidden ? "Show" : "Hide"}
                  </button>
                  <button type="button" className="text-slate-500" onClick={() => toggleLocked(layer.id)}>
                    {layer.locked ? "Unlock" : "Lock"}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    <FreeformCanvas
      frameHeight={draft.frameHeight}
      layers={draft.layers}
      sections={draft.sections}
      busy={busy}
      selectedLayerId={selectedLayerId}
      onSelectLayer={onSelectLayer}
      onLayersChange={setLayers}
      onPersist={persistLayers}
      hint="Click a layer to select it. Drag to move. Drag handles to resize."
      renderLayer={(layer) => (
        <VisualLayerPreview layer={layer} scopeId={scopeId} preview={preview} cms={cms} />
      )}
      renderToolbar={(layer) => (
        <>
          <span className="max-w-[140px] truncate text-[10px] font-bold text-slate-700">
            {layerLabel(layer, cms)}
          </span>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#0f5f5c] hover:bg-slate-100"
            onClick={() => bringForward(layer.id)}
          >
            Front
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => sendBackward(layer.id)}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => renameLayer(layer.id)}
          >
            Rename
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => duplicateLayer(layer)}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50"
            onClick={() => deleteLayer(layer.id)}
          >
            Delete
          </button>
        </>
      )}
      renderSections={(sections) => (
        <>
          {sections.map((section) => (
            <div
              key={section.id}
              className="pointer-events-none absolute inset-x-2 rounded border border-dashed border-[#f58b3a]/70 bg-[#f58b3a]/5"
              style={{
                top: `${section.y}%`,
                height: `${section.h}%`,
              }}
            >
              <div className="pointer-events-auto absolute -top-7 left-0 flex items-center gap-1 rounded-md border border-[#f58b3a] bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow">
                <span>{section.label}</span>
                <button type="button" className="text-slate-500" onClick={() => moveSection(section.id, -1)}>
                  Up
                </button>
                <button type="button" className="text-slate-500" onClick={() => moveSection(section.id, 1)}>
                  Down
                </button>
                <button type="button" className="text-slate-500" onClick={() => addSection(section.id, "above")}>
                  +Above
                </button>
                <button type="button" className="text-slate-500" onClick={() => addSection(section.id, "below")}>
                  +Below
                </button>
                <button type="button" className="text-slate-500" onClick={() => resizeSection(section.id, -2)}>
                  -H
                </button>
                <button type="button" className="text-slate-500" onClick={() => resizeSection(section.id, 2)}>
                  +H
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    />
    </div>
  );
}
