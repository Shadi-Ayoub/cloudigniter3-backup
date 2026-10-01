#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
command -v python3 >/dev/null 2>&1 || { echo 'Python 3 is required for the preview server.' >&2; exit 1; }
PORT="${PORT:-4173}"
case "$PORT" in ''|*[!0-9]*) echo 'PORT must be a number.' >&2; exit 1;; esac
[ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || { echo 'Use a port between 1024 and 65535.' >&2; exit 1; }
bash "$ROOT/scripts/prepare-static-deploy.sh"
printf '\nPreview: http://127.0.0.1:%s — stop with Ctrl+C.\n' "$PORT"
cd "$ROOT/dist"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
