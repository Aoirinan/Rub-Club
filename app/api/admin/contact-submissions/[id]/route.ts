import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getContactSubmission,
  updateContactSubmissionStatus,
  type ContactSubmissionStatus,
} from "@/lib/contact-submissions";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Enforce location scope: single-location staff can only touch their office's
  // messages (and never location-less legacy rows).
  const existing = await getContactSubmission(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (staff.locationScope !== "both" && existing.location !== staff.locationScope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ok = await updateContactSubmissionStatus(
    id,
    parsed.data.status as ContactSubmissionStatus,
  );
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
