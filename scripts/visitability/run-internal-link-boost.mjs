#!/usr/bin/env node
/**
 * Internal link boost act: backfill links for low-inbound articles.
 */
import { execFileSync } from "node:child_process";
import { PATHS, readJson } from "./lib.mjs";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const brief = readJson(PATHS.actBrief);
const maxSlugs = brief?.params?.maxSlugs ?? 5;

function main() {
  const auditJson = execFileSync(
    "node",
    ["scripts/audit-orphan-articles.mjs", "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  const audit = JSON.parse(auditJson);
  const slugs = (audit.lowInbound ?? [])
    .slice(0, maxSlugs)
    .map((entry) => entry.slug)
    .filter(Boolean);

  if (slugs.length === 0) {
    console.log("internal-link-boost: no orphan slugs");
    process.exit(0);
  }

  execFileSync(
    "python3",
    ["scripts/backfill-internal-links.py", "--force", `--slugs=${slugs.join(",")}`],
    { cwd: repoRoot, stdio: "inherit" },
  );

  execFileSync("node", ["scripts/backfill-date-modified.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  console.log(JSON.stringify({ actType: "internal_link_boost", slugs }));
}

main();
