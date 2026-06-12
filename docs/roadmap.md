# Roadmap

## MCP server: unicode-inspect (deferred)

An MCP server that would expose the scanner as a callable tool.

**Why deferred:** The original motivation was to let Claude self-check its own chat responses before sending. That requires a PostResponse or PreResponse hook -- neither exists in Claude Code today. Without such a hook, the MCP would fire only when Claude voluntarily decides to call it, which is not a reliable quality gate.

Current architecture already covers the two checkable surfaces: per-turn reinforcement (mode-tracker injects the ruleset on every message) and PreToolUse file blocking (prewrite.js blocks Write/Edit containing forbidden chars). Chat response text is not a tool call and has no interception point in the current API.

**When worth building:** If Claude Code adds a PostResponse hook, an MCP with `inspect_unicode(text)` and `entropy_score(text)` would allow a mechanical check on every response before it reaches the user. Until then, the MCP adds infrastructure without changing behavior.

**Tools to expose when the time comes:**

- `inspect_unicode(text)` -- list of findings: char, codepoint, line, col, severity, fix hint
- `strip_invisible(text)` -- strips zero-width chars and non-breaking spaces
- `entropy_score(text)` -- paragraph length variance, sentence length variance, connector count

## Multi-agent support (v2)

**Current scope:** avoid-ai runs exclusively on Claude Code. The three hooks (`SessionStart`, `UserPromptSubmit`, `PreToolUse`) are Claude Code-specific APIs. Other agents (Cursor, Windsurf, Cline, Copilot, etc.) have no hook system and cannot run the avoid-ai hooks or inject context on session start.

**What needs to be built:**

- `src/rules/avoid-ai-activate.md` -- static ruleset in plain markdown, suitable for injection into any agent's rules directory.
- Per-agent drop locations: `.cursor/rules/avoid-ai.mdc`, `.windsurf/rules/avoid-ai.md`, `.clinerules/avoid-ai.md`, `.github/copilot-instructions.md` (appended section), `.opencode/AGENTS.md`.
- `bin/install.js` -- auto-detects installed agents, runs `claude plugin` for Claude Code, writes rule files for everything else. Pattern: caveman's installer architecture.
- Curl one-liner: `curl -fsSL .../install.sh | bash` wrapping `bin/install.js`.

**Limitation vs Claude Code:** Rule-file agents get P0+P1 vocabulary and formatting rules but not PreToolUse file blocking. The scanner CLI remains available standalone regardless of agent.

**Why deferred:** Maintaining 5+ drop locations and testing across agents that change their config formats is significant ongoing work. Claude Code is the primary target for v1. The `claude plugin marketplace add nord-winter/avoid-ai && claude plugin install avoid-ai` path is already native and clean.

## Language-aware filtering (v2)

**Current limitation:** The homoglyph detector in `check.js` flags Cyrillic characters that look like Latin letters (e.g. `U+0430`, `U+0435`, `U+043E`, `U+0440`). This is correct when the text is Latin-primary -- a Cyrillic `U+0430` in an English word is a strong AI signal. But in Russian-primary text, all Cyrillic is legitimate and the detector produces nothing but false positives.

The same issue applies to typographic rules. En dash as a range separator (1990--2000) is normal in some style guides. Typographic quotes are correct in French and German. Context matters.

**What needs to be built:**

- `detect_language(text)` -- fast heuristic: count script distribution (Latin vs Cyrillic vs CJK etc.) over a sliding window. If >50% of alphabetic chars in a 100-char window are Cyrillic, treat that window as Russian.
- Per-rule language gates: homoglyph checks only fire when surrounding context is Latin-primary. En dash P1 flag suppressed in numeric ranges.
- Config option: `{ "primaryLanguage": "ru" }` to set a default and skip cross-script homoglyph checks entirely.

**Why deferred:** Requires maintaining a language-detection module or bundling a small lib (franc, langdetect). Adds complexity. The false positive rate on pure English/Russian text is low enough that the current behavior is acceptable for v1.
