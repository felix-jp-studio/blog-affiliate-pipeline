/** Pure helpers behind changed-slugs.mjs: no git, fs, argv or env, so they unit test. */
import { isArticleMarkdownPath, slugFromArticlePath } from "./e2e-utils.mjs";

export const EMPTY_SHA = "0000000000000000000000000000000000000000";

export function parseArgs(argv) {
  const valueOf = (p) => argv.find((arg) => arg.startsWith(p))?.slice(p.length);
  return {
    format: valueOf("--format=") ?? "lines",
    base: valueOf("--base="),
    head: valueOf("--head="),
    noFallback: argv.includes("--no-fallback"),
  };
}

/**
 * Explicit --base/--head win, then the GitHub event payload, then origin/main...HEAD.
 * `readEvent` reads and parses the event payload so callers inject the fs access.
 */
export function resolveRange({ base, head }, env = {}, readEvent = () => ({})) {
  if (base && head) return { base, head };

  const eventName = env.GITHUB_EVENT_NAME;
  const eventPath = env.GITHUB_EVENT_PATH;

  if (eventName === "pull_request" && eventPath) {
    const event = readEvent(eventPath);
    return { base: event.pull_request.base.sha, head: event.pull_request.head.sha };
  }

  if (eventName === "push" && eventPath) {
    const event = readEvent(eventPath);
    if (event.before && event.before !== EMPTY_SHA) {
      return { base: event.before, head: event.after ?? "HEAD" };
    }
  }

  return {
    base: env.GITHUB_BASE_REF ?? env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA ?? "origin/main",
    head: env.GITHUB_SHA ?? "HEAD",
  };
}

export function articlePathsFromDiff(diffOutput) {
  return diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && isArticleMarkdownPath(line));
}

export function slugsFromPaths(paths) {
  return [...new Set(paths.map((path) => slugFromArticlePath(path)).filter(Boolean))];
}

export function selectOutputSlugs(
  slugs,
  { noFallback = false, fallbackSlugs = [] } = {},
) {
  if (slugs.length > 0) {
    return slugs;
  }
  return noFallback ? [] : fallbackSlugs;
}

export function formatSlugs(slugs, format) {
  switch (format) {
    case "comma":
      return slugs.join(",");
    case "env":
      return `E2E_SMOKE_SLUGS=${slugs.join(",")}`;
    case "json":
      return JSON.stringify(slugs);
    default:
      return slugs.map((slug) => `${slug}\n`).join("");
  }
}
