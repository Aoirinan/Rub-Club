"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IntakeField, IntakeDiagramValue } from "@/lib/intakeForms/types";

const W = 320;
const H = 640;

type Point = { x: number; y: number };

function DiagramSide({
  side,
  src,
  onExport,
}: {
  side: "front" | "back";
  src: string;
  onExport: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [marked, setMarked] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, W, H);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c0392b";
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) {
        // single tap -> dot
        const p = stroke[0];
        if (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#c0392b";
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0]!.x, stroke[0]!.y);
      for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i]!.x, stroke[i]!.y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      bgRef.current = img;
      redraw();
    };
    img.src = src;
  }, [src, redraw]);

  const commit = useCallback(() => {
    const canvas = canvasRef.current;
    const hasMarks = strokesRef.current.length > 0;
    setMarked(hasMarks);
    onExport(canvas && hasMarks ? canvas.toDataURL("image/png") : "");
  }, [onExport]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-bold uppercase tracking-wide text-stone-600">{side}</p>
      <div className="mx-auto overflow-hidden rounded border border-dashed border-stone-400 bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`${side} body diagram — mark areas of pain`}
          className="h-auto w-full touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            drawingRef.current = true;
            canvasRef.current?.setPointerCapture(e.pointerId);
            strokesRef.current.push([pointFromEvent(e)]);
            redraw();
          }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            e.preventDefault();
            strokesRef.current[strokesRef.current.length - 1]?.push(pointFromEvent(e));
            redraw();
          }}
          onPointerUp={() => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            commit();
          }}
          onPointerLeave={() => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            commit();
          }}
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            strokesRef.current.pop();
            redraw();
            commit();
          }}
          className="focus-ring rounded border border-stone-300 px-3 py-1 font-semibold text-stone-700 hover:bg-stone-100"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            strokesRef.current = [];
            redraw();
            setMarked(false);
            onExport("");
          }}
          className="focus-ring rounded border border-stone-300 px-3 py-1 font-semibold text-stone-700 hover:bg-stone-100"
        >
          Clear
        </button>
        {marked ? <span className="text-emerald-700">Marked</span> : null}
      </div>
    </div>
  );
}

export function BodyDiagram({
  field,
  value,
  onChange,
  error,
}: {
  field: IntakeField;
  value: IntakeDiagramValue | undefined;
  onChange: (next: IntakeDiagramValue) => void;
  error?: string;
}) {
  return (
    <fieldset className="rounded-lg border border-stone-300 bg-white p-4">
      <legend className="px-1 text-sm font-bold text-[var(--pp-heading)]">{field.label}</legend>
      {field.helpText ? <p className="mb-3 text-xs text-stone-600">{field.helpText}</p> : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <DiagramSide
          side="front"
          src="/body-diagram-front.png"
          onExport={(frontImage) => onChange({ frontImage, backImage: value?.backImage ?? "" })}
        />
        <DiagramSide
          side="back"
          src="/body-diagram-back.png"
          onExport={(backImage) => onChange({ frontImage: value?.frontImage ?? "", backImage })}
        />
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </fieldset>
  );
}
