import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8"),
) as { version: string };

const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
const appVersion = sha ? `${pkg.version} · ${sha}` : pkg.version;

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// ── Legacy URL redirects (provenance + review notes: docs/legacy-redirect-map.csv) ──

const PRIMARY_ORIGIN = "https://www.chiropracticparistexas.com";

/**
 * Old chiropracticparistexas.com paths → current routes.
 * Host-agnostic path redirects; evaluated after the legacy-domain host rules below.
 */
const LEGACY_PRIMARY_REDIRECTS: Record<string, string> = {
  "/about.php": "/about",
  "/about-chiro": "/services/chiropractic",
  "/acupuncture": "/services/chiropractic/acupuncture",
  "/acupuncture1": "/services/chiropractic/acupuncture",
  "/adjustments-and-manipulation": "/services/chiropractic/chiropractic-adjustments",
  "/attorneys.php": "/contact",
  "/auto-accident-chiropractic.php": "/sulphur-springs/auto-injury",
  "/auto-injury": "/sulphur-springs/auto-injury",
  "/burn-scar-massage": "/services/massage",
  "/chiropractic-care": "/services/chiropractic",
  "/chiropractic-care.php": "/services/chiropractic",
  "/chiropractic-massage-therapy": "/services/chiropractic/therapeutic-massage",
  "/cold-laser-therapy": "/services/chiropractic",
  "/common-chiropractic-conditions": "/sulphur-springs/common-chiropractic-conditions",
  "/conditions/index.php": "/services/chiropractic",
  "/contact-us.php": "/contact",
  "/cryotherapy": "/services/chiropractic/heat-and-cryotherapy",
  "/ice-pack-cryotherapy": "/services/chiropractic/heat-and-cryotherapy",
  "/whole-body-cryotherapy": "/services/chiropractic/heat-and-cryotherapy",
  "/custom-foot-orthotics": "/services/chiropractic",
  "/deep-tissue-massage": "/services/massage",
  "/degenerative-disc-disease": "/services/chiropractic/degenerative-disc-disease",
  "/disclaimers/hipaa_policy": "/privacy",
  "/disclaimers/privacy_policy": "/website-privacy",
  "/disclaimers/terms_of_use": "/terms",
  "/downloads.php": "/patient-forms",
  "/paperwork.php": "/patient-forms",
  "/new-patients": "/patient-forms",
  "/patient-resources": "/patient-forms",
  "/educational-videos": "/",
  "/exercise-videos": "/",
  "/videos.php": "/",
  "/electrical-muscle-stimulation": "/services/chiropractic/electric-muscle-stimulation",
  "/electrical-stimulation-therapies": "/services/chiropractic/electric-muscle-stimulation",
  "/ems.php": "/services/chiropractic/electric-muscle-stimulation",
  "/interferential-current-therapy": "/services/chiropractic/electric-muscle-stimulation",
  "/microcurrent-therapy": "/services/chiropractic/electric-muscle-stimulation",
  "/hot-stone-massage": "/services/massage",
  "/injuries": "/sulphur-springs",
  "/injured-we-can-help": "/sulphur-springs/personal-injury",
  "/massage.php": "/services/massage",
  "/meet-the-doctor": "/about",
  "/pediatric-care": "/services/chiropractic/pediatric-care",
  "/pediatric-chiropractic.php": "/services/chiropractic/pediatric-care",
  "/personal-injury": "/sulphur-springs/personal-injury",
  "/physical-therapy": "/services/chiropractic",
  "/physiotherapy.php": "/services/chiropractic",
  "/postural-rehabilitation.php": "/services/chiropractic/postural-rehabilitation",
  "/prenatal-chiropractic": "/services/chiropractic",
  "/prenatal-massage": "/services/massage",
  "/products.php": "/services",
  "/q-and-a": "/faq",
  "/relaxation-massage": "/services/massage",
  "/swedish-massage": "/services/massage",
  "/thai-massage": "/services/massage",
  "/sports-massage": "/services/massage",
  "/what-is-chiropractic-massage-therapy": "/services/massage",
  "/services.php": "/services",
  "/spinal-decompression": "/services/chiropractic/spinal-decompression",
  "/spinal-decompression.php": "/services/chiropractic/spinal-decompression",
  "/spinal-wellness-tips": "/faq",
  "/spine-care": "/services/chiropractic",
  "/sports-injury": "/sulphur-springs/sports-injury",
  "/staff": "/locations/paris/staff",
  "/stretch---flex-rehab": "/services/chiropractic",
  "/testimonials.php": "/reviews",
  "/testimonials/:rest*": "/reviews",
  "/therapeutic-exercise": "/services/chiropractic",
  "/therapeutic-ultrasound": "/services/chiropractic/therapeutic-ultrasound",
  "/ultra-sound.php": "/services/chiropractic/therapeutic-ultrasound",
  "/vertebral-subluxation-complex": "/sulphur-springs/vertebral-subluxation-complex",
  "/wellness-care-plans": "/services/chiropractic/wellness-care-plans",
  "/x-ray.php": "/services/chiropractic",
  "/3d-spine-simulator": "/services/chiropractic",
  // Retired blog posts → FAQ.
  "/6-stretches-to-help-low-back-pain": "/faq",
  "/could-we-help-your-tmj": "/faq",
  "/headaches-can-be-a-pain-in-the-neck": "/faq",
  "/how-to-kick-your-reliance-on-pain-medication": "/faq",
  "/tech-neck": "/faq",
  "/tendons-muscles-and-ligaments": "/faq",
  "/whats-the-difference-between-tens-and-ems": "/faq",
  "/where-is-your-wallet": "/faq",
  // Old WordPress-era paths (specific routes first, then the catch-all).
  "/index.php/about": "/about",
  "/index.php/chiropractic-care": "/services/chiropractic",
  "/index.php/contact-us": "/contact",
  "/index.php/paperwork": "/patient-forms",
  "/index.php/physiotherapy": "/services/chiropractic",
  "/index.php/services": "/services",
  "/index.php/special-offers": "/services/chiropractic/wellness-care-plans",
  "/index.php/spinal-decompression": "/services/chiropractic/spinal-decompression",
  "/index.php/:rest*": "/",
  // SEO junk / retired utility pages.
  "/links": "/",
  "/sitemap": "/",
  "/geosearch.php": "/",
  "/rankings.php": "/",
};

/**
 * massageparistexas.com paths that map somewhere OTHER than the
 * /services/massage host catch-all (which remains the final fallback).
 */
const LEGACY_MASSAGE_REDIRECTS: Record<string, string> = {
  "/about.htm": "/about",
  "/chiropactic.htm": "/services/chiropractic", // (sic — legacy typo)
  "/chiropractic-care": "/services/chiropractic",
  "/chiropractic.php": "/services/chiropractic",
  "/contact": "/contact",
  "/contact.htm": "/contact",
  "/contact.php": "/contact",
  "/massage-prices": "/services/massage/prices",
  "/massage-prices.php": "/services/massage/prices",
  "/patient-forms": "/patient-forms",
};

/**
 * chiropracticsulphursprings.com paths that map somewhere OTHER than the
 * /sulphur-springs host catch-all (which remains the final fallback).
 */
const LEGACY_SS_REDIRECTS: Record<string, string> = {
  "/-massage-therapy": "/sulphur-springs/massage",
  "/about-chiro": "/sulphur-springs/about-chiropractic",
  "/about-us": "/locations/sulphur-springs",
  "/acupuncture": "/sulphur-springs/acupuncture",
  "/adjustments-and-manipulation": "/sulphur-springs/adjustments-and-manipulation",
  "/appointment-request": "/book",
  "/auto-injury": "/sulphur-springs/auto-injury",
  "/chiro-fitness/rub-club": "/services/chiropractic/wellness-care-plans",
  "/chiropractic-massage-therapy": "/sulphur-springs/massage",
  "/common-chiropractic-conditions": "/sulphur-springs/common-chiropractic-conditions",
  "/contact-us": "/sulphur-springs/contact",
  "/deep-tissue-massage": "/sulphur-springs/massage",
  "/degenerative-disc-disease": "/sulphur-springs/degenerative-disc-disease",
  "/educational-videos": "/sulphur-springs/patient-resources",
  "/exercise-videos": "/sulphur-springs/patient-resources",
  "/electrical-muscle-stimulation": "/sulphur-springs/electrical-muscle-stimulation",
  "/ice-pack-cryotherapy": "/sulphur-springs/ice-pack-cryotherapy",
  "/links": "/sulphur-springs/patient-resources",
  "/meet-the-doctors": "/sulphur-springs/staff",
  "/meet-the-staff": "/sulphur-springs/staff",
  "/new-patients": "/sulphur-springs/patient-resources",
  "/personal-injury": "/sulphur-springs/personal-injury",
  "/postural-rehabilitation": "/sulphur-springs/postural-rehabilitation",
  "/prenatal-massage": "/sulphur-springs/massage",
  "/relaxation-massage": "/sulphur-springs/massage",
  "/sports-massage": "/sulphur-springs/massage",
  "/swedish-massage": "/sulphur-springs/massage",
  "/what-is-chiropractic-massage-therapy": "/sulphur-springs/massage",
  "/q-and-a": "/sulphur-springs/q-and-a",
  "/spinal-decompression": "/sulphur-springs/spinal-decompression",
  "/spinal-wellness-tips": "/sulphur-springs/q-and-a",
  "/sports-injury": "/sulphur-springs/sports-injury",
  "/testimonials": "/reviews",
  "/therapeutic-exercise": "/sulphur-springs/therapeutic-exercise",
  "/therapeutic-ultrasound": "/sulphur-springs/therapeutic-ultrasound",
  "/vertebral-subluxation-complex": "/sulphur-springs/vertebral-subluxation-complex",
};

/** Expand a path map into host-conditioned permanent redirects (apex + www). */
function legacyHostRedirects(domain: string, map: Record<string, string>) {
  return [domain, `www.${domain}`].flatMap((host) =>
    Object.entries(map).map(([source, destination]) => ({
      source,
      has: [{ type: "host" as const, value: host }],
      destination: `${PRIMARY_ORIGIN}${destination}`,
      permanent: true,
    })),
  );
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  async redirects() {
    return [
      // Per-path legacy-domain redirects MUST precede the host catch-alls below
      // (first match wins). Provenance: docs/legacy-redirect-map.csv.
      ...legacyHostRedirects("massageparistexas.com", LEGACY_MASSAGE_REDIRECTS),
      ...legacyHostRedirects("chiropracticsulphursprings.com", LEGACY_SS_REDIRECTS),

      // Legacy secondary domains → primary domain sections (catch-all, permanent 308).
      //
      // IMPORTANT (deploy-time): These host-based rules only fire if each domain is
      // added to THIS Vercel project (Settings → Domains) as a normal domain, so the
      // Host header reaches the app. Do NOT use the Domains "Redirect to" dropdown for
      // these — it only does root-to-root domain redirects and cannot target a section
      // path like /services/massage. Adding the domains here + redeploying is what maps
      // each host to the correct section below.
      {
        source: "/:path*",
        has: [{ type: "host", value: "massageparistexas.com" }],
        destination: "https://www.chiropracticparistexas.com/services/massage",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.massageparistexas.com" }],
        destination: "https://www.chiropracticparistexas.com/services/massage",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "chiropracticsulphursprings.com" }],
        destination: "https://www.chiropracticparistexas.com/sulphur-springs",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.chiropracticsulphursprings.com" }],
        destination: "https://www.chiropracticparistexas.com/sulphur-springs",
        permanent: true,
      },

      // Old primary-domain paths (chiropracticparistexas.com) → current routes.
      ...Object.entries(LEGACY_PRIMARY_REDIRECTS).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      { source: "/massage", destination: "/services/massage", permanent: true },
      { source: "/chiropractic", destination: "/services/chiropractic", permanent: true },
      { source: "/meet-the-doctors", destination: "/about", permanent: true },
      { source: "/locations", destination: "/contact", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/admin/:path*",
        headers: [
          ...SECURITY_HEADERS,
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/api/providers",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/api/slots",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
