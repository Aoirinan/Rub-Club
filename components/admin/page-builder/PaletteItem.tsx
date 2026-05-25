"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PageLayoutBlockDef } from "@/lib/page-layout";

type Props = {
  block: PageLayoutBlockDef;
};

export function PaletteItem({ block }: Props) {
  const id = `palette-${block.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { blockId: block.id } });

  return (
    <div
      ref={setNodeRef}
      className={`cursor-grab rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-semibold text-slate-800">{block.label}</p>
      {block.description ? (
        <p className="mt-0.5 text-[11px] text-slate-500">{block.description}</p>
      ) : null}
    </div>
  );
}
