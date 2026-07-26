#!/usr/bin/env bash
# Approve action_required workflow runs for a given commit SHA.
# Requires GH_TOKEN with actions approve permission (e.g. GITHUB_BOT_TOKEN).
set -euo pipefail

SHA="${1:-}"
REPO="${2:-${GITHUB_REPOSITORY:-}}"

if [[ -z "${SHA}" || -z "${REPO}" ]]; then
  echo "Usage: approve-pending-runs.sh <head_sha> [owner/repo]" >&2
  exit 1
fi

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "[skip] GH_TOKEN is not set"
  exit 0
fi

approve_runs() {
  gh api "repos/${REPO}/actions/runs?head_sha=${SHA}&per_page=30" \
    --jq '.workflow_runs[] | select(.status == "action_required") | .id' \
    | while read -r RUN_ID; do
        [[ -z "${RUN_ID}" ]] && continue
        echo "Approving workflow run ${RUN_ID}..."
        gh api --method POST "repos/${REPO}/actions/runs/${RUN_ID}/approve" || true
      done
}

for _attempt in 1 2 3 4 5 6; do
  PENDING=$(
    gh api "repos/${REPO}/actions/runs?head_sha=${SHA}&per_page=30" \
      --jq '[.workflow_runs[] | select(.status == "action_required")] | length'
  )
  if [[ "${PENDING}" -gt 0 ]]; then
    approve_runs
  fi
  sleep 15
done

echo "Done polling action_required runs for ${SHA}."
