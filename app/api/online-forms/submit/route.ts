import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRateLimitOk, getClientIp } from "@/lib/rate-limit";
import { getFormDefinition } from "@/lib/intakeForms/definitions";
import {
  getFormConfig,
  getGlobalConfig,
  createSubmission,
} from "@/lib/intakeForms/config-db";
import {
  validateForm,
  pruneHiddenValues,
  type IntakeFormState,
} from "@/lib/intakeForms/validate";
import { notifyNewSubmission } from "@/lib/intakeForms/notify";
import type {
  IntakeSignatureValue,
  IntakeDiagramValue,
} from "@/lib/intakeForms/types";

export const runtime = "nodejs";

const DATA_URL_PREFIX = "data:image/png";

const signatureSchema = z.object({
  signatureImage: z.string().max(3_000_000).optional(),
  printedName: z.string().max(300).optional(),
  email: z.string().max(300).optional(),
  dateSigned: z.string().max(120).optional(),
  typedName: z.string().max(300).optional(),
});

const diagramSchema = z.object({
  frontImage: z.string().max(5_000_000).optional(),
  backImage: z.string().max(5_000_000).optional(),
});

const bodySchema = z.object({
  formSlug: z.string().min(1).max(120),
  answers: z.record(z.string(), z.unknown()).default({}),
  signatures: z.record(z.string(), signatureSchema).default({}),
  diagrams: z.record(z.string(), diagramSchema).default({}),
  consentAccepted: z.boolean(),
});

/** Only keep genuine PNG data URLs; drop anything else so we never store junk. */
function cleanImage(value: string | undefined): string {
  return value && value.startsWith(DATA_URL_PREFIX) ? value : "";
}

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = parsed.data;

  const definition = getFormDefinition(body.formSlug);
  if (!definition) {
    return NextResponse.json({ error: "Unknown form." }, { status: 400 });
  }

  // Server-side enabled gate — never trust the client.
  const [config, globalConfig] = await Promise.all([
    getFormConfig(body.formSlug),
    getGlobalConfig(),
  ]);
  if (!config || !globalConfig.enabled || !config.enabled) {
    return NextResponse.json(
      { error: config?.disabledMessage || "This form is not currently accepting submissions." },
      { status: 403 },
    );
  }

  if (body.consentAccepted !== true) {
    return NextResponse.json(
      { error: "Please accept the consent agreement before submitting." },
      { status: 400 },
    );
  }

  // Sanitize images.
  const signatures: Record<string, IntakeSignatureValue> = {};
  for (const [key, sig] of Object.entries(body.signatures)) {
    signatures[key] = {
      signatureImage: cleanImage(sig.signatureImage),
      printedName: sig.printedName?.trim() || undefined,
      email: sig.email?.trim() || undefined,
      dateSigned: sig.dateSigned?.trim() || undefined,
      typedName: sig.typedName?.trim() || undefined,
    };
  }
  const diagrams: Record<string, IntakeDiagramValue> = {};
  for (const [key, diag] of Object.entries(body.diagrams)) {
    diagrams[key] = {
      frontImage: cleanImage(diag.frontImage),
      backImage: cleanImage(diag.backImage),
    };
  }

  // Re-prune hidden fields and re-validate authoritatively.
  const state: IntakeFormState = {
    answers: body.answers,
    signatures,
    diagrams,
    consentAccepted: true,
  };
  const pruned = pruneHiddenValues(definition, state);
  const result = validateForm(definition, pruned);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Some required fields are missing or invalid. Please review the form." },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? "";
  const ipAddress = getClientIp(req.headers);

  let submissionId: string;
  try {
    submissionId = await createSubmission({
      formSlug: definition.slug,
      formTitle: config.title,
      answers: pruned.answers,
      signatures: pruned.signatures,
      diagrams: pruned.diagrams,
      consentAccepted: true,
      consentLabelAtSubmit: config.consentCheckboxLabel,
      meta: { ipAddress, userAgent },
    });
  } catch (err) {
    // Never log field values — only the error.
    console.error("[online-forms] submission save failed", err);
    return NextResponse.json(
      { error: "We could not save your form right now. Please call our office." },
      { status: 503 },
    );
  }

  // Optional, PHI-free office notification.
  await notifyNewSubmission({
    formTitle: config.title,
    submissionId,
    notifyEmails: config.notifyEmails,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
