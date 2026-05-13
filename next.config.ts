import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8"),
) as { version: string };

const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
const appVersion = sha ? `${pkg.version} · ${sha}` : pkg.version;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
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
    ];
  },
};

export default nextConfig;
