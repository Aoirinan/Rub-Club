"use client";

import { useState } from "react";
import { OpsCollapsibleSection } from "./OpsCollapsibleSection";

type EmailStatus = {
  sendgridConfigured: boolean;
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromEnvInvalidFormat?: boolean;
  apiKeyLooksValid?: boolean;
  fromLooksValid?: boolean;
  likelySwapped?: boolean;
  fromLooksLikeApiKey?: boolean;
  apiKeyLooksLikeEmail?: boolean;
  fromUsesFreeMailbox?: boolean;
  officeNotificationConfigured?: boolean;
};

type EmailTestResult = {
  ok: boolean;
  detail?: string;
  to?: string;
};

export function OpsEmailStatusBanner({
  emailStatus,
  onSendTestEmail,
}: {
  emailStatus: EmailStatus | null;
  onSendTestEmail?: () => Promise<EmailTestResult>;
}) {
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null);

  if (!emailStatus) return null;

  const hasProblem =
    emailStatus.likelySwapped ||
    emailStatus.fromEnvInvalidFormat ||
    emailStatus.fromUsesFreeMailbox ||
    !emailStatus.sendgridConfigured;

  async function runTest() {
    if (!onSendTestEmail) return;
    setTestBusy(true);
    setTestResult(null);
    try {
      setTestResult(await onSendTestEmail());
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <OpsCollapsibleSection
      title="Email delivery"
      summary={
        hasProblem
          ? "Invitation emails may not send until setup is fixed."
          : "SendGrid env looks configured — send a test to confirm delivery."
      }
      defaultOpen={hasProblem}
    >
      <ul className="space-y-1 text-sm text-slate-700">
        <li>
          API key:{" "}
          <strong>
            {!emailStatus.hasApiKey
              ? "missing"
              : emailStatus.apiKeyLooksValid
                ? "present (SG.…)"
                : emailStatus.apiKeyLooksLikeEmail
                  ? "looks like an email (swapped?)"
                  : "present but unexpected format"}
          </strong>
        </li>
        <li>
          FROM address:{" "}
          <strong>
            {!emailStatus.hasFromEmail
              ? "missing"
              : emailStatus.fromLooksValid
                ? "valid"
                : emailStatus.fromLooksLikeApiKey
                  ? "looks like API key (swapped?)"
                  : "invalid format"}
          </strong>
        </li>
      </ul>

      {emailStatus.likelySwapped ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          The SendGrid API key and FROM email appear <strong>swapped</strong> in Vercel. Put the{" "}
          <code className="text-xs">SG.…</code> value in <code className="text-xs">SENDGRID_API_KEY</code>{" "}
          (or <code className="text-xs">send_grid</code>) and the verified sender email in{" "}
          <code className="text-xs">SENDGRID_FROM_EMAIL</code> (or{" "}
          <code className="text-xs">sendgridfromemail</code>).
        </p>
      ) : null}

      {emailStatus.fromEnvInvalidFormat ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          The FROM email on the server is not valid after cleaning. Use a plain address only — no
          quotes, JSON, or API key.
        </p>
      ) : null}

      {!emailStatus.hasApiKey || !emailStatus.hasFromEmail ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Add <code className="text-xs">SENDGRID_API_KEY</code> and{" "}
          <code className="text-xs">SENDGRID_FROM_EMAIL</code> in Vercel → Settings → Environment
          Variables (Production), then redeploy.
        </p>
      ) : null}

      {emailStatus.fromUsesFreeMailbox ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          The FROM address uses a personal mailbox (Gmail, Outlook, etc.). Gmail often shows{" "}
          <strong>via sendgrid.net</strong> and may file invites in <strong>Spam</strong>. For
          production, authenticate your clinic domain in SendGrid (Settings → Sender Authentication)
          and set <code className="text-xs">SENDGRID_FROM_EMAIL</code> to something like{" "}
          <code className="text-xs">scheduling@chiropracticparistexas.com</code>.
        </p>
      ) : emailStatus.sendgridConfigured ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          If invites land in spam, authenticate your clinic domain in SendGrid and ask staff to mark
          the first message as <strong>Not spam</strong>.
        </p>
      ) : null}

      {onSendTestEmail ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={runTest}
            disabled={testBusy}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
          >
            {testBusy ? "Sending test…" : "Send test email to me"}
          </button>
          {testResult ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                testResult.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-rose-200 bg-rose-50 text-rose-950"
              }`}
            >
              {testResult.ok
                ? `Test email sent to ${testResult.to ?? "your inbox"}. Check spam if it does not arrive within a minute.`
                : testResult.detail ?? "Test email failed."}
            </p>
          ) : null}
        </div>
      ) : null}

      <a
        href="https://github.com/Aoirinan/Rub-Club/blob/main/docs/production-env-checklist.md"
        className="inline-block text-sm font-semibold text-[#c0392b] underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Setup guide (for your developer)
      </a>
    </OpsCollapsibleSection>
  );
}
