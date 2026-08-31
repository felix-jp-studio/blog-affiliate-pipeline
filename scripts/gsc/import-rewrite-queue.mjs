/**
 * GSC Performance CSV → rewrite-queue candidate collection.
 * Query rows match published keywords; page rows match /articles/{slug}.
 */

export function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return { headers, rows };
}

export function serializeCsv(headers, rows) {
  const body = rows.map((row) => headers.map((header) => row[header] ?? "").join(","));
  return `${[headers.join(","), ...body].join("\n")}\n`;
}

export function normalizeQuery(value) {
  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function pickField(row, names) {
  for (const name of names) {
    const exact = row[name];
    if (exact !== undefined && exact !== "") {
      return exact;
    }
    const found = Object.entries(row).find(
      ([key]) => key.toLowerCase() === name.toLowerCase(),
    );
    if (found?.[1]) {
      return found[1];
    }
  }
  return "";
}

export function slugFromPageUrl(pageUrl) {
  const raw = String(pageUrl ?? "").trim();
  if (!raw) {
    return "";
  }
  let path = raw;
  if (raw.includes("://")) {
    try {
      path = new URL(raw).pathname;
    } catch {
      return "";
    }
  }
  const match = path.match(/\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i);
  return match ? match[1].toLowerCase() : "";
}

export function resolveSlug(query, keywordIndex) {
  const normalized = normalizeQuery(query);
  if (keywordIndex.has(normalized)) {
    return keywordIndex.get(normalized);
  }
  for (const [keyword, slug] of keywordIndex.entries()) {
    if (normalized.includes(keyword) || keyword.includes(normalized)) {
      return slug;
    }
  }
  return "";
}

export function buildKeywordIndex(articles) {
  const index = new Map();
  for (const article of articles) {
    if (article.draft || !article.fields?.keyword) {
      continue;
    }
    index.set(normalizeQuery(article.fields.keyword), article.slug);
  }
  return index;
}

export function collectCandidates({
  gscRows,
  queueRows,
  articles,
  minPosition = 11,
  maxPosition = 30,
}) {
  const keywordIndex = buildKeywordIndex(articles);
  const publishedSlugs = new Set(
    articles
      .filter((article) => !article.draft && article.slug)
      .map((article) => article.slug),
  );
  const seenQueries = new Set(
    queueRows.map((row) => normalizeQuery(row.query)).filter(Boolean),
  );
  const seenSlugs = new Set(queueRows.map((row) => row.slug).filter(Boolean));
  const candidates = [];

  for (const row of gscRows) {
    const page = pickField(row, ["Page", "page", "URL", "Landing page", "ページ"]);
    const query = pickField(row, ["Query", "query", "Top queries", "クエリ"]);
    const positionRaw = pickField(row, [
      "Position",
      "position",
      "Average position",
      "掲載順位",
    ]);
    const position = Number.parseFloat(positionRaw);
    if (Number.isNaN(position) || position < minPosition || position > maxPosition) {
      continue;
    }

    let slug = "";
    let label = query;
    let notes = "GSC 11-30位";

    if (page) {
      slug = slugFromPageUrl(page);
      if (!slug || !publishedSlugs.has(slug)) {
        continue;
      }
      label = query || page;
      notes = "GSC page 11-30位";
    } else if (query) {
      slug = resolveSlug(query, keywordIndex);
      notes = slug ? "GSC 11-30位" : "GSC 11-30位（slug要確認）";
    } else {
      continue;
    }

    if (label && seenQueries.has(normalizeQuery(label))) {
      continue;
    }
    if (slug && seenSlugs.has(slug)) {
      continue;
    }

    if (label) {
      seenQueries.add(normalizeQuery(label));
    }
    if (slug) {
      seenSlugs.add(slug);
    }

    candidates.push({
      slug,
      query: label,
      position: position.toFixed(1),
      priority: String(candidates.length + 1),
      status: "pending",
      notes,
    });
  }

  candidates.sort(
    (a, b) => Number.parseFloat(a.position) - Number.parseFloat(b.position),
  );
  candidates.forEach((row, index) => {
    row.priority = String(index + 1);
  });
  return candidates;
}
