#!/usr/bin/env node
/**
 * Parse A8 / ValueCommerce tracking URLs from plain text or HTML snippets.
 * No ASP login — user pastes content copied from management portals.
 *
 * Usage:
 *   npm run affiliate:parse -- --file paste.html
 *   echo '...' | npm run affiliate:parse
 *   npm run affiliate:parse -- --text 'https://px.a8.net/...'
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  extractProgramIdFromUrl,
  inferProviderFromUrl,
  readAspUrls,
  validateTrackingUrl,
} from "./lib.mjs";

const HREF_PATTERN = /href\s*=\s*["']([^"']+)["']/gi;
const URL_PATTERN =
  /https:\/\/(?:px\.a8\.net\/[^\s"'<>]+|[^\s"'<>]*valuecommerce\.com\/[^\s"'<>]+)/gi;

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractCandidateUrls(text) {
  const urls = new Set();

  for (const match of text.matchAll(HREF_PATTERN)) {
    const href = match[1].trim();
    if (href.startsWith("https://")) {
      urls.add(href);
    }
  }

  for (const match of text.matchAll(URL_PATTERN)) {
    urls.add(match[0].replace(/[),.;]+$/, ""));
  }

  return [...urls];
}

/**
 * @param {string} text
 * @param {object} registry
 * @returns {object[]}
 */
export function parseAspPaste(text, registry) {
  const candidates = extractCandidateUrls(text);
  const parsed = [];
  const seen = new Set();

  for (const trackingUrl of candidates) {
    const normalized = trackingUrl.replace(/&amp;/g, "&");
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const provider = inferProviderFromUrl(normalized, registry);
    if (!provider) continue;

    const urlError = validateTrackingUrl(normalized, provider, registry);
    if (urlError) continue;

    let programId = null;
    try {
      programId = extractProgramIdFromUrl(normalized, provider);
    } catch {
      programId = null;
    }

    parsed.push({
      trackingUrl: normalized,
      provider,
      programId,
      source:
        text.includes(`href="${normalized}"`) || text.includes(`href='${normalized}'`)
          ? "html-href"
          : "plain-url",
    });
  }

  return parsed;
}

function parseArgs(argv) {
  const args = { file: null, text: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") {
      args.file = argv[i + 1];
      i += 1;
    } else if (arg === "--text") {
      args.text = argv[i + 1];
      i += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}

async function readInput(args) {
  if (args.text) return args.text;
  if (args.file) return readFileSync(args.file, "utf8");
  return readStdin();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const text = await readInput(args);
  if (!text.trim()) {
    throw new Error("No input text. Provide --file, --text, or stdin.");
  }

  const registry = readAspUrls();
  const parsed = parseAspPaste(text, registry);

  if (parsed.length === 0) {
    console.error("No valid A8 / ValueCommerce tracking URLs found in paste.");
    process.exit(2);
  }

  if (args.json) {
    console.log(JSON.stringify(parsed, null, 2));
    return;
  }

  for (const entry of parsed) {
    console.log(`[${entry.provider}] ${entry.trackingUrl}`);
    if (entry.programId) {
      console.log(`  programId: ${entry.programId}`);
    }
  }
  console.log(
    `\nParsed ${parsed.length} tracking URL(s). Pipe to intake after adding programKey.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`affiliate:parse failed: ${error.message}`);
    process.exit(1);
  });
}
