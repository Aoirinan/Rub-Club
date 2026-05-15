import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type TestimonialVideoItem } from "@/lib/site-owner-config";
import { uploadOwnerTestimonialVideo } from "@/lib/owner-marketing-upload";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

function isFile(v: FormDataEntryValue | null): v is File {
  return v !== null && typeof v === "object" && "arrayBuffer" in (v as Blob);
}

export async function POST(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get("file");
  const title = String(fd.get("title") ?? "").trim();
  const label = String(fd.get("label") ?? "").trim();
  if (!isFile(file)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const contentType = file.type || "application/octet-stream";
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const { url, storagePath } = await uploadOwnerTestimonialVideo({ buffer: buf, contentType });
    const id = randomUUID();
    const item: TestimonialVideoItem = {
      id,
      title,
      label,
      url,
      storagePath,
      createdAt: new Date().toISOString(),
    };
    const cur = await getSiteOwnerConfig();
    const nextVideos = [...cur.testimonialVideos, item];
    await setSiteOwnerConfigPatch({ testimonialVideos: nextVideos });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
