import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/staff-auth";
import { listSubmissions } from "@/lib/intakeForms/config-db";
import { getFormDefinition, flattenFields } from "@/lib/intakeForms/definitions";
import {
  submissionPatientName,
  formatAnswerWithOther,
} from "@/lib/intakeForms/display";
import type { IntakeSubmissionRecord } from "@/lib/intakeForms/types";

export const runtime = "nodejs";

function csvCell(raw: string): string {
  // Spreadsheet formula injection guard: intake answers are public text.
  const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = z
    .object({ slug: z.string().min(1) })
    .safeParse({ slug: url.searchParams.get("slug") ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const def = getFormDefinition(parsed.data.slug);
  if (!def) return NextResponse.json({ error: "Unknown form" }, { status: 400 });

  const records = await listSubmissions(parsed.data.slug, { status: "all", limit: 500 });
  const fields = flattenFields(def);

  // Several blocks share a label (e.g. four "Signature" blocks), so number the
  // repeats to keep every column header distinct.
  const exportable = fields.filter((f) => !["heading", "note", "legal-text"].includes(f.type));
  const labelTotals = new Map<string, number>();
  for (const f of exportable) labelTotals.set(f.label, (labelTotals.get(f.label) ?? 0) + 1);
  const labelSeen = new Map<string, number>();
  const columnLabel = (f: (typeof exportable)[number]): string => {
    const total = labelTotals.get(f.label) ?? 1;
    if (total <= 1) return f.label;
    const n = (labelSeen.get(f.label) ?? 0) + 1;
    labelSeen.set(f.label, n);
    return `${f.label} ${n}`;
  };

  const headers: string[] = ["Submission ID", "Submitted At", "Status", "Patient Name", "IP Address"];
  for (const f of exportable) {
    const label = columnLabel(f);
    if (f.type === "signature-block") {
      headers.push(`${label} - Signed`, `${label} - Printed Name`, `${label} - Email`, `${label} - Date`);
    } else if (f.type === "body-diagram") {
      headers.push(`${label} - Marked`);
    } else {
      headers.push(label);
    }
  }

  const lines: string[] = [csvRow(headers)];
  for (const r of records as IntakeSubmissionRecord[]) {
    const cells: string[] = [
      r.id,
      r.meta.submittedAt ?? "",
      r.status,
      submissionPatientName(r.answers),
      r.meta.ipAddress ?? "",
    ];
    for (const f of fields) {
      if (["heading", "note", "legal-text"].includes(f.type)) continue;
      if (f.type === "signature-block") {
        const sig = r.signatures[f.id];
        const signed = sig?.signatureImage ? "Drawn" : sig?.typedName ? `Typed: ${sig.typedName}` : "No";
        cells.push(signed, sig?.printedName ?? "", sig?.email ?? "", sig?.dateSigned ?? "");
      } else if (f.type === "body-diagram") {
        const d = r.diagrams[f.id];
        cells.push(d && (d.frontImage || d.backImage) ? "Yes" : "No");
      } else {
        cells.push(formatAnswerWithOther(f.id, r.answers));
      }
    }
    lines.push(csvRow(cells));
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${parsed.data.slug}-submissions.csv"`,
    },
  });
}
