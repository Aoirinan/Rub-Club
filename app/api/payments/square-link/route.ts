import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { createPaymentLink } from "@/lib/square";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

/**
 * Staff-only: creates a Square hosted checkout link for an existing booking when
 * `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID` are set (note includes booking id
 * for webhooks). Otherwise returns a stub URL for development.
 *
 * The amount must match the booking's stored `paymentAmountCents` when one is
 * already set; otherwise it is recorded on the booking so the Square webhook
 * can verify the paid amount before auto-confirming.
 */
const bodySchema = z.object({
  phone: z.string().min(7).max(40),
  bookingId: z.string().min(4).max(120).optional(),
  amountCents: z.number().int().positive().max(500_000).optional(),
  patientName: z.string().min(1).max(120).optional(),
  description: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { phone, bookingId, amountCents, patientName, description } = parsed.data;
  const displayName = patientName?.trim() || `Guest ${phone.replace(/\D/g, "").slice(-4)}`;

  if (bookingId && amountCents) {
    const db = getFirestore();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const snap = await bookingRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const expected = snap.get("paymentAmountCents");
    if (typeof expected === "number" && expected > 0 && expected !== amountCents) {
      return NextResponse.json(
        { error: "Amount does not match the amount already requested for this booking." },
        { status: 400 },
      );
    }

    const linkResult = await createPaymentLink({
      amountCents,
      patientName: displayName,
      bookingId,
      description: description?.trim() || undefined,
    });
    if (linkResult.created) {
      await bookingRef
        .update({
          paymentLinkUrl: linkResult.url,
          paymentLinkId: linkResult.paymentLinkId,
          paymentAmountCents: amountCents,
          paymentRequestedAt: FieldValue.serverTimestamp(),
          paymentRequestedByUid: staff.uid,
        })
        .catch((e) => console.error("[square-link] booking update failed", e));
      return NextResponse.json({
        ok: true,
        url: linkResult.url,
        paymentLinkId: linkResult.paymentLinkId,
        message: "Square payment link created.",
      });
    }
    return NextResponse.json(
      {
        ok: false,
        reason: linkResult.reason,
        detail: linkResult.detail,
        url: null,
        message:
          linkResult.reason === "missing_env"
            ? "Square is not configured (set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID)."
            : `Square did not return a link: ${linkResult.detail ?? linkResult.reason}`,
      },
      { status: linkResult.reason === "missing_env" ? 503 : 502 },
    );
  }

  const stubUrl = `https://squareup.com/checkout/pay-stub?booking=${encodeURIComponent(bookingId ?? "unknown")}`;
  console.info("[square-link] stub response", { bookingId: bookingId ?? null });
  return NextResponse.json({
    ok: true,
    url: stubUrl,
    message:
      "Stub URL — pass bookingId and amountCents to create a real Square link when credentials are configured.",
  });
}
