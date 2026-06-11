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
