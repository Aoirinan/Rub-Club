"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSiteContentFields } from "@/components/admin/cms/useSiteContentFields";
import {
  CONTENT_SCOPES,
  isContentScopeId,
  isFaqItemsScope,
} from "@/lib/page-builder-content-scopes";
import { isPageLayoutId, PAGE_LAYOUT_PAGES } from "@/lib/page-layout";
import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import { FaqItemsPanel } from "@/components/admin/FaqItemsPanel";
import { HeaderBrandingForm } from "./HeaderBrandingForm";
import { ScopeFieldForm } from "./ScopeFieldForm";

type Props = {
  getIdToken: () => Promise<string | null>;
  initialScope?: string;
};

function parseInitialScope(raw?: string): PageBuilderScopeId {
  if (raw && isPageLayoutId(raw)) return raw;
  if (raw && isFaqItemsScope(raw)) return raw;
  if (raw && isContentScopeId(raw)) return raw;
  return "header-branding";
}

function scopeLivePath(scope: PageBuilderScopeId): string | null {
  if (isPageLayoutId(scope)) {
    return PAGE_LAYOUT_PAGES.find((p) => p.id === scope)?.path ?? null;
  }
  if (scope === "home") return "/";
  if (scope === "header-branding") return "/";
  if (scope === "footer") return "/";
  if (scope === "navigation") return "/";
  if (scope === "about") return "/about";
  if (scope === "contact") return "/contact";
  if (scope === "wellness") return "/wellness-care-plans";
  if (scope === "insurance") return "/insurance";
  if (scope === "reviews") return "/reviews";
  if (scope === "patient-forms") return "/patient-forms";
  if (scope === "faq-copy") return "/faq";
  if (scope === "services-hub") return "/services";
  if (scope === "paris-office") return "/locations/paris";
  if (scope === "paris-staff") return "/locations/paris/staff";
  if (scope === "ss-subpages") return "/sulphur-springs";
  return null;
}

function scopeLabel(scope: PageBuilderScopeId, pages: { id: string; label: string }[]): string {
  if (isPageLayoutId(scope)) {
    return pages.find((p) => p.id === scope)?.label ?? scope;
  }
  if (scope === "faq-items") return "FAQ items";
  return CONTENT_SCOPES.find((s) => s.id === scope)?.label ?? scope;
}

export function StructuredSiteEditor({ getIdToken, initialScope }: Props) {
  const [scope, setScope] = useState<PageBuilderScopeId>(() => parseInitialScope(initialScope));
  const [previewKey, setPreviewKey] = useState(0);

  const cms = useSiteContentFields({
    getIdToken,
    onSaved: () => {
      setPreviewKey((k) => k + 1);
    },
  });

  const livePath = scopeLivePath(scope);

  const pages = useMemo(
    () => PAGE_LAYOUT_PAGES.map((p) => ({ id: p.id, label: p.label })),
    [],
  );

  const loadCms = cms.load;
  useEffect(() => {
    void loadCms();
  }, [loadCms]);

  const handleSavedRefresh = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  let main: React.ReactNode = null;
  if (scope === "faq-items") {
    main = <FaqItemsPanel getIdToken={getIdToken} />;
  } else if (scope === "header-branding") {
    main = (
      <HeaderBrandingForm
        getIdToken={getIdToken}
        cmsFields={cms.fields}
        cmsBusy={cms.busy}
        onSaveField={cms.saveField}
        onResetField={cms.resetField}
        onSaved={handleSavedRefresh}
      />
    );
  } else {
    main = (
      <ScopeFieldForm
        scope={scope}
        fields={cms.fields}
        busy={cms.busy}
        message={cms.message}
        onSave={cms.saveField}
        onReset={cms.resetField}
      />
    );
  }

  return (
    <div className="relative isolate z-0 flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Website editor</h1>
        <span className="hidden text-xs text-slate-500 sm:inline">
          Pick what to edit, change a field, save — changes appear on the live site within ~60 seconds.
        </span>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <label className="text-sm">
            <span className="sr-only">Page or section</span>
            <select
              className="max-w-[260px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              value={scope}
              onChange={(e) => setScope(parseInitialScope(e.target.value))}
            >
              <optgroup label="Header">
                <option value="header-branding">Header logos &amp; phones</option>
              </optgroup>
              <optgroup label="Service pages">
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Site copy">
                {CONTENT_SCOPES.filter((s) => s.id !== "header-branding").map((s) => (
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
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={refreshPreview}
          >
            Refresh preview
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 lg:flex-row">
        <main className="min-w-0 flex-1 p-4 lg:max-w-2xl lg:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Editing: {scopeLabel(scope, pages)}
            </h2>
            {cms.message ? (
              <p
                className={`text-xs font-bold ${
                  cms.message.kind === "ok" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {cms.message.text}
              </p>
            ) : null}
          </div>
          {cms.loading ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : (
            main
          )}
        </main>

        {livePath ? (
          <aside className="hidden w-full shrink-0 border-t border-slate-200 bg-white lg:flex lg:w-[640px] lg:flex-col lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Live preview — {livePath}
              </p>
              <a
                href={livePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0f5f5c] underline"
              >
                Open ↗
              </a>
            </div>
            <iframe
              key={`${livePath}-${previewKey}`}
              src={livePath}
              title="Site preview"
              className="h-full min-h-[calc(100vh-9rem)] w-full"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
