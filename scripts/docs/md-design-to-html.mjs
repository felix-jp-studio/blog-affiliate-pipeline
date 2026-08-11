#!/usr/bin/env node
/**
 * Convert docs/*-design.md to styled HTML design documents.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { marked } from "marked";
import { repoRoot } from "../e2e/e2e-utils.mjs";

const DOCS_DIR = join(repoRoot, "docs");

const STYLES = `
      :root {
        color-scheme: light dark;
        --bg: #0f1419;
        --card: #1a2332;
        --text: #e7ecf3;
        --muted: #9fb0c3;
        --accent: #5b9fd4;
        --border: #2a3544;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #f6f8fb;
          --card: #fff;
          --text: #1a2332;
          --muted: #5a6b7d;
          --accent: #2563eb;
          --border: #d8e0ea;
        }
      }
      * { box-sizing: border-box; }
      body {
        font-family: "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif;
        line-height: 1.65;
        margin: 0;
        background: var(--bg);
        color: var(--text);
      }
      header, main, footer {
        max-width: 960px;
        margin: 0 auto;
        padding: 0 1.5rem;
      }
      header { padding-top: 2.5rem; padding-bottom: 1rem; }
      header h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
      header p { margin: 0; color: var(--muted); font-size: 0.92rem; }
      main {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.5rem 1.75rem;
        margin-bottom: 2rem;
      }
      main h2 { font-size: 1.2rem; color: var(--accent); margin-top: 2rem; }
      main h2:first-child { margin-top: 0; }
      main h3 { font-size: 1rem; margin-top: 1.25rem; }
      main h4 { font-size: 0.95rem; }
      main p, main li { font-size: 0.95rem; }
      main blockquote {
        margin: 1rem 0;
        padding: 0.75rem 1rem;
        border-left: 3px solid var(--accent);
        background: rgba(91, 159, 212, 0.08);
        color: var(--muted);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
        margin: 1rem 0;
      }
      th, td {
        border: 1px solid var(--border);
        padding: 0.5rem 0.65rem;
        text-align: left;
        vertical-align: top;
      }
      th { background: rgba(91, 159, 212, 0.12); }
      code {
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        font-size: 0.85em;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.1em 0.35em;
        border-radius: 4px;
      }
      pre {
        overflow-x: auto;
        background: rgba(0, 0, 0, 0.25);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1px solid var(--border);
        font-size: 0.85rem;
      }
      pre code { background: none; padding: 0; }
      pre.diagram, pre.language-mermaid {
        font-family: ui-monospace, monospace;
        white-space: pre;
        font-size: 0.78rem;
        line-height: 1.4;
      }
      ul, ol { padding-left: 1.25rem; }
      hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
      footer { padding-bottom: 2rem; color: var(--muted); font-size: 0.85rem; }
      a { color: var(--accent); }
`;

marked.setOptions({ gfm: true, breaks: false });

const renderer = new marked.Renderer();
const defaultCode = renderer.code.bind(renderer);
renderer.code = ({ text, lang }) => {
  if (lang === "mermaid") {
    return `<pre class="diagram">${escapeHtml(text)}</pre>`;
  }
  return defaultCode({ text, lang });
};
marked.use({ renderer });

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "設計書";
}

function stripLeadingH1(markdown) {
  return markdown.replace(/^#\s+.+\n+/, "");
}

function buildHtml(title, bodyHtml, sourceName) {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — 設計書</title>
    <style>${STYLES}
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>blog-affiliate-pipeline / ソース: ${escapeHtml(sourceName)} / HTML 自動生成</p>
    </header>
    <main>
      ${bodyHtml}
    </main>
    <footer>blog-affiliate-pipeline docs — ${escapeHtml(sourceName)}</footer>
  </body>
</html>
`;
}

function convertFile(mdPath) {
  const markdown = readFileSync(mdPath, "utf8");
  const sourceName = basename(mdPath);
  const title = extractTitle(markdown);
  const body = stripLeadingH1(markdown);
  const bodyHtml = marked.parse(body);
  const htmlPath = mdPath.replace(/\.md$/, ".html");
  writeFileSync(htmlPath, buildHtml(title, bodyHtml, sourceName), "utf8");
  return htmlPath;
}

function main() {
  const files = readdirSync(DOCS_DIR)
    .filter((name) => name.endsWith("-design.md"))
    .map((name) => join(DOCS_DIR, name))
    .sort();

  if (files.length === 0) {
    console.error("No *-design.md files found in docs/");
    process.exit(1);
  }

  for (const file of files) {
    const out = convertFile(file);
    console.log(`${basename(file)} → ${basename(out)}`);
  }
}

main();
