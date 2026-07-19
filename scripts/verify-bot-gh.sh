#!/usr/bin/env bash
# Verify felix-jp-studio-bot can access this repository via GITHUB_BOT_TOKEN.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Checking bot GitHub CLI access..."
if ! "${SCRIPT_DIR}/gh-bot.sh" auth status 2>&1 | grep -q "felix-jp-studio-bot"; then
  echo "Warning: active account may not be felix-jp-studio-bot (GH_TOKEN overrides gh auth)." >&2
  echo "Proceeding with API check..." >&2
fi

REPO="${1:-felix-jp-studio/blog-affiliate-pipeline}"
echo "Repository: ${REPO}"

LOGIN="$("${SCRIPT_DIR}/gh-bot.sh" api user --jq .login 2>/dev/null || true)"
if [[ -z "${LOGIN}" ]]; then
  echo "Error: could not read bot user via API. Check GITHUB_BOT_TOKEN." >&2
  exit 1
fi
echo "Authenticated as: ${LOGIN}"

if [[ "${LOGIN}" != "felix-jp-studio-bot" ]]; then
  echo "Warning: expected felix-jp-studio-bot, got ${LOGIN}" >&2
fi

"${SCRIPT_DIR}/gh-bot.sh" repo view "${REPO}" --json nameWithOwner,isPrivate --jq '"OK: " + .nameWithOwner + " (private=" + (.isPrivate|tostring) + ")"'
echo "Bot access verification succeeded."
