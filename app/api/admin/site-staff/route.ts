import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import {
  listSiteStaffMembers,
  nextSiteStaffOrder,
  parseSiteStaffDoc,
  SITE_STAFF_CACHE_TAG,
  SITE_STAFF_COLLECTION,
  type SiteStaffBrand,
} from "@/lib/site-staff";
import { seedSiteStaffCollection } from "@/lib/site-staff-seed";
import {
  resolveSiteStaffImageContentType,
  resolveSiteStaffVideoContentType,
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

const createJsonSchema = z.object({
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  bio: z.string().max(8000).optional(),
  photoUrl: photoUrlSchema,
  brand: brandSchema,
  order: z.number().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  specialties: z.array(z.string().max(80)).max(20).optional(),
});

const seedSchema = z.object({
  seedDefaults: z.literal(true),
});

function bumpCache(): void {
  revalidateTag(SITE_STAFF_CACHE_TAG);
  revalidatePath("/locations/paris/staff");
  revalidatePath("/sulphur-springs/staff");
  revalidatePath("/sulphur-springs");
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getFirestore();
  const members = await listSiteStaffMembers(db);
  return NextResponse.json({
    members,
    siteUsesCustomList: members.length > 0,
  });
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") ?? "";
  const db = getFirestore();

  if (ct.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const name = String(form.get("name") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const bio = String(form.get("bio") ?? "").trim();
    const brandRaw = String(form.get("brand") ?? "").trim();
    const brandParsed = brandSchema.safeParse(brandRaw);
    const activeRaw = form.get("active");
    const featuredRaw = form.get("featured");
    const orderRaw = form.get("order");
    const orderParsed =
      typeof orderRaw === "string" && orderRaw.length > 0 ? Number(orderRaw) : Number(orderRaw);
    const specialtiesRaw = String(form.get("specialties") ?? "").trim();

    if (!name || !title) {
      return NextResponse.json({ error: "Name and title are required." }, { status: 400 });
    }
    if (!brandParsed.success) {
      return NextResponse.json({ error: "Brand must be paris, sulphur, or both." }, { status: 400 });
    }
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a portrait image (JPEG, PNG, or WebP)." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = resolveSiteStaffImageContentType(file.type, buf);
    if (!contentType) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }
    const brand = brandParsed.data;
    const order =
      typeof orderParsed === "number" && Number.isFinite(orderParsed)
        ? orderParsed
        : await nextSiteStaffOrder(db, brand);
    const ref = db.collection(SITE_STAFF_COLLECTION).doc();
    const id = ref.id;
    let photoUrl: string;
    let photoStoragePath: string;
    try {
      const up = await uploadSiteStaffPhoto({ memberId: id, buffer: buf, contentType });
      photoUrl = up.photoUrl;
      photoStoragePath = up.photoStoragePath;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    let videoUrl: string | undefined;
    let videoStoragePath: string | undefined;
    const videoFile = form.get("video");
    if (videoFile instanceof File && videoFile.size > 0) {
      const videoContentType = resolveSiteStaffVideoContentType(videoFile.type);
      if (!videoContentType) {
        return NextResponse.json(
          { error: "Unsupported video type. Use MP4, MOV, or WebM." },
          { status: 400 },
        );
      }
      try {
        const up = await uploadSiteStaffVideo({
          memberId: id,
          buffer: Buffer.from(await videoFile.arrayBuffer()),
          contentType: videoContentType,
        });
        videoUrl = up.videoUrl;
        videoStoragePath = up.videoStoragePath;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Video upload failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    const specialties = specialtiesRaw
      ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    await ref.set({
      name,
      title,
      bio,
      photoUrl,
      photoStoragePath,
      ...(videoUrl ? { videoUrl, videoStoragePath } : {}),
      specialties,
      brand,
      order,
      active: activeRaw === "false" ? false : true,
      featured: featuredRaw === "true",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: staff.uid,
    });
    bumpCache();
    const snap = await ref.get();
    const row = parseSiteStaffDoc(snap.id, snap.data());
    if (!row) {
      return NextResponse.json({ error: "Could not read member" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, member: row }, { status: 201 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const seeded = seedSchema.safeParse(json);
  if (seeded.success) {
    try {
      const { count } = await seedSiteStaffCollection(db, staff.uid);
      bumpCache();
      const members = await listSiteStaffMembers(db);
      return NextResponse.json({ ok: true, count, members, siteUsesCustomList: true });
    } catch (e) {
      if (e instanceof Error && e.message === "SITE_STAFF_ALREADY_SEEDED") {
        return NextResponse.json(
          { error: "Staff list already exists. Remove existing people first if you want to import again." },
          { status: 409 },
        );
      }
      throw e;
    }
  }

  const parsed = createJsonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const body = parsed.data;
  const brand = body.brand as SiteStaffBrand;
  const order =
    typeof body.order === "number" && Number.isFinite(body.order)
      ? body.order
      : await nextSiteStaffOrder(db, brand);
  const ref = db.collection(SITE_STAFF_COLLECTION).doc();
  await ref.set({
    name: body.name.trim(),
    title: body.title.trim(),
    bio: body.bio?.trim() ?? "",
    photoUrl: body.photoUrl.trim(),
    specialties: body.specialties ?? [],
    brand,
    order,
    active: body.active !== false,
    featured: body.featured === true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  bumpCache();
  const snap = await ref.get();
  const row = parseSiteStaffDoc(snap.id, snap.data());
  if (!row) {
    return NextResponse.json({ error: "Could not read member" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, member: row }, { status: 201 });
}
