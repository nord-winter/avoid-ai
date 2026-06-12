# avoid-ai

Claude Code plugin that applies a self-editing pass to every Claude response. Removes vocabulary, formatting, and structural patterns statistically associated with AI-generated text. Active on every session. No config needed.

## Features

**Response quality enforcement** -- three hooks run on every session automatically. At startup, the full ruleset is injected into context. On every user message, a compact rule reminder keeps the rules in model attention. Before any file write, the content is checked for forbidden characters and blocked if violations are found.

**On-demand text audit** -- `/avoid-ai detect` audits any text for AI patterns with P0/P1/P2 severity, line-level findings, and an optional rewrite. Works on English and Russian text.

**Personal voice profile** -- `/avoid-ai-voice build` runs an 8-question interview and produces an `about-me.md` profile. Claude reads it before responding, matching your vocabulary, sentence rhythm, and tone instead of defaulting to generic professional style.

**Unicode and encoding scanner** -- standalone CLI that works outside Claude Code. Reads files in UTF-8, resolves codepoints correctly (including supplementary-plane characters such as emoji), and reports findings by exact line and codepoint column.

| Category | What it catches |
|---|---|
| Invisible chars (P0) | U+200B zero-width space, U+FEFF BOM, U+00A0 non-breaking space, U+00AD soft hyphen, and 6 others |
| Typographic substitutes (P1) | U+2014 em dash, U+2013 en dash, U+2026 ellipsis, U+2019 typographic apostrophe, smart quotes |
| Homoglyphs (P0) | Cyrillic and Greek chars visually identical to Latin (30+ pairs); auto-skipped in Cyrillic-primary text |
| Structural entropy | Uniform paragraph/sentence length, AI connector frequency (moreover/furthermore/additionally/...) |

Example output:

```
[P1] line 1:24  U+2014 EM DASH
       ...example [EMDASH] showing what the scanner finds...
[P0] line 2:9   U+00A0 NON-BREAKING SPACE
       ...It has a[_]non-breaking space...
[P0] line 2:35  U+200B ZERO-WIDTH SPACE
       ...and a [?]zero-width space...

Summary: 2 P0 (invisible / homoglyphs)  1 P1 (typographic substitutes)
Entropy: connectors=2
```

`--fix` creates a clean copy: invisible characters stripped, typographic substitutes replaced with keyboard equivalents (em dash becomes ` - `, ellipsis becomes `...`, smart quotes become straight quotes).

## Install

```bash
git clone https://github.com/nord-winter/avoid-ai ~/.claude/plugins/avoid-ai
```

Restart Claude Code. The plugin activates automatically. First response confirms with `avoid-ai: on`.

Or use the install script if you cloned elsewhere:

```bash
bash install.sh
```

## Commands

| Command | Effect |
|---|---|
| `/avoid-ai` or `/avoid-ai on` | Activate (P0+P1 rules) |
| `/avoid-ai strict` | Activate full audit (P0+P1+P2) |
| `/avoid-ai off` | Deactivate |
| `/avoid-ai detect [text]` | Audit provided text for AI patterns |
| `/avoid-ai detect --rewrite [text]` | Audit + return clean version |
| `/avoid-ai-voice` | Apply voice profile from `about-me.md` |
| `/avoid-ai-voice build` | Interview to build voice profile |
| `/avoid-ai help` | Quick reference card |

## Rule levels

**on** (default): P0 + P1. Credibility killers and obvious AI smell.

**strict**: P0 + P1 + P2. Full audit, including uniform paragraph length, copula avoidance, transition phrases.

### P0 - Credibility killers

Chatbot artifacts ("Great question!", "I hope this helps!"), cutoff disclaimers, vague attributions without sources, sycophancy, acknowledgment loops.

### P1 - Obvious AI smell

Tier-1 words (delve, leverage, robust, seamless, meticulous, utilize, holistic, actionable, impactful, paradigm, embark, showcase, intricate, ever-evolving, cutting-edge, game-changer, deep dive, unpack, and 50+ more), em dashes, bold overuse, emoji in headers, stacked hedges, "Let's explore", "In today's X", generic closers, reasoning chain artifacts, infomercial hooks, invisible Unicode watermarks.

### P2 - Stylistic polish (strict only)

Uniform paragraph/sentence length, synonym cycling, compulsive rule of three, copula avoidance, transition boilerplate.

## Scanner CLI

Check any file for forbidden characters and AI structural patterns:

```bash
node src/scripts/check.js path/to/file.md
node src/scripts/check.js path/to/file.md --fix
```

`--fix` creates a `.fixed` copy: invisible characters are stripped, typographic substitutes are replaced with keyboard equivalents, homoglyphs are flagged for manual review.

### Why keyboard equivalents

A standard keyboard (physical or mobile) produces a limited character set: hyphen `-`, straight apostrophe `'`, straight double quote `"`, three separate periods `...`. These are what humans type directly.

Typographic substitutes -- em dash (U+2014), ellipsis (U+2026), smart quotes (U+201C/U+201D), typographic apostrophe (U+2019) -- appear in text that was processed by software: word processors that autocorrect, publishing pipelines, and LLMs trained on professionally edited corpora. A human writing on a phone or keyboard does not produce these characters unless autocorrect inserts them.

This is the basis of the `--fix` replacements: em dash becomes ` - `, ellipsis becomes `...`, smart quotes become `"`. The result is text whose character distribution matches what a keyboard produces.

## Voice profile

Build a personal voice profile so Claude writes in your style, not generic professional:

```
/avoid-ai-voice build
```

Starts an 8-question interview. Saves results to `about-me.md`. Claude reads it before every response when voice mode is active. A starter template is in `templates/about-me.md`.

## Language support

English patterns are built in. Russian is included as an additional reference: 110+ stop-words, negative parallelism constructions, closing banners, and rhetorical opener traps. The scanner automatically skips homoglyph detection on Cyrillic-primary text to avoid false positives.

### Adding your language

To add patterns for another language, create a reference file in `skills/avoid-ai-detect/references/` following the structure of `russian-patterns.md`. Include:

- A stop-word list (vocabulary that appears at statistically elevated rates in AI-generated text in that language)
- Structural patterns specific to that language (formulaic openers, closing phrases, rhetorical constructions)
- Any script-specific scanner rules (e.g., which characters should be skipped for homoglyph detection)

Pull requests for new language references are welcome.

## Configuration

Default mode on startup: `on`. To change, set env var:

```bash
export AVOID_AI_DEFAULT_MODE=strict
```

Or create `~/.config/avoid-ai/config.json`:

```json
{ "defaultMode": "strict" }
```

## Tests

```bash
npm test
```

27 tests covering the scanner, prewrite hook, config module, entropy scoring, and fix mode.

## Research basis

The ruleset in this plugin is grounded in published research on AI writing patterns: excess vocabulary studies (Kobak et al., Science Advances 2025), stylometric authorship analysis (Dentella et al., 2025), Unicode artifact investigations (Originality.AI, OpenAI), and detection method surveys (Wu et al., Computational Linguistics 2025).

Full bibliography with links: [docs/references.md](docs/references.md)

## Composability

avoid-ai has a single responsibility: response text quality. It does not control response length, tool behavior, or any other Claude Code feature. This means it composes cleanly with other Claude Code plugins -- each plugin owns its own domain and they do not interfere.

## License

MIT
