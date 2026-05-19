import { NextResponse } from "next/server";

/**
 * Online patient intake has been retired. Patient PHI is no longer accepted
 * through this site; new and personal injury patients fill out paperwork in
 * the office. This endpoint returns 410 Gone so legacy clients fail loudly.
 */
export const runtime = "nodejs";

const GONE_BODY = {
  error:
    "Online intake is no longer available. Please print the patient packet from /patient-forms and bring it to your appointment, or call the office.",
} as const;

export async function POST() {
  return NextResponse.json(GONE_BODY, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE_BODY, { status: 410 });
}
