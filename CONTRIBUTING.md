# Contributing

## Setup

```bash
git clone https://github.com/nord-winter/avoid-ai ~/.claude/plugins/avoid-ai
cd ~/.claude/plugins/avoid-ai
npm install
npm test
```

Tests must pass before any PR.

## Project structure

```
src/
  hooks/
    activate.js        -- SessionStart: injects full ruleset into context
    mode-tracker.js    -- UserPromptSubmit: per-turn compact rule reminder
    prewrite.js        -- PreToolUse: blocks file writes with forbidden chars
    avoid-ai-config.js -- shared config resolver (env > plugin config > file > default)
  scripts/
    check.js           -- standalone CLI scanner (unicode + entropy)
skills/
  avoid-ai/            -- /avoid-ai on|off|strict|help
  avoid-ai-detect/     -- /avoid-ai detect [--rewrite]
    references/
      ru.md            -- Russian-language stop-words and patterns
  avoid-ai-voice/      -- /avoid-ai-voice build
  avoid-ai-help/       -- /avoid-ai help
tests/
  verify.js            -- 27 test cases
.claude-plugin/
  plugin.json          -- plugin manifest and userConfig schema
```

## Running tests

```bash
npm test
```

Or directly:

```bash
node tests/verify.js
```

All 27 tests must pass. The test suite covers: scanner character detection, `--fix` replacements, config resolution order, entropy scoring, prewrite hook, and mode switching.

## Scanner (`src/scripts/check.js`)

The scanner reads UTF-8 files and checks for:

- P0 invisible characters (zero-width spaces, BOM, non-breaking spaces, etc.)
- P1 typographic substitutes (em dash, en dash, ellipsis, smart quotes)
- P0 homoglyphs (Cyrillic/Greek chars that look like Latin)
- Structural entropy (uniform paragraph/sentence length, AI connector frequency)

Entropy runs on prose files only (`.md`, `.txt`, `.rst`, `.html`, `.htm`). Code files are skipped to avoid false positives from connector words in string literals.

Column numbers are codepoint-based, not UTF-16 unit-based. `cpCol()` handles supplementary-plane characters (emoji, etc.) correctly.

## Adding a language

Create `skills/avoid-ai-detect/references/<lang-code>.md` using `references/TEMPLATE.md` as the starting point. `ru.md` is an existing example. Include:

1. A stop-word list - vocabulary that appears at elevated rates in AI-generated text in that language
2. Structural patterns specific to that language (formulaic openers, closing phrases, rhetorical constructions)
3. Any script-specific scanner rules (which characters to skip for homoglyph detection)

Then update `skills/avoid-ai-detect/SKILL.md` to reference the new file.

## Commit conventions

Conventional Commits:

```
feat: add Spanish language reference
fix: entropy false positive on numbered lists
docs: update install instructions
refactor: extract config resolver
test: add em dash fix test
chore: bump version to 1.2.0
```

Subject line: 50 chars max, present tense, no period. Body only when the "why" is not obvious from the diff.

## Tagging releases

```bash
git tag v1.2.0
git push origin v1.2.0
```

Update `"version"` in `.claude-plugin/plugin.json` before tagging.

## Rule levels

| Level | Coverage | When to use |
|---|---|---|
| P0 | Credibility killers | Always flag |
| P1 | Obvious AI smell | Flag before publishing |
| P2 | Stylistic polish | Flag when time allows (strict mode only) |

When adding a new rule, decide its tier and add it to: `skills/avoid-ai/SKILL.md`, `skills/avoid-ai-detect/SKILL.md`, and the compact rules in `src/hooks/avoid-ai-config.js` (`getCompactRules()`).

## PR checklist

- `npm test` passes
- New rules added to all three rule locations (see above)
- No em dash (U+2014) or typographic chars in prose files (run `node src/scripts/check.js <file>` to verify)
- Version bumped in `.claude-plugin/plugin.json` if releasing
