/**
 * Server-only data access for the online patient forms.
 *
 * Everything here uses the Firebase Admin SDK and is only ever called from
 * Next.js API routes / server components — the public Firestore rules deny all
 * client access, so enabled-gating and PHI reads are enforced here, not in
 * security rules.
 */

import {
  FieldValue,
  type DocumentData,
  type Timestamp,
} from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import type {
  IntakeFormConfig,
  IntakeGlobalConfig,
  IntakeLegalText,
  IntakeSubmissionInput,
  IntakeSubmissionRecord,
  IntakeSubmissionStatus,
  IntakeSignatureValue,
  IntakeDiagramValue,
} from "@/lib/intakeForms/types";
import {
  INTAKE_FORMS_CONFIG_COLLECTION,
  INTAKE_GLOBAL_DOC_ID,
  INTAKE_FORM_SEEDS,
  DEFAULT_INTRO_TEXT,
  DEFAULT_CONSENT_CHECKBOX_LABEL,
  DEFAULT_SUCCESS_MESSAGE,
  DEFAULT_DISABLED_MESSAGE,
  DEFAULT_TERMS_HTML,
} from "@/lib/intakeForms/seed-config";
import {
  INTAKE_LEGAL_TEXT_COLLECTION,
  INTAKE_LEGAL_TEXT_SEEDS,
} from "@/lib/intakeForms/legal-text";

export const INTAKE_SUBMISSIONS_COLLECTION = "intake_submissions";

function timestampToIso(
  value: Timestamp | Date | string | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

function seedFor(slug: string) {
  return INTAKE_FORM_SEEDS.find((f) => f.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Global master switch
// ---------------------------------------------------------------------------

export async function getGlobalConfig(): Promise<IntakeGlobalConfig> {
  const snap = await getFirestore()
    .collection(INTAKE_FORMS_CONFIG_COLLECTION)
    .doc(INTAKE_GLOBAL_DOC_ID)
    .get();
  const data = snap.data();
  return {
    // Ship safe: default OFF until a doc explicitly enables forms.
    enabled: data?.enabled === true,
    updatedAt: timestampToIso(data?.updatedAt as Timestamp | undefined),
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
  };
}

export async function setGlobalEnabled(
  enabled: boolean,
  updatedBy: string,
): Promise<void> {
  await getFirestore()
    .collection(INTAKE_FORMS_CONFIG_COLLECTION)
    .doc(INTAKE_GLOBAL_DOC_ID)
    .set(
      { enabled, updatedAt: FieldValue.serverTimestamp(), updatedBy },
      { merge: true },
    );
}

// ---------------------------------------------------------------------------
// Per-form config
// ---------------------------------------------------------------------------

function buildConfig(slug: string, data: DocumentData | undefined): IntakeFormConfig {
  const seed = seedFor(slug);
  const notifyRaw = data?.notifyEmails;
  const notifyEmails = Array.isArray(notifyRaw)
    ? notifyRaw.filter((e): e is string => typeof e === "string" && e.trim().length > 0)
    : [];
  return {
    slug,
    title: typeof data?.title === "string" && data.title.trim() ? data.title : seed?.title ?? slug,
    enabled: data?.enabled === true,
    order: typeof data?.order === "number" ? data.order : seed?.order ?? 999,
    introText:
      typeof data?.introText === "string" ? data.introText : seed?.introText ?? DEFAULT_INTRO_TEXT,
    consentCheckboxLabel:
      typeof data?.consentCheckboxLabel === "string"
        ? data.consentCheckboxLabel
        : DEFAULT_CONSENT_CHECKBOX_LABEL,
    termsHtml: typeof data?.termsHtml === "string" ? data.termsHtml : DEFAULT_TERMS_HTML,
    successMessage:
      typeof data?.successMessage === "string" ? data.successMessage : DEFAULT_SUCCESS_MESSAGE,
    disabledMessage:
      typeof data?.disabledMessage === "string" ? data.disabledMessage : DEFAULT_DISABLED_MESSAGE,
    notifyEmails,
    updatedAt: timestampToIso(data?.updatedAt as Timestamp | undefined),
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
  };
}

export async function getFormConfig(slug: string): Promise<IntakeFormConfig | null> {
  if (!seedFor(slug)) return null;
  const snap = await getFirestore()
    .collection(INTAKE_FORMS_CONFIG_COLLECTION)
    .doc(slug)
    .get();
  return buildConfig(slug, snap.data());
}

export async function listFormConfigs(): Promise<IntakeFormConfig[]> {
  const db = getFirestore();
  const snaps = await Promise.all(
    INTAKE_FORM_SEEDS.map((f) =>
      db.collection(INTAKE_FORMS_CONFIG_COLLECTION).doc(f.slug).get(),
    ),
  );
  const configs = snaps.map((snap, i) => buildConfig(INTAKE_FORM_SEEDS[i]!.slug, snap.data()));
  return configs.sort((a, b) => a.order - b.order);
}

export type IntakeFormConfigPatch = Partial<
  Pick<
    IntakeFormConfig,
    | "title"
    | "enabled"
    | "introText"
    | "consentCheckboxLabel"
    | "termsHtml"
    | "successMessage"
    | "disabledMessage"
    | "notifyEmails"
  >
>;

export async function updateFormConfig(
  slug: string,
  patch: IntakeFormConfigPatch,
  updatedBy: string,
): Promise<boolean> {
  if (!seedFor(slug)) return false;
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.introText !== undefined) update.introText = patch.introText;
  if (patch.consentCheckboxLabel !== undefined)
    update.consentCheckboxLabel = patch.consentCheckboxLabel;
  if (patch.termsHtml !== undefined) update.termsHtml = patch.termsHtml;
  if (patch.successMessage !== undefined) update.successMessage = patch.successMessage;
  if (patch.disabledMessage !== undefined) update.disabledMessage = patch.disabledMessage;
  if (patch.notifyEmails !== undefined) update.notifyEmails = patch.notifyEmails;

  await getFirestore()
    .collection(INTAKE_FORMS_CONFIG_COLLECTION)
    .doc(slug)
    .set(update, { merge: true });
  return true;
}

// ---------------------------------------------------------------------------
// Legal text
// ---------------------------------------------------------------------------

function buildLegalText(cmsKey: string, data: DocumentData | undefined): IntakeLegalText {
  const seed = INTAKE_LEGAL_TEXT_SEEDS.find((s) => s.cmsKey === cmsKey);
  return {
    cmsKey,
    label: typeof data?.label === "string" && data.label.trim() ? data.label : seed?.label ?? cmsKey,
    body: typeof data?.body === "string" ? data.body : seed?.body ?? "",
    updatedAt: timestampToIso(data?.updatedAt as Timestamp | undefined),
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
  };
}

export async function getLegalTextMany(keys: string[]): Promise<Record<string, IntakeLegalText>> {
  if (keys.length === 0) return {};
  const db = getFirestore();
  const snaps = await Promise.all(
    keys.map((key) => db.collection(INTAKE_LEGAL_TEXT_COLLECTION).doc(key).get()),
  );
  return Object.fromEntries(
    snaps.map((snap, i) => {
      const key = keys[i]!;
      return [key, buildLegalText(key, snap.data())];
    }),
  );
}

export async function listLegalText(): Promise<IntakeLegalText[]> {
  return Object.values(await getLegalTextMany(INTAKE_LEGAL_TEXT_SEEDS.map((s) => s.cmsKey)));
}

export async function updateLegalText(
  cmsKey: string,
  body: string,
  updatedBy: string,
): Promise<boolean> {
  const seed = INTAKE_LEGAL_TEXT_SEEDS.find((s) => s.cmsKey === cmsKey);
  if (!seed) return false;
  await getFirestore()
    .collection(INTAKE_LEGAL_TEXT_COLLECTION)
    .doc(cmsKey)
    .set(
      { label: seed.label, body, updatedAt: FieldValue.serverTimestamp(), updatedBy },
      { merge: true },
    );
  return true;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function createSubmission(input: IntakeSubmissionInput): Promise<string> {
  const db = getFirestore();
  const ref = db.collection(INTAKE_SUBMISSIONS_COLLECTION).doc();
  await ref.set({
    formSlug: input.formSlug,
    formTitle: input.formTitle,
    answers: input.answers,
    signatures: input.signatures,
    diagrams: input.diagrams,
    consentAccepted: input.consentAccepted,
    consentLabelAtSubmit: input.consentLabelAtSubmit,
    meta: {
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
      submittedAt: FieldValue.serverTimestamp(),
    },
    status: "new",
    reviewedBy: null,
    reviewedAt: null,
  });
  return ref.id;
}

function parseSignatures(value: unknown): Record<string, IntakeSignatureValue> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, IntakeSignatureValue> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw && typeof raw === "object") {
      const v = raw as Record<string, unknown>;
      out[key] = {
        signatureImage: typeof v.signatureImage === "string" ? v.signatureImage : "",
        printedName: typeof v.printedName === "string" ? v.printedName : undefined,
        email: typeof v.email === "string" ? v.email : undefined,
        dateSigned: typeof v.dateSigned === "string" ? v.dateSigned : undefined,
        typedName: typeof v.typedName === "string" ? v.typedName : undefined,
      };
    }
  }
  return out;
}

function parseDiagrams(value: unknown): Record<string, IntakeDiagramValue> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, IntakeDiagramValue> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw && typeof raw === "object") {
      const v = raw as Record<string, unknown>;
      out[key] = {
        frontImage: typeof v.frontImage === "string" ? v.frontImage : "",
        backImage: typeof v.backImage === "string" ? v.backImage : "",
      };
    }
  }
  return out;
}

function parseSubmission(id: string, data: DocumentData | undefined): IntakeSubmissionRecord | null {
  if (!data) return null;
  const statusRaw = typeof data.status === "string" ? data.status : "new";
  const status: IntakeSubmissionStatus =
    statusRaw === "reviewed" || statusRaw === "archived" ? statusRaw : "new";
  const meta = (data.meta ?? {}) as Record<string, unknown>;
  return {
    id,
    formSlug: typeof data.formSlug === "string" ? data.formSlug : "",
    formTitle: typeof data.formTitle === "string" ? data.formTitle : "",
    answers: (data.answers as Record<string, unknown>) ?? {},
    signatures: parseSignatures(data.signatures),
    diagrams: parseDiagrams(data.diagrams),
    consentAccepted: data.consentAccepted === true,
    consentLabelAtSubmit:
      typeof data.consentLabelAtSubmit === "string" ? data.consentLabelAtSubmit : "",
    meta: {
      ipAddress: typeof meta.ipAddress === "string" ? meta.ipAddress : "",
      userAgent: typeof meta.userAgent === "string" ? meta.userAgent : "",
      submittedAt: timestampToIso(meta.submittedAt as Timestamp | undefined),
    },
    status,
    reviewedBy: typeof data.reviewedBy === "string" ? data.reviewedBy : null,
    reviewedAt: timestampToIso(data.reviewedAt as Timestamp | undefined),
  };
}

export async function listSubmissions(
  formSlug: string,
  options?: { status?: IntakeSubmissionStatus | "all"; limit?: number },
): Promise<IntakeSubmissionRecord[]> {
  const db = getFirestore();
  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 500);
  const snap = await db
    .collection(INTAKE_SUBMISSIONS_COLLECTION)
    .where("formSlug", "==", formSlug)
    .orderBy("meta.submittedAt", "desc")
    .limit(limit)
    .get();
  const rows: IntakeSubmissionRecord[] = [];
  for (const doc of snap.docs) {
    const row = parseSubmission(doc.id, doc.data());
    if (!row) continue;
    if (options?.status && options.status !== "all" && row.status !== options.status) continue;
    rows.push(row);
  }
  return rows;
}

export async function getSubmission(id: string): Promise<IntakeSubmissionRecord | null> {
  const snap = await getFirestore().collection(INTAKE_SUBMISSIONS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return parseSubmission(snap.id, snap.data());
}

export async function updateSubmissionStatus(
  id: string,
  status: IntakeSubmissionStatus,
  reviewedBy: string,
): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection(INTAKE_SUBMISSIONS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set(
    {
      status,
      reviewedBy,
      reviewedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return true;
}

/**
 * Map of formSlug -> submission count (for the admin list).
 *
 * Uses a field-less `select()` query (no document data transferred) since this
 * firebase-admin version predates `.count()` aggregation. Capped per form so a
 * large backlog can't blow up the request.
 */
const SUBMISSION_COUNT_CAP = 1000;

export async function countSubmissionsByForm(): Promise<Record<string, number>> {
  const db = getFirestore();
  const counts: Record<string, number> = {};
  await Promise.all(
    INTAKE_FORM_SEEDS.map(async (f) => {
      const snap = await db
        .collection(INTAKE_SUBMISSIONS_COLLECTION)
        .where("formSlug", "==", f.slug)
        .select()
        .limit(SUBMISSION_COUNT_CAP)
        .get();
      counts[f.slug] = snap.size;
    }),
  );
  return counts;
}
