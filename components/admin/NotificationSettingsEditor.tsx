"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  NOTIFICATION_MERGE_FIELDS,
  type NotificationTemplatesConfig,
} from "@/lib/notification-templates";

type Props = {
  getIdToken: () => Promise<string | null>;
};

type Tab = "customer" | "internal";
type Channel = "sms" | "email";

const KINDS = [
  { id: "first_time" as const, label: "First time" },
  { id: "standard" as const, label: "Standard" },
  { id: "status_change" as const, label: "Status change" },
];

export function NotificationSettingsEditor({ getIdToken }: Props) {
  const [templates, setTemplates] = useState<NotificationTemplatesConfig>(
    DEFAULT_NOTIFICATION_TEMPLATES,
  );
  const [rescheduleEmail, setRescheduleEmail] = useState("");
  const [envReschedule, setEnvReschedule] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("customer");
  const [channel, setChannel] = useState<Channel>("sms");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("standard");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/notification-settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      templates?: NotificationTemplatesConfig;
      envRescheduleEmail?: string | null;
    };
    if (res.ok && data.templates) {
      setTemplates(data.templates);
      setRescheduleEmail(data.templates.rescheduleEmail);
    }
    setEnvReschedule(data.envRescheduleEmail ?? null);
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<NotificationTemplatesConfig> & { rescheduleEmail?: string }) {
    setSaving(true);
    setMessage(null);
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/notification-settings", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setMessage("Could not save.");
    } else {
      setMessage("Saved.");
      await load();
    }
    setSaving(false);
  }

  function insertField(field: string) {
    const token = `[${field}]`;
    if (channel === "sms") {
      const cur = templates.sms[tab][kind];
      const next = { ...templates, sms: { ...templates.sms, [tab]: { ...templates.sms[tab], [kind]: cur + token } } };
      setTemplates(next);
    } else {
      const cur = templates.email[tab][kind].body;
      const next = {
        ...templates,
        email: {
          ...templates.email,
          [tab]: {
            ...templates.email[tab],
            [kind]: { ...templates.email[tab][kind], body: cur + token },
          },
        },
      };
      setTemplates(next);
    }
  }

  function restoreDefaults() {
    const d = DEFAULT_NOTIFICATION_TEMPLATES;
    if (channel === "sms") {
      setTemplates({
        ...templates,
        sms: { ...templates.sms, [tab]: { ...templates.sms[tab], [kind]: d.sms[tab][kind] } },
      });
    } else {
      setTemplates({
        ...templates,
        email: {
          ...templates.email,
          [tab]: { ...templates.email[tab], [kind]: { ...d.email[tab][kind] } },
        },
      });
    }
  }

  const smsValue = templates.sms[tab][kind];
  const emailValue = templates.email[tab][kind];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Reminders are sent only when staff click <strong>Send reminders</strong> on the scheduler â€” never
        on a timer. Production can override reschedule email with{" "}
        <code className="rounded bg-slate-100 px-1">RESCHEDULE_EMAIL</code> in Vercel.
        {envReschedule ? (
          <span className="mt-1 block text-emerald-800">
            Env override active: <code className="rounded bg-emerald-50 px-1">{envReschedule}</code>
          </span>
        ) : null}
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <label className="block text-sm font-semibold text-slate-900">
          Reschedule / scheduling contact email
          <input
            type="email"
            className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={rescheduleEmail}
            onChange={(e) => setRescheduleEmail(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save({ rescheduleEmail })}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Save reschedule email
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["customer", "internal"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {t === "customer" ? "Customer" : "Internal (staff)"}
          </button>
        ))}
        {(["sms", "email"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${channel === c ? "bg-[#c0392b] text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {c === "sms" ? "Text" : "Email"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === k.id ? "bg-teal-100 text-teal-900 ring-1 ring-teal-300" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">
          Insert placeholders (name, time, etc.)
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {NOTIFICATION_MERGE_FIELDS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => insertField(f)}
              className="rounded bg-white px-2 py-0.5 text-[10px] font-mono ring-1 ring-slate-200 hover:bg-slate-50"
            >
              [{f}]
            </button>
          ))}
        </div>
      </details>

      {channel === "sms" ? (
        <label className="block text-sm">
          <span className="font-semibold text-slate-900">Message body</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            rows={6}
            value={smsValue}
            onChange={(e) =>
              setTemplates({
                ...templates,
                sms: { ...templates.sms, [tab]: { ...templates.sms[tab], [kind]: e.target.value } },
              })
            }
          />
        </label>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="font-semibold text-slate-900">Subject</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={emailValue.subject}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  email: {
                    ...templates.email,
                    [tab]: {
                      ...templates.email[tab],
                      [kind]: { ...emailValue, subject: e.target.value },
                    },
                  },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-900">Body</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              rows={8}
              value={emailValue.body}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  email: {
                    ...templates.email,
                    [tab]: {
                      ...templates.email[tab],
                      [kind]: { ...emailValue, body: e.target.value },
                    },
                  },
                })
              }
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={restoreDefaults}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
        >
          Restore default
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save({ sms: templates.sms, email: templates.email })}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          {saving ? "Savingâ€¦" : "Save templates"}
        </button>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
