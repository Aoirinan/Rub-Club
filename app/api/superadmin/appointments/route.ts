import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const fromMs = fromStr ? Date.parse(fromStr) : Date.now() - 7 * 86400000;
  const toMs = toStr ? Date.parse(toStr) : Date.now() + 60 * 86400000;
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const db = getFirestore();
  const snap = await db
    .collection("bookings")
    .where("startAt", ">=", Timestamp.fromMillis(fromMs))
    .where("startAt", "<=", Timestamp.fromMillis(toMs))
    .orderBy("startAt", "asc")
    .limit(500)
    .get();

  const rows = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      startIso: typeof x.startIso === "string" ? x.startIso : null,
      startAtMs: x.startAt instanceof Timestamp ? x.startAt.toMillis() : null,
      name: typeof x.name === "string" ? x.name : "",
      phone: typeof x.phone === "string" ? x.phone : "",
      email: typeof x.email === "string" ? x.email : "",
      serviceLine: typeof x.serviceLine === "string" ? x.serviceLine : "",
      visitKind: typeof x.visitKind === "string" ? x.visitKind : "",
      durationMin: typeof x.durationMin === "number" ? x.durationMin : null,
      status: typeof x.status === "string" ? x.status : "",
      confirmationStatus: typeof x.confirmationStatus === "string" ? x.confirmationStatus : "",
      internalNotes: typeof x.internalNotes === "string" ? x.internalNotes : "",
      locationId: typeof x.locationId === "string" ? x.locationId : "",
      providerDisplayName:
        typeof x.providerDisplayName === "string" ? x.providerDisplayName : "",
      prepaidOnline: x.prepaidOnline === true,
      paymentLinkUrl: typeof x.paymentLinkUrl === "string" ? x.paymentLinkUrl : "",
      paymentAmountCents: typeof x.paymentAmountCents === "number" ? x.paymentAmountCents : null,
      paidAmountCents: typeof x.paidAmountCents === "number" ? x.paidAmountCents : null,
      paidAtMs: x.paidAt instanceof Timestamp ? x.paidAt.toMillis() : null,
      squarePaymentId: typeof x.squarePaymentId === "string" ? x.squarePaymentId : "",
    };
  });

  return NextResponse.json({ appointments: rows });
}
