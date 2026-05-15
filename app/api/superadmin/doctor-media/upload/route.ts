import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type DoctorMediaItem } from "@/lib/site-owner-config";
import { uploadOwnerDoctorMedia } from "@/lib/owner-marketing-upload";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

function isFile(v: FormDataEntryValue | null): v is File {
  return v !== null && typeof v === "object" && "arrayBuffer" in (v as Blob);
}

const DOCTOR_KEYS = new Set(["greg", "sean", "brandy"]);

export async function POST(req: Request) {
  if (!isSuperadminRequest(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get("file");
  const doctorKey = String(fd.get("doctorKey") ?? "").trim().toLowerCase();
  const caption = String(fd.get("caption") ?? "").trim();
  const mediaType = String(fd.get("mediaType") ?? "photo").trim() as "photo" | "video";
  if (!isFile(file)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!DOCTOR_KEYS.has(doctorKey)) {
    return NextResponse.json({ error: "Invalid doctorKey" }, { status: 400 });
  }
  if (mediaType !== "photo" && mediaType !== "video") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }
  const contentType = file.type || "application/octet-stream";
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const { url, storagePath } = await uploadOwnerDoctorMedia({
      buffer: buf,
      contentType,
      mediaType,
    });
    const cur = await getSiteOwnerConfig();
    const nextOrder =
      cur.doctorMedia.length === 0 ? 0 : Math.max(...cur.doctorMedia.map((d) => d.sortOrder)) + 1;
    const id = randomUUID();
    const item: DoctorMediaItem = {
      id,
      doctorKey: doctorKey as DoctorMediaItem["doctorKey"],
      caption,
      mediaType,
      url,
      storagePath,
      sortOrder: nextOrder,
    };
    await setSiteOwnerConfigPatch({ doctorMedia: [...cur.doctorMedia, item] });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
