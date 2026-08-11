import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../e2e/e2e-utils.mjs";

export const PATHS = {
  state: join(repoRoot, "config/visitability-pdca-state.json"),
  brief: join(repoRoot, "data/visitability-cycle-brief.json"),
  keywordSeed: join(repoRoot, "data/keywords.seed.csv"),
  indexQueue: join(repoRoot, "data/gsc-index-queue.json"),
  rewriteQueue: join(repoRoot, "data/gsc-rewrite-queue.json"),
  articlesDir: join(repoRoot, "site/src/content/articles"),
  hubMesh: join(repoRoot, "site/src/data/hub-article-mesh.ts"),
  pdcaLog: join(repoRoot, "docs/operations/visitability-pdca-log.md"),
};

export const TARGET_RATIO = {
  comparison: 40,
  howto: 25,
  troubleshoot: 25,
  crosssell: 10,
};

export const TEMPLATES = {
  comparison_x2_crosssell: [
    { articleType: "comparison", count: 2 },
    { articleType: "crosssell", count: 1 },
  ],
  howto_x2_trouble: [
    { articleType: "howto", count: 2 },
    { articleType: "troubleshoot", count: 1 },
  ],
  single_article: [{ articleType: "howto", count: 1 }],
};

export function readJson(path, fallback = null) {
  if (!existsSync(path)) {
    return fallback;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function loadKeywordSeed() {
  const lines = readFileSync(PATHS.keywordSeed, "utf8").trim().split("\n");
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [keyword, articleType, priorityRaw] = line.split(",");
    rows.push({
      keyword: keyword.trim(),
      articleType: articleType.trim(),
      priority: Number.parseInt(priorityRaw, 10),
    });
  }
  return rows;
}

export function keywordSeedMaxPriority(rows) {
  return rows.reduce((max, row) => Math.max(max, row.priority), 0);
}

export function loadUsedKeywords() {
  const used = new Set();
  for (const file of readdirSync(PATHS.articlesDir).filter((name) =>
    name.endsWith(".md"),
  )) {
    const content = readFileSync(join(PATHS.articlesDir, file), "utf8");
    const match = content.match(/^keyword:\s*(.+)\s*$/m);
    if (match) {
      used.add(match[1].trim());
    }
  }
  return used;
}

export function loadArticleCounts() {
  const counts = {
    comparison: 0,
    howto: 0,
    troubleshoot: 0,
    crosssell: 0,
    other: 0,
  };

  for (const file of readdirSync(PATHS.articlesDir).filter((name) =>
    name.endsWith(".md"),
  )) {
    const content = readFileSync(join(PATHS.articlesDir, file), "utf8");
    const draftMatch = content.match(/^draft:\s*(true|false)\s*$/m);
    if (draftMatch?.[1] === "true") continue;
    const typeMatch = content.match(/^articleType:\s*(\w+)\s*$/m);
    const articleType = typeMatch?.[1] ?? "other";
    if (articleType in counts) {
      counts[articleType] += 1;
    } else {
      counts.other += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const ratios = Object.fromEntries(
    Object.entries(counts).map(([type, count]) => [
      type,
      total > 0 ? Math.round((count / total) * 1000) / 1000 : 0,
    ]),
  );
  const gaps = Object.fromEntries(
    Object.keys(TARGET_RATIO).map((type) => [
      type,
      Math.round((TARGET_RATIO[type] / 100 - (ratios[type] ?? 0)) * 1000) / 1000,
    ]),
  );

  return { counts, ratios, gaps, total };
}

export function loadIndexQueueMetrics() {
  const queue = readJson(PATHS.indexQueue, { entries: [] });
  const entries = queue.entries ?? [];
  const indexed = entries.filter((entry) => entry.indexed === true).length;
  const total = entries.length;
  const rate = total > 0 ? Math.round((indexed / total) * 1000) / 1000 : 0;
  return { total, indexed, rate, pending: total - indexed };
}

export function loadRewriteQueueCount() {
  const queue = readJson(PATHS.rewriteQueue, { items: [] });
  const items = queue.items ?? queue.entries ?? [];
  return Array.isArray(items) ? items.length : 0;
}

export function inferCategory(keyword, articleType) {
  if (articleType === "troubleshoot") return "trouble";
  if (articleType === "crosssell") return "cost";
  if (
    /光|ひかり|NURO|WiMAX|フレッツ|プロバイダ|ホームルーター|開通|工事|でんき|電気|固定費|引越|引っ越し/i.test(
      keyword,
    )
  ) {
    return articleType === "crosssell" ? "cost" : "hikari";
  }
  return "sim";
}

export function makeLabelFromTitle(title) {
  const short = title.split("【")[0].split("｜")[0].trim();
  if (short.length <= 24) return short;
  return `${short.slice(0, 22)}…`;
}

export function slugFromArticlePath(outputPath) {
  const match = outputPath.match(/\/([^/]+)\.md$/);
  return match?.[1] ?? null;
}

export function pickUnusedKeywords(seedRows, usedKeywords, articleType, count) {
  const candidates = seedRows.filter(
    (row) => row.articleType === articleType && !usedKeywords.has(row.keyword),
  );
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.slice(0, count);
}

export function selectTemplate(metrics, state = {}) {
  const crosssellGap = metrics.typeRatioGaps?.crosssell ?? 0;
  const howtoGap = metrics.typeRatioGaps?.howto ?? 0;
  const troubleGap = metrics.typeRatioGaps?.troubleshoot ?? 0;

  if (crosssellGap > 0.08) {
    return "comparison_x2_crosssell";
  }
  if (howtoGap > 0.05 || troubleGap > 0.05) {
    return "howto_x2_trouble";
  }
  const cycleNumber = state.cycleNumber ?? 32;
  return cycleNumber % 2 === 0 ? "comparison_x2_crosssell" : "howto_x2_trouble";
}

export function appendKeywordRows(existingRows, newRows) {
  const seen = new Set(existingRows.map((row) => row.keyword));
  const merged = [...existingRows];
  for (const row of newRows) {
    if (seen.has(row.keyword)) continue;
    merged.push(row);
    seen.add(row.keyword);
  }
  return merged;
}

export function serializeKeywordSeed(rows) {
  const lines = ["keyword,article_type,priority"];
  for (const row of rows) {
    lines.push(`${row.keyword},${row.articleType},${row.priority}`);
  }
  return `${lines.join("\n")}\n`;
}
