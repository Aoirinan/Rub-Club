"use client";

import type { Auth } from "firebase/auth";
import { MassageTeamAdminSection } from "@/app/admin/super/_components/MassageTeamAdminSection";
import { SiteStaffAdminSection } from "@/app/admin/super/_components/SiteStaffAdminSection";
import { CmsFieldEditor } from "@/components/admin/cms/CmsFieldEditor";
import type { SiteContentFieldRow } from "@/components/admin/cms/useSiteContentFields";
import { HERO_BLOCK_ID, fieldMetaForIds, heroFieldIdsForLayoutPage } from "@/lib/page-builder-cms";
import {
  contentScopeDef,
  sectionDef,
  type ContentScopeId,
} from "@/lib/page-builder-content-scopes";
import { blockDef, type PageLayoutId } from "@/lib/page-layout";

type Props = {
  mode: "layout" | "content";
  pageId?: PageLayoutId;
  contentScopeId?: ContentScopeId;
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  hiddenBlocks: string[];
  fields: SiteContentFieldRow[];
  cmsBusy: boolean;
  cmsMessage: { kind: "ok" | "err"; text: string } | null;
  auth: Auth | null;
  onToggleHidden: (blockId: string) => void;
  onRemove: (blockId: string) => void;
  onSaveField: (id: string, value: string, file?: File) => Promise<void>;
  onResetField: (id: string, label: string) => Promise<void>;
  onNotify: (message: string | null) => void;
};

function fieldRow(fields: SiteContentFieldRow[], id: string): SiteContentFieldRow | undefined {
  return fields.find((f) => f.id === id);
}

function FieldList({
  fieldIds,
  fields,
  busy,
  onSave,
  onReset,
}: {
  fieldIds: string[];
  fields: SiteContentFieldRow[];
  busy: boolean;
  onSave: Props["onSaveField"];
  onReset: Props["onResetField"];
}) {
  const metas = fieldMetaForIds(fieldIds);
  return (
    <div className="space-y-2">
      {metas.map((meta) => {
        const row = fieldRow(fields, meta.id);
        if (!row) return null;
        return (
          <CmsFieldEditor
            key={meta.id}
            field={row}
            busy={busy}
            onSave={onSave}
            onReset={onReset}
            compact
          />
        );
      })}
    </div>
  );
}

export function PageBuilderInspector({
  mode,
  pageId,
  contentScopeId,
  selectedBlockId,
  selectedSectionId,
  hiddenBlocks,
  fields,
  cmsBusy,
  cmsMessage,
  auth,
  onToggleHidden,
  onRemove,
  onSaveField,
  onResetField,
  onNotify,
}: Props) {
  if (mode === "content" && contentScopeId) {
    if (!selectedSectionId) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Select a section on the canvas to edit its fields.
        </div>
      );
    }
    const section = sectionDef(contentScopeId, selectedSectionId);
    if (!section) return null;
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">{section.label}</h3>
        <p className="text-xs text-slate-500">{contentScopeDef(contentScopeId).label}</p>
        {cmsMessage ? (
          <p
            className={`rounded-lg px-2 py-1.5 text-xs ${
              cmsMessage.kind === "ok" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"
            }`}
          >
            {cmsMessage.text}
          </p>
        ) : null}
        <FieldList
          fieldIds={section.fieldIds}
          fields={fields}
          busy={cmsBusy}
          onSave={onSaveField}
          onReset={onResetField}
        />
      </div>
    );
  }

  if (!pageId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Select a section or hero on the canvas.
      </div>
    );
  }

  if (!selectedBlockId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Select the hero or a section on the canvas to edit layout and content.
      </div>
    );
  }

  if (selectedBlockId === HERO_BLOCK_ID) {
    const heroIds = heroFieldIdsForLayoutPage(pageId);
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Hero</h3>
        <p className="text-xs text-slate-500">Fixed at top of the live page</p>
        {cmsMessage ? (
          <p
            className={`rounded-lg px-2 py-1.5 text-xs ${
              cmsMessage.kind === "ok" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"
            }`}
          >
            {cmsMessage.text}
          </p>
        ) : null}
        <FieldList
          fieldIds={heroIds}
          fields={fields}
          busy={cmsBusy}
          onSave={onSaveField}
          onReset={onResetField}
        />
      </div>
    );
  }

  const block = blockDef(pageId, selectedBlockId);
  if (!block) return null;

  const isHidden = hiddenBlocks.includes(selectedBlockId);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{block.label}</h3>
        {block.description ? (
          <p className="mt-1 text-xs text-slate-600">{block.description}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => onToggleHidden(selectedBlockId)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          {isHidden ? "Show on live site" : "Hide on live site"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(selectedBlockId)}
          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50"
        >
          Remove from page
        </button>
      </div>

      {cmsMessage ? (
        <p
          className={`rounded-lg px-2 py-1.5 text-xs ${
            cmsMessage.kind === "ok" ? "bg-green-100 text-green-900" : "bg-rose-100 text-rose-900"
          }`}
        >
          {cmsMessage.text}
        </p>
      ) : null}

      {block.embedKey === "massage-team" ? (
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200 p-2">
          <MassageTeamAdminSection auth={auth} onNotify={onNotify} />
        </div>
      ) : null}

      {block.embedKey === "sulphur-staff" ? (
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200 p-2">
          <SiteStaffAdminSection auth={auth} onNotify={onNotify} locationFocus="sulphur" />
        </div>
      ) : null}

      {(block.cmsFieldIds?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Content</p>
          <FieldList
            fieldIds={block.cmsFieldIds ?? []}
            fields={fields}
            busy={cmsBusy}
            onSave={onSaveField}
            onReset={onResetField}
          />
        </div>
      ) : block.embedKey ? null : (
        <p className="text-xs text-slate-500">This section uses fixed layout copy in code.</p>
      )}
    </div>
  );
}
