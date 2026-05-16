import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { finalizeOwnerDoctorMediaAfterDirectUpload } from "@/lib/owner-marketing-upload";
import { assertCanAddDoctorVideo } from "@/lib/owner-upload-quota";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type DoctorMediaItem } from "@/lib/site-owner-config";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

const DOCTOR_KEYS = new Set(["greg", "sean", "brandy"]);

export async function POST(req: Request) {
  if (!(await isSuperadminRequest(req.headers.get("cookie")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const storagePath = typeof o.storagePath === "string" ? o.storagePath.trim() : "";
  const doctorKey = String(o.doctorKey ?? "").trim().toLowerCase();
  const caption = typeof o.caption === "string" ? o.caption.trim() : "";
  const mediaType = String(o.mediaType ?? "").trim() as "photo" | "video";
  if (!storagePath) {
    return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
  }
  if (!DOCTOR_KEYS.has(doctorKey)) {
    return NextResponse.json({ error: "Invalid doctorKey" }, { status: 400 });
  }
  if (mediaType !== "photo" && mediaType !== "video") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }

  const cur = await getSiteOwnerConfig();
  if (cur.doctorMedia.some((d) => d.storagePath === storagePath)) {
    return NextResponse.json({ error: "This file is already registered." }, { status: 400 });
  }

  try {
    if (mediaType === "video") {
      assertCanAddDoctorVideo(cur, doctorKey as DoctorMediaItem["doctorKey"]);
    }
    const { url } = await finalizeOwnerDoctorMediaAfterDirectUpload(storagePath, mediaType);
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
