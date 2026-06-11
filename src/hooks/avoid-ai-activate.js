#!/usr/bin/env node
// avoid-ai -- SessionStart activation hook
//
// 1. Write flag file at $CLAUDE_CONFIG_DIR/.avoid-ai-active
// 2. Emit ruleset from SKILL.md (filtered by mode)
// 3. Nudge statusline setup if not configured

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { getDefaultMode, safeWriteFlag, getCompactRules } = require('./avoid-ai-config');

const claudeDir    = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath     = path.join(claudeDir, '.avoid-ai-active');
const settingsPath = path.join(claudeDir, 'settings.json');

const mode = getDefaultMode();

// 'off' -- deactivate and exit
if (mode === 'off') {
  try { fs.unlinkSync(flagPath); } catch (e) {}
  process.stdout.write('OK');
  process.exit(0);
}

// 1. Write flag file
safeWriteFlag(flagPath, mode);

// 2. Build context output from SKILL.md
// Strip sections that are too large to inject on every session:
//   - Tier-2 words (flag when 2+ in same paragraph -- subtle, covered by reinforcement)
//   - Tier-3 words (density flag only -- too fine-grained for session context)
//   - P2 section in 'on' mode (strict mode only)
// The per-turn reinforcement (mode-tracker.js) covers key vocab on every message.
// Full lists remain in SKILL.md for reference via /avoid-ai help.

let skillContent = '';
try {
  skillContent = fs.readFileSync(
    path.join(__dirname, '..', '..', 'skills', 'avoid-ai', 'SKILL.md'), 'utf8'
  );
} catch (e) {}

let output;

if (skillContent) {
  // Strip YAML frontmatter
  let body = skillContent.replace(/^---[\s\S]*?---\s*/, '');

  // Strip P2 section in 'on' mode (P2 = stylistic polish, strict only)
  // Regex handles P2 as last section (fallback to end-of-string)
  if (mode === 'on') {
    body = body.replace(/^## P2[\s\S]*?(?=^## |\s*$)/m, '');
  }

  // Strip Tier-2 and Tier-3 word lists -- too long for session context,
  // covered adequately by per-turn reinforcement for the key Tier-1 words.
  body = body.replace(/^\*\*Tier-2 words[\s\S]*?(?=^\*\*Tier-3|^---|^##)/m, '');
  body = body.replace(/^\*\*Tier-3[\s\S]*?(?=^---|^##|\s*$)/m, '');

  output = 'AVOID-AI MODE ACTIVE (level: ' + mode + ')\n\n' + body.trim();
} else {
  // Fallback: SKILL.md not found (standalone install)
  output = 'AVOID-AI MODE ACTIVE (level: ' + mode + ')\n\n' + getCompactRules(mode);
}

// 3. Nudge statusline setup if not configured
try {
  const settings = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    : {};
  if (!settings.statusLine) {
    const scriptPath = path.join(__dirname, 'avoid-ai-statusline.sh');
    const snippet = '"statusLine": { "type": "command", "command": ' +
      JSON.stringify('bash "' + scriptPath + '"')
      + ' }';
    output += '\n\nSTATUSLINE SETUP NEEDED: add to ' + settingsPath + ': ' + snippet +
      ' Proactively offer to set this up for the user on first interaction.';
  }
} catch (e) {}

output += '\n\nACKNOWLEDGE ACTIVATION: Respond with exactly: "avoid-ai: ' + mode + '"';

process.stdout.write(output);
