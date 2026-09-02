import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";
import { uploadSiteContentMedia } from "@/lib/cms-upload";
import { resolveMassageTeamImageContentType } from "@/lib/massage-team-upload";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Some browsers send an empty File.type for valid JPEGs: sniff magic bytes.
  const contentType = resolveMassageTeamImageContentType(file.type, buffer);
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, or WebP." }, { status: 400 });
  }
  try {
    const url = await uploadSiteContentMedia({
      fieldId: `stretch_flex/${safeId}`,
      contentType,
      buffer,
      originalFilename: file.name || "photo",
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
