#!/usr/bin/env bash
# avoid-ai -- uninstall script
# Removes plugin directory and deregisters from settings.json.

set -euo pipefail

PLUGIN_NAME="avoid-ai"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGIN_DIR="$CLAUDE_DIR/plugins/$PLUGIN_NAME"
SETTINGS="$CLAUDE_DIR/settings.json"
FLAG="$CLAUDE_DIR/.avoid-ai-active"

echo "Uninstalling $PLUGIN_NAME..."

# 1. Remove flag file
if [ -f "$FLAG" ]; then
  rm "$FLAG"
  echo "  Removed flag file"
fi

# 2. Deregister from settings.json
if [ -f "$SETTINGS" ]; then
  node - <<EOF
const fs = require('fs');
const p = '$SETTINGS';
let s = {};
try { s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) {}
if (s.plugins) {
  const before = s.plugins.length;
  s.plugins = s.plugins.filter(pl => (typeof pl === 'string' ? pl : pl.path) !== '$PLUGIN_DIR');
  if (s.plugins.length < before) {
    fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n', 'utf8');
    console.log('  Deregistered from ' + p);
  } else {
    console.log('  Plugin was not in ' + p);
  }
}
EOF
fi

# 3. Remove plugin directory
if [ -d "$PLUGIN_DIR" ]; then
  rm -rf "$PLUGIN_DIR"
  echo "  Removed $PLUGIN_DIR"
else
  echo "  Plugin directory not found (already removed?)"
fi

echo ""
echo "Done. Restart Claude Code to complete removal."
