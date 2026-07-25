#!/usr/bin/env bash
# CI と同一 OS（Linux）で Playwright visual baseline を更新する。
# macOS 等で npm run test:e2e:visual:update すると OS 差で誤検知するため、本スクリプトを使う。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.61.1-noble}"
MODE="${1:-update}"

case "${MODE}" in
  update)
    NPM_SCRIPT="test:e2e:visual:update"
    ;;
  verify)
    NPM_SCRIPT="test:e2e:visual"
    ;;
  *)
    echo "Usage: $0 [update|verify]" >&2
    exit 1
    ;;
esac

echo "Running ${NPM_SCRIPT} in ${PLAYWRIGHT_IMAGE} ..."

docker run --rm \
  -v "${ROOT}:/work" \
  -v /work/site/node_modules \
  -w /work/site \
  -e CI=true \
  -e PUBLIC_CONTACT_FORM_ACTION="" \
  "${PLAYWRIGHT_IMAGE}" \
  bash -lc "npm ci && npm run ${NPM_SCRIPT}"
