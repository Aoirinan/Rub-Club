import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { IMAGES } from "@/lib/home-images";
import { TEAM } from "@/lib/home-verbatim";
import {
  listMassageTeamMembers,
  MASSAGE_TEAM_CACHE_TAG,
  MASSAGE_TEAM_COLLECTION,
  parseMassageTeamDoc,
} from "@/lib/massage-team";
import {
  deleteMassageTeamStorageObject,
  resolveMassageTeamImageContentType,
  uploadMassageTeamPhoto,
} from "@/lib/massage-team-upload";
import { requireStaff } from "@/lib/staff-auth";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

const httpsUrl = z.string().url().refine((u) => u.startsWith("https:"), "Must be an https URL");

const createJsonSchema = z.object({
  name: z.string().min(1).max(120),
  bio: z.string().min(1).max(8000),
  role: z.string().max(120).optional(),
  photoUrl: httpsUrl,
  sortOrder: z.number().optional(),
});

const seedSchema = z.object({
  seedDefaults: z.literal(true),
});

async function nextSortOrder(db: Firestore): Promise<number> {
  const snap = await db.collection(MASSAGE_TEAM_COLLECTION).orderBy("sortOrder", "desc").limit(1).get();
  if (snap.empty) return 0;
  const v = snap.docs[0].get("sortOrder");
  return (typeof v === "number" && Number.isFinite(v) ? v : 0) + 10;
}

function bumpCache(): void {
  revalidateTag(MASSAGE_TEAM_CACHE_TAG);
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getFirestore();
  const members = await listMassageTeamMembers(db);
  return NextResponse.json({
    members,
    siteUsesCustomList: members.length > 0,
  });
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
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
    const bio = String(form.get("bio") ?? "").trim();
    const roleRaw = String(form.get("role") ?? "").trim();
    const sortRaw = form.get("sortOrder");
    const sortParsed =
      typeof sortRaw === "string" && sortRaw.length > 0 ? Number(sortRaw) : Number(sortRaw);
    const sortOrder =
      typeof sortParsed === "number" && Number.isFinite(sortParsed) ? sortParsed : await nextSortOrder(db);

    const file = form.get("photo");
    if (!name || !bio) {
      return NextResponse.json({ error: "Name and bio are required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a portrait image (JPEG, PNG, or WebP)." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = resolveMassageTeamImageContentType(file.type, buf);
    if (!contentType) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, or WebP (if the file is JPEG, try re-saving or renaming to .jpg)." },
        { status: 400 },
      );
    }
    const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc();
    const id = ref.id;
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
    await ref.set({
      name,
      bio,
      ...(roleRaw ? { role: roleRaw } : {}),
      photoUrl,
      photoStoragePath,
      sortOrder,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid: staff.uid,
    });
    bumpCache();
    const snap = await ref.get();
    const row = parseMassageTeamDoc(snap.id, snap.data());
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
    const existing = await db.collection(MASSAGE_TEAM_COLLECTION).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "Firestore already has massage team rows. Delete them first if you want to re-seed." },
        { status: 409 },
      );
    }
    let i = 0;
    for (const member of TEAM) {
      const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc();
      await ref.set({
        name: member.name,
        bio: member.bio,
        ...("role" in member && member.role ? { role: member.role } : {}),
        photoUrl: IMAGES[member.imageKey],
        sortOrder: i * 10,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: staff.uid,
      });
      i += 1;
    }
    bumpCache();
    const members = await listMassageTeamMembers(db);
    return NextResponse.json({ ok: true, members, siteUsesCustomList: true });
  }

  const parsed = createJsonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const body = parsed.data;
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : await nextSortOrder(db);
  const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc();
  await ref.set({
    name: body.name.trim(),
    bio: body.bio.trim(),
    ...(body.role?.trim() ? { role: body.role.trim() } : {}),
    photoUrl: body.photoUrl.trim(),
    sortOrder,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  bumpCache();
  const snap = await ref.get();
  const row = parseMassageTeamDoc(snap.id, snap.data());
  if (!row) {
    return NextResponse.json({ error: "Could not read member" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, member: row }, { status: 201 });
}

export async function DELETE(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = new URL(req.url).searchParams.get("all");
  if (all !== "1" && all !== "true") {
    return NextResponse.json({ error: "Missing all=1" }, { status: 400 });
  }
  const db = getFirestore();
  const snap = await db.collection(MASSAGE_TEAM_COLLECTION).get();
  for (const doc of snap.docs) {
    const path = doc.get("photoStoragePath");
    if (typeof path === "string") {
      await deleteMassageTeamStorageObject(path).catch(() => {});
    }
    await doc.ref.delete();
  }
  bumpCache();
  return NextResponse.json({ ok: true, deleted: snap.size });
}
