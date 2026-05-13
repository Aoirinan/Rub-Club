import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { sendBookingNotification } from "@/lib/sendgrid";
import { siteShortName } from "@/lib/site-content";
import { assertRateLimitOk } from "@/lib/rate-limit";

export const runtime = "nodejs";

const FIELDS = [
  "firstName", "lastName", "dateOfBirth", "phone", "email",
  "address", "city", "state", "zip",
  "emergencyContactName", "emergencyContactPhone",
  "reasonForVisit", "areasOfConcern",
  "allergies", "medications", "medicalConditions",
  "pregnant", "pacemaker",
  "previousMassage", "pressurePreference",
  "howDidYouHear", "additionalNotes",
  "service", "location",
] as const;

export async function POST(req: Request) {
  const rl = await assertRateLimitOk(req.headers);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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

  const record: Record<string, unknown> = { submittedAt: FieldValue.serverTimestamp() };
  for (const key of FIELDS) {
    const val = body[key];
    if (typeof val === "string" && val.trim()) {
      record[key] = val.trim();
    } else if (typeof val === "boolean") {
      record[key] = val;
    }
  }

  const db = getFirestore();
  const ref = await db.collection("intake_forms").add(record);

  try {
    const officeEmail = process.env.OFFICE_NOTIFICATION_EMAIL?.trim();
    if (officeEmail) {
      await sendBookingNotification({
        to: officeEmail,
        subject: `New intake form: ${firstName} ${lastName}`,
        text: [
          `New patient intake form submitted on ${siteShortName}.`,
          "",
          `Name: ${firstName} ${lastName}`,
          phone ? `Phone: ${phone}` : "",
          email ? `Email: ${email}` : "",
          `Service: ${body.service ?? "Not specified"}`,
          `Location: ${body.location ?? "Not specified"}`,
          body.reasonForVisit ? `Reason: ${body.reasonForVisit}` : "",
          "",
          `View in Firestore: intake_forms/${ref.id}`,
        ].filter(Boolean).join("\n"),
        fromName: "Patient Intake",
      });
    }
  } catch (err) {
    console.error("Intake notification email failed:", err);
  }

  return NextResponse.json({ ok: true, id: ref.id });
}
