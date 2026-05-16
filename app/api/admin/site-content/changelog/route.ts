import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { CONTENT_CHANGE_LOG_COLLECTION } from "@/lib/cms";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await getFirestore()
    .collection(CONTENT_CHANGE_LOG_COLLECTION)
    .orderBy("changedAt", "desc")
    .limit(10)
    .get();

  const entries = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      fieldId: data.fieldId ?? "",
      pageLabel: data.pageLabel ?? "",
      sectionLabel: data.sectionLabel ?? "",
      fieldLabel: data.fieldLabel ?? "",
      oldValue: typeof data.oldValue === "string" ? data.oldValue : "",
      newValue: typeof data.newValue === "string" ? data.newValue : "",
      changedAt: data.changedAt?.toDate?.()?.toISOString() ?? null,
      changedBy: typeof data.changedBy === "string" ? data.changedBy : "",
    };
  });

  return NextResponse.json({ entries });
}
