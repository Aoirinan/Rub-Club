import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { sendBookingNotification } from "@/lib/sendgrid";
import { siteShortName } from "@/lib/site-content";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { INTAKE_BOOLEAN_FIELDS, INTAKE_TEXT_FIELDS } from "@/lib/intake-form-fields";
import {
  INTAKE_ALLOWED_MIME,
  INTAKE_MAX_FILE_BYTES,
  type IntakeFileKind,
  uploadIntakeFileBuffer,
} from "@/lib/intake-documents";

export const runtime = "nodejs";

function isFormDataFile(v: FormDataEntryValue | null): v is File {
  return v !== null && typeof v === "object" && "arrayBuffer" in (v as Blob);
}

function parseFormDataFields(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const honeypot = fd.get("website");
  out.website = typeof honeypot === "string" ? honeypot : "";
  for (const key of INTAKE_TEXT_FIELDS) {
    const v = fd.get(key);
    out[key] = typeof v === "string" ? v : "";
  }
  for (const key of INTAKE_BOOLEAN_FIELDS) {
    const v = fd.get(key);
    if (v === "true" || v === "on") out[key] = true;
    else if (v === "false") out[key] = false;
    else out[key] = false;
  }
  return out;
}

async function readOptionalIntakeFile(
  entry: FormDataEntryValue | null,
  humanLabel: string,
  kind: IntakeFileKind,
): Promise<{ buffer: Buffer; contentType: string; originalFilename: string; kind: IntakeFileKind } | null> {
  if (!isFormDataFile(entry)) return null;
  const contentType = entry.type || "application/octet-stream";
  if (!INTAKE_ALLOWED_MIME[contentType]) {
    throw new Error(`${humanLabel}: please upload a JPG, PNG, WebP, or PDF file.`);
  }
  const buffer = Buffer.from(await entry.arrayBuffer());
  if (buffer.length > INTAKE_MAX_FILE_BYTES) {
    throw new Error(`${humanLabel}: file is too large (max 10 MB).`);
  }
  if (buffer.length === 0) {
    throw new Error(`${humanLabel}: file is empty.`);
  }
  return {
    buffer,
    contentType,
    originalFilename: entry.name || (kind === "insurance" ? "insurance" : "license"),
    kind,
  };
}

function buildRecordFromBody(body: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = { submittedAt: FieldValue.serverTimestamp() };
  for (const key of INTAKE_TEXT_FIELDS) {
    const val = body[key];
    if (typeof val === "string" && val.trim()) {
      record[key] = val.trim();
    }
  }
  for (const key of INTAKE_BOOLEAN_FIELDS) {
    const val = body[key];
    if (typeof val === "boolean") {
      record[key] = val;
    }
  }
  return record;
}

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const contentTypeHeader = req.headers.get("content-type") ?? "";
  const isMultipart = contentTypeHeader.includes("multipart/form-data");

  let body: Record<string, unknown>;
  let insuranceLegacy: Awaited<ReturnType<typeof readOptionalIntakeFile>> | null = null;
  let insuranceFrontFile: Awaited<ReturnType<typeof readOptionalIntakeFile>> | null = null;
  let insuranceBackFile: Awaited<ReturnType<typeof readOptionalIntakeFile>> | null = null;
  let driversFile: Awaited<ReturnType<typeof readOptionalIntakeFile>> | null = null;

  try {
    if (isMultipart) {
      const fd = await req.formData();
      body = parseFormDataFields(fd);
      insuranceLegacy = await readOptionalIntakeFile(fd.get("insuranceCard"), "Insurance card", "insurance");
      insuranceFrontFile = await readOptionalIntakeFile(
        fd.get("insuranceCardFront"),
        "Insurance card (front)",
        "insurance_front",
      );
      insuranceBackFile = await readOptionalIntakeFile(
        fd.get("insuranceCardBack"),
        "Insurance card (back)",
        "insurance_back",
      );
      driversFile = await readOptionalIntakeFile(
        fd.get("driversLicense"),
        "Driver's license or ID",
        "drivers_license",
      );
    } else {
      body = (await req.json()) as Record<string, unknown>;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json({ error: "Please provide a phone number or email." }, { status: 400 });
  }

  const record = buildRecordFromBody(body);
  const db = getFirestore();
  const ref = await db.collection("intake_forms").add(record);

  const fileUpdates: Record<string, unknown> = {};
  try {
    if (insuranceFrontFile) {
      const meta = await uploadIntakeFileBuffer({
        intakeId: ref.id,
        kind: "insurance_front",
        buffer: insuranceFrontFile.buffer,
        contentType: insuranceFrontFile.contentType,
        originalFilename: insuranceFrontFile.originalFilename,
      });
      fileUpdates.insuranceCardFront = { ...meta, uploadedAt: FieldValue.serverTimestamp() };
    }
    if (insuranceBackFile) {
      const meta = await uploadIntakeFileBuffer({
        intakeId: ref.id,
        kind: "insurance_back",
        buffer: insuranceBackFile.buffer,
        contentType: insuranceBackFile.contentType,
        originalFilename: insuranceBackFile.originalFilename,
      });
      fileUpdates.insuranceCardBack = { ...meta, uploadedAt: FieldValue.serverTimestamp() };
    }
    if (insuranceLegacy && !insuranceFrontFile && !insuranceBackFile) {
      const meta = await uploadIntakeFileBuffer({
        intakeId: ref.id,
        kind: "insurance",
        buffer: insuranceLegacy.buffer,
        contentType: insuranceLegacy.contentType,
        originalFilename: insuranceLegacy.originalFilename,
      });
      fileUpdates.insuranceCard = { ...meta, uploadedAt: FieldValue.serverTimestamp() };
    }
    if (driversFile) {
      const meta = await uploadIntakeFileBuffer({
        intakeId: ref.id,
        kind: "drivers_license",
        buffer: driversFile.buffer,
        contentType: driversFile.contentType,
        originalFilename: driversFile.originalFilename,
      });
      fileUpdates.driversLicense = { ...meta, uploadedAt: FieldValue.serverTimestamp() };
    }
    if (Object.keys(fileUpdates).length > 0) {
      await ref.update(fileUpdates);
    }
  } catch (err) {
    console.error("Intake file upload failed:", err);
    await ref.update({
      intakeFileUploadError: String(err instanceof Error ? err.message : err),
      intakeFileUploadFailedAt: FieldValue.serverTimestamp(),
    });
  }

  try {
    const officeEmail = process.env.OFFICE_NOTIFICATION_EMAIL?.trim();
    if (officeEmail) {
      const hasDocs = Boolean(insuranceLegacy || insuranceFrontFile || insuranceBackFile || driversFile);
      await sendBookingNotification({
        to: officeEmail,
        subject: `New intake form: ${firstName} ${lastName}`,
        text: [
          `New patient intake form submitted on ${siteShortName}.`,
          "",
          `Name: ${firstName} ${lastName}`,
          phone ? `Phone: ${phone}` : "",
          email ? `Email: ${email}` : "",
          `Service: ${String(body.service ?? "Not specified")}`,
          `Location: ${String(body.location ?? "Not specified")}`,
          body.reasonForVisit ? `Reason: ${String(body.reasonForVisit)}` : "",
          hasDocs
            ? "Attachments: patient uploaded one or more ID/insurance images (Scheduler → Manager → Intake documents with uploads)."
            : "",
          "",
          `View in Firestore: intake_forms/${ref.id}`,
        ]
          .filter(Boolean)
          .join("\n"),
        fromName: "Patient Intake",
      });
    }
  } catch (err) {
    console.error("Intake notification email failed:", err);
  }

  return NextResponse.json({ ok: true, id: ref.id });
}