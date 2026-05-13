import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAuth, getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "superadmin"]),
});

function authErrorCode(e: unknown): string {
  if (typeof e !== "object" || e === null) return "";
  const o = e as { code?: string; errorInfo?: { code?: string } };
  return o.code ?? o.errorInfo?.code ?? "";
}

export async function POST(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const email = parsed.data.email.trim().toLowerCase();
  let uid: string;
  try {
    const user = await getAuth().getUserByEmail(email);
    uid = user.uid;
  } catch {
    return NextResponse.json(
      { error: "No Firebase user with that email. Create the user in Firebase Auth first." },
      { status: 404 },
    );
  }

  await getFirestore()
    .collection("staff")
    .doc(uid)
    .set(
      {
        role: parsed.data.role,
        email,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: staff.uid,
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, uid, role: parsed.data.role });
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await getFirestore().collection("staff").limit(200).get();
  const rows = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  return NextResponse.json({ staff: rows });
}

/**
 * Deletes `staff/{uid}` and removes the Firebase Auth user (sign-in account).
 */
export async function DELETE(req: Request) {
  const actor = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const uidParam = url.searchParams.get("uid")?.trim();
  const parsedUid = z.string().min(1).max(128).safeParse(uidParam);
  if (!parsedUid.success) {
    return NextResponse.json({ error: "Missing or invalid uid" }, { status: 400 });
  }
  const targetUid = parsedUid.data;

  if (targetUid === actor.uid) {
    return NextResponse.json({ error: "You cannot remove your own staff access from this page." }, { status: 400 });
  }

  const db = getFirestore();
  const targetRef = db.collection("staff").doc(targetUid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: "Staff document not found." }, { status: 404 });
  }

  const targetRole = targetSnap.get("role") as string | undefined;
  if (targetRole === "superadmin") {
    const superadmins = await db.collection("staff").where("role", "==", "superadmin").limit(50).get();
    if (superadmins.size <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last manager (superadmin). Promote another manager first." },
        { status: 400 },
      );
    }
  }

  await targetRef.delete();

  try {
    await getAuth().deleteUser(targetUid);
  } catch (e: unknown) {
    if (authErrorCode(e) === "auth/user-not-found") {
      return NextResponse.json({ ok: true });
    }
    console.error(e);
    return NextResponse.json(
      {
        error:
          "Staff access was removed, but deleting the Firebase sign-in account failed. Delete that user in the Firebase console (Authentication), or try again.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
