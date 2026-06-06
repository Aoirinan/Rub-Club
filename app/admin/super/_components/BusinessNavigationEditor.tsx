"use client";

import { useState } from "react";
import type { BusinessNavItem, BusinessNavigationConfig } from "@/lib/site-owner-config";

type BusinessKey = "parisChiro" | "sulphurSprings";

const BUSINESS_LABELS: Record<BusinessKey, string> = {
  parisChiro: "Paris Chiropractic",
  sulphurSprings: "Sulphur Springs",
};

function emptyItem(): BusinessNavItem {
  return { label: "New link", href: "/" };
}

function NavItemEditor({
  item,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  item: BusinessNavItem;
  index: number;
  onChange: (next: BusinessNavItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start gap-2">
        <span className="mt-2 text-xs font-bold text-slate-500">#{index + 1}</span>
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Label</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={item.label}
              onChange={(e) => onChange({ ...item, label: e.target.value })}
            />
          </label>
          <label className="block text-xs">
            <span className="font-semibold text-slate-700">URL</span>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={item.href}
              onChange={(e) => onChange({ ...item, href: e.target.value })}
            />
          </label>
        </div>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={item.external === true}
            onChange={(e) => onChange({ ...item, external: e.target.checked })}
          />
          External
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            ↓
          </button>
          <button
            type="button"
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-slate-600">Dropdown children (optional)</p>
        {(item.children ?? []).map((child, childIdx) => (
          <div key={`${index}-child-${childIdx}`} className="flex flex-wrap gap-2 pl-4">
            <input
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Label"
              value={child.label}
              onChange={(e) => {
                const children = [...(item.children ?? [])];
                children[childIdx] = { ...child, label: e.target.value };
                onChange({ ...item, children });
              }}
            />
            <input
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="/path"
              value={child.href}
              onChange={(e) => {
                const children = [...(item.children ?? [])];
                children[childIdx] = { ...child, href: e.target.value };
                onChange({ ...item, children });
              }}
            />
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => {
                const children = (item.children ?? []).filter((_, i) => i !== childIdx);
                onChange({ ...item, children: children.length ? children : undefined });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-semibold text-[#0f5f5c] underline"
          onClick={() =>
            onChange({
              ...item,
              children: [...(item.children ?? []), { label: "Sub link", href: "/" }],
            })
          }
        >
          + Add dropdown item
        </button>
      </div>
    </div>
  );
}

export function BusinessNavigationEditor({
  config,
  onChange,
  onSave,
  saving,
}: {
  config: BusinessNavigationConfig;
  onChange: (next: BusinessNavigationConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [activeBusiness, setActiveBusiness] = useState<BusinessKey>("parisChiro");
  const items = config[activeBusiness];

  function updateItems(next: BusinessNavItem[]) {
    onChange({ ...config, [activeBusiness]: next });
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed!);
    updateItems(next);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">Business navigation</h2>
        <p className="mt-1 text-sm text-slate-600">
          Edit the dropdown navigation shown when visitors enter via the Paris Chiro or Sulphur Springs
          brand. Gift cards, booking links, and patient forms can stay in the menu — remove anything
          unrelated to that business.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(BUSINESS_LABELS) as BusinessKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveBusiness(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              activeBusiness === key ? "bg-[#0f5f5c] text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {BUSINESS_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <NavItemEditor
            key={`${activeBusiness}-${idx}-${item.label}`}
            item={item}
            index={idx}
            onChange={(next) => {
              const copy = [...items];
              copy[idx] = next;
              updateItems(copy);
            }}
            onRemove={() => updateItems(items.filter((_, i) => i !== idx))}
            onMoveUp={() => moveItem(idx, idx - 1)}
            onMoveDown={() => moveItem(idx, idx + 1)}
            canMoveUp={idx > 0}
            canMoveDown={idx < items.length - 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          onClick={() => updateItems([...items, emptyItem()])}
        >
          Add nav item
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-[#0f5f5c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save business navigation"}
        </button>
      </div>
    </section>
  );
}
