"use client";

import { OpsCollapsibleSection } from "./OpsCollapsibleSection";

type EmailStatus = {
  sendgridConfigured: boolean;
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromEnvInvalidFormat?: boolean;
  officeNotificationConfigured?: boolean;
};

export function OpsEmailStatusBanner({ emailStatus }: { emailStatus: EmailStatus | null }) {
  if (!emailStatus) return null;

  const hasProblem =
    emailStatus.fromEnvInvalidFormat || !emailStatus.sendgridConfigured;

  if (!hasProblem) return null;

  return (
    <OpsCollapsibleSection
      title="Email delivery (for your web person)"
      summary="Invitation emails are not working on this site until setup is fixed."
      defaultOpen
    >
      <p className="text-sm text-slate-700">
        Team invites may not send email until outgoing mail is configured on the server. Share this
        with whoever manages the website hosting.
      </p>
      <a
        href="https://github.com/Aoirinan/Rub-Club/blob/main/docs/production-env-checklist.md"
        className="inline-block text-sm font-semibold text-[#0f5f5c] underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Setup guide (for your developer)
      </a>
      {emailStatus.fromEnvInvalidFormat ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          The &ldquo;from&rdquo; email address on the server is not valid. Your web person should fix
          the sender address in production settings.
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Outgoing email is not fully configured on this deployment.
        </p>
      )}
    </OpsCollapsibleSection>
  );
}
