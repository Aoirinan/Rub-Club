"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Auth } from "firebase/auth";
import { useSiteContentFields } from "@/components/admin/cms/useSiteContentFields";
import {
  CONTENT_SCOPES,
  isContentScopeId,
  isFaqItemsScope,
} from "@/lib/page-builder-content-scopes";
import { isPageLayoutId, PAGE_LAYOUT_PAGES, type PageLayoutId } from "@/lib/page-layout";
import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import { FaqItemsPanel } from "@/components/admin/FaqItemsPanel";
import {
  HEADER_BRANDING_LAYOUT_FIELD,
  parseHeaderBrandingLayout,
  serializeHeaderBrandingLayout,
  type HeaderBrandingLayout,
} from "@/lib/header-branding-cms";
import {
  headerVisualToBrandingLayout,
} from "@/lib/visual-page-migrations";
import { isVisualScopeId, type VisualPageLayout } from "@/lib/visual-page-layout";
import { VisualLayoutInspector } from "./VisualLayoutInspector";
import { VisualPageEditorCanvas } from "./VisualPageEditorCanvas";
import type { PageBuilderPageMeta, PagePreviewData } from "./types";

type Props = {
  getIdToken: () => Promise<string | null>;
  auth: Auth | null;
  initialScope?: string;
};

function parseInitialScope(raw?: string): PageBuilderScopeId {
  if (raw && isPageLayoutId(raw)) return raw;
  if (raw && isFaqItemsScope(raw)) return raw;
  if (raw && isContentScopeId(raw)) return raw;
  return "massage";
}

function scopeLivePath(scope: PageBuilderScopeId): string | null {
  if (isPageLayoutId(scope)) {
    return PAGE_LAYOUT_PAGES.find((p) => p.id === scope)?.path ?? null;
  }
  if (scope === "home") return "/";
  if (scope === "header-branding") return "/";
  if (scope === "about") return "/about";
  if (scope === "contact") return "/contact";
  if (scope === "wellness") return "/wellness-care-plans";
  if (scope === "insurance") return "/insurance";
  if (scope === "reviews") return "/reviews";
  if (scope === "patient-forms") return "/patient-forms";
  if (scope === "faq-copy") return "/faq";
  if (scope === "services-hub") return "/services";
  return null;
}

export function PageBuilder({ getIdToken, initialScope }: Props) {
  const [scope, setScope] = useState<PageBuilderScopeId>(() => parseInitialScope(initialScope));
  const [pages, setPages] = useState<PageBuilderPageMeta[]>([]);
  const [preview, setPreview] = useState<PagePreviewData>({
    cms: {},
    teamNames: [],
    doctorNames: [],
  });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [visualDraft, setVisualDraft] = useState<VisualPageLayout | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isFaqScope = scope === "faq-items";
  const visualScope = isVisualScopeId(scope) ? scope : null;
  const pageId = isPageLayoutId(scope) ? (scope as PageLayoutId) : undefined;

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
    () =>
      scope === "header-branding" && visualDraft
        ? headerVisualToBrandingLayout(visualDraft)
        : parseHeaderBrandingLayout(cmsFieldMap),
    [scope, visualDraft, cmsFieldMap],
  );

  const saveHeaderLayoutToCms = useCallback(
    async (layout: HeaderBrandingLayout) => {
      await cms.saveField(HEADER_BRANDING_LAYOUT_FIELD, serializeHeaderBrandingLayout(layout));
    },
    [cms],
  );

  useEffect(() => {
    syncPreviewFromFields(cms.fields);
  }, [cms.fields, syncPreviewFromFields]);

  const loadPages = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/page-layout", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { pages?: PageBuilderPageMeta[] };
    if (res.ok && data.pages?.length) setPages(data.pages);
  }, [getIdToken]);

  const loadCms = cms.load;
  useEffect(() => {
    void loadPages();
    void loadCms();
  }, [loadPages, loadCms]);

  useEffect(() => {
    if (pageId) void loadPreviewForLayout();
  }, [pageId, loadPreviewForLayout]);

  useEffect(() => {
    setSelectedLayerId(null);
    setVisualDraft(null);
    setMessage(null);
  }, [scope]);

  const selectedLayer = useMemo(
    () => visualDraft?.layers.find((l) => l.id === selectedLayerId) ?? null,
    [visualDraft, selectedLayerId],
  );

  const persistVisualDraft = useCallback(
    async (layoutOverride?: VisualPageLayout) => {
      const toSave = layoutOverride ?? visualDraft;
      if (!toSave || !visualScope) return;
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/visual-layout", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ scope: visualScope, layout: toSave }),
      });
      if (res.ok) {
        const data = (await res.json()) as { layout?: VisualPageLayout };
        const normalized = data.layout ?? toSave;
        setVisualDraft(normalized);
        if (scope === "header-branding") {
          await saveHeaderLayoutToCms(headerVisualToBrandingLayout(normalized));
        }
      }
    },
    [visualDraft, visualScope, getIdToken, scope, saveHeaderLayoutToCms],
  );

  const livePath = scopeLivePath(scope);

  const inspector = visualScope ? (
    <VisualLayoutInspector
      scopeId={visualScope}
      selectedLayer={selectedLayer}
      fields={cms.fields}
      cmsBusy={cms.busy}
      cmsMessage={cms.message}
      onSaveField={cms.saveField}
      onResetField={cms.resetField}
      onUpdateLayerContent={(layerId, content) => {
        setVisualDraft((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            layers: prev.layers.map((l) => (l.id === layerId ? { ...l, content } : l)),
          };
          void persistVisualDraft(next);
          return next;
        });
      }}
      onUpdateLayerSrc={(layerId, src) => {
        setVisualDraft((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            layers: prev.layers.map((l) => (l.id === layerId ? { ...l, src } : l)),
          };
          void persistVisualDraft(next);
          return next;
        });
      }}
      onHeaderIconScale={
        scope === "header-branding"
          ? (value) => {
              const key = "ss";
              setVisualDraft((prev) => {
                if (!prev) return prev;
                const next = {
                  ...prev,
                  layers: prev.layers.map((l) =>
                    l.brandKey === key && (l.embedKey === "header-logo" || l.id === "brand_logo_ss")
                      ? { ...l, iconScale: value }
                      : l,
                  ),
                };
                void persistVisualDraft(next);
                return next;
              });
            }
          : undefined
      }
      headerIconScale={headerLayout.brands.ss.iconScale}
      onHeaderFrameHeight={
        scope === "header-branding"
          ? (value) => {
              setVisualDraft((prev) => {
                if (!prev) return prev;
                const next = { ...prev, frameHeight: value };
                void persistVisualDraft(next);
                return next;
              });
            }
          : undefined
      }
      headerFrameHeight={headerLayout.frameHeight}
    />
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Website editor</h1>
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
          {livePath ? (
            <a
              href={livePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0f5f5c] underline"
            >
              View live ↗
            </a>
          ) : null}
        </div>
      </header>

      {message ? (
        <p className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}
      {isFaqScope ? (
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <FaqItemsPanel getIdToken={getIdToken} />
        </main>
      ) : visualScope ? (
        <div className="flex flex-1 flex-col gap-0 lg:flex-row">
          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <VisualPageEditorCanvas
              scopeId={visualScope}
              getIdToken={getIdToken}
              preview={preview}
              cms={cmsFieldMap}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onLayoutChange={setVisualDraft}
              onSyncHeaderLayout={(layout) => {
                if (scope === "header-branding") {
                  void saveHeaderLayoutToCms(layout);
                }
              }}
            />
          </main>
          <aside className="w-full shrink-0 border-t border-slate-200 bg-slate-50 p-4 lg:w-[360px] lg:border-l lg:border-t-0">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>
            {inspector}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
