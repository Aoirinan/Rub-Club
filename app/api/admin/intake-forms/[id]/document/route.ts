import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestore } from "@/lib/firebase-admin";
import { requireStaff } from "@/lib/staff-auth";
import { appendIntakePhiAudit } from "@/lib/intake-phi-audit";
import { signedIntakeDocumentUrl } from "@/lib/intake-documents";

export const runtime = "nodejs";

const bodySchema = z.object({
  document: z.enum(["insurance", "drivers_license"]),
  mode: z.enum(["inline", "download"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const db = getFirestore();
  const doc = await db.collection("intake_forms").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const d = doc.data() ?? {};
  const slotKey = parsed.data.document === "insurance" ? "insuranceCard" : "driversLicense";
  const slot = d[slotKey] as Record<string, unknown> | undefined;
  const storagePath = slot && typeof slot.storagePath === "string" ? slot.storagePath : "";
  const contentType =
    slot && typeof slot.contentType === "string" ? slot.contentType : "application/octet-stream";
  const originalFilename =
    slot && typeof slot.originalFilename === "string" ? slot.originalFilename : "document";

  if (!storagePath) {
    return NextResponse.json({ error: "No file for this document type." }, { status: 404 });
  }

  const auditAction = parsed.data.mode === "download" ? "document_download" : "document_inline";
  await appendIntakePhiAudit({
    intakeFormId: id,
    actorUid: staff.uid,
    actorEmail: staff.email,
    action: auditAction,
    documentKey: parsed.data.document,
    req,
  });

  const url = await signedIntakeDocumentUrl({
    storagePath,
    originalFilename,
    contentType,
    mode: parsed.data.mode,
    expiresMs: 10 * 60 * 1000,
  });

  return NextResponse.json({ url, expiresInSeconds: 600 });
}
