#!/usr/bin/env bash
# Run the tool convention checker across every NN-* folder.
# Usage: scripts/check-all.sh [--strict]
# Default: print a summary and exit 0 even when tools fail.
# --strict: exit 1 if any tool fails (useful for a curated CI list).

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT=0

for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

pass=0
fail=0
failed=()
log="$(mktemp)"
trap 'rm -f "$log"' EXIT

for dir in "$ROOT"/[0-9][0-9]-*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"
  if "$ROOT/scripts/check-tool-conventions.sh" "$name" >"$log" 2>&1; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    failed+=("$name")
    echo "FAIL $name"
    sed 's/^/    /' "$log" | head -20
  fi
done

echo
echo "Summary: $pass passed, $fail failed"
if [ "$fail" -gt 0 ]; then
  echo "Failed: ${failed[*]}"
  if [ "$STRICT" -eq 1 ]; then
    exit 1
  fi
fi
exit 0
