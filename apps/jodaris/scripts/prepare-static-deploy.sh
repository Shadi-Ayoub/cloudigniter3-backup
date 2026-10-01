#!/usr/bin/env bash
# Copy only the public HTML. Never publish the development tree.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
command -v node >/dev/null 2>&1 || { echo 'Node.js is required for structural checks.' >&2; exit 1; }
node "$ROOT/scripts/check.mjs"
if [ -L "$ROOT/dist" ]; then echo 'Refusing a symlinked dist directory.' >&2; exit 1; fi
mkdir -p "$ROOT/dist"
# Do not delete unexpected files from an existing directory or accidentally ship them.
while IFS= read -r -d '' item; do
  if [ "$(basename "$item")" != 'index.html' ]; then
    printf 'Unexpected dist entry: %s. Move it aside and retry.\n' "$item" >&2; exit 1
  fi
done < <(find "$ROOT/dist" -mindepth 1 -maxdepth 1 -print0)
if [ -L "$ROOT/dist/index.html" ]; then echo 'Refusing a symlinked dist/index.html.' >&2; exit 1; fi
cp "$ROOT/index.html" "$ROOT/dist/index.html"
printf '\nPublic release staged at %s/dist/index.html\nUpload only the contents of dist/.\n' "$ROOT"
