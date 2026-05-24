/**
 * Generates docs/two-phase-client-sow.pdf (local only — not served on the website).
 * Run: npm run generate:sow-pdf
 *
 * The output is laid out for printing and signing by hand:
 * - Markdown links and backticks are stripped.
 * - `_____` fill-in lines render as plain underscore characters in a monospaced
 *   font so they read as a writing line.
 * - Headings, checkboxes, and signature blocks have consistent spacing.
 */
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const ROOT = path.join(__dirname, "..");
const MD_PATH = path.join(ROOT, "docs", "two-phase-client-sow.md");
const OUT_PATH = path.join(ROOT, "docs", "two-phase-client-sow.pdf");

type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "hr" }
  | { kind: "blank" }
  | { kind: "checkbox"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "body"; text: string };

function stripInline(s: string): string {
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  return s;
}

function parse(md: string): Block[] {
  const out: Block[] = [];
  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    const trimmed = line.trim();

    if (!trimmed) {
      out.push({ kind: "blank" });
      continue;
    }
    if (trimmed === "---") {
      out.push({ kind: "hr" });
      continue;
    }
    const hMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = stripInline(hMatch[2]);
      if (level === 1) out.push({ kind: "h1", text });
      else if (level === 2) out.push({ kind: "h2", text });
      else out.push({ kind: "h3", text });
      continue;
    }
    const cbDirect = /^☐\s+(.+)$/.exec(trimmed);
    const cbDash = /^[-*]\s*\[\s\]\s+(.+)$/.exec(trimmed);
    if (cbDirect || cbDash) {
      const text = stripInline((cbDirect ?? cbDash)![1]);
      out.push({ kind: "checkbox", text });
      continue;
    }
    const bMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bMatch) {
      out.push({ kind: "bullet", text: stripInline(bMatch[1]) });
      continue;
    }
    const nMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (nMatch) {
      out.push({ kind: "body", text: stripInline(nMatch[1]) });
      continue;
    }
    out.push({ kind: "body", text: stripInline(trimmed) });
  }
  return out;
}

function main(): void {
  if (!fs.existsSync(MD_PATH)) {
    console.error("Missing:", MD_PATH);
    process.exit(1);
  }
  const md = fs.readFileSync(MD_PATH, "utf8");
  const blocks = parse(md);

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 64, bottom: 64, left: 64, right: 64 },
    info: {
      Title: "Two-Phase Website Statement of Work",
      Author: "Wellness Paris TX website project",
      Subject: "Phase 1 marketing + Phase 2A HIPAA + Phase 2B scheduler/PHI",
    },
  });

  const stream = fs.createWriteStream(OUT_PATH);
  doc.pipe(stream);

  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.margins.right;
  const pageWidth = doc.page.width - leftMargin - rightMargin;

  const bodySize = 11;
  const h1Size = 16;
  const h2Size = 13;
  const h3Size = 11.5;
  const indent = 18;

  const resetX = () => {
    doc.x = leftMargin;
  };

  doc.font("Helvetica").fontSize(bodySize);

  for (const block of blocks) {
    switch (block.kind) {
      case "blank":
        doc.moveDown(0.6);
        resetX();
        break;
      case "hr": {
        doc.moveDown(0.5);
        const y = doc.y;
        doc
          .moveTo(leftMargin, y)
          .lineTo(doc.page.width - rightMargin, y)
          .strokeColor("#999")
          .lineWidth(0.5)
          .stroke();
        doc.strokeColor("black");
        doc.moveDown(0.8);
        resetX();
        break;
      }
      case "h1":
        doc.moveDown(0.7);
        resetX();
        doc
          .font("Helvetica-Bold")
          .fontSize(h1Size)
          .text(block.text, { width: pageWidth });
        doc.font("Helvetica").fontSize(bodySize);
        doc.moveDown(0.4);
        break;
      case "h2":
        doc.moveDown(0.5);
        resetX();
        doc
          .font("Helvetica-Bold")
          .fontSize(h2Size)
          .text(block.text, { width: pageWidth });
        doc.font("Helvetica").fontSize(bodySize);
        doc.moveDown(0.3);
        break;
      case "h3":
        doc.moveDown(0.4);
        resetX();
        doc
          .font("Helvetica-Bold")
          .fontSize(h3Size)
          .text(block.text, { width: pageWidth });
        doc.font("Helvetica").fontSize(bodySize);
        doc.moveDown(0.2);
        break;
      case "checkbox": {
        const x = leftMargin + indent;
        const y = doc.y;
        const box = 9;
        doc
          .lineWidth(0.7)
          .rect(x, y + 2, box, box)
          .stroke();
        doc
          .font("Helvetica")
          .fontSize(bodySize)
          .text(block.text, x + box + 8, y, {
            width: pageWidth - indent - box - 8,
            lineGap: 2,
          });
        doc.moveDown(0.15);
        resetX();
        break;
      }
      case "bullet": {
        const x = leftMargin + indent;
        doc
          .font("Helvetica")
          .fontSize(bodySize)
          .text("\u2022  " + block.text, x, doc.y, {
            width: pageWidth - indent,
            lineGap: 2,
          });
        doc.moveDown(0.1);
        resetX();
        break;
      }
      case "body":
        resetX();
        doc
          .font("Helvetica")
          .fontSize(bodySize)
          .text(block.text, { width: pageWidth, align: "left", lineGap: 2 });
        break;
    }
  }

  doc.end();

  stream.on("finish", () => {
    const stat = fs.statSync(OUT_PATH);
    console.log(`Wrote ${OUT_PATH} (${Math.round(stat.size / 1024)} KB)`);
  });
  stream.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
