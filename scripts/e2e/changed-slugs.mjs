/**
 * Resolve article slugs changed in a PR or recent commit.
 *
 * Usage:
 *   node scripts/e2e/changed-slugs.mjs
 *   node scripts/e2e/changed-slugs.mjs --format=comma
 *   node scripts/e2e/changed-slugs.mjs --format=env
 *   node scripts/e2e/changed-slugs.mjs --format=json
 *   node scripts/e2e/changed-slugs.mjs --base=origin/main --head=HEAD
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  isArticleMarkdownPath,
  loadE2eConfig,
  repoRoot,
  slugFromArticlePath,
  articlesPathPrefix,
} from "./e2e-utils.mjs";

const args = process.argv.slice(2);
const formatArg = args.find((arg) => arg.startsWith("--format="));
const baseArg = args.find((arg) => arg.startsWith("--base="));
const headArg = args.find((arg) => arg.startsWith("--head="));
const format = formatArg?.split("=")[1] ?? "lines";

function runGit(argsList) {
  return execFileSync("git", argsList, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function resolveRange() {
  if (baseArg && headArg) {
    return {
      base: baseArg.split("=")[1],
      head: headArg.split("=")[1],
    };
  }

  const eventName = process.env.GITHUB_EVENT_NAME;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (eventName === "pull_request" && eventPath) {
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    return {
      base: event.pull_request.base.sha,
      head: event.pull_request.head.sha,
    };
  }

  if (eventName === "push" && eventPath) {
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    const before = event.before;
    const after = event.after ?? "HEAD";
    if (before && before !== "0000000000000000000000000000000000000000") {
      return { base: before, head: after };
    }
  }

  const baseRef =
    process.env.GITHUB_BASE_REF ??
    process.env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA ??
    "origin/main";
  const headRef = process.env.GITHUB_SHA ?? "HEAD";

  return { base: baseRef, head: headRef };
}

function changedArticlePaths(base, head) {
  let diffOutput = "";
  try {
    diffOutput = runGit([
      "diff",
      "--name-only",
      `${base}...${head}`,
      "--",
      articlesPathPrefix,
    ]);
  } catch {
    try {
      diffOutput = runGit(["diff", "--name-only", base, head, "--", articlesPathPrefix]);
    } catch {
      return [];
    }
  }

  return diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && isArticleMarkdownPath(line));
}

function resolveChangedSlugs() {
  const { base, head } = resolveRange();
  const paths = changedArticlePaths(base, head);
  const slugs = [
    ...new Set(paths.map((path) => slugFromArticlePath(path)).filter(Boolean)),
  ];
  return { base, head, slugs };
}

function fallbackSlugs() {
  const config = loadE2eConfig();
  return config.smokeSlugs ?? [];
}

function formatOutput(slugs) {
  switch (format) {
    case "comma":
      process.stdout.write(slugs.join(","));
      break;
    case "env":
      process.stdout.write(`E2E_SMOKE_SLUGS=${slugs.join(",")}`);
      break;
    case "json":
      process.stdout.write(JSON.stringify(slugs));
      break;
    default:
      for (const slug of slugs) {
        console.log(slug);
      }
  }
}

const { base, head, slugs } = resolveChangedSlugs();
const outputSlugs = slugs.length > 0 ? slugs : fallbackSlugs();

if (format === "lines") {
  console.error(`changed-slugs: base=${base} head=${head} count=${outputSlugs.length}`);
}

formatOutput(outputSlugs);
