"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageLayoutBlockDef } from "@/lib/page-layout";
import { SectionPreviewBody } from "./previews/SectionPreviewBody";
import type { PagePreviewData } from "./types";

type Props = {
  block: PageLayoutBlockDef;
  preview: PagePreviewData;
  selected: boolean;
  hidden: boolean;
  onSelect: () => void;
  isDragging?: boolean;
};

export function SectionPreviewCard({
  block,
  preview,
  selected,
  hidden,
  onSelect,
  isDragging,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortDragging ? 0.4 : hidden ? 0.55 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border-2 bg-white shadow-md transition-shadow ${
        selected ? "border-[#0f5f5c] ring-2 ring-[#0f5f5c]/20" : "border-slate-200 hover:border-slate-300"
      } ${isDragging ? "shadow-xl" : ""} ${hidden ? "grayscale" : ""}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-200 active:cursor-grabbing"
          aria-label={`Drag ${block.label}`}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </button>
        <span className="flex-1 text-sm font-bold text-slate-900">{block.label}</span>
        {hidden ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Hidden</span>
        ) : null}
      </div>
      <div className="pointer-events-none p-4">
        <SectionPreviewBody block={block} preview={preview} />
      </div>
    </div>
  );
}
