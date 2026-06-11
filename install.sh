#!/usr/bin/env bash
# avoid-ai -- install script
# Copies plugin to ~/.claude/plugins/avoid-ai and registers it.

set -euo pipefail

PLUGIN_NAME="avoid-ai"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGIN_DIR="$CLAUDE_DIR/plugins/$PLUGIN_NAME"
SETTINGS="$CLAUDE_DIR/settings.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing $PLUGIN_NAME..."

# 1. Copy plugin files
mkdir -p "$PLUGIN_DIR"
cp -r "$SCRIPT_DIR/." "$PLUGIN_DIR/"
echo "  Copied plugin to $PLUGIN_DIR"

# 2. Register in settings.json
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

# Use node to safely merge plugin entry into settings JSON
node - <<EOF
const fs = require('fs');
const p = '$SETTINGS';
let s = {};
try { s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) {}
if (!s.plugins) s.plugins = [];
const already = s.plugins.some(pl => (typeof pl === 'string' ? pl : pl.path) === '$PLUGIN_DIR');
if (!already) {
  s.plugins.push('$PLUGIN_DIR');
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n', 'utf8');
  console.log('  Registered plugin in ' + p);
} else {
  console.log('  Plugin already registered in ' + p);
}
EOF

echo ""
echo "Done. Restart Claude Code to activate."
echo "First response will confirm with: avoid-ai: on"
