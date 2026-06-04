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

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdcssl.ibsrv.net",
        pathname: "/ibimg/**",
      },
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
