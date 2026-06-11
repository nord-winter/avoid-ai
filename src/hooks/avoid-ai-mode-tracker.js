#!/usr/bin/env node
// avoid-ai -- UserPromptSubmit hook
// Tracks /avoid-ai commands and reinforces mode on every turn.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag, readFlag, VALID_MODES, getCompactRules } = require('./avoid-ai-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.avoid-ai-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();
    const promptLower = prompt.toLowerCase();

    // Natural language activation
    if (/\b(activate|enable|turn on|start)\b.*\bavoid.?ai\b/i.test(prompt) ||
        /\bavoid.?ai\b.*\b(mode|activate|enable|turn on|start)\b/i.test(prompt)) {
      if (!/\b(stop|disable|turn off|deactivate)\b/i.test(prompt)) {
        const mode = getDefaultMode();
        if (mode !== 'off') safeWriteFlag(flagPath, mode);
      }
    }

    // /avoid-ai commands
    if (promptLower.startsWith('/avoid-ai') || promptLower.startsWith('/avoid-ai:avoid-ai')) {
      const parts = promptLower.split(/\s+/);
      const arg = parts[1] || '';
      let mode = null;

      if (arg === 'off' || arg === 'stop' || arg === 'disable') {
        mode = 'off';
      } else if (arg === 'strict') {
        mode = 'strict';
      } else if (arg === 'on' || arg === '') {
        mode = 'on';
      } else if (arg === 'detect') {
        // detect is handled by the avoid-ai-detect skill -- no flag change needed
        // Let it pass through to Claude
      }

      if (mode && mode !== 'off') {
        safeWriteFlag(flagPath, mode);
      } else if (mode === 'off') {
        try { fs.unlinkSync(flagPath); } catch (e) {}
      }
    }

    // Natural language deactivation
    if (/\b(stop|disable|deactivate|turn off)\b.*\bavoid.?ai\b/i.test(prompt) ||
        /\bavoid.?ai\b.*\b(stop|disable|deactivate|turn off)\b/i.test(prompt)) {
      try { fs.unlinkSync(flagPath); } catch (e) {}
    }

    // Per-turn reinforcement: keep mode visible in model attention every message.
    // Without this, the SessionStart context drifts out of attention mid-conversation,
    // especially when other plugins inject competing style instructions.
    const activeMode = readFlag(flagPath);
    if (activeMode) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: getCompactRules(activeMode)
        }
      }));
    }
  } catch (e) {
    // Silent fail
  }
});
