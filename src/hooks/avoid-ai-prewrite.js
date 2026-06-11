#!/usr/bin/env node
// avoid-ai -- PreToolUse hook
// Blocks file writes/edits containing em dashes when avoid-ai mode is active.
// Forces Claude to fix content before saving.

const path = require('path');
const os = require('os');
const { readFlag } = require('./avoid-ai-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.avoid-ai-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    // If avoid-ai not active, approve immediately
    const activeMode = readFlag(flagPath);
    if (!activeMode) {
      process.exit(0);
    }

    const data = JSON.parse(input);
    const toolName = data.tool_name || '';

    // Only intercept file content operations
    if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
      process.exit(0);
    }

    let contentToCheck = '';
    if (toolName === 'Write') {
      contentToCheck = data.tool_input?.content || '';
    } else if (toolName === 'Edit') {
      contentToCheck = data.tool_input?.new_string || '';
    } else if (toolName === 'MultiEdit') {
      const edits = data.tool_input?.edits || [];
      contentToCheck = edits.map(e => e.new_string || '').join('\n');
    }

    const matches = contentToCheck.match(/\u2014/g);
    if (matches && matches.length > 0) {
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: `AVOID-AI: ${matches.length} em dash(es) in output. Replace with comma, period, or two sentences.`
      }));
      process.exit(0);
    }

    // Clean. Approve.
    process.exit(0);
  } catch (e) {
    // Silent fail = approve
    process.exit(0);
  }
});
