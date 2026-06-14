import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/staff-auth";
import { getSubmission, updateSubmissionStatus } from "@/lib/intakeForms/config-db";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const submission = await getSubmission(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ submission });
}

const patchSchema = z.object({
  status: z.enum(["new", "reviewed", "archived"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const ok = await updateSubmissionStatus(id, parsed.data.status, staff.email ?? staff.uid);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
