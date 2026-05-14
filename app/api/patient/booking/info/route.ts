import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { findBookingByPortalToken } from "@/lib/patient-portal-lookup";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(16).max(500),
});

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
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

  const db = getFirestore();
  const snap = await findBookingByPortalToken(db, parsed.data.token);
  if (!snap) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const status = snap.get("status");
  if (status !== "confirmed") {
    return NextResponse.json(
      { error: "This appointment is no longer active online." },
      { status: 410 },
    );
  }

  const locationId = snap.get("locationId");
  const serviceLine = snap.get("serviceLine");
  const durationMin = snap.get("durationMin");
  const startIso = snap.get("startIso");
  const providerId = snap.get("providerId");
  const providerDisplayName = snap.get("providerDisplayName");
  const name = snap.get("name");

  return NextResponse.json({
    ok: true,
    status,
    locationId,
    serviceLine,
    durationMin,
    startIso,
    providerId: typeof providerId === "string" ? providerId : "",
    providerDisplayName: typeof providerDisplayName === "string" ? providerDisplayName : "",
    name: typeof name === "string" ? name : "",
    canReschedule: typeof providerId === "string" && providerId.trim().length > 0,
  });
}
