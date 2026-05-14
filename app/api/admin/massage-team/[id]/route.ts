import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import {
  MASSAGE_TEAM_CACHE_TAG,
  MASSAGE_TEAM_COLLECTION,
  parseMassageTeamDoc,
} from "@/lib/massage-team";
import {
  deleteMassageTeamStorageObject,
  MASSAGE_TEAM_ALLOWED_MIME,
  uploadMassageTeamPhoto,
} from "@/lib/massage-team-upload";
import { requireStaff } from "@/lib/staff-auth";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

const httpsUrl = z.string().url().refine((u) => u.startsWith("https:"), "Must be an https URL");

const patchJsonSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().min(1).max(8000).optional(),
  role: z.string().max(120).nullable().optional(),
  photoUrl: httpsUrl.optional(),
  sortOrder: z.number().optional(),
});

type Params = { params: Promise<{ id: string }> };

function bumpCache(): void {
  revalidateTag(MASSAGE_TEAM_CACHE_TAG);
}

export async function PATCH(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getFirestore();
  const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const name = form.has("name") ? String(form.get("name") ?? "").trim() : undefined;
    const bio = form.has("bio") ? String(form.get("bio") ?? "").trim() : undefined;
    const sortRaw = form.get("sortOrder");
    const sortOrder =
      sortRaw !== null && String(sortRaw).length > 0
        ? Number(sortRaw)
        : undefined;

    const file = form.get("photo");
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: staff.uid,
    };
    if (name !== undefined) {
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      updates.name = name;
    }
    if (bio !== undefined) {
      if (!bio) return NextResponse.json({ error: "Bio required" }, { status: 400 });
      updates.bio = bio;
    }
    if (form.has("role")) {
      const r = String(form.get("role") ?? "").trim();
      updates.role = r ? r : FieldValue.delete();
    }
    if (typeof sortOrder === "number" && Number.isFinite(sortOrder)) {
      updates.sortOrder = sortOrder;
    }

    if (file instanceof File && file.size > 0) {
      const contentType = file.type;
      if (!MASSAGE_TEAM_ALLOWED_MIME[contentType]) {
        return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const oldPath = existing.get("photoStoragePath");
      let photoUrl: string;
      let photoStoragePath: string;
      try {
        const up = await uploadMassageTeamPhoto({ memberId: id, buffer: buf, contentType });
        photoUrl = up.photoUrl;
        photoStoragePath = up.photoStoragePath;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      updates.photoUrl = photoUrl;
      updates.photoStoragePath = photoStoragePath;
      if (typeof oldPath === "string") {
        await deleteMassageTeamStorageObject(oldPath).catch(() => {});
      }
    }

    if (Object.keys(updates).length <= 2) {
      return NextResponse.json({ error: "No changes submitted" }, { status: 400 });
    }

    await ref.update(updates);
    bumpCache();
    const next = await ref.get();
    const row = parseMassageTeamDoc(next.id, next.data());
    if (!row) {
      return NextResponse.json({ error: "Invalid data" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, member: row });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchJsonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const body = parsed.data;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.bio !== undefined) updates.bio = body.bio.trim();
  if (body.role !== undefined) {
    if (body.role === null || body.role === "") {
      updates.role = FieldValue.delete();
    } else {
      updates.role = body.role.trim();
    }
  }
  if (body.photoUrl !== undefined) {
    updates.photoUrl = body.photoUrl.trim();
    updates.photoStoragePath = FieldValue.delete();
  }
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  if (Object.keys(updates).length <= 2) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await ref.update(updates);
  bumpCache();
  const next = await ref.get();
  const row = parseMassageTeamDoc(next.id, next.data());
  if (!row) {
    return NextResponse.json({ error: "Invalid data" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, member: row });
}

export async function DELETE(_req: Request, ctx: Params) {
  const staff = await requireStaff(_req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const db = getFirestore();
  const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const path = snap.get("photoStoragePath");
  if (typeof path === "string") {
    await deleteMassageTeamStorageObject(path).catch(() => {});
  }
  await ref.delete();
  bumpCache();
  return NextResponse.json({ ok: true });
}
