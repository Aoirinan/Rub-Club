import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { ServiceLine } from "@/lib/constants";
import { isValidCatalogDurationMin } from "@/lib/booking-duration";
import {
  ensureSchedulerServicesSeeded,
  fetchAllSchedulerServices,
} from "@/lib/scheduler-services-db";
import {
  isCustomerVisibleService,
  schedulerServiceMatchesLine,
} from "@/lib/scheduler-service-lines";

export const runtime = "nodejs";

const LINES: ServiceLine[] = ["massage", "chiropractic", "stretch"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineRaw = searchParams.get("serviceLine");
  const serviceLine =
    lineRaw && LINES.includes(lineRaw as ServiceLine) ? (lineRaw as ServiceLine) : null;

  const db = getFirestore();
  await ensureSchedulerServicesSeeded(db);
  // Starts stay on the 30-minute grid, but a catalog service may run any
  // catalog length (e.g. 45 minutes): /api/slots and the booking POST accept a
  // service's own length (lib/booking-duration.ts).
  let services = (await fetchAllSchedulerServices(db)).filter(
    (s) => isCustomerVisibleService(s) && isValidCatalogDurationMin(s.durationMinutes),
  );
  if (serviceLine) {
    services = services.filter((s) => schedulerServiceMatchesLine(s, serviceLine));
  }

  return NextResponse.json({
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      priceCents: s.priceCents,
      durationMinutes: s.durationMinutes,
    })),
  });
}
