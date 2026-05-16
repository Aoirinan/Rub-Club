import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

function isoFromFirestoreTime(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate().toISOString();
  }
  return null;
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getFirestore();
  const snap = await db.collection("intake_forms").orderBy("submittedAt", "desc").limit(80).get();

  const items = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      submittedAt: isoFromFirestoreTime(d.submittedAt),
      firstName: typeof d.firstName === "string" ? d.firstName : "",
      lastName: typeof d.lastName === "string" ? d.lastName : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      email: typeof d.email === "string" ? d.email : "",
      hasInsuranceCard: Boolean(d.insuranceCard?.storagePath),
      hasDriversLicense: Boolean(d.driversLicense?.storagePath),
    };
  });

  return NextResponse.json({ items });
}
