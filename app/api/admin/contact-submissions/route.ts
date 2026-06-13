import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countNewContactSubmissions,
  listContactSubmissions,
  type ContactLocationScope,
  type ContactSubmissionStatus,
} from "@/lib/contact-submissions";
import { requireStaff } from "@/lib/staff-auth";
import {
  getSendgridApiKey,
  getSendgridFromEmailNormalized,
  isValidOutboundFromEmail,
} from "@/lib/sendgrid";

export const runtime = "nodejs";

const querySchema = z.object({
  status: z.enum(["new", "read", "archived", "all"]).optional(),
  location: z.enum(["paris", "sulphur_springs", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "front_desk");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    location: url.searchParams.get("location") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  // Single-location staff are locked to their office; both/superadmin can choose.
  const requested = (parsed.data.location ?? "all") as ContactLocationScope;
  const scope: ContactLocationScope =
    staff.locationScope === "both" ? requested : staff.locationScope;

  const status = (parsed.data.status ?? "all") as ContactSubmissionStatus | "all";
  const submissions = await listContactSubmissions({
    status,
    location: scope,
    limit: parsed.data.limit,
  });
  const newCount = await countNewContactSubmissions(scope);

  const officeConfigured = Boolean(process.env.OFFICE_NOTIFICATION_EMAIL?.trim());
  const sendgridConfigured =
    Boolean(getSendgridApiKey()) && isValidOutboundFromEmail(getSendgridFromEmailNormalized());

  return NextResponse.json({
    submissions,
    newCount,
    scope: staff.locationScope,
    delivery: {
      sendgridConfigured,
      officeNotificationConfigured: officeConfigured,
    },
  });
}
