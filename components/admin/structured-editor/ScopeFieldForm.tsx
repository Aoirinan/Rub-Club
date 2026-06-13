"use client";

import { useMemo } from "react";
import { CmsFieldEditor } from "@/components/admin/cms/CmsFieldEditor";
import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import {
  contentScopeDef,
  isContentScopeId,
  type ContentScopeId,
} from "@/lib/page-builder-content-scopes";
import { isPageLayoutId, type PageLayoutId } from "@/lib/page-layout";
import {
  HERO_BLOCK_ID,
  heroFieldIdsForLayoutPage,
  layoutPageLabels,
} from "@/lib/page-builder-cms";
import { CONTENT_REGISTRY, type ContentFieldMeta } from "@/lib/cms-registry";
import { pageLayoutDef } from "@/lib/page-layout";

type Props = {
  scope: string;
  fields: SiteContentFieldRow[];
  busy: boolean;
  message: { kind: "ok" | "err"; text: string } | null;
  onSave: (id: string, value: string, file?: File) => Promise<void>;
  onReset: (id: string, label: string) => Promise<void>;
  /** Field ids to hide (e.g. legacy fields superseded by the practice editor). */
  excludeFieldIds?: string[];
};

type SectionDef = {
  id: string;
  label: string;
  description?: string;
  fieldIds: string[];
};

function sectionsForLayoutPage(pageId: PageLayoutId): SectionDef[] {
  const sections: SectionDef[] = [];
  const heroIds = heroFieldIdsForLayoutPage(pageId);
  if (heroIds.length > 0) {
    sections.push({
      id: `${pageId}_hero`,
      label: "Page hero",
      description: "Top of the page heading and subheading.",
      fieldIds: heroIds,
    });
  }
  const def = pageLayoutDef(pageId);
  for (const block of def.blocks) {
    if (block.id === HERO_BLOCK_ID) continue;
    if (!block.cmsFieldIds?.length) continue;
    sections.push({
      id: block.id,
      label: block.label,
      fieldIds: block.cmsFieldIds,
    });
  }
  // Catch any other registry fields tied to this layout page but not bound to a block.
  const allLabels = layoutPageLabels(pageId);
  const known = new Set(sections.flatMap((s) => s.fieldIds));
  const extras = CONTENT_REGISTRY.filter(
    (f) => allLabels.includes(f.pageLabel) && !known.has(f.id),
  );
  if (extras.length > 0) {
    sections.push({
      id: `${pageId}_other`,
      label: "Other fields",
      fieldIds: extras.map((f) => f.id),
    });
  }
  return sections;
}

function sectionsForContentScope(scopeId: ContentScopeId): SectionDef[] {
  const def = contentScopeDef(scopeId);
  return def.sections.map((s) => ({
    id: s.id,
    label: s.label,
    fieldIds: s.fieldIds,
  }));
}

function pickFields(
  ids: string[],
  rows: SiteContentFieldRow[],
): { rows: SiteContentFieldRow[]; missing: ContentFieldMeta[] } {
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const present: SiteContentFieldRow[] = [];
  const missing: ContentFieldMeta[] = [];
  for (const id of ids) {
    const r = rowMap.get(id);
    if (r) present.push(r);
    else {
      const meta = CONTENT_REGISTRY.find((m) => m.id === id);
      if (meta) missing.push(meta);
    }
  }
  return { rows: present, missing };
}

export function ScopeFieldForm({
  scope,
  fields,
  busy,
  message,
  onSave,
  onReset,
  excludeFieldIds,
}: Props) {
  const sections = useMemo<SectionDef[]>(() => {
    const base = isPageLayoutId(scope)
      ? sectionsForLayoutPage(scope)
      : isContentScopeId(scope)
        ? sectionsForContentScope(scope)
        : [];
    if (!excludeFieldIds?.length) return base;
    const hidden = new Set(excludeFieldIds);
    return base
      .map((s) => ({ ...s, fieldIds: s.fieldIds.filter((id) => !hidden.has(id)) }))
      .filter((s) => s.fieldIds.length > 0);
  }, [scope, excludeFieldIds]);

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Nothing editable here yet. Pick another page from the dropdown above.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const { rows, missing } = pickFields(section.fieldIds, fields);
        if (rows.length === 0 && missing.length === 0) return null;
        return (
          <section
            key={section.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <header className="mb-3">
              <h3 className="text-sm font-bold text-slate-900">{section.label}</h3>
              {section.description ? (
                <p className="text-xs text-slate-500">{section.description}</p>
              ) : null}
            </header>
            <div className="space-y-2">
              {rows.map((row) => (
                <CmsFieldEditor
                  key={row.id}
                  field={row}
                  busy={busy}
                  onSave={onSave}
                  onReset={onReset}
                  compact
                />
              ))}
              {missing.length > 0 ? (
                <p className="text-xs text-slate-500">
                  {missing.length} field{missing.length === 1 ? "" : "s"} still loading…
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
      {message ? (
        <p
          className={`text-xs font-bold ${
            message.kind === "ok" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
