import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { verifyBearerUid } from "@/lib/staff-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  secret: z.string().min(8).max(200),
});

/**
 * One-time style bootstrap: if `ADMIN_BOOTSTRAP_SECRET` matches, grants `superadmin`
 * to the currently signed-in Firebase user (creates `staff/{uid}`).
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Bootstrap disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const decoded = await verifyBearerUid(req.headers.get("authorization"));
  if (!decoded?.uid || !decoded.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirestore();
  await db
    .collection("staff")
    .doc(decoded.uid)
    .set(
      {
        role: "superadmin",
        email: decoded.email,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, role: "superadmin" });
}
