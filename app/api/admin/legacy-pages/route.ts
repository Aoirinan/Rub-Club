import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { listAllLegacyPages } from "@/lib/legacy-pages";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listAllLegacyPages();
  return NextResponse.json({ pages });
}
