import { NextResponse } from "next/server";
import { z } from "zod";
import {
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

  const ok = await updateContactSubmissionStatus(
    id,
    parsed.data.status as ContactSubmissionStatus,
  );
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
