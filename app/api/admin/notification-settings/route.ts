import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  getNotificationTemplates,
  parseNotificationTemplatesPatch,
  saveNotificationTemplates,
} from "@/lib/notification-settings-db";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/lib/notification-templates";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

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
    canEditRescheduleEmail: staff.role === "superadmin",
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
  const patch = parseNotificationTemplatesPatch(json);
  if (!patch) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const db = getFirestore();
  if (patch.rescheduleEmail !== undefined && staff.role !== "superadmin") {
    // Reschedule notices carry patient names and contact details, so only a
    // superadmin may change where they go (as with contact-message routing).
    // Re-saving the current address is harmless and allowed.
    const current = await getNotificationTemplates(db);
    if (patch.rescheduleEmail.toLowerCase() !== current.rescheduleEmail.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Only a superadmin can change where reschedule notices are sent." },
        { status: 403 },
      );
    }
    delete patch.rescheduleEmail;
  }
  await saveNotificationTemplates(db, patch, staff.uid);
  const templates = await getNotificationTemplates(db);
  return NextResponse.json({ templates });
}
