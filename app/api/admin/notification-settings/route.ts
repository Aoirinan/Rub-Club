import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import {
  getNotificationTemplates,
  saveNotificationTemplates,
} from "@/lib/notification-settings-db";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/lib/notification-templates";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  rescheduleEmail: z.string().email().max(200).optional(),
  sms: z.record(z.string(), z.unknown()).optional(),
  email: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getFirestore();
  const templates = await getNotificationTemplates(db);
  return NextResponse.json({
    templates,
    defaults: DEFAULT_NOTIFICATION_TEMPLATES,
    envRescheduleEmail: process.env.RESCHEDULE_EMAIL?.trim() || null,
  });
}

export async function PATCH(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const db = getFirestore();
  await saveNotificationTemplates(db, parsed.data as Partial<import("@/lib/notification-templates").NotificationTemplatesConfig>, staff.uid);
  const templates = await getNotificationTemplates(db);
  return NextResponse.json({ templates });
}
