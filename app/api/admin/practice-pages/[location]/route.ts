import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import {
  PRACTICE_PAGES_COLLECTION,
  PRACTICE_PAGE_PATHS,
  buildPracticePageDefaults,
  getPracticePageForEditing,
  isPracticeLocationId,
  mergePracticePageDoc,
  practicePageVersion,
  type PracticePageDoc,
} from "@/lib/practice-pages";

export const runtime = "nodejs";

const CONFLICT_ERROR =
  "Someone else saved this page after you opened it — reload to see their changes.";

/** Thrown inside the save transaction when the stored version moved on. */
class VersionConflict extends Error {}

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

  const { page, version } = await getPracticePageForEditing(location);
  return NextResponse.json({ page, version });
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

  // Body: { page, version } — `version` is what the editor loaded (null for a
  // never-saved page). A request without it (an editor tab opened before this
  // check existed) is refused rather than allowed to overwrite blindly.
  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  if (!body || !("version" in body) || !body.page || typeof body.page !== "object") {
    return NextResponse.json(
      { error: "This editor is out of date. Copy any unsaved text, then reload the page." },
      { status: 400 },
    );
  }
  const baseVersion = typeof body.version === "string" ? body.version : null;

  const db = getFirestore();
  const ref = db.collection(PRACTICE_PAGES_COLLECTION).doc(location);
  const defaults = await buildPracticePageDefaults(location);
  // Written explicitly (not serverTimestamp) so the new version can be returned.
  const updatedAt = Timestamp.now();

  let next: PracticePageDoc;
  try {
    next = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : undefined;
      // Someone saved since this editor loaded: don't overwrite their changes.
      if (practicePageVersion(data) !== baseVersion) throw new VersionConflict();
      // Sanitize the submitted doc against the current effective page so
      // partial or malformed payloads can never break the public route.
      const current = mergePracticePageDoc(data, defaults);
      const merged = mergePracticePageDoc(body.page, current);
      tx.set(
        ref,
        { ...merged, updatedAt, updatedBy: staff.email ?? staff.uid },
        { merge: false },
      );
      return merged;
    });
  } catch (e) {
    if (e instanceof VersionConflict) {
      return NextResponse.json({ error: CONFLICT_ERROR }, { status: 409 });
    }
    throw e;
  }

  revalidatePath(PRACTICE_PAGE_PATHS[location]);
  return NextResponse.json({
    ok: true,
    page: next,
    version: practicePageVersion({ updatedAt }),
  });
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
