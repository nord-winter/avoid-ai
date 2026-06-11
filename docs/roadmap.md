# Roadmap

## MCP server: unicode-inspect

An MCP tool that Claude can call inline during generation to inspect text for AI-specific Unicode patterns.

**Why:** `check.js` works as a CLI after the fact. An MCP tool lets Claude self-check output in real time, before responding, not just when writing files.

**Tools to expose:**

- `inspect_unicode(text)` -- returns list of findings: char, codepoint, line, col, severity, fix hint
- `strip_invisible(text)` -- strips zero-width chars and non-breaking spaces, returns clean text
- `entropy_score(text)` -- returns paragraph length variance, sentence length variance, connector frequency. Low score = high AI signal.

**Stack:** Node.js MCP server using the `@modelcontextprotocol/sdk` package.

**Integration:** Add as a tool in `plugin.json` so avoid-ai mode can call it as part of the PreToolUse or PostToolUse pipeline.

## Language-aware filtering (v2)

**Current limitation:** The homoglyph detector in `check.js` flags Cyrillic characters that look like Latin letters (e.g. `а`, `е`, `о`, `р`). This is correct when the text is Latin-primary -- a Cyrillic `а` in an English word is a strong AI signal. But in Russian-primary text, all Cyrillic is legitimate and the detector produces nothing but false positives.

The same issue applies to typographic rules. En dash as a range separator (1990--2000) is normal in some style guides. Typographic quotes are correct in French and German. Context matters.

**What needs to be built:**

- `detect_language(text)` -- fast heuristic: count script distribution (Latin vs Cyrillic vs CJK etc.) over a sliding window. If >50% of alphabetic chars in a 100-char window are Cyrillic, treat that window as Russian.
- Per-rule language gates: homoglyph checks only fire when surrounding context is Latin-primary. En dash P1 flag suppressed in numeric ranges.
- Config option: `{ "primaryLanguage": "ru" }` to set a default and skip cross-script homoglyph checks entirely.

**Why deferred:** Requires maintaining a language-detection module or bundling a small lib (franc, langdetect). Adds complexity. The false positive rate on pure English/Russian text is low enough that the current behavior is acceptable for v1.
