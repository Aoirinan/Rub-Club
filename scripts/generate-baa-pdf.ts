/**
 * Generates docs/business-associate-agreement-template.pdf (local only — not served on the website).
 * Run: npm run generate:baa-pdf
 */
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const ROOT = path.join(__dirname, "..");
const MD_PATH = path.join(ROOT, "docs", "business-associate-agreement-template.md");
const OUT_PATH = path.join(ROOT, "docs", "business-associate-agreement-template.pdf");

function markdownToPlainLines(md: string): string[] {
  const lines: string[] = [];
  for (const raw of md.split(/\r?\n/)) {
    let line = raw.trimEnd();
    if (line === "---") {
      lines.push("");
      continue;
    }
    if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim().replace(/\*\*/g, ""));
      lines.push(cells.filter(Boolean).join(" — "));
      continue;
    }
    line = line.replace(/^#{1,6}\s+/, "");
    line = line.replace(/\*\*([^*]+)\*\*/g, "$1");
    line = line.replace(/\*([^*]+)\*/g, "$1");
    line = line.replace(/^[-*]\s+\[ \]\s+/, "☐ ");
    line = line.replace(/^[-*]\s+/, "• ");
    line = line.replace(/^\d+\.\s+/, (m) => m);
    if (line.startsWith("> ")) line = line.slice(2);
    lines.push(line);
  }
  return lines;
}

function main(): void {
  if (!fs.existsSync(MD_PATH)) {
    console.error("Missing:", MD_PATH);
    process.exit(1);
  }
  const md = fs.readFileSync(MD_PATH, "utf8");
  const lines = markdownToPlainLines(md);

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: "Business Associate Agreement (Template)",
      Author: "Rub Club website project",
      Subject: "HIPAA BAA template — attorney review required",
    },
  });

  const stream = fs.createWriteStream(OUT_PATH);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bodySize = 10;
  const smallSize = 9;
  const h1Size = 14;
  const h2Size = 12;

  doc.font("Helvetica");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      doc.moveDown(0.35);
      continue;
    }

    const isH1 =
      trimmed === "BUSINESS ASSOCIATE AGREEMENT" ||
      trimmed.startsWith("EXHIBIT ") ||
      trimmed === "Signatures";
    const isH2 =
      /^(\d+\.\s|Checklist before signing)/.test(trimmed) ||
      trimmed === "How to use" ||
      trimmed.startsWith("IMPORTANT:");

    if (isH1) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(h1Size).text(trimmed, { width: pageWidth });
      doc.font("Helvetica").fontSize(bodySize);
      doc.moveDown(0.35);
      continue;
    }

    if (isH2 || /^#{0}$/.test(trimmed)) {
      doc.moveDown(0.25);
      doc.font("Helvetica-Bold").fontSize(h2Size).text(trimmed, { width: pageWidth });
      doc.font("Helvetica").fontSize(bodySize);
      doc.moveDown(0.2);
      continue;
    }

    const size = trimmed.startsWith("IMPORTANT:") || trimmed.startsWith("☐") ? smallSize : bodySize;
    doc.fontSize(size).text(trimmed, {
      width: pageWidth,
      align: "left",
      lineGap: 2,
    });
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
