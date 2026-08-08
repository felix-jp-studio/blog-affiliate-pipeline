/**
 * Onboard newly published articles: internal links v2 + dateModified bump.
 *
 * Usage:
 *   node scripts/post-publish-article-onboard.mjs --from-git
 *   node scripts/post-publish-article-onboard.mjs --slugs=slug-a,slug-b
 *   node scripts/post-publish-article-onboard.mjs --from-git --dry-run
 */
import { execFileSync } from "node:child_process";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fromGit = args.includes("--from-git");
const slugsArg = args.find((arg) => arg.startsWith("--slugs="));

function resolveSlugs() {
  if (fromGit) {
    const output = execFileSync(
      "node",
      ["scripts/e2e/changed-slugs.mjs", "--format=json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    return [...new Set(JSON.parse(output || "[]").filter(Boolean))];
  }

  if (slugsArg) {
    return [
      ...new Set(
        slugsArg
          .slice("--slugs=".length)
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean),
      ),
    ];
  }

  return [];
}

const slugs = resolveSlugs();
if (slugs.length === 0) {
  console.log("post-publish-article-onboard: no slugs to process");
  process.exit(0);
}

console.log(`post-publish-article-onboard: ${slugs.length} slug(s): ${slugs.join(", ")}`);

const pyArgs = [
  "scripts/backfill-internal-links.py",
  "--force",
  `--slugs=${slugs.join(",")}`,
];
if (dryRun) {
  pyArgs.push("--dry-run");
}

execFileSync("python3", pyArgs, {
  cwd: repoRoot,
  stdio: "inherit",
});

if (!dryRun) {
  execFileSync("node", ["scripts/backfill-date-modified.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

console.log("post-publish-article-onboard: done");
