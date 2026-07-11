#!/usr/bin/env node
/**
 * search-firestore-text.mjs <needle>
 * Case-insensitive scan of content collections for a string. Read-only.
 */
import nextEnv from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

nextEnv.loadEnvConfig(process.cwd());

function norm(raw) {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim();
  if (s.length >= 2 && ((s[0] === "'" && s.at(-1) === "'") || (s[0] === '"' && s.at(-1) === '"'))) s = s.slice(1, -1).trim();
  return s;
}
initializeApp({ credential: cert(JSON.parse(norm(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))) });
const db = getFirestore();

const needle = (process.argv[2] || 'baggot').toLowerCase();
const COLLECTIONS = [
  'legacy_import', 'legacyPages', 'site_content', 'site_staff_members',
  'massage_team_members', 'practice_pages', 'site_faqs', 'site_owner_config',
];

function walk(value, path, hits, docPath) {
  if (typeof value === 'string') {
    if (value.toLowerCase().includes(needle)) hits.push(`${docPath} :: ${path} = ${value.slice(0, 120)}`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, hits, docPath));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, hits, docPath);
  }
}

async function scanCollection(col) {
  const hits = [];
  const snap = await col.get();
  for (const d of snap.docs) {
    walk(d.data(), '', hits, `${col.path}/${d.id}`);
    for (const sub of await d.ref.listCollections()) {
      const subSnap = await sub.get();
      for (const sd of subSnap.docs) walk(sd.data(), '', hits, `${sub.path}/${sd.id}`);
    }
  }
  return hits;
}

async function main() {
  console.log(`Searching for "${needle}"\n`);
  let total = 0;
  for (const name of COLLECTIONS) {
    try {
      const hits = await scanCollection(db.collection(name));
      total += hits.length;
      if (hits.length) hits.forEach((h) => console.log(h));
    } catch (e) {
      console.log(`  (skip ${name}: ${e.message})`);
    }
  }
  console.log(`\ntotal matches: ${total}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
