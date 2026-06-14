"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  IntakeFormConfig,
  IntakeGlobalConfig,
  IntakeLegalText,
} from "@/lib/intakeForms/types";
import { isPlaceholderLegalText } from "@/lib/intakeForms/legal-text";
import { adminFetch } from "./authFetch";

type Overview = {
  global: IntakeGlobalConfig;
  forms: IntakeFormConfig[];
  counts: Record<string, number>;
  legalText: IntakeLegalText[];
  delivery: { sendgridConfigured: boolean };
};

const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export function OnlineFormsManager() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGlobal, setSavingGlobal] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/online-forms");
      if (!res.ok) throw new Error("load failed");
      setData((await res.json()) as Overview);
    } catch {
      setError("Could not load online forms settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleGlobal(enabled: boolean) {
    setSavingGlobal(true);
    try {
      await adminFetch("/api/admin/online-forms", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "global", enabled }),
      });
      await load();
    } finally {
      setSavingGlobal(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-10 text-sm text-slate-600">Loading…</p>;
  }
  if (error || !data) {
    return <p className="px-4 py-10 text-sm text-red-700">{error ?? "No data."}</p>;
  }

  const placeholderCount = data.legalText.filter((b) => isPlaceholderLegalText(b.body)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-black text-slate-900">Online Forms</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage the public patient intake &amp; consent forms, their copy, and submissions.
        </p>
      </header>

      {/* Master switch */}
      <section className={`${SECTION_CLASS} p-5`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Online Forms — Master Switch</h2>
            <p className="text-sm text-slate-600">
              When off, every public form shows its disabled message regardless of its own setting.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={data.global.enabled}
              disabled={savingGlobal}
              onChange={(e) => toggleGlobal(e.target.checked)}
            />
            {data.global.enabled ? "Enabled" : "Disabled"}
          </label>
        </div>
        {!data.global.enabled ? (
          <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            All public online forms are currently turned OFF.
          </p>
        ) : null}
        {placeholderCount > 0 ? (
          <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {placeholderCount} legal/consent block(s) still contain placeholder text. Replace them
            with the clinic&apos;s attorney-approved language before going live.
          </p>
        ) : null}
        {!data.delivery.sendgridConfigured ? (
          <p className="mt-3 text-xs text-slate-500">
            Email notifications are not configured (SendGrid). Submissions are still saved and
            visible here.
          </p>
        ) : null}
      </section>

      {/* Forms list */}
      <section className={SECTION_CLASS}>
        <h2 className="border-b border-slate-200 px-5 py-3 text-base font-bold text-slate-900">
          Forms
        </h2>
        <ul className="divide-y divide-slate-100">
          {data.forms.map((form) => (
            <FormRow
              key={form.slug}
              form={form}
              count={data.counts[form.slug] ?? 0}
              onSaved={load}
            />
          ))}
        </ul>
      </section>

      {/* Legal text */}
      <LegalTextEditor blocks={data.legalText} onSaved={load} />
    </div>
  );
}

function FormRow({
  form,
  count,
  onSaved,
}: {
  form: IntakeFormConfig;
  count: number;
  onSaved: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(form.enabled);
  const [introText, setIntroText] = useState(form.introText);
  const [consentLabel, setConsentLabel] = useState(form.consentCheckboxLabel);
  const [termsHtml, setTermsHtml] = useState(form.termsHtml);
  const [successMessage, setSuccessMessage] = useState(form.successMessage);
  const [disabledMessage, setDisabledMessage] = useState(form.disabledMessage);
  const [notifyEmails, setNotifyEmails] = useState(form.notifyEmails.join(", "));
  const [status, setStatus] = useState<string | null>(null);

  async function patch(patchBody: Record<string, unknown>) {
    setSaving(true);
    setStatus(null);
    try {
      const res = await adminFetch("/api/admin/online-forms", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "form", slug: form.slug, patch: patchBody }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(d.error ?? "Save failed.");
        return false;
      }
      await onSaved();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(next: boolean) {
    setEnabled(next);
    await patch({ enabled: next });
  }

  async function saveCopy() {
    const emails = notifyEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const ok = await patch({
      introText,
      consentCheckboxLabel: consentLabel,
      termsHtml,
      successMessage,
      disabledMessage,
      notifyEmails: emails,
    });
    if (ok) setStatus("Saved.");
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{form.title}</p>
          <p className="text-xs text-slate-500">
            /{form.slug} · {count} submission{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={enabled}
              disabled={saving}
              onChange={(e) => toggleEnabled(e.target.checked)}
            />
            {enabled ? "On" : "Off"}
          </label>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {open ? "Close" : "Edit copy"}
          </button>
          <Link
            href={`/admin/super/online-forms/${form.slug}/submissions`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            View submissions
          </Link>
        </div>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4">
          <Field label="Intro text">
            <input className={inputClass} value={introText} onChange={(e) => setIntroText(e.target.value)} />
          </Field>
          <Field label="Consent checkbox label">
            <textarea className={inputClass} rows={2} value={consentLabel} onChange={(e) => setConsentLabel(e.target.value)} />
          </Field>
          <Field label="Terms of consent (shown in the modal)">
            <textarea className={inputClass} rows={5} value={termsHtml} onChange={(e) => setTermsHtml(e.target.value)} />
          </Field>
          <Field label="Success message">
            <textarea className={inputClass} rows={2} value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} />
          </Field>
          <Field label="Disabled message">
            <textarea className={inputClass} rows={2} value={disabledMessage} onChange={(e) => setDisabledMessage(e.target.value)} />
          </Field>
          <Field label="Notify emails (comma-separated, optional)">
            <input className={inputClass} value={notifyEmails} onChange={(e) => setNotifyEmails(e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveCopy}
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save copy"}
            </button>
            {status ? <span className="text-sm text-slate-600">{status}</span> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function LegalTextEditor({
  blocks,
  onSaved,
}: {
  blocks: IntakeLegalText[];
  onSaved: () => Promise<void> | void;
}) {
  return (
    <section className={SECTION_CLASS}>
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-bold text-slate-900">Legal &amp; consent text</h2>
        <p className="text-sm text-slate-600">
          Shared blocks are reused across forms — editing one updates every form that uses it.
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {blocks.map((block) => (
          <LegalBlockRow key={block.cmsKey} block={block} onSaved={onSaved} />
        ))}
      </ul>
    </section>
  );
}

function LegalBlockRow({
  block,
  onSaved,
}: {
  block: IntakeLegalText;
  onSaved: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(block.body);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const isPlaceholder = isPlaceholderLegalText(block.body);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await adminFetch("/api/admin/online-forms", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "legal", cmsKey: block.cmsKey, body }),
      });
      if (!res.ok) {
        setStatus("Save failed.");
        return;
      }
      setStatus("Saved.");
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{block.label}</p>
          <p className="text-xs text-slate-500">{block.cmsKey}</p>
        </div>
        <div className="flex items-center gap-3">
          {isPlaceholder ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              Placeholder
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mt-3 space-y-2">
          <textarea
            className={inputClass}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {status ? <span className="text-sm text-slate-600">{status}</span> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
