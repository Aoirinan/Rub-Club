"use client";

import { useEffect, useRef, useState } from "react";
import { parseCmsToggle } from "@/lib/sticky-call-bar";
import type { SiteContentFieldRow } from "./useSiteContentFields";
import { RichTextArea } from "./RichTextArea";

type Props = {
  field: SiteContentFieldRow;
  busy: boolean;
  onSave: (id: string, value: string, file?: File) => Promise<void>;
  onReset: (id: string, label: string) => Promise<void>;
  compact?: boolean;
  /** Told whether this box holds unsaved typing (so pickers can ask before leaving). */
  onDirtyChange?: (id: string, dirty: boolean) => void;
};

export function CmsFieldEditor({ field, busy, onSave, onReset, compact, onDirtyChange }: Props) {
  const [draft, setDraft] = useState(field.value);
  const [expanded, setExpanded] = useState(compact ? false : true);
  const textareaId = `cms-field-${field.id}`;
  // Stored value the draft was last synced to, and the draft this box's own
  // Save/Reset sent (its result should replace that draft).
  const syncedValue = useRef(field.value);
  const sentDraft = useRef<string | null>(null);

  useEffect(() => {
    // A refresh after saving some other field must not wipe typing here: only
    // follow the stored value while the draft is untouched, or when this
    // field's own save/reset produced it (and nothing was typed since).
    const synced = syncedValue.current;
    const sent = sentDraft.current;
    setDraft((d) => (d === synced || d === sent ? field.value : d));
    syncedValue.current = field.value;
  }, [field.id, field.value]);

  const isBoolean = field.type === "boolean";
  const dirty = isBoolean
    ? parseCmsToggle(draft) !== parseCmsToggle(field.value)
    : draft !== field.value;

  useEffect(() => {
    onDirtyChange?.(field.id, dirty);
  }, [onDirtyChange, field.id, dirty]);

  useEffect(() => {
    if (!onDirtyChange) return;
    const id = field.id;
    return () => onDirtyChange(id, false);
  }, [onDirtyChange, field.id]);

  function runOwnWrite(write: () => Promise<void>) {
    sentDraft.current = draft;
    void write()
      .catch(() => {
        /* the shared message line shows the error; the draft is kept */
      })
      .finally(() => {
        sentDraft.current = null;
      });
  }

  const valuePreview = isBoolean
    ? parseCmsToggle(field.value)
      ? "On"
      : "Off"
    : field.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) ||
      "(empty)";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900">{field.fieldLabel}</p>
          <p className="text-[10px] text-slate-500">{field.sectionLabel}</p>
          {!expanded ? (
            <p className="mt-1 truncate text-xs text-slate-600">{valuePreview}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-slate-200 px-3 py-3">
          {isBoolean ? (
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#c0392b] focus:ring-[#c0392b]"
                checked={parseCmsToggle(draft)}
                onChange={(e) => setDraft(e.target.checked ? "true" : "false")}
              />
              <span>{field.fieldLabel}</span>
            </label>
          ) : null}
          {field.type === "text" || field.type === "phone" ? (
            <input
              type={field.type === "phone" ? "tel" : "text"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : null}
          {field.type === "url" ? (
            <div className="flex gap-2">
              <input
                type="url"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              {draft.startsWith("http") ? (
                <a
                  href={draft}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded border px-2 py-2 text-xs font-bold"
                >
                  Open
                </a>
              ) : null}
            </div>
          ) : null}
          {field.type === "richtext" ? (
            <RichTextArea textareaId={textareaId} value={draft} onChange={setDraft} />
          ) : null}
          {field.type === "image" || field.type === "video" ? (
            <div className="space-y-2">
              {field.type === "image" && field.value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={field.value} alt="" className="max-h-20 rounded border object-contain" />
              ) : null}
              {field.value && field.type === "video" ? (
                <p className="break-all text-xs text-slate-600">{field.value}</p>
              ) : null}
              <input
                type="file"
                accept={
                  field.type === "image"
                    ? "image/jpeg,image/png,image/webp"
                    : "video/mp4,video/quicktime,video/webm"
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // Clear the picker so choosing the same (or a smaller) file again re-triggers.
                  e.target.value = "";
                  if (file) {
                    void onSave(field.id, field.value, file).catch(() => {
                      /* the shared message line shows the error */
                    });
                  }
                }}
              />
              {field.type === "image" && field.value ? (
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs font-semibold text-slate-600 underline disabled:opacity-50"
                  onClick={() => void onSave(field.id, "")}
                >
                  Clear image
                </button>
              ) : null}
            </div>
          ) : null}
          {field.type !== "image" && field.type !== "video" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-[#c0392b] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                onClick={() => runOwnWrite(() => onSave(field.id, draft))}
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-xs font-semibold text-slate-600 underline"
                onClick={() => runOwnWrite(() => onReset(field.id, field.fieldLabel))}
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
