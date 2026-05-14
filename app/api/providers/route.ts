import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { fetchActiveProvidersForService } from "@/lib/providers-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, must-revalidate" } as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") as LocationId | null;
    const serviceLine = searchParams.get("serviceLine") as ServiceLine | null;

    if (locationId !== "paris" && locationId !== "sulphur_springs") {
      return NextResponse.json({ error: "Invalid locationId" }, { status: 400, headers: noStore });
    }
    if (serviceLine !== "massage" && serviceLine !== "chiropractic") {
      return NextResponse.json({ error: "Invalid serviceLine" }, { status: 400, headers: noStore });
    }

    const db = getFirestore();
    const rows = await fetchActiveProvidersForService(db, locationId, serviceLine, {
      publicBooking: true,
    });
    const providers = rows.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      sortOrder: p.sortOrder,
      photoUrl: p.photoUrl ?? null,
      about: p.about ?? null,
    }));

    return NextResponse.json({ providers }, { headers: noStore });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Missing Firebase Admin credentials")) {
      return NextResponse.json(
        {
          error:
            "Server is missing FIREBASE_SERVICE_ACCOUNT_KEY. Add it under Vercel → Settings → Environment Variables (Production), then redeploy.",
        },
        { status: 503, headers: noStore },
      );
    }
    return NextResponse.json({ error: "Failed to load providers" }, { status: 500, headers: noStore });
  }
}
