"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Auth } from "firebase/auth";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSiteContentFields } from "@/components/admin/cms/useSiteContentFields";
import { HERO_BLOCK_ID } from "@/lib/page-builder-cms";
import {
  CONTENT_SCOPES,
  isContentScopeId,
  isFaqItemsScope,
  type ContentScopeId,
} from "@/lib/page-builder-content-scopes";
import { scopeKind } from "@/lib/page-builder-cms";
import {
  blockDef,
  isPageLayoutId,
  pageLayoutDef,
  type PageLayoutId,
  type PageLayoutState,
} from "@/lib/page-layout";
import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import { FaqItemsPanel } from "@/components/admin/FaqItemsPanel";
import { ContentScopeCanvas } from "./ContentScopeCanvas";
import { HeaderBrandingCanvas } from "./HeaderBrandingCanvas";
import { resetHeaderLayoutValue } from "./HeaderBrandingInspector";
import { HeroPreviewCard } from "./HeroPreviewCard";
import { PageBuilderInspector } from "./PageBuilderInspector";
import { PaletteItem } from "./PaletteItem";
import { SectionPreviewCard } from "./SectionPreviewCard";
import { SectionPreviewBody } from "./previews/SectionPreviewBody";
import type { PageBuilderPageMeta, PagePreviewData } from "./types";
import {
  HEADER_BRANDING_LAYOUT_FIELD,
  parseHeaderBrandingLayout,
  serializeHeaderBrandingLayout,
  type HeaderBrandKey,
  type HeaderBrandingLayout,
} from "@/lib/header-branding-cms";

type Props = {
  getIdToken: () => Promise<string | null>;
  auth: Auth | null;
  initialScope?: string;
};

function layoutsEqual(a: PageLayoutState, b: PageLayoutState): boolean {
  if (a.blockOrder.length !== b.blockOrder.length) return false;
  if (a.hiddenBlocks.length !== b.hiddenBlocks.length) return false;
  return (
    a.blockOrder.every((id, i) => id === b.blockOrder[i]) &&
    [...a.hiddenBlocks].sort().join() === [...b.hiddenBlocks].sort().join()
  );
}

function parseInitialScope(raw?: string): PageBuilderScopeId {
  if (raw && isPageLayoutId(raw)) return raw;
  if (raw && isFaqItemsScope(raw)) return raw;
  if (raw && isContentScopeId(raw)) return raw;
  return "massage";
}

function DroppableZone({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      aria-label={label}
      className={`${className ?? ""} ${isOver ? "ring-2 ring-[#0f5f5c]/40" : ""}`}
    >
      {children}
    </div>
  );
}

export function PageBuilder({ getIdToken, auth, initialScope }: Props) {
  const [scope, setScope] = useState<PageBuilderScopeId>(() => parseInitialScope(initialScope));
  const [pages, setPages] = useState<PageBuilderPageMeta[]>([]);
  const [saved, setSaved] = useState<PageLayoutState>({ blockOrder: [], hiddenBlocks: [] });
  const [draft, setDraft] = useState<PageLayoutState>({ blockOrder: [], hiddenBlocks: [] });
  const [preview, setPreview] = useState<PagePreviewData>({
    cms: {},
    teamNames: [],
    doctorNames: [],
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);
  const [headerSelectedBrand, setHeaderSelectedBrand] = useState<HeaderBrandKey | null>(null);

  const isLayout = scopeKind(scope) === "layout";
  const isFaqScope = scope === "faq-items";
  const pageId = isLayout ? (scope as PageLayoutId) : undefined;
  const contentScopeId =
    !isLayout && !isFaqScope && isContentScopeId(scope) ? (scope as ContentScopeId) : undefined;
  const isHeaderBrandingScope = contentScopeId === "header-branding";

  const syncPreviewFromFields = useCallback(
    (fieldRows: { id: string; value: string }[]) => {
      const cms: Record<string, string> = {};
      for (const f of fieldRows) cms[f.id] = f.value;
      setPreview((prev) => ({ ...prev, cms }));
    },
    [],
  );

  const loadPreviewForLayout = useCallback(async () => {
    if (!pageId) return;
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/admin/page-layout/preview?page=${encodeURIComponent(pageId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as PagePreviewData & { error?: string };
    if (res.ok) {
      setPreview({
        cms: data.cms ?? {},
        teamNames: data.teamNames ?? [],
        doctorNames: data.doctorNames ?? [],
      });
    }
  }, [getIdToken, pageId]);

  const cms = useSiteContentFields({
    getIdToken,
    onSaved: () => {
      void loadPreviewForLayout();
    },
  });

  const cmsFieldMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of cms.fields) map[f.id] = f.value;
    return map;
  }, [cms.fields]);

  const headerLayout = useMemo(
    () => parseHeaderBrandingLayout(cmsFieldMap),
    [cmsFieldMap],
  );

  const saveHeaderLayout = useCallback(
    async (layout: HeaderBrandingLayout) => {
      await cms.saveField(HEADER_BRANDING_LAYOUT_FIELD, serializeHeaderBrandingLayout(layout));
    },
    [cms],
  );

  useEffect(() => {
    syncPreviewFromFields(cms.fields);
  }, [cms.fields, syncPreviewFromFields]);

  const dirty = isLayout && pageId ? !layoutsEqual(draft, saved) : false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const def = pageId ? pageLayoutDef(pageId) : null;
  const paletteIds = useMemo(() => {
    if (!pageId || !def) return [];
    return def.blocks.map((b) => b.id).filter((id) => !draft.blockOrder.includes(id));
  }, [def, draft.blockOrder, pageId]);
  const paletteBlocks = useMemo(
    () =>
      paletteIds
        .map((id) => (pageId ? blockDef(pageId, id) : undefined))
        .filter((b): b is NonNullable<typeof b> => Boolean(b)),
    [pageId, paletteIds],
  );

  const loadPages = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/page-layout", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { pages?: PageBuilderPageMeta[] };
    if (res.ok && data.pages?.length) setPages(data.pages);
  }, [getIdToken]);

  const loadLayout = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const layoutRes = await fetch(`/api/admin/page-layout?page=${encodeURIComponent(pageId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const layoutData = (await layoutRes.json()) as {
      blockOrder?: string[];
      hiddenBlocks?: string[];
      error?: string;
    };
    if (!layoutRes.ok) {
      setMessage(layoutData.error ?? "Could not load layout.");
      setLoading(false);
      return;
    }
    const layout: PageLayoutState = {
      blockOrder: layoutData.blockOrder ?? [],
      hiddenBlocks: layoutData.hiddenBlocks ?? [],
    };
    setSaved(layout);
    setDraft(layout);
    await loadPreviewForLayout();
    setLoading(false);
  }, [getIdToken, pageId, loadPreviewForLayout]);

  const loadCms = cms.load;
  useEffect(() => {
    void loadPages();
    void loadCms();
  }, [loadPages, loadCms]);

  useEffect(() => {
    setSelectedBlockId(null);
    if (contentScopeId === "header-branding") {
      setSelectedSectionId(null);
      setHeaderSelectedBrand(null);
    } else {
      setSelectedSectionId(null);
    }
    if (isLayout && pageId) {
      void loadLayout();
    } else {
      setLoading(false);
    }
  }, [scope, isLayout, pageId, loadLayout, contentScopeId]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  async function saveLayout() {
    if (!pageId) return;
    setSaving(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/page-layout", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        page: pageId,
        blockOrder: draft.blockOrder,
        hiddenBlocks: draft.hiddenBlocks,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      blockOrder?: string[];
      hiddenBlocks?: string[];
    };
    if (!res.ok) {
      setMessage(data.error ?? "Save failed.");
    } else {
      const next: PageLayoutState = {
        blockOrder: data.blockOrder ?? draft.blockOrder,
        hiddenBlocks: data.hiddenBlocks ?? draft.hiddenBlocks,
      };
      setSaved(next);
      setDraft(next);
      setMessage("Layout published — live page updates within about a minute.");
    }
    setSaving(false);
  }

  function insertBlock(blockId: string, beforeId: string | null) {
    setDraft((prev) => {
      if (prev.blockOrder.includes(blockId)) return prev;
      const order = [...prev.blockOrder];
      if (beforeId && order.includes(beforeId)) {
        order.splice(order.indexOf(beforeId), 0, blockId);
      } else {
        order.push(blockId);
      }
      return { ...prev, blockOrder: order };
    });
  }

  function removeBlock(blockId: string) {
    setDraft((prev) => ({
      blockOrder: prev.blockOrder.filter((id) => id !== blockId),
      hiddenBlocks: prev.hiddenBlocks.filter((id) => id !== blockId),
    }));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || !pageId) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("palette-")) {
      const blockId = activeId.replace(/^palette-/, "");
      if (overId === "palette-drop" || overId === "trash") return;
      if (draft.blockOrder.includes(overId)) {
        insertBlock(blockId, overId);
      } else {
        insertBlock(blockId, null);
      }
      return;
    }

    if (!draft.blockOrder.includes(activeId)) return;

    if (overId === "palette-drop" || overId === "trash") {
      removeBlock(activeId);
      return;
    }

    if (draft.blockOrder.includes(overId) && activeId !== overId) {
      setDraft((prev) => ({
        ...prev,
        blockOrder: arrayMove(
          prev.blockOrder,
          prev.blockOrder.indexOf(activeId),
          prev.blockOrder.indexOf(overId),
        ),
      }));
    }
  }

  const activeBlock =
    pageId && activeDragId && !activeDragId.startsWith("palette-")
      ? blockDef(pageId, activeDragId)
      : pageId && activeDragId?.startsWith("palette-")
        ? blockDef(pageId, activeDragId.replace(/^palette-/, ""))
        : undefined;

  const activePage = pageId ? pages.find((p) => p.id === pageId) : undefined;

  const inspector = (
    <PageBuilderInspector
      mode={isLayout ? "layout" : "content"}
      pageId={pageId}
      contentScopeId={contentScopeId}
      selectedBlockId={selectedBlockId}
      selectedSectionId={selectedSectionId}
      hiddenBlocks={draft.hiddenBlocks}
      fields={cms.fields}
      cmsBusy={cms.busy}
      cmsMessage={cms.message}
      auth={auth}
      onToggleHidden={(blockId) => {
        setDraft((prev) => {
          const hidden = new Set(prev.hiddenBlocks);
          if (hidden.has(blockId)) hidden.delete(blockId);
          else hidden.add(blockId);
          return { ...prev, hiddenBlocks: [...hidden] };
        });
      }}
      onRemove={removeBlock}
      onSaveField={cms.saveField}
      onResetField={cms.resetField}
      onNotify={setNotifyMessage}
      headerSelectedBrand={headerSelectedBrand}
      onHeaderResetLayout={() => {
        void cms.saveField(HEADER_BRANDING_LAYOUT_FIELD, resetHeaderLayoutValue());
      }}
      onHeaderIconScale={(value) => {
        const next = {
          ...headerLayout,
          brands: {
            ...headerLayout.brands,
            ss: { ...headerLayout.brands.ss, iconScale: value },
          },
        };
        void saveHeaderLayout(next);
      }}
      headerIconScale={headerLayout.brands.ss.iconScale}
    />
  );

  const layoutCanvas = pageId ? (
    <DroppableZone id="canvas-drop" label="Page canvas" className="mx-auto max-w-2xl">
      <div className="space-y-4">
        <HeroPreviewCard
          pageId={pageId}
          preview={preview}
          selected={selectedBlockId === HERO_BLOCK_ID}
          onSelect={() => setSelectedBlockId(HERO_BLOCK_ID)}
        />
        <SortableContext items={draft.blockOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {draft.blockOrder.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Drag sections from the left palette to build this page
              </p>
            ) : (
              draft.blockOrder.map((id) => {
                const block = blockDef(pageId, id);
                if (!block) return null;
                return (
                  <SectionPreviewCard
                    key={id}
                    block={block}
                    preview={preview}
                    selected={selectedBlockId === id}
                    hidden={draft.hiddenBlocks.includes(id)}
                    onSelect={() => setSelectedBlockId(id)}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </div>
    </DroppableZone>
  ) : null;

  const contentCanvas = isHeaderBrandingScope ? (
    cms.loading ? (
      <p className="text-sm text-slate-600">Loading header layout…</p>
    ) : (
      <HeaderBrandingCanvas
        layout={headerLayout}
        busy={cms.busy}
        selectedBrand={headerSelectedBrand}
        onSelectBrand={setHeaderSelectedBrand}
        onSaveLayout={saveHeaderLayout}
      />
    )
  ) : contentScopeId && !loading ? (
    <ContentScopeCanvas
      scopeId={contentScopeId}
      preview={preview}
      selectedSectionId={selectedSectionId}
      onSelectSection={setSelectedSectionId}
    />
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Website editor</h1>
        {dirty ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            Unsaved layout
          </span>
        ) : null}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <label className="text-sm">
            <span className="sr-only">Page or section</span>
            <select
              className="max-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              value={scope}
              onChange={(e) => setScope(parseInitialScope(e.target.value))}
            >
              <optgroup label="Service pages">
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Site copy">
                {CONTENT_SCOPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="faq-items">FAQ items</option>
              </optgroup>
            </select>
          </label>
          {activePage ? (
            <a
              href={activePage.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0f5f5c] underline"
            >
              Preview live ↗
            </a>
          ) : null}
          {isLayout ? (
            <button
              type="button"
              disabled={saving || loading || !dirty}
              onClick={() => void saveLayout()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save layout"}
            </button>
          ) : null}
        </div>
      </header>

      {message ? (
        <p className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}
      {notifyMessage ? (
        <p className="mx-4 mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
          {notifyMessage}
        </p>
      ) : null}

      {isLayout ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 flex-col gap-0 lg:flex-row">
            <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-60 lg:border-b-0 lg:border-r">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Add sections</h2>
              <p className="mt-1 text-[11px] text-slate-500">Drag onto the canvas or drop here to remove</p>
              <DroppableZone
                id="palette-drop"
                label="Remove section drop zone"
                className="mt-3 min-h-[80px] space-y-2"
              >
                {paletteBlocks.length === 0 ? (
                  <p className="text-xs text-slate-400">All sections are on the page</p>
                ) : (
                  paletteBlocks.map((b) => (b ? <PaletteItem key={b.id} block={b} /> : null))
                )}
              </DroppableZone>
              <DroppableZone
                id="trash"
                label="Trash"
                className="mt-4 rounded-lg border border-dashed border-rose-200 bg-rose-50/50 p-3 text-center text-xs font-semibold text-rose-700"
              >
                Drop here to remove from page
              </DroppableZone>
            </aside>

            <main className="min-w-0 flex-1 p-4 lg:p-6">
              {loading ? (
                <p className="text-sm text-slate-600">Loading canvas…</p>
              ) : (
                layoutCanvas
              )}
            </main>

            <aside className="w-full shrink-0 border-t border-slate-200 bg-slate-50 p-4 lg:w-[360px] lg:border-l lg:border-t-0">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>
              {inspector}
            </aside>
          </div>

          <DragOverlay>
            {activeBlock ? (
              <div className="max-w-md rounded-xl border-2 border-[#0f5f5c] bg-white p-4 shadow-2xl opacity-95">
                <p className="text-sm font-bold text-slate-900">{activeBlock.label}</p>
                <div className="pointer-events-none mt-2">
                  <SectionPreviewBody block={activeBlock} preview={preview} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : isFaqScope ? (
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <FaqItemsPanel getIdToken={getIdToken} />
        </main>
      ) : (
        <div className="flex flex-1 flex-col gap-0 lg:flex-row">
          <main className="min-w-0 flex-1 p-4 lg:p-6">
            {cms.loading ? (
              <p className="text-sm text-slate-600">Loading fields…</p>
            ) : (
              contentCanvas
            )}
          </main>
          <aside className="w-full shrink-0 border-t border-slate-200 bg-slate-50 p-4 lg:w-[360px] lg:border-l lg:border-t-0">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>
            {inspector}
          </aside>
        </div>
      )}
    </div>
  );
}
