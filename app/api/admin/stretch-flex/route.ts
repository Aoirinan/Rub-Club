import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { getStretchFlexExercises } from "@/lib/stretch-flex";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const exercises = await getStretchFlexExercises();
  return NextResponse.json({ exercises });
}
