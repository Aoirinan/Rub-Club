import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { buildBookingsExportCsv } from "@/lib/bookings-export-csv";
import { getFirestore } from "@/lib/firebase-admin";
import { isSuperadminRequest } from "@/lib/superadmin-auth";
import { TIME_ZONE } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const fromMs = fromStr ? Date.parse(fromStr) : Date.now() - 30 * 86400000;
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
    .limit(5000)
    .get();

  const csv = buildBookingsExportCsv(snap.docs, { statuses: [] });
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
  const v = typeof pkg.version === "string" ? pkg.version : "export";
  const filename = `bookings-owner-${v}-${DateTime.now().setZone(TIME_ZONE).toFormat("yyyy-LL-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
