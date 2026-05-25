"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeaderBrandBlock } from "@/components/HeaderBrandBlock";
import { LOCATIONS } from "@/lib/constants";
import {
  HEADER_BRAND_KEYS,
  HEADER_BRANDING_LAYOUT_DEFAULT,
  normalizeHeaderBrandingLayout,
  type HeaderBrandBox,
  type HeaderBrandKey,
  type HeaderBrandingLayout,
} from "@/lib/header-branding-cms";

type Props = {
  layout: HeaderBrandingLayout;
  busy: boolean;
  onSaveLayout: (layout: HeaderBrandingLayout) => Promise<void>;
  selectedBrand: HeaderBrandKey | null;
  onSelectBrand: (key: HeaderBrandKey | null) => void;
};

type DragMode = { kind: "move"; key: HeaderBrandKey; startX: number; startY: number; orig: HeaderBrandBox } | {
  kind: "resize";
  key: HeaderBrandKey;
  startX: number;
  startY: number;
  orig: HeaderBrandBox;
};

export function HeaderBrandingCanvas({
  layout: initialLayout,
  busy,
  onSaveLayout,
  selectedBrand,
  onSelectBrand,
}: Props) {
  const [draft, setDraft] = useState(() => normalizeHeaderBrandingLayout(initialLayout));
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragMode | null>(null);
  const paris = LOCATIONS.paris;
  const sulphur = LOCATIONS.sulphur_springs;

  useEffect(() => {
    setDraft(normalizeHeaderBrandingLayout(initialLayout));
  }, [initialLayout]);

  const persist = useCallback(
    async (next: HeaderBrandingLayout) => {
      const normalized = normalizeHeaderBrandingLayout(next);
      setDraft(normalized);
      await onSaveLayout(normalized);
    },
    [onSaveLayout],
  );

  const pctFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return { px: 0, py: 0 };
    const rect = el.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { px, py } = pctFromPointer(e.clientX, e.clientY);

      if (drag.kind === "move") {
        const dx = px - drag.startX;
        const dy = py - drag.startY;
        setDraft((prev) => {
          const next = { ...prev, brands: { ...prev.brands } };
          next.brands[drag.key] = {
            ...drag.orig,
            x: drag.orig.x + dx,
            y: drag.orig.y + dy,
          };
          return normalizeHeaderBrandingLayout(next);
        });
      } else {
        const dw = px - drag.startX;
        const dh = py - drag.startY;
        setDraft((prev) => {
          const next = { ...prev, brands: { ...prev.brands } };
          next.brands[drag.key] = {
            ...drag.orig,
            w: drag.orig.w + dw,
            h: drag.orig.h + dh,
          };
          return normalizeHeaderBrandingLayout(next);
        });
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setDraft((current) => {
        void persist(current);
        return current;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pctFromPointer, persist]);

  const startMove = (key: HeaderBrandKey, e: React.PointerEvent) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectBrand(key);
    const { px, py } = pctFromPointer(e.clientX, e.clientY);
    dragRef.current = {
      kind: "move",
      key,
      startX: px,
      startY: py,
      orig: { ...draft.brands[key] },
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const startResize = (key: HeaderBrandKey, e: React.PointerEvent) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectBrand(key);
    const { px, py } = pctFromPointer(e.clientX, e.clientY);
    dragRef.current = {
      kind: "resize",
      key,
      startX: px,
      startY: py,
      orig: { ...draft.brands[key] },
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <p className="mb-3 text-sm text-slate-600">
        Drag a logo to move it. Drag the corner handle to resize. Click empty space to deselect.
      </p>
      <div
        className="rounded-xl border-2 border-dashed border-slate-300 bg-white shadow-inner"
        onClick={() => onSelectBrand(null)}
      >
        <div
          ref={frameRef}
          className="relative w-full overflow-hidden"
          style={{ height: draft.frameHeight }}
        >
          {HEADER_BRAND_KEYS.map((key) => {
            const box = draft.brands[key];
            const selected = selectedBrand === key;
            return (
              <div
                key={key}
                className="absolute"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-full w-full">
                  <HeaderBrandBlock
                    brandKey={key}
                    box={box}
                    paris={paris}
                    sulphur={sulphur}
                    interactive
                    selected={selected}
                    onSelect={() => onSelectBrand(key)}
                    onPointerDownBox={(e) => startMove(key, e)}
                    onPointerDownResize={(e) => startResize(key, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {busy ? <p className="mt-2 text-xs text-slate-500">Saving…</p> : null}
    </div>
  );
}

export function defaultHeaderLayoutForReset(): HeaderBrandingLayout {
  return normalizeHeaderBrandingLayout(HEADER_BRANDING_LAYOUT_DEFAULT);
}
