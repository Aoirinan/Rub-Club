import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { appendIntakePhiAudit } from "@/lib/intake-phi-audit";
import { INTAKE_BOOLEAN_FIELDS, INTAKE_TEXT_FIELDS } from "@/lib/intake-form-fields";

export const runtime = "nodejs";

function isoFromFirestoreTime(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate().toISOString();
  }
  return null;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const recordAccess = url.searchParams.get("recordAccess") !== "0";

  const db = getFirestore();
  const ref = db.collection("intake_forms").doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (recordAccess) {
    await appendIntakePhiAudit({
      intakeFormId: id,
      actorUid: staff.uid,
      actorEmail: staff.email,
      action: "detail_view",
      req,
    });
  }

  const d = doc.data() ?? {};
  const record: Record<string, unknown> = {
    id: doc.id,
    submittedAt: isoFromFirestoreTime(d.submittedAt),
  };
  for (const key of INTAKE_TEXT_FIELDS) {
    record[key] = typeof d[key] === "string" ? d[key] : "";
  }
  for (const key of INTAKE_BOOLEAN_FIELDS) {
    record[key] = Boolean(d[key]);
  }

  const fileSummary = (slot: unknown) => {
    if (!slot || typeof slot !== "object") return null;
    const o = slot as Record<string, unknown>;
    if (typeof o.storagePath !== "string") return null;
    return {
      contentType: typeof o.contentType === "string" ? o.contentType : "",
      originalFilename: typeof o.originalFilename === "string" ? o.originalFilename : "",
      bytes: typeof o.bytes === "number" ? o.bytes : 0,
      uploadedAt: isoFromFirestoreTime(o.uploadedAt),
    };
  };

  record.insuranceCard = fileSummary(d.insuranceCard);
  record.driversLicense = fileSummary(d.driversLicense);

  const logSnap = await ref.collection("phi_access_log").orderBy("at", "desc").limit(80).get();
  const accessLog = logSnap.docs.map((logDoc) => {
    const L = logDoc.data();
    return {
      id: logDoc.id,
      at: isoFromFirestoreTime(L.at),
      actorUid: typeof L.actorUid === "string" ? L.actorUid : "",
      actorEmail: typeof L.actorEmail === "string" ? L.actorEmail : null,
      action: typeof L.action === "string" ? L.action : "",
      documentKey: typeof L.documentKey === "string" ? L.documentKey : null,
      ip: typeof L.ip === "string" ? L.ip : null,
    };
  });

  return NextResponse.json({ intake: record, accessLog });
}
