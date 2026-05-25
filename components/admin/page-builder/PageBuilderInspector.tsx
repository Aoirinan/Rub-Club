"use client";

import Link from "next/link";
import { blockDef } from "@/lib/page-layout";
import type { PageLayoutId } from "@/lib/page-layout";

type Props = {
  pageId: PageLayoutId;
  selectedBlockId: string | null;
  hiddenBlocks: string[];
  onToggleHidden: (blockId: string) => void;
  onRemove: (blockId: string) => void;
};

export function PageBuilderInspector({
  pageId,
  selectedBlockId,
  hiddenBlocks,
  onToggleHidden,
  onRemove,
}: Props) {
  if (!selectedBlockId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Select a section on the canvas to edit visibility or jump to Site content.
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

      <div className="flex flex-wrap gap-2">
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

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Edit content</p>
        {(block.cmsFieldIds ?? []).map((fieldId) => (
          <Link
            key={fieldId}
            href={`/admin/super/site-content?field=${encodeURIComponent(fieldId)}`}
            className="block rounded-lg bg-[#0f5f5c]/5 px-3 py-2 text-xs font-semibold text-[#0f5f5c] hover:bg-[#0f5f5c]/10"
          >
            Edit field: {fieldId.replace(/_/g, " ")}
          </Link>
        ))}
        {block.adminLink ? (
          <Link
            href={block.adminLink.href}
            className="block rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
          >
            {block.adminLink.label}
          </Link>
        ) : null}
        {!block.cmsFieldIds?.length && !block.adminLink ? (
          <p className="text-xs text-slate-500">This section uses fixed layout copy in code.</p>
        ) : null}
      </div>
    </div>
  );
}
