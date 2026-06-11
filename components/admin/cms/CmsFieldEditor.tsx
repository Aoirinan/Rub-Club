"use client";

import { useEffect, useState } from "react";
import { HEADER_SHOW_TOP_PHONE_BAR_FIELD } from "@/lib/header-top-phone-bar";
import type { SiteContentFieldRow } from "./useSiteContentFields";
import { RichTextArea } from "./RichTextArea";

type Props = {
  field: SiteContentFieldRow;
  busy: boolean;
  onSave: (id: string, value: string, file?: File) => Promise<void>;
  onReset: (id: string, label: string) => Promise<void>;
  compact?: boolean;
};

export function CmsFieldEditor({ field, busy, onSave, onReset, compact }: Props) {
  const [draft, setDraft] = useState(field.value);
  const [expanded, setExpanded] = useState(compact ? false : true);
  const textareaId = `cms-field-${field.id}`;

  useEffect(() => {
    setDraft(field.value);
  }, [field.id, field.value]);

  const isTopPhoneBarToggle = field.id === HEADER_SHOW_TOP_PHONE_BAR_FIELD;

  function isTopPhoneBarEnabled(value: string): boolean {
    const v = value.trim().toLowerCase();
    return v !== "false" && v !== "no";
  }

  const valuePreview = isTopPhoneBarToggle
    ? isTopPhoneBarEnabled(field.value)
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
        <span className="shrink-0 text-xs text-slate-400">{expanded ? "â–²" : "â–¼"}</span>
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-slate-200 px-3 py-3">
          {isTopPhoneBarToggle ? (
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#015949] focus:ring-[#015949]"
                checked={isTopPhoneBarEnabled(draft)}
                onChange={(e) => setDraft(e.target.checked ? "true" : "false")}
              />
              <span>Show the dark phone bar above the logos on every page</span>
            </label>
          ) : null}
          {!isTopPhoneBarToggle && (field.type === "text" || field.type === "phone") ? (
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
                  if (file) void onSave(field.id, field.value, file);
                }}
              />
            </div>
          ) : null}
          {field.type !== "image" && field.type !== "video" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-[#015949] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                onClick={() => void onSave(field.id, draft)}
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-xs font-semibold text-slate-600 underline"
                onClick={() => void onReset(field.id, field.fieldLabel)}
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
