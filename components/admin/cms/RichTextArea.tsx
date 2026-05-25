"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  textareaId?: string;
};

export function RichTextArea({ value, onChange, textareaId = "cms-richtext" }: Props) {
  const wrap = (before: string, after: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("**", "**")}>
          Bold
        </button>
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("_", "_")}>
          Italic
        </button>
        <button type="button" className="rounded border px-2 py-0.5 text-xs font-semibold" onClick={() => wrap("\n- ", "")}>
          Bullet
        </button>
      </div>
      <textarea
        id={textareaId}
        className="min-h-[100px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
