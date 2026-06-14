import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/staff-auth";
import {
  listFormConfigs,
  getGlobalConfig,
  setGlobalEnabled,
  updateFormConfig,
  updateLegalText,
  listLegalText,
  countSubmissionsByForm,
} from "@/lib/intakeForms/config-db";
import { INTAKE_FORM_SLUGS } from "@/lib/intakeForms/seed-config";
import {
  getSendgridApiKey,
  getSendgridFromEmailNormalized,
  isValidOutboundFromEmail,
} from "@/lib/sendgrid";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [global, forms, counts, legalText] = await Promise.all([
    getGlobalConfig(),
    listFormConfigs(),
    countSubmissionsByForm(),
    listLegalText(),
  ]);

  const sendgridConfigured =
    Boolean(getSendgridApiKey()) && isValidOutboundFromEmail(getSendgridFromEmailNormalized());

  return NextResponse.json({
    global,
    forms,
    counts,
    legalText,
    delivery: { sendgridConfigured },
  });
}

const patchSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("global"), enabled: z.boolean() }),
  z.object({
    type: z.literal("form"),
    slug: z.string().min(1),
    patch: z.object({
      enabled: z.boolean().optional(),
      introText: z.string().max(2000).optional(),
      consentCheckboxLabel: z.string().max(2000).optional(),
      termsHtml: z.string().max(50000).optional(),
      successMessage: z.string().max(2000).optional(),
      disabledMessage: z.string().max(2000).optional(),
      notifyEmails: z.array(z.string().email().max(200)).max(20).optional(),
    }),
  }),
  z.object({
    type: z.literal("legal"),
    cmsKey: z.string().min(1),
    body: z.string().max(60000),
  }),
]);

export async function PATCH(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;
  const editor = staff.email ?? staff.uid;

  if (data.type === "global") {
    await setGlobalEnabled(data.enabled, editor);
    return NextResponse.json({ ok: true });
  }

  if (data.type === "form") {
    if (!INTAKE_FORM_SLUGS.includes(data.slug)) {
      return NextResponse.json({ error: "Unknown form" }, { status: 400 });
    }
    const ok = await updateFormConfig(data.slug, data.patch, editor);
    if (!ok) return NextResponse.json({ error: "Unknown form" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // legal
  const ok = await updateLegalText(data.cmsKey, data.body, editor);
  if (!ok) return NextResponse.json({ error: "Unknown legal block" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
