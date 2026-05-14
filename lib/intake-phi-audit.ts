import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { getClientIp } from "@/lib/rate-limit";

export type IntakePhiAuditAction = "detail_view" | "document_inline" | "document_download";

export async function appendIntakePhiAudit(opts: {
  intakeFormId: string;
  actorUid: string;
  actorEmail?: string | null;
  action: IntakePhiAuditAction;
  documentKey?: "insurance" | "drivers_license";
  req: Request;
}): Promise<void> {
  const db = getFirestore();
  const ip = getClientIp(opts.req.headers);
  await db.collection("intake_forms").doc(opts.intakeFormId).collection("phi_access_log").add({
    at: FieldValue.serverTimestamp(),
    actorUid: opts.actorUid,
    actorEmail: opts.actorEmail ?? null,
    action: opts.action,
    documentKey: opts.documentKey ?? null,
    ip: ip === "unknown" ? null : ip,
  });
}
