"use client";

export type ResizeAnchor = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { anchor: ResizeAnchor; className: string; cursor: string }[] = [
  { anchor: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { anchor: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { anchor: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { anchor: "e", className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { anchor: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
  { anchor: "s", className: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { anchor: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { anchor: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

type Props = {
  selected: boolean;
  onResizeStart: (anchor: ResizeAnchor, e: React.PointerEvent) => void;
  toolbar?: React.ReactNode;
};

export function FreeformLayerChrome({ selected, onResizeStart, toolbar }: Props) {
  if (!selected) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-sm ring-2 ring-[#0f5f5c] ring-offset-1"
        aria-hidden
      />
      {HANDLES.map(({ anchor, className, cursor }) => (
        <span
          key={anchor}
          role="presentation"
          className={`absolute z-30 h-3 w-3 rounded-full border-2 border-[#0f5f5c] bg-white shadow ${className}`}
          style={{ cursor }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onResizeStart(anchor, e);
          }}
        />
      ))}
      {toolbar ? (
        <div className="absolute -top-10 left-0 z-40 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-md">
          {toolbar}
        </div>
      ) : null}
    </>
  );
}
