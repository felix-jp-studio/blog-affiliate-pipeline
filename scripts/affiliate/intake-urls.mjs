#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { applyIntakeBatch, readAspUrls, writeAspUrls } from "./lib.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, file: null, programKey: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--file") {
      args.file = argv[i + 1];
      i += 1;
    } else if (!arg.startsWith("-")) {
      args.programKey = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function readInput(file) {
  const raw = file ? readFileSync(file, "utf8") : await readStdin();
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
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

function normalizeEntries(entries, defaultProgramKey) {
  return entries.map((entry) => {
    const programKey = entry.programKey ?? entry.id ?? defaultProgramKey;
    if (!programKey) {
      throw new Error("programKey is required (CLI arg, entry.programKey, or entry.id)");
    }
    return { ...entry, programKey };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const entries = normalizeEntries(await readInput(args.file), args.programKey);
  const registry = readAspUrls();
  const { registry: nextRegistry, changes } = applyIntakeBatch(registry, entries);

  if (args.dryRun) {
    console.log("[dry-run] Would update asp-urls.json:");
    for (const entry of entries) {
      console.log(`  - ${entry.programKey}: ${entry.trackingUrl ?? "(from registry)"}`);
    }
    console.log(JSON.stringify(nextRegistry.programs, null, 2));
    return;
  }

  writeAspUrls(nextRegistry);
  console.log(`Updated config/asp-urls.json (${changes.length} field changes)`);
  for (const entry of entries) {
    console.log(`  ✓ ${entry.programKey}`);
  }
}

main().catch((error) => {
  console.error(`affiliate:intake failed: ${error.message}`);
  process.exit(1);
});
