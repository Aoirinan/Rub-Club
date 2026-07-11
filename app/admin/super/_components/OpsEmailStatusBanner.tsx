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
  fromEmail?: string;
  fromEmailDomain?: string;
  fromDisplayName?: string;
  isClinicFromDomain?: boolean;
  isTransitionFromDomain?: boolean;
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

  const summary = hasProblem
    ? "Email may land in spam until FROM uses an authenticated domain."
    : emailStatus.isClinicFromDomain
      ? "Sending from clinic domain — send a test to confirm delivery."
      : emailStatus.isTransitionFromDomain
        ? "Transition domain active — cut over to clinic domain when DNS is ready."
        : "SendGrid env looks configured — send a test to confirm delivery.";

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
      summary={summary}
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
              : emailStatus.fromEmail
                ? emailStatus.fromEmail
                : emailStatus.fromLooksValid
                  ? "valid"
                  : emailStatus.fromLooksLikeApiKey
                    ? "looks like API key (swapped?)"
                    : "invalid format"}
          </strong>
        </li>
        {emailStatus.fromEmail ? (
          <li>
            Display name in inbox:{" "}
            <strong>{emailStatus.fromDisplayName ?? "Chiropractic Associates · The Rub Club"}</strong>
          </li>
        ) : null}
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
          The FROM address uses a personal mailbox (Gmail, Outlook, etc.). Authenticate{" "}
          <strong>massageparistx.com</strong> in SendGrid, set{" "}
          <code className="text-xs">sendgridfromemail</code> to{" "}
          <code className="text-xs">scheduling@massageparistx.com</code>, and set{" "}
          <code className="text-xs">SENDGRID_REPLY_TO</code> to{" "}
          <code className="text-xs">scheduling@massageparistx.com</code>. See the transition
          setup guide below.
        </p>
      ) : emailStatus.isTransitionFromDomain ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Transition sender is active on <strong>{emailStatus.fromEmailDomain}</strong>. When clinic
          DNS is ready, switch to{" "}
          <code className="text-xs">scheduling@chiropracticparistexas.com</code> in Vercel only —
          no code change.
        </p>
      ) : emailStatus.isClinicFromDomain ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Sending from the clinic domain. If mail still lands in spam, confirm SendGrid domain
          authentication is verified.
        </p>
      ) : emailStatus.sendgridConfigured ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          If invites land in spam, authenticate a sending domain in SendGrid and ask staff to mark
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

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <a
          href="https://github.com/Aoirinan/Rub-Club/blob/main/docs/sendgrid-transition-setup.md"
          className="inline-block text-sm font-semibold text-[#c0392b] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Transition email setup (massageparistx.com → clinic)
        </a>
        <a
          href="https://github.com/Aoirinan/Rub-Club/blob/main/docs/production-env-checklist.md"
          className="inline-block text-sm font-semibold text-[#c0392b] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Production env checklist
        </a>
      </div>
    </OpsCollapsibleSection>
  );
}
