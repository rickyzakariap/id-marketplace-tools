#!/usr/bin/env bash
# Validate a tool folder against the stack policy in Architecture.md.
# Usage: scripts/check-tool-conventions.sh <tool-folder>

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "usage: $(basename "$0") <tool-folder>" >&2
  exit 2
fi

case "$TARGET" in
  /*) ;;
  *) TARGET="$ROOT/$TARGET" ;;
esac
TARGET="${TARGET%/}"

if [ ! -d "$TARGET" ]; then
  echo "FAIL folder not found: $TARGET" >&2
  exit 1
fi

NAME="$(basename "$TARGET")"
ERRORS=0
fail() {
  echo "FAIL [$NAME] $*" >&2
  ERRORS=$((ERRORS + 1))
}

if ! [[ "$NAME" =~ ^([0-9]+)-[a-z0-9-]+$ ]]; then
  fail "folder name must be NN-slug (lowercase, hyphens)"
fi

NUMBER=""
if [[ "$NAME" =~ ^([0-9]+)- ]]; then
  NUMBER="${BASH_REMATCH[1]}"
fi

has_node=0
has_go=0
has_python=0
has_extension=0
[ -f "$TARGET/package.json" ] && has_node=1
{ [ -f "$TARGET/main.go" ] || [ -f "$TARGET/server.go" ] || [ -f "$TARGET/go.mod" ]; } && has_go=1
if find "$TARGET" -maxdepth 1 -type f -name '*.py' -print -quit | grep -q .; then
  has_python=1
fi
[ -f "$TARGET/manifest.json" ] && has_extension=1

STACKS=$((has_node + has_go + has_python + has_extension))
if [ "$STACKS" -eq 0 ]; then
  fail "no supported stack found (expected package.json, Go files, Python files, or Chrome manifest.json)"
fi
if [ "$STACKS" -gt 1 ]; then
  fail "mixed stacks detected; use exactly one stack per tool"
fi

if [ "$has_node" -eq 1 ]; then
  [ -f "$TARGET/server.js" ] || fail "Node tool must have server.js"
  [ -f "$TARGET/README.md" ] || fail "missing README.md"
  [ -f "$TARGET/public/index.html" ] || fail "missing public/index.html"
  [ -d "$TARGET/test" ] || fail "missing test/"
  if [ -d "$TARGET/test" ] && ! find "$TARGET/test" -maxdepth 1 -type f -name '*.test.js' -print -quit | grep -q .; then
    fail "missing test/*.test.js"
  fi

  if [ -f "$TARGET/package.json" ]; then
    grep -q '"express"' "$TARGET/package.json" || fail "package.json must depend on express"
    if grep -qE '"(react|react-dom|vite|next|@vitejs/plugin-react|tailwindcss)"' "$TARGET/package.json"; then
      fail "React/Vite/Next/Tailwind not allowed for new tools (see Architecture.md)"
    fi
    grep -q '"start"[[:space:]]*:' "$TARGET/package.json" || fail "package.json needs a start script"
    grep -q '"test"[[:space:]]*:' "$TARGET/package.json" || fail "package.json needs a test script"
  fi

  if [ -n "$NUMBER" ] && [ -f "$TARGET/server.js" ]; then
    EXPECTED=$((8000 + 10#$NUMBER))
    if ! grep -qE "PORT[[:space:]]*=[[:space:]]*${EXPECTED}([^0-9]|$)" "$TARGET/server.js"; then
      fail "server.js must set PORT = $EXPECTED (8000 + project number)"
    fi
  fi
fi

if [ "$has_go" -eq 1 ]; then
  [ -f "$TARGET/README.md" ] || fail "missing README.md"
  if [ ! -f "$TARGET/public/index.html" ] && [ ! -f "$TARGET/main.go" ]; then
    fail "Go web tool must serve public/index.html (or be a CLI with main.go)"
  fi
fi

if [ "$has_python" -eq 1 ]; then
  [ -f "$TARGET/README.md" ] || fail "missing README.md"
  if [ ! -f "$TARGET/index.html" ] && [ ! -f "$TARGET/public/index.html" ] \
    && [ ! -f "$TARGET/main.py" ] && [ ! -f "$TARGET/cli.py" ]; then
    fail "Python tool must be a web tool (index.html) or a CLI (main.py or cli.py)"
  fi
  if grep -rEq '^[[:space:]]*(import|from)[[:space:]]+(requests|flask|django|fastapi|pandas|numpy|bs4|lxml|click|rich|pydantic)\b' \
    --include='*.py' "$TARGET" 2>/dev/null; then
    fail "Python tools must use the standard library only (see Architecture.md)"
  fi
fi

if [ "$has_extension" -eq 1 ]; then
  [ -f "$TARGET/README.md" ] || fail "missing README.md"
  grep -qE '"manifest_version"[[:space:]]*:[[:space:]]*3' "$TARGET/manifest.json" \
    || fail "manifest.json must set manifest_version 3"
  if ! find "$TARGET" -maxdepth 2 -type f -name '*.js' -print -quit | grep -q .; then
    fail "extension must contain JavaScript files"
  fi
  if ! grep -qE '"(background|action|content_scripts|side_panel)"' "$TARGET/manifest.json"; then
    fail "manifest.json needs background, action, content_scripts, or side_panel"
  fi
  if grep -rEq 'https?://[^"]+\.js' --include='*.js' --include='*.html' "$TARGET" 2>/dev/null; then
    fail "remote scripts are not allowed; bundle all code locally (MV3 policy)"
  fi
fi

if [ -d "$TARGET/node_modules" ] && git -C "$ROOT" ls-files --error-unmatch "$NAME/node_modules" >/dev/null 2>&1; then
  fail "node_modules must not be tracked by git"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL [$NAME] $ERRORS convention violation(s); see Architecture.md" >&2
  exit 1
fi

echo "OK [$NAME] stack conventions valid"
exit 0
