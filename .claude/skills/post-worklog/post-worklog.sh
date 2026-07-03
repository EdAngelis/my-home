#!/usr/bin/env bash
# Post a worklog to the Issues Creator app.
#
# The JSON body is read from the file given as the first argument (or from stdin
# when the argument is "-"). The base URL and bearer token come from the
# environment, so the secret never appears on the command line or in the CLI
# transcript.
#
# Usage:
#   WORKLOG_API_URL=... WORKLOG_API_TOKEN=... ./post-worklog.sh body.json
#   ... | ./post-worklog.sh -
#
# Config resolution (first match wins):
#   1. worklog.env sitting next to this script (gitignored) — set it once.
#   2. WORKLOG_API_URL / WORKLOG_API_TOKEN already in the environment.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/worklog.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/worklog.env"
  set +a
fi

: "${WORKLOG_API_URL:?Set WORKLOG_API_URL in worklog.env or the environment, e.g. http://localhost:3000}"
: "${WORKLOG_API_TOKEN:?Set WORKLOG_API_TOKEN in worklog.env or the environment (must match the app's value)}"

body="${1:--}" # file path, or "-" for stdin

curl -sS -w '\nHTTP %{http_code}\n' -X POST "$WORKLOG_API_URL/api/worklog" \
  -H "Authorization: Bearer $WORKLOG_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "@$body"
