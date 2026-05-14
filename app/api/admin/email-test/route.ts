import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { sendSuperadminTestEmail } from "@/lib/sendgrid";

export const runtime = "nodejs";

type Body = { to?: string };

/**
 * Superadmin-only: sends one minimal message via SendGrid to prove this deployment can mail.
 */
export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const to = (typeof body.to === "string" ? body.to.trim() : "") || staff.email?.trim() || "";
  if (!to) {
    return NextResponse.json(
      {
        ok: false,
        issue: "invalid_to" as const,
        detail:
          "No recipient: add an email to your Firebase user or POST { \"to\": \"you@example.com\" }.",
      },
      { status: 400 },
    );
  }

  const result = await sendSuperadminTestEmail(to);
  if (result.ok) {
    return NextResponse.json({ ok: true as const });
  }

  if (result.issue === "sendgrid_error") {
    return NextResponse.json(
      { ok: false as const, issue: result.issue, detail: result.detail },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: false as const, issue: result.issue, detail: result.detail },
    { status: 400 },
  );
}
