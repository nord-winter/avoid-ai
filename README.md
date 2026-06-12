# avoid-ai

Claude Code plugin that strips AI-isms from Claude's own responses. Active on every session. No config needed.

## What it does

Claude has a vocabulary problem. Left unchecked, it uses "delve", "leverage", "robust", "seamless", "it's worth noting that", em dashes everywhere, and closes every response with "the future looks bright". This plugin fixes that.

Three enforcement layers:

- **SessionStart hook** injects the full ruleset into context at session start
- **UserPromptSubmit hook** reinforces rules on every turn so they don't drift
- **PreToolUse hook** blocks file writes that contain em dashes, forcing Claude to fix before saving

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

`--fix` creates a `.fixed` copy: invisible characters are stripped, typographic substitutes (em dash, ellipsis, smart quotes) are replaced with keyboard equivalents. Homoglyphs are flagged with a marker for manual review.

## Voice profile

Build a personal voice profile so Claude writes in your style, not generic professional:

```
/avoid-ai-voice build
```

Starts an 8-question interview. Saves results to `about-me.md`. Claude reads it before every response when voice mode is active. A starter template is in `templates/about-me.md`.

## Russian language support

The detect skill includes 110+ Russian AI stop-words, negative parallelism patterns, closing banners, and rhetorical opener traps. Load via `/avoid-ai detect` on Russian text.

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

## Works alongside caveman mode

Both plugins can be active at the same time. avoid-ai controls vocabulary and structure. caveman controls response length. Combined: concise, human-sounding responses with no AI-isms.

## License

MIT
