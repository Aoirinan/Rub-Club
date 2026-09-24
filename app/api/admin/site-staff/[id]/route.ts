import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import {
  parseSiteStaffDoc,
  SITE_STAFF_CACHE_TAG,
  SITE_STAFF_COLLECTION,
} from "@/lib/site-staff";
import {
  deleteSiteStaffStorageObject,
  resolveSiteStaffImageContentType,
  resolveSiteStaffVideoContentType,
  SITE_STAFF_PHOTO_MAX_BYTES,
  SITE_STAFF_VIDEO_MAX_BYTES,
  uploadSiteStaffPhoto,
  uploadSiteStaffVideo,
} from "@/lib/site-staff-upload";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const brandSchema = z.enum(["paris", "sulphur", "both"]);

const photoUrlSchema = z
  .string()
  .min(1)
  .max(2000)
  .refine(
    (u) => u.startsWith("https:") || u.startsWith("/"),
    "Photo must be an https URL or site path starting with /",
  );

const patchJsonSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  title: z.string().min(1).max(120).optional(),
  bio: z.string().max(8000).optional(),
  photoUrl: photoUrlSchema.optional(),
  brand: brandSchema.optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  specialties: z.array(z.string().max(80)).max(20).optional(),
  removeVideo: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

/** Best-effort removal of managed Storage objects (non-strings are skipped). */
async function deleteStorageObjects(paths: unknown[]): Promise<void> {
  for (const path of paths) {
    if (typeof path === "string") {
      await deleteSiteStaffStorageObject(path).catch(() => {});
    }
  }
}

function bumpCache(): void {
  revalidateTag(SITE_STAFF_CACHE_TAG);
  revalidatePath("/locations/paris/staff");
  revalidatePath("/sulphur-springs/staff");
  revalidatePath("/sulphur-springs");
  revalidatePath("/sulphur-springs/massage");
}

export async function PATCH(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getFirestore();
  const ref = db.collection(SITE_STAFF_COLLECTION).doc(id);
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
    const title = form.has("title") ? String(form.get("title") ?? "").trim() : undefined;
    const bio = form.has("bio") ? String(form.get("bio") ?? "").trim() : undefined;
    const brandRaw = form.has("brand") ? String(form.get("brand") ?? "").trim() : undefined;
    const orderRaw = form.get("order");
    const order =
      orderRaw !== null && String(orderRaw).length > 0 ? Number(orderRaw) : undefined;
    const specialtiesRaw = form.has("specialties")
      ? String(form.get("specialties") ?? "").trim()
      : undefined;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: staff.uid,
    };
    if (name !== undefined) {
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      updates.name = name;
    }
    if (title !== undefined) {
      if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
      updates.title = title;
    }
    if (bio !== undefined) updates.bio = bio;
    if (brandRaw !== undefined) {
      const brandParsed = brandSchema.safeParse(brandRaw);
      if (!brandParsed.success) {
        return NextResponse.json({ error: "Invalid brand" }, { status: 400 });
      }
      updates.brand = brandParsed.data;
    }
    if (form.has("active")) {
      updates.active = String(form.get("active") ?? "") !== "false";
    }
    if (form.has("featured")) {
      updates.featured = String(form.get("featured") ?? "") === "true";
    }
    if (typeof order === "number" && Number.isFinite(order)) {
      updates.order = order;
    }
    if (specialtiesRaw !== undefined) {
      updates.specialties = specialtiesRaw
        ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // Validate every file before touching Storage: a bad video must not leave
    // the photo half-replaced.
    const photoFile = form.get("photo");
    let photo: { buffer: Buffer; contentType: string } | null = null;
    if (photoFile instanceof File && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const contentType = resolveSiteStaffImageContentType(photoFile.type, buffer);
      if (!contentType) {
        return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
      }
      if (buffer.length > SITE_STAFF_PHOTO_MAX_BYTES) {
        return NextResponse.json({ error: "Image is too large (max 5 MB)." }, { status: 400 });
      }
      photo = { buffer, contentType };
    }

    const videoFile = form.get("video");
    let video: { buffer: Buffer; contentType: string } | null = null;
    if (videoFile instanceof File && videoFile.size > 0) {
      if (videoFile.size > SITE_STAFF_VIDEO_MAX_BYTES) {
        return NextResponse.json({ error: "Video is too large (max 80 MB)." }, { status: 400 });
      }
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      const contentType = resolveSiteStaffVideoContentType(videoFile.type, buffer);
      if (!contentType) {
        return NextResponse.json(
          { error: "Unsupported video type. Use MP4, MOV, or WebM." },
          { status: 400 },
        );
      }
      video = { buffer, contentType };
    }

    const removeVideo = !video && String(form.get("removeVideo") ?? "") === "true";
    if (removeVideo) {
      updates.videoUrl = FieldValue.delete();
      updates.videoStoragePath = FieldValue.delete();
    }

    if (Object.keys(updates).length <= 2 && !photo && !video) {
      return NextResponse.json({ error: "No changes submitted" }, { status: 400 });
    }

    const oldPhotoPath = existing.get("photoStoragePath");
    const oldVideoPath = existing.get("videoStoragePath");
    // New objects written by this request. Same extension ⇒ same deterministic
    // key as the old object, which the record still uses: never delete those.
    const written: string[] = [];
    const discardWritten = () =>
      deleteStorageObjects(written.filter((p) => p !== oldPhotoPath && p !== oldVideoPath));

    try {
      if (photo) {
        const up = await uploadSiteStaffPhoto({ memberId: id, ...photo });
        written.push(up.photoStoragePath);
        updates.photoUrl = up.photoUrl;
        updates.photoStoragePath = up.photoStoragePath;
      }
      if (video) {
        const up = await uploadSiteStaffVideo({ memberId: id, ...video });
        written.push(up.videoStoragePath);
        updates.videoUrl = up.videoUrl;
        updates.videoStoragePath = up.videoStoragePath;
      }
    } catch (e) {
      await discardWritten();
      const msg = e instanceof Error ? e.message : "Upload failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    try {
      await ref.update(updates);
    } catch (e) {
      await discardWritten();
      throw e;
    }

    // The record now points at the new files: remove the ones it replaced.
    await deleteStorageObjects([
      photo && oldPhotoPath !== updates.photoStoragePath ? oldPhotoPath : null,
      (video || removeVideo) && oldVideoPath !== updates.videoStoragePath ? oldVideoPath : null,
    ]);
    bumpCache();
    const next = await ref.get();
    const row = parseSiteStaffDoc(next.id, next.data());
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
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.brand !== undefined) updates.brand = body.brand;
  if (body.order !== undefined) updates.order = body.order;
  if (body.active !== undefined) updates.active = body.active;
  if (body.featured !== undefined) updates.featured = body.featured;
  if (body.specialties !== undefined) updates.specialties = body.specialties;
  if (body.photoUrl !== undefined) {
    updates.photoUrl = body.photoUrl.trim();
    updates.photoStoragePath = FieldValue.delete();
  }
  if (body.removeVideo === true) {
    updates.videoUrl = FieldValue.delete();
    updates.videoStoragePath = FieldValue.delete();
  }

  if (Object.keys(updates).length <= 2) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await ref.update(updates);
  // Only once the record no longer points at them.
  await deleteStorageObjects([
    body.photoUrl !== undefined ? existing.get("photoStoragePath") : null,
    body.removeVideo === true ? existing.get("videoStoragePath") : null,
  ]);
  bumpCache();
  const next = await ref.get();
  const row = parseSiteStaffDoc(next.id, next.data());
  if (!row) {
    return NextResponse.json({ error: "Invalid data" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, member: row });
}

export async function DELETE(req: Request, ctx: Params) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const db = getFirestore();
  const ref = db.collection(SITE_STAFF_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const path = snap.get("photoStoragePath");
  if (typeof path === "string") {
    await deleteSiteStaffStorageObject(path).catch(() => {});
  }
  const videoPath = snap.get("videoStoragePath");
  if (typeof videoPath === "string") {
    await deleteSiteStaffStorageObject(videoPath).catch(() => {});
  }
  await ref.delete();
  bumpCache();
  return NextResponse.json({ ok: true });
}
