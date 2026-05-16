import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { onBookingCheckedIn } from "@/lib/patients-db";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    checkedIn: z.boolean().optional(),
    needsReschedule: z.boolean().optional(),
    internalNotes: z.string().max(2000).optional(),
  })
  .strict();

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "admin");
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
    parsed.data.needsReschedule === undefined &&
    parsed.data.internalNotes === undefined
  ) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getFirestore();
  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    visitStateUpdatedAt: FieldValue.serverTimestamp(),
    visitStateUpdatedByUid: staff.uid,
    visitStateUpdatedByEmail: staff.email ?? null,
  };

  if (parsed.data.checkedIn === true) {
    updates.checkedInAt = FieldValue.serverTimestamp();
  } else if (parsed.data.checkedIn === false) {
    updates.checkedInAt = FieldValue.delete();
  }

  if (typeof parsed.data.needsReschedule === "boolean") {
    updates.needsReschedule = parsed.data.needsReschedule;
  }

  if (typeof parsed.data.internalNotes === "string") {
    updates.internalNotes = parsed.data.internalNotes.trim();
  }

  const hadCheckedIn = snap.get("checkedInAt") instanceof Timestamp;
  await ref.update(updates);

  const next = await ref.get();
  if (parsed.data.checkedIn === true && !hadCheckedIn) {
    const patientId = typeof snap.get("patientId") === "string" ? snap.get("patientId") : null;
    if (patientId) {
      const at = next.get("checkedInAt");
      if (at instanceof Timestamp) {
        await onBookingCheckedIn(db, patientId, at).catch(() => {});
      }
    }
  }
  const d = next.data() ?? {};
  const checkedInAt = d.checkedInAt instanceof Timestamp ? d.checkedInAt.toMillis() : undefined;

  return NextResponse.json({
    ok: true,
    checkedInAtMs: typeof checkedInAt === "number" ? checkedInAt : null,
    needsReschedule: typeof d.needsReschedule === "boolean" ? d.needsReschedule : false,
    internalNotes: typeof d.internalNotes === "string" ? d.internalNotes : "",
  });
}
