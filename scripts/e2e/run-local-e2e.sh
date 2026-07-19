#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

echo "[e2e] generator integration test (template generate → validate)"
PYTHONPATH=packages/generator python3 -m unittest tests.test_e2e_publish -q

echo "[e2e] validate repository article markdown"
node scripts/e2e/validate-articles.mjs

echo "[e2e] build site"
(
  cd site
  npm run build
)

echo "[e2e] validate dist output"
node scripts/e2e/validate-dist.mjs

echo "[OK] local E2E passed"
