#!/usr/bin/env bash
# Run gh CLI as the default human account (felix-jp-studio).
# Uses gh auth keyring; do not set GH_TOKEN here.
set -euo pipefail

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

gh "$@"
