#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";
import { readAspUrls, runAffiliateHealthCheck } from "./lib.mjs";

const REPORT_PATH = join(repoRoot, "data/affiliate-health-report.json");

function parseArgs(argv) {
  const args = { dryRun: false, alertDays: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--alert-days") {
      args.alertDays = Number(argv[i + 1]);
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readAspUrls();
  const report = await runAffiliateHealthCheck(registry, {
    alertDays: args.alertDays ?? undefined,
  });

  console.log(
    `[health] programs=${report.summary.totalPrograms} alerts=${report.summary.alertCount} probeFailures=${report.summary.probeFailures}`,
  );

  for (const alert of report.alerts) {
    console.warn(`[health] ALERT ${alert.type}: ${alert.message}`);
  }

  if (args.dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${REPORT_PATH}`);

  if (report.summary.alertCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`affiliate:health failed: ${error.message}`);
  process.exit(1);
});
