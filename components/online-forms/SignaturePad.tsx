"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IntakeField, IntakeSignatureValue } from "@/lib/intakeForms/types";

const CANVAS_W = 600;
const CANVAS_H = 200;

type Point = { x: number; y: number };

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SignaturePad({
  field,
  value,
  onChange,
  error,
}: {
  field: IntakeField;
  value: IntakeSignatureValue | undefined;
  onChange: (next: IntakeSignatureValue) => void;
  error?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [useTyped, setUseTyped] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const includePrintedName = field.includePrintedName !== false;
  const includeEmail = field.includeEmail !== false;
  const includeDate = field.includeDate !== false;

  const dateSigned = value?.dateSigned ?? todayLabel();

  // Ensure the date is captured as soon as the block renders.
  useEffect(() => {
    if (includeDate && !value?.dateSigned) {
      onChange({ ...current(), dateSigned: todayLabel() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = useCallback(
    (): IntakeSignatureValue => ({
      signatureImage: value?.signatureImage ?? "",
      printedName: value?.printedName ?? "",
      email: value?.email ?? "",
      dateSigned: value?.dateSigned ?? (includeDate ? todayLabel() : undefined),
      typedName: value?.typedName ?? "",
    }),
    [value, includeDate],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2937";
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0]!.x, stroke[0]!.y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i]!.x, stroke[i]!.y);
      }
      ctx.stroke();
    }
  }, []);

  const commitImage = useCallback(() => {
    const canvas = canvasRef.current;
    const hasStrokes = strokesRef.current.some((s) => s.length > 1);
    setHasInk(hasStrokes);
    const image = canvas && hasStrokes ? canvas.toDataURL("image/png") : "";
    onChange({ ...current(), signatureImage: image });
  }, [current, onChange]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (useTyped) return;
    e.preventDefault();
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    strokesRef.current.push([pointFromEvent(e)]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke?.push(pointFromEvent(e));
    redraw();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    commitImage();
  };

  const undo = () => {
    strokesRef.current.pop();
    redraw();
    commitImage();
  };

  const clear = () => {
    strokesRef.current = [];
    redraw();
    setHasInk(false);
    onChange({ ...current(), signatureImage: "" });
  };

  return (
    <fieldset className="rounded-lg border border-stone-300 bg-white p-4">
      <legend className="px-1 text-sm font-bold text-[var(--pp-heading)]">
        {field.label}
      </legend>

      {!useTyped ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded border border-dashed border-stone-400 bg-stone-50">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              role="img"
              aria-label={`Signature pad for ${field.label}`}
              className="h-40 w-full touch-none"
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={undo}
              className="focus-ring rounded border border-stone-300 px-3 py-1 font-semibold text-stone-700 hover:bg-stone-100"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clear}
              className="focus-ring rounded border border-stone-300 px-3 py-1 font-semibold text-stone-700 hover:bg-stone-100"
            >
              Clear
            </button>
            <span className="text-stone-500">Sign above using your mouse or finger.</span>
            <button
              type="button"
              onClick={() => setUseTyped(true)}
              className="focus-ring ml-auto rounded px-2 py-1 font-semibold text-[var(--pp-accent)] underline"
            >
              Can&apos;t draw? Type your name instead
            </button>
          </div>
          {!hasInk ? (
            <p className="text-xs text-stone-500">No signature drawn yet.</p>
          ) : (
            <p className="text-xs text-emerald-700">Signature captured.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block space-y-1 text-sm">
            <span className="font-semibold text-stone-700">Type your full legal name as your signature</span>
            <input
              type="text"
              value={value?.typedName ?? ""}
              onChange={(e) => onChange({ ...current(), typedName: e.target.value, signatureImage: "" })}
              className="focus-ring w-full rounded border border-stone-300 px-3 py-2"
              style={{ fontFamily: "cursive" }}
              autoComplete="name"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setUseTyped(false);
              onChange({ ...current(), typedName: "" });
            }}
            className="focus-ring rounded px-2 py-1 text-xs font-semibold text-[var(--pp-accent)] underline"
          >
            Draw my signature instead
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {includePrintedName ? (
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-stone-700">Printed name</span>
            <input
              type="text"
              value={value?.printedName ?? ""}
              onChange={(e) => onChange({ ...current(), printedName: e.target.value })}
              className="focus-ring w-full rounded border border-stone-300 px-3 py-2"
              autoComplete="name"
            />
          </label>
        ) : null}
        {includeEmail ? (
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-stone-700">Email</span>
            <input
              type="email"
              value={value?.email ?? ""}
              onChange={(e) => onChange({ ...current(), email: e.target.value })}
              className="focus-ring w-full rounded border border-stone-300 px-3 py-2"
              autoComplete="email"
            />
          </label>
        ) : null}
        {includeDate ? (
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-stone-700">Date signed</span>
            <input
              type="text"
              value={dateSigned}
              readOnly
              className="w-full rounded border border-stone-200 bg-stone-100 px-3 py-2 text-stone-600"
            />
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </fieldset>
  );
}
