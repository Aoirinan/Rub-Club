"use client";

import type { ContentScopeId } from "@/lib/page-builder-content-scopes";
import { contentScopeDef } from "@/lib/page-builder-content-scopes";
import type { PagePreviewData } from "./types";
import { cmsExcerpt } from "./types";

type Props = {
  scopeId: ContentScopeId;
  preview: PagePreviewData;
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
};

export function ContentScopeCanvas({
  scopeId,
  preview,
  selectedSectionId,
  onSelectSection,
}: Props) {
  const def = contentScopeDef(scopeId);

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <p className="text-sm text-slate-600">
        {def.description}. Select a section to edit its fields in the inspector.
      </p>
      {def.sections.map((section) => {
        const excerpt = cmsExcerpt(preview.cms, section.fieldIds);
        return (
          <div
            key={section.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSection(section.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectSection(section.id);
              }
            }}
            className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-shadow ${
              selectedSectionId === section.id
                ? "border-[#0f5f5c] ring-2 ring-[#0f5f5c]/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <h3 className="text-sm font-bold text-slate-900">{section.label}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {section.fieldIds.length} field{section.fieldIds.length === 1 ? "" : "s"}
            </p>
            {excerpt ? <p className="mt-2 text-xs text-slate-600">{excerpt}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
