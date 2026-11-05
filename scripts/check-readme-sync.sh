#!/usr/bin/env bash
# Verify that every NN-* tool folder is listed in README.md and vice versa.
# Usage: scripts/check-readme-sync.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README="$ROOT/README.md"

if [ ! -f "$README" ]; then
  echo "FAIL README.md not found" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

find "$ROOT" -maxdepth 1 -mindepth 1 -type d -name '[0-9][0-9]-*' -printf '%f\n' \
  | sort > "$tmpdir/folders.txt"

grep -oE '\[[0-9]{2}-[a-z0-9-]+\]\([0-9]{2}-[a-z0-9-]+/\)' "$README" \
  | sed -E 's/^\[([^]]+)\].*/\1/' \
  | sort -u > "$tmpdir/listed.txt"

missing="$(comm -23 "$tmpdir/folders.txt" "$tmpdir/listed.txt")"
extra="$(comm -13 "$tmpdir/folders.txt" "$tmpdir/listed.txt")"

status=0
if [ -n "$missing" ]; then
  echo "FAIL folders missing from README.md:" >&2
  printf '  %s\n' $missing >&2
  status=1
fi
if [ -n "$extra" ]; then
  echo "FAIL README.md links without a folder:" >&2
  printf '  %s\n' $extra >&2
  status=1
fi

if [ "$status" -eq 0 ]; then
  total="$(wc -l < "$tmpdir/folders.txt" | tr -d ' ')"
  echo "OK README.md matches $total tool folders"
fi
exit "$status"
