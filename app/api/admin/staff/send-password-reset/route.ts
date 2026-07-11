import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicAppOriginForRequest } from "@/lib/app-origin";
import { getFirestore } from "@/lib/firebase-admin";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { requireStaff } from "@/lib/staff-auth";
import { sendStaffPasswordResetForEmail } from "@/lib/staff-password-reset";

export const runtime = "nodejs";

const bodySchema = z.object({
  uid: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const actor = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await assertRateLimitOk(req.headers, {
    bucket: "admin_staff_password_reset",
    maxPerWindow: 10,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many password reset requests. Try again later." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const targetUid = parsed.data.uid.trim();
  const targetSnap = await getFirestore().collection("staff").doc(targetUid).get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  const rawEmail = targetSnap.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "This person has no email on file." }, { status: 400 });
  }

  const continueOrigin = getPublicAppOriginForRequest(req);
  const result = await sendStaffPasswordResetForEmail({ email, continueOrigin });

  if (result.sent) {
    return NextResponse.json({ ok: true, emailedReset: true, email });
  }

  if (result.issue === "user_not_found") {
    return NextResponse.json(
      { error: "No sign-in account exists for that email. Re-invite them or check Firebase Auth." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: false,
    emailedReset: false,
    issue: result.issue,
    detail: result.sendgridDetail,
  });
}
