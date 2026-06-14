import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/staff-auth";
import { listSubmissions } from "@/lib/intakeForms/config-db";
import { getFormDefinition } from "@/lib/intakeForms/definitions";
import { submissionPatientName } from "@/lib/intakeForms/display";

export const runtime = "nodejs";

const querySchema = z.object({
  slug: z.string().min(1),
  status: z.enum(["new", "reviewed", "archived", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    slug: url.searchParams.get("slug") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  if (!getFormDefinition(parsed.data.slug)) {
    return NextResponse.json({ error: "Unknown form" }, { status: 400 });
  }

  const records = await listSubmissions(parsed.data.slug, {
    status: parsed.data.status ?? "all",
    limit: parsed.data.limit,
  });

  // Slim list — never ship signature/diagram images to the table view.
  const submissions = records.map((r) => ({
    id: r.id,
    formSlug: r.formSlug,
    formTitle: r.formTitle,
    patientName: submissionPatientName(r.answers),
    status: r.status,
    submittedAt: r.meta.submittedAt,
  }));

  return NextResponse.json({ submissions });
}
