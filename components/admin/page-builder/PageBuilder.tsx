"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  blockDef,
  pageLayoutDef,
  type PageLayoutId,
  type PageLayoutState,
} from "@/lib/page-layout";
import { PageBuilderInspector } from "./PageBuilderInspector";
import { PaletteItem } from "./PaletteItem";
import { SectionPreviewCard } from "./SectionPreviewCard";
import { SectionPreviewBody } from "./previews/SectionPreviewBody";
import type { PageBuilderPageMeta, PagePreviewData } from "./types";

type Props = {
  getIdToken: () => Promise<string | null>;
  initialPageId?: PageLayoutId;
};

function layoutsEqual(a: PageLayoutState, b: PageLayoutState): boolean {
  if (a.blockOrder.length !== b.blockOrder.length) return false;
  if (a.hiddenBlocks.length !== b.hiddenBlocks.length) return false;
  return (
    a.blockOrder.every((id, i) => id === b.blockOrder[i]) &&
    [...a.hiddenBlocks].sort().join() === [...b.hiddenBlocks].sort().join()
  );
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

export function PageBuilder({ getIdToken, initialPageId = "massage" }: Props) {
  const [pages, setPages] = useState<PageBuilderPageMeta[]>([]);
  const [pageId, setPageId] = useState<PageLayoutId>(initialPageId);
  const [saved, setSaved] = useState<PageLayoutState>({ blockOrder: [], hiddenBlocks: [] });
  const [draft, setDraft] = useState<PageLayoutState>({ blockOrder: [], hiddenBlocks: [] });
  const [preview, setPreview] = useState<PagePreviewData>({
    cms: {},
    teamNames: [],
    doctorNames: [],
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = !layoutsEqual(draft, saved);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const def = pageLayoutDef(pageId);
  const paletteIds = useMemo(
    () => def.blocks.map((b) => b.id).filter((id) => !draft.blockOrder.includes(id)),
    [def.blocks, draft.blockOrder],
  );
  const paletteBlocks = useMemo(
    () =>
      paletteIds
        .map((id) => blockDef(pageId, id))
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
    setLoading(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const [layoutRes, previewRes] = await Promise.all([
      fetch(`/api/admin/page-layout?page=${encodeURIComponent(pageId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/admin/page-layout/preview?page=${encodeURIComponent(pageId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const layoutData = (await layoutRes.json()) as {
      blockOrder?: string[];
      hiddenBlocks?: string[];
      error?: string;
    };
    const previewData = (await previewRes.json()) as PagePreviewData & { error?: string };
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
    if (previewRes.ok) {
      setPreview({
        cms: previewData.cms ?? {},
        teamNames: previewData.teamNames ?? [],
        doctorNames: previewData.doctorNames ?? [],
      });
    }
    setLoading(false);
  }, [getIdToken, pageId]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  useEffect(() => {
    void loadLayout();
    setSelectedBlockId(null);
  }, [loadLayout]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  async function save() {
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
      setMessage("Published — live page updates within about a minute.");
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
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("palette-")) {
      const blockId = activeId.replace(/^palette-/, "");
      if (overId === "palette-drop" || overId === "trash") return;
      if (draft.blockOrder.includes(overId)) {
        insertBlock(blockId, overId);
      } else if (overId === "canvas-drop") {
        insertBlock(blockId, null);
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
    activeDragId && !activeDragId.startsWith("palette-")
      ? blockDef(pageId, activeDragId)
      : activeDragId?.startsWith("palette-")
        ? blockDef(pageId, activeDragId.replace(/^palette-/, ""))
        : undefined;

  const activePage = pages.find((p) => p.id === pageId);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/admin/super/site-content"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Site content
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Page builder</h1>
        {dirty ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            Unsaved changes
          </span>
        ) : null}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <label className="text-sm">
            <span className="sr-only">Page</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              value={pageId}
              onChange={(e) => setPageId(e.target.value as PageLayoutId)}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
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
          <button
            type="button"
            disabled={saving || loading || !dirty}
            onClick={() => void save()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </header>

      {message ? (
        <p className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}

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
            <DroppableZone id="palette-drop" label="Remove section drop zone" className="mt-3 min-h-[80px] space-y-2">
              {paletteBlocks.length === 0 ? (
                <p className="text-xs text-slate-400">All sections are on the page</p>
              ) : (
                paletteBlocks.map((b) => (b ? <PaletteItem key={b.id} block={b} /> : null))
              )}
            </DroppableZone>
            <DroppableZone id="trash" label="Trash" className="mt-4 rounded-lg border border-dashed border-rose-200 bg-rose-50/50 p-3 text-center text-xs font-semibold text-rose-700">
              Drop here to remove from page
            </DroppableZone>
          </aside>

          <main className="min-w-0 flex-1 p-4 lg:p-6">
            {loading ? (
              <p className="text-sm text-slate-600">Loading canvas…</p>
            ) : (
              <DroppableZone id="canvas-drop" label="Page canvas" className="mx-auto max-w-2xl">
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
              </DroppableZone>
            )}
          </main>

          <aside className="w-full shrink-0 border-t border-slate-200 bg-slate-50 p-4 lg:w-72 lg:border-l lg:border-t-0">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>
            <PageBuilderInspector
              pageId={pageId}
              selectedBlockId={selectedBlockId}
              hiddenBlocks={draft.hiddenBlocks}
              onToggleHidden={(blockId) => {
                setDraft((prev) => {
                  const hidden = new Set(prev.hiddenBlocks);
                  if (hidden.has(blockId)) hidden.delete(blockId);
                  else hidden.add(blockId);
                  return { ...prev, hiddenBlocks: [...hidden] };
                });
              }}
              onRemove={removeBlock}
            />
          </aside>
        </div>

        <DragOverlay>
          {activeBlock ? (
            <div className="max-w-md rounded-xl border-2 border-[#0f5f5c] bg-white p-4 shadow-2xl opacity-95">
              <p className="text-sm font-bold text-slate-900">{activeBlock.label}</p>
              <div className="mt-2 pointer-events-none">
                <SectionPreviewBody block={activeBlock} preview={preview} />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
