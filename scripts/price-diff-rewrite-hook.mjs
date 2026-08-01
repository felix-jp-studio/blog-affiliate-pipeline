/**
 * Compare hikari price snapshots and append changed providers to rewrite-queue.csv.
 *
 * Depends on snapshot shape from hikari-price-scraper-v1:
 *   data/hikari-prices-snapshot.json  (version "1", providers map)
 *
 * Usage:
 *   node scripts/price-diff-rewrite-hook.mjs
 *   node scripts/price-diff-rewrite-hook.mjs --dry-run
 *   node scripts/price-diff-rewrite-hook.mjs \
 *     --previous=scripts/fixtures/hikari-prices-previous.json \
 *     --current=scripts/fixtures/hikari-prices-current.json
 *
 * Exit 0 when snapshots missing or no changes (CI-friendly).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const previousArg = args.find((a) => a.startsWith("--previous="));
const currentArg = args.find((a) => a.startsWith("--current="));

const defaultCurrent = join(repoRoot, "data/hikari-prices-snapshot.json");
const defaultPrevious = join(repoRoot, "data/hikari-prices-snapshot.prev.json");
const queuePath = join(repoRoot, "data/rewrite-queue.csv");

const PRICE_KEYS = ["monthlyFeeYen", "constructionFeeYen", "campaignNote"];

function resolvePath(arg, fallback) {
  if (!arg) return fallback;
  const rel = arg.slice(arg.indexOf("=") + 1);
  return join(repoRoot, rel);
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
  return { headers, rows };
}

function serializeCsv(headers, rows) {
  const body = rows.map((row) => headers.map((h) => row[h] ?? "").join(","));
  return `${[headers.join(","), ...body].join("\n")}\n`;
}

function loadQueue() {
  if (!existsSync(queuePath)) {
    return {
      headers: ["slug", "query", "position", "priority", "status", "notes"],
      rows: [],
    };
  }
  return parseCsv(readFileSync(queuePath, "utf8"));
}

function priceFingerprint(provider) {
  return PRICE_KEYS.map((k) => String(provider?.[k] ?? "")).join("|");
}

function diffProviders(previous, current) {
  const prevMap = previous?.providers ?? {};
  const currMap = current?.providers ?? {};
  const changes = [];

  for (const [key, curr] of Object.entries(currMap)) {
    if (!curr?.ok) continue;
    const prev = prevMap[key];
    if (!prev) {
      changes.push({
        provider: key,
        reason: "new-provider",
        slugs: curr.rewriteSlugs ?? [],
        detail: `monthly=${curr.monthlyFeeYen}`,
      });
      continue;
    }
    if (priceFingerprint(prev) === priceFingerprint(curr)) continue;
    const parts = [];
    for (const field of PRICE_KEYS) {
      if (String(prev[field] ?? "") !== String(curr[field] ?? "")) {
        parts.push(`${field}:${prev[field] ?? "null"}→${curr[field] ?? "null"}`);
      }
    }
    changes.push({
      provider: key,
      reason: "price-change",
      slugs: curr.rewriteSlugs ?? prev.rewriteSlugs ?? [],
      detail: parts.join("; "),
    });
  }
  return changes;
}

function appendQueueRows(changes) {
  const { headers, rows } = loadQueue();
  const ensured = headers.length
    ? headers
    : ["slug", "query", "position", "priority", "status", "notes"];
  const existingPending = new Set(
    rows.filter((r) => r.status === "pending").map((r) => r.slug),
  );
  const added = [];

  for (const change of changes) {
    const slugs =
      change.slugs.length > 0 ? change.slugs : [`${change.provider}-price-review`];
    for (const slug of slugs) {
      if (existingPending.has(slug)) continue;
      const notes =
        `hikari-price-diff ${change.provider} ${change.reason}: ${change.detail}`.replaceAll(
          ",",
          ";",
        );
      rows.push({
        slug,
        query: `${change.provider} 料金改定`,
        position: "",
        priority: "20",
        status: "pending",
        notes,
      });
      existingPending.add(slug);
      added.push(slug);
    }
  }

  return { headers: ensured, rows, added };
}

function main() {
  const currentPath = resolvePath(currentArg, defaultCurrent);
  const previousPath = resolvePath(previousArg, defaultPrevious);

  const current = loadJson(currentPath);
  if (!current) {
    console.log(
      `price-diff-rewrite-hook: current snapshot missing (${currentPath}) — skip (exit 0).`,
    );
    console.log(
      "Merge hikari-price-scraper-v1 or pass --current=scripts/fixtures/hikari-prices-current.json",
    );
    return 0;
  }

  const previous = loadJson(previousPath);
  if (!previous) {
    console.log(
      `price-diff-rewrite-hook: previous snapshot missing (${previousPath}) — skip (exit 0).`,
    );
    console.log(
      "On first run, copy current → data/hikari-prices-snapshot.prev.json after scrape.",
    );
    return 0;
  }

  if (String(current.version) !== "1" && String(current.version) !== "1.0") {
    console.warn(
      `price-diff-rewrite-hook: unexpected snapshot version ${current.version}; continuing best-effort.`,
    );
  }

  const changes = diffProviders(previous, current);
  if (changes.length === 0) {
    console.log("price-diff-rewrite-hook: no price changes");
    return 0;
  }

  console.log(
    `price-diff-rewrite-hook: ${changes.length} provider change(s):`,
    changes.map((c) => c.provider).join(", "),
  );

  const { headers, rows, added } = appendQueueRows(changes);
  if (added.length === 0) {
    console.log("price-diff-rewrite-hook: all target slugs already pending — no write");
    return 0;
  }

  if (dryRun) {
    console.log("dry-run — would append slugs:", added.join(", "));
    console.log(
      serializeCsv(
        headers,
        rows.filter((r) => added.includes(r.slug)),
      ),
    );
    return 0;
  }

  writeFileSync(queuePath, serializeCsv(headers, rows), "utf8");
  console.log(`updated ${queuePath} (+${added.length} row(s))`);

  // Promote current → previous for next run when using default paths
  if (!previousArg && !currentArg && currentPath === defaultCurrent) {
    writeFileSync(defaultPrevious, JSON.stringify(current, null, 2) + "\n", "utf8");
    console.log(`wrote ${defaultPrevious}`);
  }

  return 0;
}

process.exit(main());
