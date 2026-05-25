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
  normalizeVisualPageLayout,
  type VisualLayer,
  type VisualPageLayout,
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

  const persist = useCallback(
    async (layers: VisualLayer[]) => {
      const next = normalizeVisualPageLayout({ ...draft, layers });
      setDraft(next);
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
        body: JSON.stringify({ scope: scopeId, layout: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as { layout?: VisualPageLayout };
        const normalized = normalizeVisualPageLayout(data.layout ?? next);
        setSaved(normalized);
        setDraft(normalized);
        if (scopeId === "header-branding") {
          onSyncHeaderLayout?.(headerVisualToBrandingLayout(normalized));
        }
      }
      setBusy(false);
    },
    [draft, getIdToken, scopeId, onSyncHeaderLayout],
  );

  const saveAll = useCallback(async () => {
    await persist(draft.layers);
  }, [draft.layers, persist]);

  useEffect(() => {
    registerSave?.(saveAll);
  }, [registerSave, saveAll]);

  const setLayers = useCallback((layers: VisualLayer[]) => {
    setDraft((prev) => normalizeVisualPageLayout({ ...prev, layers }));
  }, []);

  const addTextLayer = () => {
    const id = newLayerId();
    const maxZ = draft.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const layer: VisualLayer = {
      id,
      type: "text",
      label: "New text",
      content: "New text",
      box: { x: 10, y: 10, w: 35, h: 10 },
      zIndex: maxZ + 1,
    };
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: [...draft.layers, layer],
    });
    setDraft(next);
    onSelectLayer(id);
    void persist(next.layers);
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
      box: { x: 15, y: 15, w: 30, h: 20 },
      zIndex: maxZ + 1,
    };
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: [...draft.layers, layer],
    });
    setDraft(next);
    onSelectLayer(id);
    await persist(next.layers);
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
    void persist(next.layers);
  };

  const deleteLayer = (layerId: string) => {
    const next = normalizeVisualPageLayout({
      ...draft,
      layers: draft.layers.filter((l) => l.id !== layerId),
    });
    setDraft(next);
    if (selectedLayerId === layerId) onSelectLayer(null);
    void persist(next.layers);
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
    void persist(next.layers);
  };

  const resetLayout = async () => {
    const def = buildDefaultVisualLayoutForScope(scopeId);
    setDraft(def);
    await persist(def.layers);
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
    <FreeformCanvas
      frameHeight={draft.frameHeight}
      layers={draft.layers}
      busy={busy}
      selectedLayerId={selectedLayerId}
      onSelectLayer={onSelectLayer}
      onLayersChange={setLayers}
      onPersist={persist}
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
            Forward
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
    />
    </div>
  );
}
