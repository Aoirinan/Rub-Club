#!/usr/bin/env node
/** Read-only: find visitor-facing (rendered) legacy URLs in published legacy pages. */
import nextEnv from "@next/env";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

nextEnv.loadEnvConfig(process.cwd());
function norm(raw) {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim();
  if (s.length >= 2 && ((s[0] === "'" && s.at(-1) === "'") || (s[0] === '"' && s.at(-1) === '"'))) s = s.slice(1, -1).trim();
  return s;
}
initializeApp({ credential: cert(JSON.parse(norm(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))) });
const db = getFirestore();

const NEEDLE = /massagepar|chiropracticparistexas\.com\/|paristx\.com/i;

async function main() {
  const lp = await db.collection("legacyPages").where("published", "==", true).get();
  console.log(`published legacy pages: ${lp.size}\n`);
  for (const d of lp.docs) {
    const x = d.data();
    const blocks = Array.isArray(x.blocks) ? x.blocks : [];
    const hits = [];
    blocks.forEach((b, i) => {
      const t = b?.text ?? "";
      if (typeof t === "string" && NEEDLE.test(t)) hits.push(`blocks[${i}].text: …${t.match(NEEDLE) ? t : ""}`);
    });
    // also title / metaDescription (rendered)
    for (const f of ["title", "metaDescription"]) {
      if (typeof x[f] === "string" && NEEDLE.test(x[f])) hits.push(`${f}: ${x[f]}`);
    }
    if (hits.length) {
      console.log(`>>> ${d.id}  route=${x.route}`);
      hits.forEach((h) => console.log("    " + h));
    }
  }
  console.log("\n(done: only pages with RENDERED legacy URLs listed)");
}
main().catch((e) => { console.error(e); process.exit(1); });
