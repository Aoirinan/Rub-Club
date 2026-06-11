import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import {
  PRACTICE_PAGES_COLLECTION,
  PRACTICE_PAGE_PATHS,
  buildPracticePageDefaults,
  getPracticePage,
  isPracticeLocationId,
  mergePracticePageDoc,
} from "@/lib/practice-pages";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ location: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  const page = await getPracticePage(location);
  return NextResponse.json({ page });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ location: string }> },
) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Sanitize the submitted doc against the current effective page so partial
  // or malformed payloads can never break the public route.
  const current = await getPracticePage(location);
  const next = mergePracticePageDoc(json, current);

  await getFirestore()
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(location)
    .set(
      {
        ...next,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: staff.email ?? staff.uid,
      },
      { merge: false },
    );

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true, page: next });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ location: string }> },
) {
  // Reset the doc to the current live defaults (testimonials are kept).
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { location } = await ctx.params;
  if (!isPracticeLocationId(location)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 404 });
  }

  const defaults = await buildPracticePageDefaults(location);
  await getFirestore()
    .collection(PRACTICE_PAGES_COLLECTION)
    .doc(location)
    .set(
      {
        ...defaults,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: staff.email ?? staff.uid,
      },
      { merge: false },
    );

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({ ok: true, page: defaults });
}
