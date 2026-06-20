import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { getSendgridEnvDiagnostics, sendOutboundEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = staff.email?.trim();
  if (!to) {
    return NextResponse.json(
      { ok: false, detail: "Your staff account has no email address on file." },
      { status: 400 },
    );
  }

  const diagnostics = getSendgridEnvDiagnostics();
  if (diagnostics.likelySwapped) {
    return NextResponse.json({
      ok: false,
      detail:
        "SendGrid API key and FROM email appear swapped in Vercel env vars. Put the SG.x… key in SENDGRID_API_KEY (or send_grid) and the verified sender email in SENDGRID_FROM_EMAIL (or sendgridfromemail).",
      diagnostics,
    });
  }

  const result = await sendOutboundEmail({
    to,
    subject: "Staff portal — test email",
    text: [
      "This is a test message from the Paris Wellness staff portal.",
      "",
      "If you received this, SendGrid is configured correctly and staff invite emails should work.",
    ].join("\n"),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, to, diagnostics });
  }

  const detail =
    result.detail ??
    (result.reason === "missing_api_key"
      ? "SENDGRID_API_KEY (or send_grid) is missing on this deployment."
      : result.reason === "invalid_from_email"
        ? "SENDGRID_FROM_EMAIL (or sendgridfromemail) is missing or not a valid email."
        : "SendGrid rejected the send.");

  return NextResponse.json({ ok: false, detail, reason: result.reason, diagnostics });
}
