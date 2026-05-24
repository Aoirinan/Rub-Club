import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import type { LocationId, ServiceLine } from "@/lib/constants";
import { PROVIDER_BG_COLOR_IDS, PROVIDER_TEXT_COLOR_IDS } from "@/lib/provider-colors";
import { parseProviderDoc } from "@/lib/providers-db";
import {
  deleteProviderStorageObject,
  uploadProviderPhoto,
} from "@/lib/provider-photo-upload";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  locationIds: z.array(z.enum(["paris", "sulphur_springs"])).min(1).optional(),
  serviceLines: z.array(z.enum(["massage", "chiropractic", "stretch"])).min(1).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
  acceptsNewClients: z.boolean().optional(),
  photoUrl: z.string().max(800).nullable().optional(),
  about: z.string().max(4000).nullable().optional(),
  schedule: z
    .object({
      openHour: z.number(),
      openMinute: z.number(),
      closeHour: z.number(),
      closeMinute: z.number(),
    })
    .nullable()
    .optional(),
  textColor: z.enum(PROVIDER_TEXT_COLOR_IDS).nullable().optional(),
  bgColor: z.enum(PROVIDER_BG_COLOR_IDS).nullable().optional(),
  hours: z.record(z.string(), z.unknown()).optional(),
  weeklyHours: z.record(z.string(), z.unknown()).optional(),
  blockOutTimes: z.array(z.record(z.string(), z.unknown())).optional(),
  notificationWindows: z.record(z.string(), z.unknown()).optional(),
  calendarVisibility: z.enum(["all", "paris", "sulphur_springs"]).optional(),
});

const httpsUrl = z.string().url().refine((u) => u.startsWith("https:"), "Must be an https URL");

type Params = { params: Promise<{ id: string }> };

function parseJsonArray<T>(raw: string, label: string): T[] | null {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as T[]) : null;
  } catch {
    return null;
  }
}

function parseSchedule(raw: string | null): z.infer<typeof patchSchema>["schedule"] | undefined {
  if (raw === null || raw === undefined || raw === "") return null;
  try {
    const v = JSON.parse(raw) as unknown;
    const parsed = patchSchema.shape.schedule.safeParse(v);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

async function removeManagedPhotoIfAny(existing: DocumentData | undefined): Promise<void> {
  const oldPath = existing?.photoStoragePath;
  if (typeof oldPath === "string" && oldPath.trim()) {
    await deleteProviderStorageObject(oldPath.trim()).catch(() => {});
  }
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
  const ref = db.collection("providers").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const existing = snap.data();

  const ct = req.headers.get("content-type") ?? "";
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  };

  if (ct.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const displayName = String(form.get("displayName") ?? "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Display name required" }, { status: 400 });
    }
    updates.displayName = displayName;

    const locationIdsRaw = String(form.get("locationIds") ?? "");
    const locationIds = parseJsonArray<LocationId>(locationIdsRaw, "locationIds");
    if (!locationIds?.length || !locationIds.every((x) => x === "paris" || x === "sulphur_springs")) {
      return NextResponse.json({ error: "Invalid locations" }, { status: 400 });
    }
    updates.locationIds = locationIds;

    const serviceLinesRaw = String(form.get("serviceLines") ?? "");
    const serviceLines = parseJsonArray<ServiceLine>(serviceLinesRaw, "serviceLines");
    if (
      !serviceLines?.length ||
      !serviceLines.every((x) => x === "massage" || x === "chiropractic" || x === "stretch")
    ) {
      return NextResponse.json({ error: "Invalid services" }, { status: 400 });
    }
    updates.serviceLines = serviceLines;

    const sortRaw = form.get("sortOrder");
    if (sortRaw !== null && String(sortRaw).length > 0) {
      const sortOrder = Number(sortRaw);
      if (Number.isFinite(sortOrder)) updates.sortOrder = sortOrder;
    }

    if (form.has("active")) {
      updates.active = String(form.get("active")) === "true";
    }
    if (form.has("acceptsNewClients")) {
      updates.acceptsNewClients = String(form.get("acceptsNewClients")) === "true";
    }

    if (form.has("about")) {
      const about = String(form.get("about") ?? "").trim();
      updates.about = about || null;
    }

    if (form.has("schedule")) {
      const schedule = parseSchedule(String(form.get("schedule") ?? ""));
      if (schedule === undefined && String(form.get("schedule") ?? "").length > 0) {
        return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
      }
      updates.schedule = schedule;
    }

    if (form.has("hours")) {
      try {
        const hours = JSON.parse(String(form.get("hours") ?? "")) as unknown;
        if (hours && typeof hours === "object") updates.hours = hours;
      } catch {
        return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
      }
    }
    if (form.has("blockOutTimes")) {
      const blockOutTimes = parseJsonArray<Record<string, unknown>>(
        String(form.get("blockOutTimes") ?? ""),
        "blockOutTimes",
      );
      if (blockOutTimes) updates.blockOutTimes = blockOutTimes;
    }
    if (form.has("notificationWindows")) {
      try {
        const nw = JSON.parse(String(form.get("notificationWindows") ?? "")) as unknown;
        if (nw && typeof nw === "object") updates.notificationWindows = nw;
      } catch {
        return NextResponse.json({ error: "Invalid notification windows" }, { status: 400 });
      }
    }
    if (form.has("calendarVisibility")) {
      const cv = String(form.get("calendarVisibility") ?? "").trim();
      if (cv === "all" || cv === "paris" || cv === "sulphur_springs") {
        updates.calendarVisibility = cv;
      }
    }
    if (form.has("textColor")) {
      const tc = String(form.get("textColor") ?? "").trim();
      const parsed = patchSchema.shape.textColor.safeParse(tc || null);
      if (parsed.success) updates.textColor = parsed.data;
    }
    if (form.has("bgColor")) {
      const bc = String(form.get("bgColor") ?? "").trim();
      const parsed = patchSchema.shape.bgColor.safeParse(bc || null);
      if (parsed.success) updates.bgColor = parsed.data;
    }

    const file = form.get("photo");
    if (file instanceof File && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      try {
        const up = await uploadProviderPhoto({
          providerId: id,
          buffer: buf,
          contentType: file.type,
        });
        await removeManagedPhotoIfAny(existing);
        updates.photoUrl = up.photoUrl;
        updates.photoStoragePath = up.photoStoragePath;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else if (form.has("photoUrl")) {
      const urlRaw = String(form.get("photoUrl") ?? "").trim();
      if (!urlRaw) {
        await removeManagedPhotoIfAny(existing);
        updates.photoUrl = null;
        updates.photoStoragePath = FieldValue.delete();
      } else {
        const parsed = httpsUrl.safeParse(urlRaw);
        if (!parsed.success) {
          return NextResponse.json({ error: "Photo must be an https URL" }, { status: 400 });
        }
        await removeManagedPhotoIfAny(existing);
        updates.photoUrl = parsed.data;
        updates.photoStoragePath = FieldValue.delete();
      }
    }
  } else {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const body = parsed.data;
    if (body.displayName !== undefined) updates.displayName = body.displayName.trim();
    if (body.locationIds !== undefined) updates.locationIds = body.locationIds as LocationId[];
    if (body.serviceLines !== undefined) updates.serviceLines = body.serviceLines as ServiceLine[];
    if (body.active !== undefined) updates.active = body.active;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
    if (body.schedule !== undefined) updates.schedule = body.schedule;
    if (body.acceptsNewClients !== undefined) updates.acceptsNewClients = body.acceptsNewClients;
    if (body.about !== undefined) {
      updates.about = body.about === null ? null : body.about.trim() || null;
    }
    if (body.textColor !== undefined) updates.textColor = body.textColor;
    if (body.bgColor !== undefined) updates.bgColor = body.bgColor;
    if (body.hours !== undefined) updates.hours = body.hours;
    if (body.weeklyHours !== undefined) updates.hours = body.weeklyHours;
    if (body.blockOutTimes !== undefined) updates.blockOutTimes = body.blockOutTimes;
    if (body.notificationWindows !== undefined) {
      updates.notificationWindows = body.notificationWindows;
    }
    if (body.calendarVisibility !== undefined) {
      updates.calendarVisibility = body.calendarVisibility;
    }
    if (body.photoUrl !== undefined) {
      if (body.photoUrl === null || !body.photoUrl.trim()) {
        await removeManagedPhotoIfAny(existing);
        updates.photoUrl = null;
        updates.photoStoragePath = FieldValue.delete();
      } else {
        const urlParsed = httpsUrl.safeParse(body.photoUrl.trim());
        if (!urlParsed.success) {
          return NextResponse.json({ error: "Photo must be an https URL" }, { status: 400 });
        }
        const nextUrl = urlParsed.data;
        const managedPath = existing?.photoStoragePath;
        const currentUrl = typeof existing?.photoUrl === "string" ? existing.photoUrl.trim() : "";
        if (typeof managedPath === "string" && managedPath && nextUrl !== currentUrl) {
          await removeManagedPhotoIfAny(existing);
          updates.photoStoragePath = FieldValue.delete();
        }
        updates.photoUrl = nextUrl;
      }
    }
  }

  await ref.update(updates);
  const next = await ref.get();
  const data = next.data();
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = parseProviderDoc(next.id, data);
  if (!row) {
    return NextResponse.json({ error: "Invalid provider data" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, provider: row });
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
  const ref = db.collection("providers").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const permanent =
    new URL(req.url).searchParams.get("permanent") === "1" ||
    new URL(req.url).searchParams.get("permanent") === "true";

  if (permanent) {
    const path = snap.get("photoStoragePath");
    if (typeof path === "string") {
      await deleteProviderStorageObject(path).catch(() => {});
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  }

  await ref.update({
    active: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: staff.uid,
  });
  return NextResponse.json({ ok: true });
}
