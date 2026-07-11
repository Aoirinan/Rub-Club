#!/usr/bin/env node
/**
 * check-legacy-import.mjs
 *
 * Read-only probe: reports how many docs exist in the `legacy_import` staging
 * collection (and a sample of IDs / sites), so we know whether the scrape+seed
 * pipeline still needs to run. Touches nothing.
 *
 *   node scripts/check-legacy-import.mjs            # summary
 *   node scripts/check-legacy-import.mjs <docId>    # dump one doc's shape
 */

import nextEnv from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

nextEnv.loadEnvConfig(process.cwd());

function normalizeServiceAccountJson(raw) {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim();
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === "'" && b === "'") || (a === '"' && b === '"')) s = s.slice(1, -1).trim();
  }
  return s;
}

const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawJson) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_KEY (.env.local).');
  process.exit(1);
}
const creds = JSON.parse(normalizeServiceAccountJson(rawJson));
initializeApp({ credential: cert(creds) });
const db = getFirestore();

async function main() {
  const target = process.argv[2];
  if (target) {
    const snap = await db.collection('legacy_import').doc(target).get();
    if (!snap.exists) { console.log(`no doc ${target}`); return; }
    const d = snap.data();
    console.log('keys:', Object.keys(d));
    console.log('site:', d.site, '| slug:', d.slug, '| title:', d.title);
    console.log('contentHtml bytes:', Buffer.byteLength(d.contentHtml || '', 'utf8'));
    console.log('contentHtmlUrl:', d.contentHtmlUrl || '(none)');
    console.log('blocks:', (d.blocks || []).length, 'assets:', (d.assets || []).length);
    console.log('first 3 blocks:', JSON.stringify((d.blocks || []).slice(0, 3), null, 2));
    console.log('first 2 assets:', JSON.stringify((d.assets || []).slice(0, 2), null, 2));
    return;
  }
  const snap = await db.collection('legacy_import').get();
  console.log(`legacy_import docs: ${snap.size}`);
  const bySite = {};
  snap.forEach((docSnap) => {
    const site = docSnap.data()?.site || '(no site)';
    bySite[site] = (bySite[site] || 0) + 1;
  });
  console.log('by site:', JSON.stringify(bySite, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
