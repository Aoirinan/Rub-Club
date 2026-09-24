import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { recordBookingEvent } from "@/lib/booking-events";
import { onBookingCheckedIn, recomputePatientOutcomeStats } from "@/lib/patients-db";
import { noShowRefusal } from "@/lib/visit-outcome";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    checkedIn: z.boolean().optional(),
    /** Explicit no-show. Mutually exclusive with a check-in: setting one clears the other. */
    noShow: z.boolean().optional(),
    needsReschedule: z.boolean().optional(),
    internalNotes: z.string().max(2000).optional(),
  })
  .strict();

type Params = { params: Promise<{ id: string }> };

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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    parsed.data.checkedIn === undefined &&
    parsed.data.noShow === undefined &&
    parsed.data.needsReschedule === undefined &&
    parsed.data.internalNotes === undefined
  ) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }
  if (parsed.data.checkedIn === true && parsed.data.noShow === true) {
    return NextResponse.json(
      { error: "A visit can't be both checked in and a no-show." },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hadNoShow = snap.get("noShow") === true;
  if (parsed.data.noShow === true && !hadNoShow) {
    const startAt = snap.get("startAt");
    const refusal = noShowRefusal(
      {
        status: snap.get("status"),
        startAtMs: startAt instanceof Timestamp ? startAt.toMillis() : null,
      },
      Date.now(),
    );
    if (refusal) return NextResponse.json({ error: refusal }, { status: 409 });
  }

  const updates: Record<string, unknown> = {
    visitStateUpdatedAt: FieldValue.serverTimestamp(),
    visitStateUpdatedByUid: staff.uid,
    visitStateUpdatedByEmail: staff.email ?? null,
  };

  const clearNoShow = () => {
    updates.noShow = FieldValue.delete();
    updates.noShowAt = FieldValue.delete();
    updates.noShowByUid = FieldValue.delete();
    updates.noShowByEmail = FieldValue.delete();
  };

  if (parsed.data.checkedIn === true) {
    updates.checkedInAt = FieldValue.serverTimestamp();
    clearNoShow();
  } else if (parsed.data.checkedIn === false) {
    updates.checkedInAt = FieldValue.delete();
  }

  if (parsed.data.noShow === true) {
    if (!hadNoShow) {
      updates.noShow = true;
      updates.noShowAt = FieldValue.serverTimestamp();
      updates.noShowByUid = staff.uid;
      updates.noShowByEmail = staff.email ?? null;
    }
    updates.checkedInAt = FieldValue.delete();
  } else if (parsed.data.noShow === false) {
    clearNoShow();
  }

  if (typeof parsed.data.needsReschedule === "boolean") {
    updates.needsReschedule = parsed.data.needsReschedule;
  }

  if (typeof parsed.data.internalNotes === "string") {
    updates.internalNotes = parsed.data.internalNotes.trim();
  }

  const hadCheckedIn = snap.get("checkedInAt") instanceof Timestamp;
  // A booking counts toward the patient's visit total at most once, even if the
  // check-in box is toggled off and on again.
  const visitAlreadyCounted = snap.get("visitCountedAt") instanceof Timestamp;
  const countVisit = parsed.data.checkedIn === true && !hadCheckedIn && !visitAlreadyCounted;
  if (countVisit) updates.visitCountedAt = FieldValue.serverTimestamp();
  await ref.update(updates);

  const noShowChanged =
    (parsed.data.noShow === true && !hadNoShow) ||
    (hadNoShow && (parsed.data.noShow === false || parsed.data.checkedIn === true));
  if (noShowChanged) {
    await recordBookingEvent(db, id, {
      type: hadNoShow ? "no_show_cleared" : "no_show_marked",
      byUid: staff.uid,
      byEmail: staff.email ?? null,
      ...(hadNoShow && parsed.data.checkedIn === true ? { meta: { via: "checked_in" } } : {}),
    }).catch((err) =>
      console.error("[visit-state] no-show event failed", err instanceof Error ? err.message : err),
    );
  }

  const next = await ref.get();
  const patientId = typeof snap.get("patientId") === "string" ? snap.get("patientId") : null;
  if (countVisit && patientId) {
    const at = next.get("checkedInAt");
    if (at instanceof Timestamp) {
      await onBookingCheckedIn(db, patientId, at).catch(() => {});
    }
  }
  if (patientId && (noShowChanged || parsed.data.checkedIn !== undefined)) {
    // A check-in or no-show mark changes the patient's no-show count.
    await recomputePatientOutcomeStats(db, patientId).catch(() => {});
  }
  const d = next.data() ?? {};
  const checkedInAt = d.checkedInAt instanceof Timestamp ? d.checkedInAt.toMillis() : undefined;

  return NextResponse.json({
    ok: true,
    checkedInAtMs: typeof checkedInAt === "number" ? checkedInAt : null,
    noShow: d.noShow === true,
    needsReschedule: typeof d.needsReschedule === "boolean" ? d.needsReschedule : false,
    internalNotes: typeof d.internalNotes === "string" ? d.internalNotes : "",
  });
}
