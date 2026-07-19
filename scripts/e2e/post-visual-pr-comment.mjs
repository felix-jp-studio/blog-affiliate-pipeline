#!/usr/bin/env node
/**
 * Build a markdown PR comment summarizing Playwright visual regression results.
 *
 * Usage:
 *   node scripts/e2e/post-visual-pr-comment.mjs [--dry-run] [--output path]
 *
 * Env:
 *   VISUAL_REPORT_PATH  - Playwright JSON report (default: site/test-results/visual-report.json)
 *   GITHUB_REPOSITORY   - owner/repo (optional, for artifact links)
 *   GITHUB_RUN_ID       - Actions run id (optional, for artifact links)
 *   VISUAL_ARTIFACT_NAME - artifact name (default: playwright-visual-diff)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "../..");

const COMMENT_MARKER = "<!-- playwright-visual-report -->";

/** @type {ReadonlyArray<{ spec: string; path: string; label: string; visualSnapshot: string; textSnapshot: string }>} */
const VISUAL_PAGES = [
  {
    spec: "contact.visual.spec.ts",
    path: "/contact",
    label: "contact",
    visualSnapshot: "contact-main.png",
    textSnapshot: "contact-main.txt",
  },
  {
    spec: "sim-hub.visual.spec.ts",
    path: "/sim",
    label: "sim-hub",
    visualSnapshot: "sim-hub.png",
    textSnapshot: "sim-hub-head.txt",
  },
  {
    spec: "article-template.visual.spec.ts",
    path: "/articles/sim-20gb-osusume",
    label: "article-sim-20gb",
    visualSnapshot: "article-sim-20gb.png",
    textSnapshot: "article-sim-20gb-head.txt",
  },
];

const PASS = "✅";
const FAIL = "❌";
const SKIP = "➖";

function parseArgs(argv) {
  const args = { dryRun: false, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--output") {
      args.output = argv[i + 1] ?? null;
      i += 1;
    }
  }
  return args;
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

/** @param {string} file */
function normalizeSpecFile(file) {
  const parts = file.replace(/\\/g, "/").split("/");
  return parts.at(-1) ?? file;
}

/** @param {unknown} suites */
function collectSpecs(suites) {
  /** @type {Array<Record<string, unknown>>} */
  const specs = [];

  /** @param {unknown} nodes */
  function walk(nodes) {
    if (!Array.isArray(nodes)) {
      return;
    }
    for (const node of nodes) {
      if (Array.isArray(node.specs)) {
        specs.push(...node.specs);
      }
      if (Array.isArray(node.suites)) {
        walk(node.suites);
      }
    }
  }

  walk(suites);
  return specs;
}

/** @param {string | undefined} message */
function parseFailureKind(message) {
  if (!message) {
    return "unknown";
  }
  const plain = stripAnsi(message);
  if (plain.includes("toHaveScreenshot")) {
    return "visual";
  }
  if (plain.includes("toMatchSnapshot")) {
    return "text";
  }
  return "unknown";
}

/** @param {string | undefined} message */
function parseDiffRatio(message) {
  if (!message) {
    return null;
  }
  const plain = stripAnsi(message);
  const match = plain.match(/ratio\s+(\d+(?:\.\d+)?)/i);
  if (!match) {
    return null;
  }
  const ratio = Number.parseFloat(match[1]);
  if (!Number.isFinite(ratio)) {
    return null;
  }
  return ratio;
}

/** @param {Record<string, unknown> | undefined} spec */
function getSpecResult(spec) {
  if (!spec) {
    return { ok: false, kind: "missing", diffRatio: null, snapshot: null };
  }

  if (spec.ok === true) {
    return { ok: true, kind: null, diffRatio: null, snapshot: null };
  }

  const tests = /** @type {Array<Record<string, unknown>> | undefined} */ (spec.tests);
  const test = tests?.[0];
  const results = /** @type {Array<Record<string, unknown>> | undefined} */ (
    test?.results
  );
  const result = results?.[results.length - 1];
  const error = /** @type {{ message?: string } | undefined} */ (result?.error);
  const message = error?.message;
  const kind = parseFailureKind(message);
  const diffRatio = kind === "visual" ? parseDiffRatio(message) : null;

  const snapshotMatch = stripAnsi(message ?? "").match(/Snapshot:\s+(\S+)/);
  const snapshot = snapshotMatch?.[1] ?? null;

  return { ok: false, kind, diffRatio, snapshot };
}

/** @param {boolean | null} passed @param {boolean | null} failed @param {boolean | null} skipped */
function statusCell(passed, failed, skipped) {
  if (passed) {
    return PASS;
  }
  if (failed) {
    return FAIL;
  }
  if (skipped) {
    return SKIP;
  }
  return FAIL;
}

/** @param {{ ok: boolean; kind: string | null; diffRatio: number | null; snapshot: string | null }} result @param {string | null} artifactUrl */
function buildDetail(result, artifactUrl) {
  if (result.ok) {
    return "一致";
  }

  const parts = [];

  if (result.kind === "visual") {
    if (result.diffRatio != null) {
      parts.push(`PNG diff ${(result.diffRatio * 100).toFixed(1)}%`);
    } else {
      parts.push("PNG 不一致");
    }
    if (result.snapshot) {
      parts.push(`\`${result.snapshot}\``);
    }
  } else if (result.kind === "text") {
    parts.push("text snapshot 不一致");
    if (result.snapshot) {
      parts.push(`\`${result.snapshot}\``);
    }
  } else if (result.kind === "missing") {
    parts.push("結果未取得");
  } else {
    parts.push("テスト失敗");
  }

  if (artifactUrl && result.kind === "visual") {
    parts.push(`[artifact](${artifactUrl})`);
  }

  return parts.join(" / ");
}

/** @param {Record<string, Record<string, unknown>>} specByFile @param {string | null} artifactUrl */
function buildMarkdown(specByFile, artifactUrl) {
  const rows = VISUAL_PAGES.map((page) => {
    const result = getSpecResult(specByFile[page.spec]);
    const visualPassed = result.ok || result.kind === "text";
    const visualFailed = !result.ok && result.kind === "visual";

    const textPassed = result.ok;
    const textFailed = !result.ok && result.kind === "text";
    const textSkipped = !result.ok && result.kind === "visual";

    return {
      path: `\`${page.path}\``,
      visual: statusCell(visualPassed, visualFailed, false),
      text: statusCell(textPassed, textFailed, textSkipped),
      detail: buildDetail(result, artifactUrl),
    };
  });

  const failedCount = rows.filter(
    (row) => row.visual === FAIL || row.text === FAIL,
  ).length;
  const headline =
    failedCount === 0
      ? "Visual regression: すべて PASS"
      : `Visual regression: ${failedCount} 件 FAIL`;

  const lines = [
    COMMENT_MARKER,
    `## ${headline}`,
    "",
    "| ページ | Visual (PNG) | Text | 詳細 |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.path} | ${row.visual} | ${row.text} | ${row.detail} |`),
    "",
    "_Playwright hybrid visual regression (`pull-request.yml`)_",
  ];

  if (artifactUrl && failedCount > 0) {
    lines.push(
      "",
      `PNG の expected / actual / diff は [Actions run の artifact \`${process.env.VISUAL_ARTIFACT_NAME ?? "playwright-visual-diff"}\`](${artifactUrl}) からダウンロードできます。`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function loadReport(reportPath) {
  if (!existsSync(reportPath)) {
    return null;
  }
  const raw = readFileSync(reportPath, "utf8");
  return JSON.parse(raw);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath =
    process.env.VISUAL_REPORT_PATH ??
    join(repoRoot, "site/test-results/visual-report.json");
  const outputPath =
    args.output ??
    process.env.VISUAL_COMMENT_OUTPUT ??
    join(repoRoot, "site/test-results/visual-pr-comment.md");

  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const artifactName = process.env.VISUAL_ARTIFACT_NAME ?? "playwright-visual-diff";

  const artifactUrl =
    repository && runId
      ? `https://github.com/${repository}/actions/runs/${runId}#artifacts`
      : null;

  const report = loadReport(reportPath);
  /** @type {Record<string, Record<string, unknown>>} */
  const specByFile = {};

  if (report?.suites) {
    for (const spec of collectSpecs(report.suites)) {
      const file = /** @type {string | undefined} */ (spec.file);
      if (file) {
        specByFile[normalizeSpecFile(file)] = spec;
      }
    }
  }

  const markdown =
    report == null
      ? [
          COMMENT_MARKER,
          "## Visual regression: レポート未取得",
          "",
          `\`visual-report.json\` が見つかりません (\`${reportPath}\`)。`,
          "",
          "Playwright の実行ログと artifact を確認してください。",
          "",
        ].join("\n")
      : buildMarkdown(specByFile, artifactUrl);

  if (args.dryRun) {
    process.stdout.write(markdown);
    return;
  }

  writeFileSync(outputPath, markdown, "utf8");
  process.stdout.write(`Wrote PR comment markdown to ${outputPath}\n`);
}

main();
