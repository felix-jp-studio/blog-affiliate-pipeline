#!/usr/bin/env node
/**
 * Execute a Visitability Cycle from visitability-cycle-brief.json (Act / Do phase).
 *
 * Usage:
 *   node scripts/visitability/run-cycle.mjs
 *   node scripts/visitability/run-cycle.mjs --dry-run
 *   node scripts/visitability/run-cycle.mjs --skip-tests
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";
import {
  PATHS,
  appendKeywordRows,
  buildCycleBatch,
  cycleBatchPath,
  inferCategory,
  loadKeywordSeed,
  makeLabelFromTitle,
  readJson,
  serializeKeywordSeed,
  slugFromArticlePath,
  writeJson,
} from "./lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipTests = args.includes("--skip-tests");

function run(cmd, cmdArgs, options = {}) {
  return execFileSync(cmd, cmdArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function parseGeneratorOutput(output) {
  const results = [];
  for (const line of output.split("\n")) {
    const okMatch = line.match(/^\[OK\] (.+) -> (.+\.md)/);
    const failMatch = line.match(/^\[FAIL\] (.+) -> (.+)/);
    if (okMatch) {
      results.push({
        ok: true,
        keyword: okMatch[1],
        outputPath: okMatch[2],
        slug: slugFromArticlePath(okMatch[2]),
      });
    } else if (failMatch) {
      results.push({
        ok: false,
        keyword: failMatch[1],
        error: failMatch[2],
      });
    }
  }
  return results;
}

function readTitleFromMarkdown(path) {
  const content = readFileSync(path, "utf8");
  const match = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match?.[1] ?? "新規記事";
}

function appendKeywordsToSeed(keywordAppend) {
  if (!keywordAppend?.length) return;
  const rows = loadKeywordSeed();
  const merged = appendKeywordRows(rows, keywordAppend);
  writeFileSync(PATHS.keywordSeed, serializeKeywordSeed(merged), "utf8");
}

function main() {
  const brief = readJson(PATHS.brief);
  if (!brief?.items?.length) {
    console.error("visitability-cycle-brief.json is missing or has no items");
    process.exit(2);
  }

  const cycleNumber = brief.cycleNumber;
  const batchPath = cycleBatchPath(cycleNumber);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          cycleNumber,
          template: brief.template,
          items: brief.items,
          batchPath,
          keywordAppend: brief.keywordAppend?.length ?? 0,
        },
        null,
        2,
      ),
    );
    return;
  }

  appendKeywordsToSeed(brief.keywordAppend ?? []);

  writeJson(batchPath, buildCycleBatch(brief));

  let generatorOutput;
  try {
    generatorOutput = run(
      "python3",
      [
        "-m",
        "generator",
        "--mode",
        "template",
        "--batch",
        `config/batch-cycle${cycleNumber}-auto.json`,
      ],
      {
        env: { ...process.env, PYTHONPATH: "packages/generator" },
      },
    );
  } catch (error) {
    const output = error.stdout?.toString?.() ?? error.message;
    console.error(output);
    process.exit(1);
  }

  console.log(generatorOutput);
  let results = parseGeneratorOutput(generatorOutput);
  const failed = results.filter((result) => !result.ok);

  if (failed.length > 0 && brief.fallbackKeywords?.length) {
    console.warn(
      `Generator failed for ${failed.length} item(s); retry not implemented in v1`,
    );
  }

  const okResults = results.filter((result) => result.ok && result.slug);
  if (okResults.length === 0) {
    console.error("No articles generated successfully");
    process.exit(1);
  }

  const slugs = okResults.map((result) => result.slug);

  run(
    "node",
    ["scripts/post-publish-article-onboard.mjs", `--slugs=${slugs.join(",")}`],
    {
      inherit: true,
    },
  );

  run("node", ["scripts/append-index-queue.mjs", `--slugs=${slugs.join(",")}`], {
    inherit: true,
  });

  const hubEntries = okResults.map((result) => {
    const item = brief.items.find((entry) => entry.keyword === result.keyword);
    const mdPath = join(repoRoot, result.outputPath);
    const title = existsSync(mdPath) ? readTitleFromMarkdown(mdPath) : result.keyword;
    return {
      slug: result.slug,
      category:
        item?.category ?? inferCategory(result.keyword, item?.articleType ?? "howto"),
      label: makeLabelFromTitle(title),
    };
  });

  const resultManifest = {
    cycleNumber,
    template: brief.template,
    slugs,
    hubEntries,
    completedAt: new Date().toISOString(),
  };
  const resultPath = join(repoRoot, "data/visitability-cycle-result.json");
  writeJson(resultPath, resultManifest);

  run("node", ["scripts/visitability/update-hub-mesh.mjs", `--manifest=${resultPath}`], {
    inherit: true,
  });

  const formatTargets = [
    PATHS.hubMesh,
    batchPath,
    PATHS.brief,
    ...okResults.map((result) => join(repoRoot, result.outputPath)),
  ].filter((path) => existsSync(path));

  run("npx", ["prettier", "--write", ...formatTargets], { inherit: true });

  if (!skipTests) {
    run("npm", ["run", "test:e2e:articles"], { inherit: true });
  }

  const state = readJson(PATHS.state, { cycleNumber });
  state.cycleNumber = cycleNumber + 1;
  state.lastRunAt = resultManifest.completedAt;
  state.lastOutcome = failed.length > 0 ? "partial" : "success";
  state.consecutiveFailures =
    failed.length > 0 ? (state.consecutiveFailures ?? 0) + 1 : 0;
  writeJson(PATHS.state, state);

  console.log(JSON.stringify(resultManifest, null, 2));
}

main();
