#!/bin/bash
# Ensures the frontend-design and ui-ux-pro-max Claude Code plugins are
# installed (user scope) at the start of every remote session, so they are
# available in this project regardless of which container the session runs
# in. Safe to run multiple times.
set -euo pipefail

# Only needed in Claude Code on the web / remote environments. Local
# machines keep their own persistent ~/.claude, so this would be redundant
# (and slower) there.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ensure_marketplace() {
  local source="$1"
  local name="$2"
  if ! claude plugin marketplace list 2>/dev/null | grep -q "$name"; then
    claude plugin marketplace add "$source" >/dev/null 2>&1 || true
  fi
}

ensure_plugin() {
  local plugin_id="$1"
  if ! claude plugin list 2>/dev/null | grep -q "$plugin_id"; then
    claude plugin install "$plugin_id" >/dev/null 2>&1 || true
  fi
}

ensure_marketplace "anthropics/claude-code" "claude-code-plugins"
ensure_marketplace "nextlevelbuilder/ui-ux-pro-max-skill" "ui-ux-pro-max-skill"

ensure_plugin "frontend-design@claude-code-plugins"
ensure_plugin "ui-ux-pro-max@ui-ux-pro-max-skill"
