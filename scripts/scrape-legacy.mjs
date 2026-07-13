#!/usr/bin/env node
/**
 * scrape-legacy.mjs
 *
 * Crawls the three legacy Baystone/Hibu sites, extracts page content VERBATIM,
 * and downloads every image/video asset to disk.
 *
 * NO paraphrasing. NO AI. What's on the page is what lands in content.json.
 *
 * Usage:
 *   npm i cheerio
 *   node scripts/scrape-legacy.mjs
 *
 * Output:
 *   legacy-export/
 *     raw/<site>/<slug>.html      original HTML (API keys stripped on save)
 *     assets/<site>/<file>        every downloaded image + video
 *     content.json                structured extraction
 *     report.txt                  what worked, what didn't
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const SITES = [
  { key: 'massage-paris',   origin: 'https://www.massageparistexas.com' },
  { key: 'chiro-paris',     origin: 'https://www.chiropracticparistexas.com' },
  { key: 'chiro-sulphur',   origin: 'https://www.chiropracticsulphursprings.com' },
];

const OUT = 'legacy-export';
const CONCURRENCY = 4;
const DELAY_MS = 350;               // be polite; these are shared-host sites
const MAX_PAGES_PER_SITE = 500;

// Only external/vendor junk. Everything on the clinic's own domains gets crawled.
const SKIP_PATTERNS = [
  /:param/i,
  /^javascript:/i,
  /^tel:/i,
  /^mailto:/i,
  /^#/,
  /onlinechiro\.com/i,
  /portal\./i,
  /squareup\.com/i,
];

// Chrome-ish UA. Some Hibu sites 403 a bare fetch.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = [];
const log = (msg) => { console.log(msg); report.push(msg); };

/** Strip vendor-embedded API keys (e.g. Google Maps) before archiving HTML. */
function sanitizeRawHtml(html) {
  return html
    .replace(/<script[^>]*maps\.google(?:apis)?\.com\/maps\/api\/js[^>]*>\s*<\/script>\s*/gi, '')
    .replace(/AIza[0-9A-Za-z_-]{35}/g, 'REDACTED');
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function slugFromUrl(u) {
  const p = new URL(u).pathname.replace(/^\/|\/$/g, '');
  return p === '' ? 'index' : p.replace(/\//g, '__');
}

function safeAssetName(u) {
  const url = new URL(u);
  let base = path.basename(url.pathname) || 'asset';
  base = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Hibu appends ?<hash> — fold it in so variants don't collide
  if (url.search) {
    const h = url.search.slice(1, 9).replace(/[^a-zA-Z0-9]/g, '');
    const ext = path.extname(base);
    base = `${path.basename(base, ext)}-${h}${ext}`;
  }
  return base;
}

async function fetchWithRetry(url, opts = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow', ...opts });
      if (res.ok) return res;
      if (res.status === 404) throw new Error(`404`);
      if (i === tries - 1) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(800 * (i + 1));
  }
}

/* ------------------------------------------------------------------ */
/* Asset download                                                      */
/* ------------------------------------------------------------------ */

const assetCache = new Map(); // absoluteUrl -> local relative path

async function downloadAsset(absUrl, siteKey) {
  if (assetCache.has(absUrl)) return assetCache.get(absUrl);

  const name = safeAssetName(absUrl);
  const rel = `assets/${siteKey}/${name}`;
  const dest = path.join(OUT, rel);

  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const res = await fetchWithRetry(absUrl, {}, 2);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error('suspiciously small');
    await fs.writeFile(dest, buf);
    assetCache.set(absUrl, rel);
    return rel;
  } catch (e) {
    log(`  ! ASSET FAILED  ${absUrl}  (${e.message})`);
    assetCache.set(absUrl, null);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Content extraction                                                  */
/* ------------------------------------------------------------------ */

/**
 * Baystone templates repeat the nav 2-3x and wrap content in one of a few
 * containers. We strip chrome, then take the largest remaining text block.
 * Raw HTML is always saved regardless, so nothing is ever lost.
 */
function extractMain($) {
  $('script, style, noscript, nav, header, footer, iframe').remove();
  $('[class*="nav"], [class*="menu"], [id*="nav"], [id*="menu"]').remove();
  $('[class*="footer"], [id*="footer"], [class*="header"], [id*="header"]').remove();
  $('[class*="cookie"], [class*="modal"], [class*="popup"]').remove();

  const candidates = [
    'main', '[role="main"]', '#main', '.main-content', '#content',
    '.content', 'article', '.page-content', '.entry-content',
  ];

  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) return el;
  }

  // Fallback: densest <div> by text length
  let best = null, bestLen = 0;
  $('body div').each((_, el) => {
    const $el = $(el);
    if ($el.find('div').length > 6) return; // container, not leaf-ish
    const len = $el.text().trim().length;
    if (len > bestLen) { bestLen = len; best = $el; }
  });
  return best || $('body');
}

function textBlocks($, $main) {
  const blocks = [];
  $main.find('h1,h2,h3,h4,h5,h6,p,li,blockquote').each((_, el) => {
    const $el = $(el);
    const t = $el.text().replace(/\s+/g, ' ').trim();
    if (!t) return;
    blocks.push({ tag: el.tagName.toLowerCase(), text: t });
  });
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Crawl one site                                                      */
/* ------------------------------------------------------------------ */

async function crawlSite(site) {
  const { key, origin } = site;
  const seen = new Set();
  const queue = [origin];
  const pages = [];

  log(`\n=== ${key}  (${origin}) ===`);

  while (queue.length && pages.length < MAX_PAGES_PER_SITE) {
    const batch = queue.splice(0, CONCURRENCY);

    await Promise.all(batch.map(async (url) => {
      const norm = url.split('#')[0].replace(/\/$/, '') || origin;
      if (seen.has(norm)) return;
      seen.add(norm);

      let html;
      try {
        const res = await fetchWithRetry(norm);
        html = await res.text();
      } catch (e) {
        log(`  ! PAGE FAILED  ${norm}  (${e.message})`);
        return;
      }

      const slug = slugFromUrl(norm);
      const rawPath = path.join(OUT, 'raw', key, `${slug}.html`);
      await fs.mkdir(path.dirname(rawPath), { recursive: true });
      await fs.writeFile(rawPath, sanitizeRawHtml(html), 'utf8');

      const $full = load(html);

      // Queue internal links BEFORE we strip nav
      $full('a[href]').each((_, a) => {
        const href = $full(a).attr('href') || '';
        if (SKIP_PATTERNS.some((re) => re.test(href))) return;
        let abs;
        try { abs = new URL(href, norm).toString(); } catch { return; }
        if (!abs.startsWith(origin)) return;
        if (SKIP_PATTERNS.some((re) => re.test(abs))) return;
        const cleaned = abs.split('#')[0].replace(/\/$/, '');
        if (!seen.has(cleaned) && !queue.includes(cleaned)) queue.push(cleaned);
      });

      const title = $full('title').first().text().trim();
      const metaDesc = $full('meta[name="description"]').attr('content') || '';

      // Collect assets from the WHOLE page (hero/banner images often sit in header)
      const assets = [];
      const assetUrls = new Set();
      $full('img[src]').each((_, img) => {
        const src = $full(img).attr('src');
        if (!src || src.startsWith('data:')) return;
        try { assetUrls.add(new URL(src, norm).toString()); } catch {}
      });
      $full('img[srcset], source[srcset]').each((_, el) => {
        const ss = $full(el).attr('srcset') || '';
        ss.split(',').forEach((part) => {
          const u = part.trim().split(/\s+/)[0];
          if (!u || u.startsWith('data:')) return;
          try { assetUrls.add(new URL(u, norm).toString()); } catch {}
        });
      });
      $full('a[href$=".mp4"], a[href$=".pdf"], video source[src]').each((_, el) => {
        const u = $full(el).attr('href') || $full(el).attr('src');
        if (!u) return;
        try { assetUrls.add(new URL(u, norm).toString()); } catch {}
      });

      for (const au of assetUrls) {
        const local = await downloadAsset(au, key);
        const $img = $full(`img[src="${au}"]`).first();
        assets.push({
          originalUrl: au,
          localPath: local,
          alt: $img.attr('alt') || '',
          title: $img.attr('title') || '',
        });
      }

      const $main = extractMain($full);
      const blocks = textBlocks($full, $main);

      pages.push({
        site: key,
        url: norm,
        slug,
        title,
        metaDescription: metaDesc,
        rawHtmlFile: path.relative(OUT, rawPath),
        contentHtml: $main.html()?.trim() || '',
        blocks,
        assets,
      });

      log(`  ok  ${slug.padEnd(40)} ${blocks.length} blocks, ${assets.length} assets`);
      await sleep(DELAY_MS);
    }));
  }

  log(`  --> ${pages.length} pages, ${queue.length} left unqueued`);
  return pages;
}

/* ------------------------------------------------------------------ */

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const all = [];
  for (const site of SITES) {
    try {
      all.push(...(await crawlSite(site)));
    } catch (e) {
      log(`!! SITE FAILED ${site.key}: ${e.message}`);
    }
  }

  await fs.writeFile(
    path.join(OUT, 'content.json'),
    JSON.stringify({ scrapedAt: new Date().toISOString(), pages: all }, null, 2),
    'utf8'
  );

  const failedAssets = [...assetCache.entries()].filter(([, v]) => v === null);

  // Flat inventory — every page that came over, one per line.
  // Cursor must account for every line in this file.
  await fs.writeFile(
    path.join(OUT, 'page-inventory.txt'),
    all.map((p) => `${p.site}__${p.slug}\t${p.url}`).sort().join('\n'),
    'utf8'
  );

  log(`\n=== DONE ===`);
  log(`pages:  ${all.length}`);
  log(`assets: ${assetCache.size - failedAssets.length} ok, ${failedAssets.length} failed`);
  if (failedAssets.length) {
    log(`\nFailed assets (grab these manually):`);
    failedAssets.forEach(([u]) => log(`  ${u}`));
  }

  await fs.writeFile(path.join(OUT, 'report.txt'), report.join('\n'), 'utf8');
}

main().catch((e) => { console.error(e); process.exit(1); });
