/**
 * Phase 0 asset rescue: downloads every cdcssl.ibsrv.net (Baystone CDN) image the
 * site references and saves it under /public so the site has zero dependency on
 * the legacy Hibu/Baystone host.
 *
 * Run: node scripts/download-ibsrv-assets.mjs
 * Idempotent — overwrites existing files so a re-run refreshes the local copies.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = process.cwd();

/** url → repo-relative destination under public/ */
const ASSETS = {
  // lib/home-images.ts
  "https://cdcssl.ibsrv.net/ibimg/smb/768x156_80/webmgr/1w/3/z/ple/RC-logo2.png.webp?2d7b966d7ecb9dae0791ca79bceae7b8":
    "public/logos/rub-club.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/768x90_80/webmgr/1x/5/c/sedona/logo1_g2b15gukTcuMWaVGgkCA-566x161-377w.png.webp?9937e103856e4c581bdc303dc0e48633":
    "public/images/legacy/chiro-logo-legacy.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x743_80/webmgr/1w/3/z/ple/63852b80b3bf1_banner.jpg.webp?71daea4ffd896824b25fbde605a9ea06":
    "public/images/legacy/massage-hero-banner.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x933_80/webmgr/1w/3/z/ple/shutterstock_1184775688-ed.jpg.webp?8559b7dd5203b55a0948674df741e14c":
    "public/images/legacy/massage-patient.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x990_80/webmgr/1w/3/z/ple/shutterstock_336945686.jpg.webp?3f41a60baebc9b6209258b4e72b3b21c":
    "public/images/legacy/service-deep-tissue.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/shutterstock_1729514116.jpg.webp?b1c3bc3c658cca01290563c23e62c80c":
    "public/images/legacy/service-prenatal.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/shutterstock_222620296.jpg.webp?a1f06e92b4c31d8c39aa11d2e138128a":
    "public/images/legacy/service-sports.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1w/3/z/ple/638660a05d69e_chirobg.jpg.webp?20e761e45f85550c3bd062f087af0e56":
    "public/images/legacy/massage-chiro-tile.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x1227_80/webmgr/1x/5/c/sedona/637d483367b61_blade.jpg.webp?f4d8fdfeaf0d5752ef0b4d328a1456af":
    "public/images/legacy/chiro-blade.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1400x934_80/webmgr/1x/5/c/sedona/638660a05d69e_chirobg.jpg.webp?20e761e45f85550c3bd062f087af0e56":
    "public/images/legacy/chiro-bg.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/250x296_80/webmgr/1x/5/c/sedona/Dr-250x296.-Greg-Thompson-1920w.webp?7be6bcf9f8af51aa716aff29d066121d":
    "public/images/legacy/doctor-greg-thompson.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1920x1993_80/webmgr/1x/5/c/sedona/sean2final-1920w.webp?14427f86ae1f71f52d35834b8d7a0195":
    "public/images/legacy/doctor-sean-welborn.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1200x1482_80/webmgr/1x/5/c/698df4a633adc_Dr.Collins.jpeg.webp?f3e9f996a1d80fb97573bee51fa2c869":
    "public/images/legacy/doctor-brandy-collins.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/682x1024_80/webmgr/1w/3/z/ple/f994bdb5-2a4c-45e3-8331-6585720ff52d-1920w.webp?6f4e5067834f149e96e335b2ad8f1a58":
    "public/images/legacy/staff-ana.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/1541x2117_80/webmgr/1w/3/z/ple/Shely-2cae328b-1920w_20230228_1811.webp?5cbfb54c7177077c5ab8b679898f1b1a":
    "public/images/legacy/staff-shely.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/2099x2355_80/webmgr/1w/3/z/CoCo.jpeg.webp?ff4756b45c7390013bd8af5700d17629":
    "public/images/legacy/staff-rosylin.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/891x1153_80/webmgr/1w/3/z/ChanChan.png.webp?60497041700f4e83050dd4dc86fe5310":
    "public/images/legacy/staff-channety.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/180x250_80/webmgr/1w/3/z/ple/Brandi-180x250-1920w.webp?2da61b33eec483b193df9e654b834a4a":
    "public/images/legacy/staff-brandi.webp",
  // lib/paris-staff-images.ts (650x250 office-staff crops)
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/64415168a80ed_Brandi.webp?2da61b33eec483b193df9e654b834a4a":
    "public/images/legacy/paris-staff-brandi-boren.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/sarah.webp?063dba69995f266776ec043011697d24":
    "public/images/legacy/paris-staff-sarah-brown.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/667da401c4fc8_ShaunaClark.jpg.webp?5b900f40d9a2ff0118b390d0a00952d1":
    "public/images/legacy/paris-staff-shauna-clark.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/shelbie-2_20251120_2115.png.webp?7f935098ccbbcf441a399c19e077443a":
    "public/images/legacy/paris-staff-shelbie-guthrie.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/Ashlie-fd8e2220-2880w.webp?cdc5cab1a87c66c94bd9929247447797":
    "public/images/legacy/paris-staff-ashlie-jenkins.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/CHANN_20250220_1843.png.webp?ba181c242dc69fe0d7ca86fd954f35ae":
    "public/images/legacy/paris-staff-channety-wooten.webp",
  // lib/site-staff-seed-rosters.ts — Sulphur Springs staff
  "https://cdcssl.ibsrv.net/ibimg/smb/767x894_80/webmgr/0b/v/v/6894fb150b783_Dr.Collins_20250807_1915.jpg.webp?968bc0ef218b12b9863a228b79e19939":
    "public/images/staff-ss/conner-collins.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/767x919_80/webmgr/0b/v/v/69e109f521ad7_VictoriaJadePetty_20260416_1613.png.webp?4daec3811ca555c5551857eaa99d7cea":
    "public/images/staff-ss/jade-petty.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/767x1023_80/webmgr/0b/v/v/6a1879241eb5d_TaylorHarrison_20260528_1719.png.webp?48423671b990c51512501e7fbd79eb12":
    "public/images/staff-ss/taylor-harrison.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/925x1108_80/webmgr/0b/v/v/brittany-brown.png.webp?0eec5d70260952ed4d908224931db41e":
    "public/images/staff-ss/brittany-brown.webp",
  "https://cdcssl.ibsrv.net/ibimg/smb/767x1022_80/webmgr/0b/v/v/6a1879fb69f5a_AshlynDavis_20260528_1723.png.webp?e28faabde18cedf72f2cfeb449a7ebaf":
    "public/images/staff-ss/ashlyn-davis.webp",
};

async function main() {
  let failed = 0;
  for (const [url, rel] of Object.entries(ASSETS)) {
    const dest = join(ROOT, rel);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (asset-migration)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error(`suspiciously small (${buf.length} bytes)`);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      console.log(`[ok] ${rel}  (${(buf.length / 1024).toFixed(1)} KB)  content-type=${res.headers.get("content-type")}`);
    } catch (e) {
      failed++;
      console.error(`[FAIL] ${rel}  ${url}\n       ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(failed ? `\n${failed} download(s) FAILED` : "\nAll assets downloaded.");
  process.exit(failed ? 1 : 0);
}

main();
