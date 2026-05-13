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
