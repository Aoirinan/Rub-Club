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
};

export default nextConfig;
