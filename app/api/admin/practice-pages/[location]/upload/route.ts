import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { uploadSiteContentMedia } from "@/lib/cms-upload";
import { requireStaff } from "@/lib/staff-auth";
import { isPracticeLocationId } from "@/lib/practice-pages-shared";

export const runtime = "nodejs";

const MAX_IMAGE = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Upload a section image for a practice page; returns its public URL. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ location: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const slotRaw = form.get("slot");
  const slot =
    typeof slotRaw === "string" && slotRaw.trim()
      ? slotRaw.trim().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60)
      : "image";

  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_IMAGE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const url = await uploadSiteContentMedia({
    fieldId: `practice_pages/${location}/${slot}`,
    contentType,
    buffer: buf,
    originalFilename: file.name,
  });

  return NextResponse.json({ ok: true, url });
}
