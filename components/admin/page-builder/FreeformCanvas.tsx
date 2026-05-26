"use client";

import { useCallback, useEffect, useRef } from "react";
import { clampBox, type VisualLayer, type VisualLayerBox, type VisualSection } from "@/lib/visual-page-layout";
import { FreeformLayerChrome, type ResizeAnchor } from "./FreeformLayerChrome";

export type DragMode =
  | {
      kind: "move";
      layerId: string;
      startX: number;
      startY: number;
      orig: VisualLayerBox;
    }
  | {
      kind: "resize";
      layerId: string;
      anchor: ResizeAnchor;
      startX: number;
      startY: number;
      orig: VisualLayerBox;
    };

function applyResize(
  anchor: ResizeAnchor,
  orig: VisualLayerBox,
  dx: number,
  dy: number,
): VisualLayerBox {
  let { x, y, w, h } = orig;
  if (anchor.includes("e")) w = orig.w + dx;
  if (anchor.includes("w")) {
    w = orig.w - dx;
    x = orig.x + dx;
  }
  if (anchor.includes("s")) h = orig.h + dy;
  if (anchor.includes("n")) {
    h = orig.h - dy;
    y = orig.y + dy;
  }
  return clampBox({ x, y, w, h });
}

type Props = {
  frameHeight: number;
  layers: VisualLayer[];
  sections?: VisualSection[];
  busy?: boolean;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onLayersChange: (layers: VisualLayer[]) => void;
  onPersist: (layers: VisualLayer[]) => void | Promise<void>;
  renderLayer: (layer: VisualLayer, selected: boolean) => React.ReactNode;
  renderToolbar?: (layer: VisualLayer) => React.ReactNode;
  renderSections?: (sections: VisualSection[]) => React.ReactNode;
  hint?: string;
};

export function FreeformCanvas({
  frameHeight,
  layers,
  sections = [],
  busy,
  selectedLayerId,
  onSelectLayer,
  onLayersChange,
  onPersist,
  renderLayer,
  renderToolbar,
  renderSections,
  hint,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragMode | null>(null);
  const movedRef = useRef(false);
  const blockClickRef = useRef(false);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const pctFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return { px: 0, py: 0 };
    const rect = el.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const updateLayerBox = useCallback(
    (layerId: string, box: VisualLayerBox) => {
      onLayersChange(
        layersRef.current.map((l) => (l.id === layerId ? { ...l, box: clampBox(box) } : l)),
      );
    },
    [onLayersChange],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { px, py } = pctFromPointer(e.clientX, e.clientY);
      const dx = px - drag.startX;
      const dy = py - drag.startY;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) movedRef.current = true;

      if (drag.kind === "move") {
        updateLayerBox(drag.layerId, {
          ...drag.orig,
          x: drag.orig.x + dx,
          y: drag.orig.y + dy,
        });
      } else {
        updateLayerBox(drag.layerId, applyResize(drag.anchor, drag.orig, dx, dy));
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;
      if (movedRef.current) {
        blockClickRef.current = true;
        setTimeout(() => {
          blockClickRef.current = false;
        }, 0);
      }
      dragRef.current = null;
      movedRef.current = false;
      void onPersist(layersRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pctFromPointer, updateLayerBox, onPersist]);

  const startMove = (layerId: string, orig: VisualLayerBox, e: React.PointerEvent) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
    onSelectLayer(layerId);
    const { px, py } = pctFromPointer(e.clientX, e.clientY);
    dragRef.current = { kind: "move", layerId, startX: px, startY: py, orig: { ...orig } };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const startResize = (
    layerId: string,
    orig: VisualLayerBox,
    anchor: ResizeAnchor,
    e: React.PointerEvent,
  ) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
    onSelectLayer(layerId);
    const { px, py } = pctFromPointer(e.clientX, e.clientY);
    dragRef.current = { kind: "resize", layerId, anchor, startX: px, startY: py, orig: { ...orig } };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const visible = [...layers].filter((l) => !l.hidden).sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="mx-auto max-w-7xl">
      {hint ? <p className="mb-3 text-sm text-slate-600">{hint}</p> : null}
      <p className="mb-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-950">
        Desktop layout preview. Mobile may stack differently until mobile layouts are added.
      </p>
      <div
        className="rounded-xl border-2 border-dashed border-slate-300 bg-white shadow-inner"
        onClick={() => onSelectLayer(null)}
      >
        <div
          ref={frameRef}
          className="relative w-full overflow-hidden bg-slate-50/50"
          style={{ height: frameHeight }}
          onClickCapture={(e) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (blockClickRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            const link = target.closest("a");
            if (link) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {visible.map((layer) => {
            const selected = selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                className="absolute"
                style={{
                  left: `${layer.box.x}%`,
                  top: `${layer.box.y}%`,
                  width: `${layer.box.w}%`,
                  height: `${layer.box.h}%`,
                  zIndex: layer.zIndex,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`relative h-full w-full overflow-hidden ${busy ? "" : "cursor-move"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (blockClickRef.current) {
                      e.preventDefault();
                      return;
                    }
                    onSelectLayer(layer.id);
                  }}
                  onPointerDown={(e) => {
                    if (layer.locked) {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectLayer(layer.id);
                      return;
                    }
                    startMove(layer.id, layer.box, e);
                  }}
                >
                  {renderLayer(layer, selected)}
                  <FreeformLayerChrome
                    selected={selected}
                    onResizeStart={(anchor, e) => {
                      if (layer.locked) return;
                      startResize(layer.id, layer.box, anchor, e);
                    }}
                    toolbar={selected && renderToolbar ? renderToolbar(layer) : undefined}
                  />
                </div>
              </div>
            );
          })}
          {renderSections ? renderSections(sections) : null}
        </div>
      </div>
      {busy ? <p className="mt-2 text-xs text-slate-500">Saving…</p> : null}
    </div>
  );
}
