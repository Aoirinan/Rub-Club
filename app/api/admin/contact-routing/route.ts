import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getContactRoutingEmails,
  saveContactRoutingEmails,
} from "@/lib/contact-routing";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  parisEmail: z.union([z.string().email().max(200), z.literal("")]).optional(),
  sulphurEmail: z.union([z.string().email().max(200), z.literal("")]).optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const emails = await getContactRoutingEmails();
  return NextResponse.json({
    emails,
    fallbackEmail: process.env.OFFICE_NOTIFICATION_EMAIL?.trim() || null,
  });
}

export async function PATCH(req: Request) {
  // Only superadmins may change where contact notifications are routed.
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
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
    return NextResponse.json({ error: "Enter valid email addresses." }, { status: 400 });
  }
  await saveContactRoutingEmails(parsed.data, staff.uid);
  const emails = await getContactRoutingEmails();
  return NextResponse.json({ emails });
}
