#!/usr/bin/env node
// avoid-ai -- shared configuration resolver
//
// Resolution order for default mode:
//   1. AVOID_AI_DEFAULT_MODE environment variable
//   2. Claude Code plugin config: ~/.claude/settings.json
//      pluginConfigs["avoid-ai@avoid-ai"].options.defaultMode
//   3. Config file defaultMode field:
//      - $XDG_CONFIG_HOME/avoid-ai/config.json (any platform, if set)
//      - ~/.config/avoid-ai/config.json (macOS / Linux fallback)
//      - %APPDATA%\avoid-ai\config.json (Windows fallback)
//   4. 'on'

const fs = require('fs');
const path = require('path');
const os = require('os');

// Modes:
//   off    -- disabled, no filtering
//   on     -- P0+P1 patterns only (credibility killers + obvious AI smell)
//   strict -- full audit: P0+P1+P2 (all tiers)
const VALID_MODES = ['off', 'on', 'strict'];

function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'avoid-ai');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'avoid-ai'
    );
  }
  return path.join(os.homedir(), '.config', 'avoid-ai');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

function getPluginConfigMode() {
  // Read from Claude Code settings.json: pluginConfigs["avoid-ai@avoid-ai"].options.defaultMode
  // Set via: claude plugin install avoid-ai --config defaultMode=strict
  //      or: /plugin configure (interactive)
  try {
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const mode = settings?.pluginConfigs?.['avoid-ai@avoid-ai']?.options?.defaultMode;
    if (mode && VALID_MODES.includes(mode.toLowerCase())) {
      return mode.toLowerCase();
    }
  } catch (e) {}
  return null;
}

function getDefaultMode() {
  // 1. Environment variable
  const envMode = process.env.AVOID_AI_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  // 2. Claude Code plugin config (set via --config or /plugin configure)
  const pluginMode = getPluginConfigMode();
  if (pluginMode) return pluginMode;

  // 3. Config file
  try {
    const config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    if (config.defaultMode && VALID_MODES.includes(config.defaultMode.toLowerCase())) {
      return config.defaultMode.toLowerCase();
    }
  } catch (e) {}

  // 4. Default
  return 'on';
}

// Symlink-safe flag write (mirrors caveman pattern).
function safeWriteFlag(flagPath, content) {
  const debug = process.env.AVOID_AI_DEBUG === '1';
  try {
    const flagDir = path.dirname(flagPath);
    fs.mkdirSync(flagDir, { recursive: true });

    let realFlagDir;
    try {
      const lstat = fs.lstatSync(flagDir);
      if (lstat.isSymbolicLink()) {
        realFlagDir = fs.realpathSync(flagDir);
        const realStat = fs.statSync(realFlagDir);
        if (!realStat.isDirectory()) return;
        if (typeof process.getuid === 'function') {
          if (realStat.uid !== process.getuid()) return;
        } else {
          const home = os.homedir();
          const normalizedReal = path.resolve(realFlagDir);
          const normalizedHome = path.resolve(home);
          if (!normalizedReal.toLowerCase().startsWith(normalizedHome.toLowerCase() + path.sep) &&
              normalizedReal.toLowerCase() !== normalizedHome.toLowerCase()) return;
        }
      } else {
        realFlagDir = flagDir;
      }
    } catch (e) { return; }

    const realFlagPath = path.join(realFlagDir, path.basename(flagPath));
    try {
      if (fs.lstatSync(realFlagPath).isSymbolicLink()) return;
    } catch (e) {
      if (e.code !== 'ENOENT') return;
    }

    const tempPath = path.join(realFlagDir, `.avoid-ai-active.${process.pid}.${Date.now()}`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;
    let fd;
    try {
      fd = fs.openSync(tempPath, flags, 0o600);
      fs.writeSync(fd, String(content));
      try { fs.fchmodSync(fd, 0o600); } catch (e) {}
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    fs.renameSync(tempPath, realFlagPath);
  } catch (e) {}
}

// Symlink-safe, size-capped, whitelist-validated flag read.
const MAX_FLAG_BYTES = 32;

function readFlag(flagPath) {
  try {
    let st;
    try { st = fs.lstatSync(flagPath); } catch (e) { return null; }
    if (st.isSymbolicLink() || !st.isFile()) return null;
    if (st.size > MAX_FLAG_BYTES) return null;

    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_RDONLY | O_NOFOLLOW;
    let fd, out;
    try {
      fd = fs.openSync(flagPath, flags);
      const buf = Buffer.alloc(MAX_FLAG_BYTES);
      const n = fs.readSync(fd, buf, 0, MAX_FLAG_BYTES, 0);
      out = buf.slice(0, n).toString('utf8');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }

    const raw = out.trim().toLowerCase();
    if (!VALID_MODES.includes(raw)) return null;
    return raw;
  } catch (e) { return null; }
}


// Single source of truth for per-turn reinforcement text.
// Used by both activate.js (SessionStart) and mode-tracker.js (UserPromptSubmit).
function getCompactRules(mode) {
  const strict = mode === 'strict';
  return (
    'AVOID-AI MODE ACTIVE (' + mode + '). Apply rules to YOUR OWN response before outputting.\n' +
    'VOCAB: No Tier-1 words: delve, leverage, robust, seamless, holistic, pivotal, meticulous, ' +
    'utilize, actionable, impactful, paradigm, embark, showcase, intricate, ever-evolving, ' +
    'cutting-edge, comprehensive, game-changer, deep dive, unpack, tapestry, realm, best practices.\n' +
    'FORMAT: No em dash (U+2014) or en dash (U+2013). No emoji in headers/bullets. ' +
    'No bold overuse. No bullets where prose works. No backticks on non-code words.\n' +
    'PATTERNS: No "it\'s worth noting", "let\'s explore", "in today\'s X", ' +
    '"Great question!", stacked hedges ("could potentially"), "Let\'s" openers, ' +
    'generic closers ("the future looks bright").\n' +
    (strict
      ? 'STRICT: also fix uniform para/sentence length, transition boilerplate (Moreover/Furthermore/' +
        'Additionally), copula avoidance (serves as/boasts/features), synonym cycling, compulsive rule of three.\n'
      : '') +
    'Switch: /avoid-ai on|off|strict.'
  );
}

module.exports = { getDefaultMode, getConfigDir, getConfigPath, VALID_MODES, safeWriteFlag, readFlag, getCompactRules };
