import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/staff-auth";
import { listPatients } from "@/lib/patients-db";

export const runtime = "nodejs";

const searchSchema = z.object({
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  paymentType: z.enum(["cash", "insurance", "mixed", "all"]).optional(),
  businessTag: z.enum(["rub_club", "chiro", "both", "all"]).optional(),
  activeOnly: z.boolean().optional(),
});

/**
 * Patient list search is a POST with the search term in the JSON body so
 * patient names and phone numbers never land in request/hosting logs as
 * query strings (same reason as POST /api/admin/patient).
 */
export async function POST(req: Request) {
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

  const parsed = searchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { search, page, limit, paymentType, businessTag, activeOnly } = parsed.data;
  const result = await listPatients({
    search: search?.trim() || undefined,
    page: page ?? 1,
    limit: limit ?? 50,
    paymentType: paymentType ?? "all",
    businessTag: businessTag ?? "all",
    activeOnly: activeOnly === true,
  });

  return NextResponse.json(result);
}
