import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEventInTx } from "@/lib/booking-events";
import {
  IN_OFFICE_PAYMENT_METHODS,
  PAYMENT_AMOUNT_MAX_CENTS,
  PAYMENT_NOTE_MAX,
  effectivePaymentMethod,
  refusePaymentChange,
  type PaymentChangeRefusal,
} from "@/lib/booking-payment";
import { recomputePatientOutcomeStats } from "@/lib/patients-db";

export const runtime = "nodejs";

/**
 * Record (or remove) a payment taken in the office — card, cash or check — so
 * the scheduler shows which visits were paid. Nothing is charged and the
 * patient is not contacted.
 */
const bodySchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("mark_paid"),
      method: z.enum(IN_OFFICE_PAYMENT_METHODS),
      amountCents: z.number().int().min(1).max(PAYMENT_AMOUNT_MAX_CENTS).optional(),
      note: z.string().max(PAYMENT_NOTE_MAX).optional(),
    })
    .strict(),
  z.object({ action: z.literal("mark_unpaid") }).strict(),
]);

type Params = { params: Promise<{ id: string }> };

/** Fields a recorded payment owns; cleared together by "mark_unpaid". */
const PAYMENT_RECORD_FIELDS = [
  "paidAt",
  "paidAmountCents",
  "paymentMethod",
  "paymentNote",
  "paymentRecordedByUid",
  "paymentRecordedByEmail",
  "paymentUnderpaid",
] as const;

export async function POST(req: Request, ctx: Params) {
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
    return NextResponse.json(
      {
        error: `Pick card, cash, check or other. The amount must be $0.01 to $5,000 and the note at most ${PAYMENT_NOTE_MAX} characters.`,
      },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const { id } = await ctx.params;
  const db = getFirestore();
  const ref = db.collection("bookings").doc(id);

  type Outcome =
    | { kind: "not_found" }
    | { kind: "refused"; refusal: PaymentChangeRefusal }
    | { kind: "done"; patientId: string | null };

  const outcome: Outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { kind: "not_found" };
    const data = snap.data() ?? {};
    const payment = {
      paidAtMs: data.paidAt instanceof Timestamp ? data.paidAt.toMillis() : null,
      paidAmountCents: typeof data.paidAmountCents === "number" ? data.paidAmountCents : null,
      paymentMethod: typeof data.paymentMethod === "string" ? data.paymentMethod : null,
      squarePaymentId: typeof data.squarePaymentId === "string" ? data.squarePaymentId : null,
    };
    const refusal = refusePaymentChange({
      action: body.action,
      bookingStatus: data.status,
      payment,
      role: staff.role,
    });
    if (refusal) return { kind: "refused", refusal };

    const actor = { byUid: staff.uid, byEmail: staff.email ?? null };
    if (body.action === "mark_paid") {
      const note = body.note?.trim() ?? "";
      tx.update(ref, {
        paidAt: FieldValue.serverTimestamp(),
        paymentMethod: body.method,
        paidAmountCents:
          typeof body.amountCents === "number" ? body.amountCents : FieldValue.delete(),
        paymentNote: note ? note : FieldValue.delete(),
        paymentRecordedByUid: staff.uid,
        paymentRecordedByEmail: staff.email ?? null,
      });
      // Method and amount only: the note is free text and stays on the booking.
      recordBookingEventInTx(db, tx, id, {
        type: "payment_recorded",
        ...actor,
        meta: {
          method: body.method,
          ...(typeof body.amountCents === "number" ? { amountCents: body.amountCents } : {}),
        },
      });
    } else {
      const cleared: Record<string, FieldValue> = {};
      for (const field of PAYMENT_RECORD_FIELDS) cleared[field] = FieldValue.delete();
      // `squarePaymentId` stays: it is the audit link to Square and stops a
      // redelivered webhook from recording the same payment again.
      tx.update(ref, cleared);
      const prevMethod = effectivePaymentMethod(payment);
      recordBookingEventInTx(db, tx, id, {
        type: "payment_cleared",
        ...actor,
        meta: {
          ...(prevMethod ? { prevMethod } : {}),
          ...(typeof payment.paidAmountCents === "number"
            ? { prevAmountCents: payment.paidAmountCents }
            : {}),
        },
      });
    }
    return {
      kind: "done",
      patientId: typeof data.patientId === "string" && data.patientId ? data.patientId : null,
    };
  });

  if (outcome.kind === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (outcome.kind === "refused") {
    return NextResponse.json(
      { error: outcome.refusal.error, code: outcome.refusal.code },
      { status: 409 },
    );
  }

  if (outcome.patientId) {
    // Keep the patient's "total paid" in step; the payment itself is saved.
    await recomputePatientOutcomeStats(db, outcome.patientId).catch((err) =>
      console.error("[booking-payment] patient stats refresh failed", err instanceof Error ? err.message : err),
    );
  }

  const next = (await ref.get()).data() ?? {};
  return NextResponse.json({
    ok: true,
    paidAtMs: next.paidAt instanceof Timestamp ? next.paidAt.toMillis() : null,
    paidAmountCents: typeof next.paidAmountCents === "number" ? next.paidAmountCents : null,
    paymentMethod: typeof next.paymentMethod === "string" ? next.paymentMethod : null,
  });
}
