import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { getSiteOrigin } from "@/lib/site-content";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const origin = getSiteOrigin();
  const bad = NextResponse.redirect(new URL("/book?confirm=invalid", origin));

  if (!token || token.length < 8) return bad;

  const db = getFirestore();
  const snap = await db.collection("bookings").where("confirmToken", "==", token).limit(1).get();
  if (snap.empty) return bad;

  const doc = snap.docs[0]!;
  await doc.ref.update({
    confirmationStatus: "confirmed_online",
    confirmClickedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.redirect(new URL("/book?confirm=thanks", origin));
}
