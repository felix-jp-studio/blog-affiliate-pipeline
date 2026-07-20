#!/usr/bin/env bash
# Run gh CLI as felix-jp-studio-bot (optional; Cursor agent sessions).
# Falls back to gh-user.sh for pr/issue when token is missing or gh fails.
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

can_fallback() {
  [[ "${1:-}" == "pr" || "${1:-}" == "issue" ]]
}

if [[ -z "${TOKEN}" ]]; then
  if can_fallback "${1:-}"; then
    echo "Warning: GITHUB_BOT_TOKEN (or GH_TOKEN_BOT) is not set; falling back to gh-user.sh." >&2
    echo "See docs/cursor-github-integration.md#bot-pat-は任意" >&2
    exec "${SCRIPT_DIR}/gh-user.sh" "$@"
  fi
  echo "Error: GITHUB_BOT_TOKEN (or GH_TOKEN_BOT) is not set." >&2
  echo "See docs/cursor-github-integration.md#bot-pat-は任意" >&2
  exit 1
fi

if GH_TOKEN="${TOKEN}" gh "$@"; then
  exit 0
fi

if can_fallback "${1:-}"; then
  echo "Warning: gh-bot failed; falling back to gh-user.sh." >&2
  exec "${SCRIPT_DIR}/gh-user.sh" "$@"
fi

exit 1
