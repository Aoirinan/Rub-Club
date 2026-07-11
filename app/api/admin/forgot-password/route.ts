import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { getPublicAppOriginForRequest } from "@/lib/app-origin";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { sendStaffPasswordResetForEmail } from "@/lib/staff-password-reset";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(200),
});

const GENERIC_OK = {
  ok: true,
  message:
    "If an account with that email exists, we sent password reset instructions. Check your inbox and spam folder.",
};

/** Self-service staff password reset — only for emails with an active staff record. */
export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers, {
    bucket: "staff_forgot_password",
    maxPerWindow: 5,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
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
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const db = getFirestore();
  const staffSnap = await db.collection("staff").where("email", "==", email).limit(1).get();
  if (staffSnap.empty) {
    return NextResponse.json(GENERIC_OK);
  }

  const continueOrigin = getPublicAppOriginForRequest(req);
  const result = await sendStaffPasswordResetForEmail({ email, continueOrigin });
  if (result.sent) {
    return NextResponse.json(GENERIC_OK);
  }

  // Do not leak whether Firebase user exists — same generic response.
  return NextResponse.json(GENERIC_OK);
}
