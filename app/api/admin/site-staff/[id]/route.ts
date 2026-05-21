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
  uploadSiteStaffPhoto,
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
});

type Params = { params: Promise<{ id: string }> };

function bumpCache(): void {
  revalidateTag(SITE_STAFF_CACHE_TAG);
  revalidatePath("/locations/paris/staff");
  revalidatePath("/sulphur-springs/staff");
  revalidatePath("/sulphur-springs");
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

    const file = form.get("photo");
    if (file instanceof File && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const contentType = resolveSiteStaffImageContentType(file.type, buf);
      if (!contentType) {
        return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
      }
      const oldPath = existing.get("photoStoragePath");
      try {
        const up = await uploadSiteStaffPhoto({ memberId: id, buffer: buf, contentType });
        updates.photoUrl = up.photoUrl;
        updates.photoStoragePath = up.photoStoragePath;
        if (typeof oldPath === "string") {
          await deleteSiteStaffStorageObject(oldPath).catch(() => {});
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    if (Object.keys(updates).length <= 2) {
      return NextResponse.json({ error: "No changes submitted" }, { status: 400 });
    }

    await ref.update(updates);
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

  if (Object.keys(updates).length <= 2) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await ref.update(updates);
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
  await ref.delete();
  bumpCache();
  return NextResponse.json({ ok: true });
}
