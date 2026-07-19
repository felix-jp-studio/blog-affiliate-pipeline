#!/usr/bin/env bash
# Run gh CLI as felix-jp-studio-bot (Cursor agent sessions).
# Requires GITHUB_BOT_TOKEN or GH_TOKEN_BOT in the environment.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load .env.local if present (gitignored; never commit tokens)
if [[ -f "${REPO_ROOT}/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env.local"
  set +a
fi

TOKEN="${GITHUB_BOT_TOKEN:-${GH_TOKEN_BOT:-}}"

if [[ -z "${TOKEN}" ]]; then
  echo "Error: GITHUB_BOT_TOKEN (or GH_TOKEN_BOT) is not set." >&2
  echo "See docs/cursor-github-integration.md#環境構築" >&2
  exit 1
fi

GH_TOKEN="${TOKEN}" gh "$@"
