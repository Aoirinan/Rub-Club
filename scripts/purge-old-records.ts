/**
 * Preview or execute the 7-year (configurable) scheduling data retention purge.
 *
 * Run:
 *   npm run purge:old-records              # dry-run (default)
 *   npm run purge:old-records -- --execute # delete for real
 *
 * Env (from .env.local):
 *   DATA_RETENTION_YEARS=7
 *   DATA_RETENTION_MAX_BOOKINGS=500
 *   DATA_RETENTION_MAX_SMS=1000
 *   DATA_RETENTION_MAX_PATIENTS=200
 *
 * CLI always scans Firestore (--dry-run or --execute). --execute does not require
 * DATA_RETENTION_ENABLED; the weekly Vercel cron does.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { getDataRetentionConfig, runDataRetentionPurge } from "../lib/data-retention";

function parseArgs(argv: string[]): { dryRun: boolean } {
  const execute = argv.includes("--execute");
  const dryRunFlag = argv.includes("--dry-run");
  if (execute && dryRunFlag) {
    console.error("Use either --dry-run or --execute, not both.");
    process.exit(1);
  }
  return { dryRun: !execute };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = getDataRetentionConfig();

  console.log("purge-old-records starting", {
    mode: args.dryRun ? "dry-run" : "execute",
    retentionYears: config.retentionYears,
    maxBookings: config.maxBookings,
    maxSms: config.maxSms,
    maxPatients: config.maxPatients,
    cronEnabledInProd: config.enabled,
  });

  if (!args.dryRun && !config.enabled) {
    console.log(
      "Note: DATA_RETENTION_ENABLED is not true; this manual --execute run still proceeds.",
    );
  }

  const result = await runDataRetentionPurge({
    dryRun: args.dryRun,
    force: !args.dryRun,
  });

  console.log("\npurge-old-records done", result);
  if (args.dryRun) {
    console.log("(dry-run: nothing was actually deleted)");
  }
  if (result.truncated) {
    console.log(
      "Truncated: more records remain. Re-run or wait for the weekly cron to continue.",
    );
  }
}

void main().catch((err) => {
  console.error("purge-old-records failed", err);
  process.exit(1);
});
