import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAuth, getFirestore } from "@/lib/firebase-admin";
import { getPublicAppOrigin } from "@/lib/app-origin";
import { requireStaff } from "@/lib/staff-auth";
import { sendStaffInviteEmail } from "@/lib/sendgrid";
import { STAFF_ROLES, canAssignRole, type StaffRole } from "@/lib/staff-roles";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    email: z.string().email(),
    role: z.enum(STAFF_ROLES as [StaffRole, ...StaffRole[]]),
    linkedProviderId: z.string().min(1).max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "massage_therapist" && !data.linkedProviderId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "linkedProviderId is required for massage therapists",
        path: ["linkedProviderId"],
      });
    }
  });

function authErrorCode(e: unknown): string {
  if (typeof e !== "object" || e === null) return "";
  const o = e as { code?: string; errorInfo?: { code?: string } };
  return o.code ?? o.errorInfo?.code ?? "";
}

export async function POST(req: Request) {
  const actor = await requireStaff(req.headers.get("authorization"), "manager");
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role;
  if (!canAssignRole(actor.role, role)) {
    return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  }

  const linkedProviderId =
    role === "massage_therapist" ? parsed.data.linkedProviderId!.trim() : undefined;

  const auth = getAuth();
  const db = getFirestore();

  let uid: string;
  let createdNewAuthUser = false;
  let temporaryPassword: string | null = null;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
  } catch (lookupErr: unknown) {
    if (authErrorCode(lookupErr) !== "auth/user-not-found") {
      console.error(lookupErr);
      return NextResponse.json({ error: "Could not look up user." }, { status: 500 });
    }
    const password = randomBytes(18).toString("base64url").slice(0, 24);
    try {
      const created = await auth.createUser({
        email,
        password,
        emailVerified: false,
        disabled: false,
      });
      uid = created.uid;
      createdNewAuthUser = true;
      temporaryPassword = password;
    } catch (e: unknown) {
      if (authErrorCode(e) === "auth/email-already-exists") {
        const u = await auth.getUserByEmail(email);
        uid = u.uid;
      } else {
        console.error(e);
        return NextResponse.json({ error: "Could not create Firebase user." }, { status: 500 });
      }
    }
  }

  await db
    .collection("staff")
    .doc(uid)
    .set(
      {
        role,
        email,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: actor.uid,
        ...(createdNewAuthUser ? { invitedAt: FieldValue.serverTimestamp() } : {}),
        ...(linkedProviderId ? { linkedProviderId } : {}),
      },
      { merge: true },
    );

  if (role !== "massage_therapist") {
    await db.collection("staff").doc(uid).update({ linkedProviderId: FieldValue.delete() });
  }

  let emailedReset = false;
  let inviteEmailIssue: "missing_env" | "sendgrid_error" | "reset_link_failed" | null = null;
  let inviteEmailDetail: string | undefined;
  try {
    const origin = getPublicAppOrigin();
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${origin}/auth/password-reset-complete`,
      handleCodeInApp: false,
    });
    const isBrandNew = createdNewAuthUser && temporaryPassword;
    const emailResult = await sendStaffInviteEmail({
      to: email,
      resetLink,
      inviterNote: isBrandNew
        ? "A manager added you to the Paris Wellness staff portal."
        : "You have been granted access to the Paris Wellness staff portal. Use the link below to sign in or reset your password if needed.",
      subject: isBrandNew
        ? "Staff portal — set your password"
        : "Staff portal — access granted",
    });
    emailedReset = emailResult.sent;
    if (!emailResult.sent) {
      inviteEmailIssue = emailResult.issue;
      inviteEmailDetail = emailResult.sendgridDetail;
    }
  } catch (e) {
    console.error("Password reset link / email failed", e);
    inviteEmailIssue = "reset_link_failed";
  }

  return NextResponse.json({
    ok: true,
    uid,
    role,
    createdNewAuthUser,
    emailedReset,
    inviteEmailIssue,
    ...(inviteEmailDetail ? { inviteEmailDetail } : {}),
    ...(createdNewAuthUser && !emailedReset && temporaryPassword
      ? {
          temporaryPassword,
          passwordWarning:
            "SendGrid is not configured or email failed. Share this one-time password with the employee securely, then ask them to change it via Forgot password on the staff login page.",
        }
      : {}),
  });
}
