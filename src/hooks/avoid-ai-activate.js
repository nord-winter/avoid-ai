#!/usr/bin/env node
// avoid-ai -- Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Writes flag file at $CLAUDE_CONFIG_DIR/.avoid-ai-active (statusline reads this)
//   2. Emits avoid-ai ruleset as hidden SessionStart context
//   3. Detects missing statusline config and emits setup nudge

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag } = require('./avoid-ai-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.avoid-ai-active');
const settingsPath = path.join(claudeDir, 'settings.json');

const mode = getDefaultMode();

// "off" mode -- skip activation entirely
if (mode === 'off') {
  try { fs.unlinkSync(flagPath); } catch (e) {}
  process.stdout.write('OK');
  process.exit(0);
}

// 1. Write flag file
safeWriteFlag(flagPath, mode);

// 2. Emit ruleset from SKILL.md (single source of truth)
let skillContent = '';
try {
  skillContent = fs.readFileSync(
    path.join(__dirname, '..', '..', 'skills', 'avoid-ai', 'SKILL.md'), 'utf8'
  );
} catch (e) {}

let output;

if (skillContent) {
  // Strip YAML frontmatter
  const body = skillContent.replace(/^---[\s\S]*?---\s*/, '');

  // In 'on' mode: strip the P2 section to reduce context size
  let filtered = body;
  if (mode === 'on') {
    // Remove "## P2" section and everything under it until next ## or end
    // Strip P2 section: from "## P2" header to the next "## " header (or end of string)
    filtered = body.replace(/^## P2[\s\S]*?(?=^## )/m, '');
  }

  output = 'AVOID-AI MODE ACTIVE (level: ' + mode + ')\n\n' + filtered;
} else {
  // Fallback minimal ruleset
  output =
    'AVOID-AI MODE ACTIVE (level: ' + mode + ')\n\n' +
    'Apply avoid-ai-writing rules to your OWN responses. Strip AI-isms before outputting.\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. No revert. Off only: "/avoid-ai off".\n\n' +
    '## Core rules\n\n' +
    'Never use: delve, leverage, robust, comprehensive, cutting-edge, pivotal, seamless, ' +
    'meticulous, utilize, holistic, actionable, impactful, tapestry, paradigm, embark, beacon, ' +
    'testament to, game-changer, underscores, showcase, intricate, ever-evolving.\n\n' +
    'Never open with: "In today\'s...", "In an era where...", "It\'s worth noting that".\n' +
    'Never close with: "The future looks bright", "Only time will tell".\n' +
    'No hollow intensifiers: genuine, truly, quite frankly, let\'s be clear.\n' +
    'No stacked hedges: "could potentially", "may eventually".\n' +
    'No "Let\'s explore / dive into / unpack".\n' +
    'No chatbot artifacts: "Great question!", "I hope this helps!", "Certainly!".\n\n' +
    'Current level: **' + mode + '**. Switch: `/avoid-ai on|off|strict`.';
}

// 3. Detect missing statusline config
try {
  let hasStatusline = false;
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.statusLine) hasStatusline = true;
  }

  if (!hasStatusline) {
    const scriptPath = path.join(__dirname, 'avoid-ai-statusline.sh');
    const command = `bash "${scriptPath}"`;
    const statusLineSnippet =
      '"statusLine": { "type": "command", "command": ' + JSON.stringify(command) + ' }';
    output += '\n\nSTATUSLINE SETUP NEEDED: The avoid-ai plugin includes a statusline badge showing ' +
      'active mode (e.g. [AVOID-AI], [AVOID-AI:STRICT]). ' +
      'To enable, add this to ' + settingsPath + ': ' + statusLineSnippet + ' ' +
      'Proactively offer to set this up for the user on first interaction.';
  }
} catch (e) {}

output += '\n\nACKNOWLEDGE ACTIVATION: Respond with exactly this one line, nothing more: "avoid-ai: ' + mode + '"';

process.stdout.write(output);
