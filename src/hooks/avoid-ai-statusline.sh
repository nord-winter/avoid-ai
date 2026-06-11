#!/bin/bash
# avoid-ai -- statusline badge script for Claude Code
# Reads the avoid-ai mode flag and outputs a colored badge.
#
# Usage in ~/.claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash /path/to/avoid-ai-statusline.sh" }

FLAG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.avoid-ai-active"

# Refuse symlinks
[ -L "$FLAG" ] && exit 0
[ ! -f "$FLAG" ] && exit 0

# Cap read at 32 bytes, strip non-alphanum chars
MODE=$(head -c 32 "$FLAG" 2>/dev/null | tr -d '\n\r' | tr '[:upper:]' '[:lower:]')
MODE=$(printf '%s' "$MODE" | tr -cd 'a-z0-9-')

# Whitelist
case "$MODE" in
  on|off|strict) ;;
  *) exit 0 ;;
esac

[ "$MODE" = "off" ] && exit 0

if [ "$MODE" = "on" ]; then
  printf '\033[38;5;75m[AVOID-AI]\033[0m'
else
  SUFFIX=$(printf '%s' "$MODE" | tr '[:lower:]' '[:upper:]')
  printf '\033[38;5;75m[AVOID-AI:%s]\033[0m' "$SUFFIX"
fi
