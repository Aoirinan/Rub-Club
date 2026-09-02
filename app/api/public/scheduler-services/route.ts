import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { ServiceLine } from "@/lib/constants";
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
  // The public wizard books on a 30-minute slot grid; a service whose length is
  // not a multiple of 30 cannot be offered online (the slot API rejects it).
  let services = (await fetchAllSchedulerServices(db)).filter(
    (s) => isCustomerVisibleService(s) && s.durationMinutes % 30 === 0,
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
