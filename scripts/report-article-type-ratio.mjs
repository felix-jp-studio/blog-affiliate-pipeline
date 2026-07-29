/**
 * Report published article type ratios vs weekly schedule targets.
 *
 * Usage:
 *   node scripts/report-article-type-ratio.mjs
 *   node scripts/report-article-type-ratio.mjs --format=md
 *   node scripts/report-article-type-ratio.mjs --json
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./e2e/e2e-utils.mjs";

const articlesDir = join(repoRoot, "site/src/content/articles");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const formatArg = args.find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";

const TARGET_RATIO = {
  comparison: 40,
  howto: 25,
  troubleshoot: 25,
  crosssell: 10,
};

const WEEKLY_QUOTA = {
  comparison: 2,
  howto: 2,
  troubleshoot: 2,
  crosssell: 1,
};

function parseArticleType(content) {
  const match = content.match(/^articleType:\s*(\w+)\s*$/m);
  return match?.[1] ?? null;
}

function isPublished(content) {
  const draftMatch = content.match(/^draft:\s*(true|false)\s*$/m);
  return draftMatch?.[1] !== "true";
}

function loadCounts() {
  const counts = {
    comparison: 0,
    howto: 0,
    troubleshoot: 0,
    crosssell: 0,
    other: 0,
  };

  for (const file of readdirSync(articlesDir).filter((name) => name.endsWith(".md"))) {
    const content = readFileSync(join(articlesDir, file), "utf8");
    if (!isPublished(content)) {
      continue;
    }
    const articleType = parseArticleType(content);
    if (articleType && articleType in counts) {
      counts[articleType] += 1;
    } else {
      counts.other += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const ratios = Object.fromEntries(
    Object.entries(counts).map(([type, count]) => [
      type,
      total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    ]),
  );

  const gaps = Object.fromEntries(
    Object.keys(TARGET_RATIO).map((type) => [
      type,
      Math.round((TARGET_RATIO[type] - (ratios[type] ?? 0)) * 10) / 10,
    ]),
  );

  return { counts, ratios, gaps, total };
}

function statusEmoji(gap) {
  if (gap <= 0) {
    return "✅";
  }
  if (gap <= 10) {
    return "⚠️";
  }
  return "🔴";
}

const report = loadCounts();

if (asJson) {
  console.log(
    JSON.stringify(
      { target: TARGET_RATIO, weeklyQuota: WEEKLY_QUOTA, ...report },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (format === "md") {
  const lines = [
    "## 記事タイプ比率レポート",
    "",
    `公開記事 **${report.total}** 本（draft 除外）`,
    "",
    "| タイプ | 本数 | 実比率 | 目標 | 差分 | 週次枠 |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const type of ["comparison", "howto", "troubleshoot", "crosssell"]) {
    lines.push(
      `| ${type} | ${report.counts[type]} | ${report.ratios[type]}% | ${TARGET_RATIO[type]}% | ${statusEmoji(report.gaps[type])} ${report.gaps[type]}pt | ${WEEKLY_QUOTA[type]}/週 |`,
    );
  }

  if (report.counts.other > 0) {
    lines.push(
      `| other | ${report.counts.other} | ${report.ratios.other}% | — | — | — |`,
    );
  }

  lines.push("");
  lines.push(
    "_目標比率は公開済み記事の偏り監視用。週次スケジュール（2/2/2/1）は `config/publish-schedule.json` に準拠。_",
  );
  console.log(lines.join("\n"));
  process.exit(0);
}

console.log(`Article type ratio (${report.total} published)\n`);
for (const type of ["comparison", "howto", "troubleshoot", "crosssell"]) {
  console.log(
    `${type.padEnd(14)} ${String(report.counts[type]).padStart(3)} (${report.ratios[type]}%)  target ${TARGET_RATIO[type]}%  gap ${report.gaps[type]}pt`,
  );
}
