#!/usr/bin/env node
// avoid-ai -- PreToolUse hook
// Blocks Write/Edit/MultiEdit when content contains em dash (U+2014) or en dash (U+2013).
// Regex uses \uXXXX escapes so this file contains no literal forbidden chars.

const path = require('path');
const os   = require('os');
const { readFlag } = require('./avoid-ai-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath  = path.join(claudeDir, '.avoid-ai-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    if (!readFlag(flagPath)) process.exit(0);

    const data     = JSON.parse(input);
    const toolName = data.tool_name || '';

    if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) process.exit(0);

    let content = '';
    if      (toolName === 'Write')     content = data.tool_input?.content || '';
    else if (toolName === 'Edit')      content = data.tool_input?.new_string || '';
    else if (toolName === 'MultiEdit') content = (data.tool_input?.edits || []).map(e => e.new_string || '').join('\n');

    const emCount = (content.match(/\u2014/g) || []).length;
    const enCount = (content.match(/\u2013/g) || []).length;
    const total   = emCount + enCount;

    if (total > 0) {
      const parts = [];
      if (emCount) parts.push(emCount + ' em dash(es) U+2014');
      if (enCount) parts.push(enCount + ' en dash(es) U+2013');
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: 'AVOID-AI: ' + parts.join(', ') + ' in output. Replace with comma, period, hyphen, or two sentences.'
      }));
    }
  } catch (e) {
    // Silent fail = approve
  }
  process.exit(0);
});
