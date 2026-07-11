#!/usr/bin/env node
/**
 * seed-firestore.mjs
 *
 * Takes legacy-export/ (from scrape-legacy.mjs) and loads it into Firebase.
 *
 * SAFETY: writes ONLY to the staging collection `legacy_import`.
 * It does not touch site_content, patients, bookings, or anything live.
 * You promote from staging into legacyPages / site_content through the admin
 * UI (or a second, reviewed script) once you've eyeballed it.
 *
 * AUTH: matches this repo's convention (see lib/firebase-admin.ts). Reads the
 * service account JSON from FIREBASE_SERVICE_ACCOUNT_KEY in .env.local via
 * @next/env, and resolves the storage bucket the same way the app does.
 *
 * Usage:
 *   node scripts/seed-firestore.mjs            # dry run, prints plan
 *   node scripts/seed-firestore.mjs --commit   # actually writes
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

nextEnv.loadEnvConfig(process.cwd());

const COMMIT = process.argv.includes('--commit');
const EXPORT_DIR = 'legacy-export';
const STAGING_COLLECTION = 'legacy_import';
const STORAGE_PREFIX = 'legacy-assets';

/** Mirror of normalizeServiceAccountJson in lib/firebase-admin.ts. */
function normalizeServiceAccountJson(raw) {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim();
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === "'" && b === "'") || (a === '"' && b === '"')) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawJson) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_KEY (set it in .env.local).');
  process.exit(1);
}
const creds = JSON.parse(normalizeServiceAccountJson(rawJson));

function resolveBucket() {
  const explicit =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (explicit) return explicit;
  const projectId =
    creds.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  // Firebase default buckets created after Sept 2024 use .firebasestorage.app.
  return projectId ? `${projectId}.firebasestorage.app` : undefined;
}

const BUCKET = resolveBucket();
if (!BUCKET) {
  console.error('Could not resolve a storage bucket (set FIREBASE_STORAGE_BUCKET).');
  process.exit(1);
}

initializeApp({ credential: cert(creds), storageBucket: BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.html': 'text/html',
};

// Firestore rejects any single field / document larger than ~1 MiB. Keep a
// safety margin below the 1,048,487-byte field cap.
const MAX_FIELD_BYTES = 1_000_000;
const byteLen = (s) => Buffer.byteLength(s || '', 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The same shared asset (logos, banners) appears on nearly every page. Upload
// each unique Storage destination ONCE, then reuse the public URL. This avoids
// hammering a single object and tripping the per-object 429 mutation limit.
const uploadCache = new Map(); // dest -> public URL

function publicUrl(dest) {
  return `https://storage.googleapis.com/${BUCKET}/${dest}`;
}

async function uploadFileWithRetry(local, dest, contentType) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await bucket.upload(local, {
        destination: dest,
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      await bucket.file(dest).makePublic();
      return publicUrl(dest);
    } catch (e) {
      const transient = e?.code === 429 || /rate limit|429/i.test(e?.message || '');
      if (attempt === 4 || !transient) throw e;
      await sleep(1000 * (attempt + 1));
    }
  }
}

async function uploadAsset(localRelPath) {
  const local = path.join(EXPORT_DIR, localRelPath);
  const dest = `${STORAGE_PREFIX}/${localRelPath.replace(/^assets\//, '')}`;
  const ext = path.extname(local).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  if (!COMMIT) return `gs://${BUCKET}/${dest}  (dry run)`;
  if (uploadCache.has(dest)) return uploadCache.get(dest);

  const url = await uploadFileWithRetry(local, dest, contentType);
  uploadCache.set(dest, url);
  return url;
}

/**
 * Offload an oversized HTML string to Storage and return its public URL, so the
 * verbatim content is preserved even when it exceeds Firestore's field cap.
 */
async function offloadOversizedHtml(docId, html) {
  const dest = `${STORAGE_PREFIX}/oversized/${docId}.html`;
  if (!COMMIT) return `gs://${BUCKET}/${dest}  (dry run)`;
  if (uploadCache.has(dest)) return uploadCache.get(dest);
  await bucket.file(dest).save(Buffer.from(html, 'utf8'), {
    metadata: { contentType: 'text/html', cacheControl: 'public, max-age=31536000, immutable' },
  });
  await bucket.file(dest).makePublic();
  const url = publicUrl(dest);
  uploadCache.set(dest, url);
  return url;
}

async function main() {
  const raw = await fs.readFile(path.join(EXPORT_DIR, 'content.json'), 'utf8');
  const { pages } = JSON.parse(raw);

  console.log(`${COMMIT ? 'COMMITTING' : 'DRY RUN'} — ${pages.length} pages`);
  console.log(`bucket: ${BUCKET}\n`);

  let uploaded = 0, skipped = 0, docsWritten = 0, offloaded = 0;
  const docErrors = [];

  for (const page of pages) {
    const docId = `${page.site}__${page.slug}`;

    const assets = [];
    for (const a of page.assets) {
      if (!a.localPath) { skipped++; continue; }
      try {
        const url = await uploadAsset(a.localPath);
        assets.push({
          url,
          originalUrl: a.originalUrl,
          alt: a.alt,
          title: a.title,
        });
        uploaded++;
      } catch (e) {
        console.error(`  ! upload failed ${a.localPath}: ${e.message}`);
        skipped++;
      }
    }

    // VERBATIM contentHtml. If it exceeds Firestore's field cap, keep it intact
    // by offloading to Storage and pointing at it instead of dropping content.
    let contentHtml = page.contentHtml || '';
    let contentHtmlUrl = '';
    if (byteLen(contentHtml) > MAX_FIELD_BYTES) {
      try {
        contentHtmlUrl = await offloadOversizedHtml(docId, contentHtml);
        contentHtml = '';
        offloaded++;
        console.log(`  ~ offloaded oversized contentHtml -> ${contentHtmlUrl}`);
      } catch (e) {
        console.error(`  ! offload failed ${docId}: ${e.message}`);
        contentHtml = '';
      }
    }

    const doc = {
      site: page.site,
      sourceUrl: page.url,
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription,
      // VERBATIM. Do not edit these two fields by hand or by model.
      contentHtml,
      contentHtmlUrl,
      blocks: page.blocks,
      assets,
      importedAt: new Date().toISOString(),
      promoted: false,          // flip to true once mapped into legacyPages
    };

    if (COMMIT) {
      try {
        await db.collection(STAGING_COLLECTION).doc(docId).set(doc, { merge: false });
        docsWritten++;
      } catch (e) {
        console.error(`  ! DOC WRITE FAILED ${docId}: ${e.message}`);
        docErrors.push({ docId, message: e.message });
        continue;
      }
    }
    console.log(`  ${COMMIT ? 'wrote' : 'would write'}  ${STAGING_COLLECTION}/${docId}  (${assets.length} assets)`);
  }

  console.log(`\ndocs written: ${docsWritten}/${pages.length}`);
  console.log(`assets uploaded: ${uploaded}, skipped: ${skipped}, oversized offloaded: ${offloaded}`);
  if (docErrors.length) {
    console.log(`\nDOC ERRORS (${docErrors.length}):`);
    docErrors.forEach((d) => console.log(`  ${d.docId}: ${d.message}`));
  }
  if (!COMMIT) console.log('\nRe-run with --commit to write.');
}

main().catch((e) => { console.error(e); process.exit(1); });
