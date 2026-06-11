# avoid-ai

Claude Code plugin that strips AI-isms from Claude's own responses. Active on every session. No config needed.

## What it does

Claude has a vocabulary problem. Left unchecked, it uses "delve", "leverage", "robust", "seamless", "it's worth noting that", em dashes everywhere, and closes every response with "the future looks bright". This plugin fixes that.

Three enforcement layers:

- **SessionStart hook** injects the full ruleset into context at session start
- **UserPromptSubmit hook** reinforces rules on every turn so they don't drift
- **PreToolUse hook** blocks file writes that contain em dashes, forcing Claude to fix before saving

## Install

```
cp -r avoid-ai ~/.claude/plugins/
```

Or clone directly:

```
git clone https://github.com/YOUR_USERNAME/avoid-ai ~/.claude/plugins/avoid-ai
```

Restart Claude Code. The plugin activates automatically.

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

Check any file for em dashes and invisible Unicode:

```
node src/scripts/check.js path/to/file.md
node src/scripts/check.js path/to/file.md --fix
```

`--fix` creates a `.fixed` copy with invisible chars stripped and em dashes marked `[EM-DASH: FIX MANUALLY]`.

## Voice profile

Build a personal voice profile so Claude writes in your style, not generic professional:

```
/avoid-ai-voice build
```

Starts an 8-question interview. Saves results to `about-me.md`. Claude reads it before every response when voice mode is active.

## Russian language support

The detect skill includes 110+ Russian AI stop-words, negative parallelism patterns, closing banners, and rhetorical opener traps. Load via `/avoid-ai detect` on Russian text.

## Configuration

Default mode on startup: `on`. To change, set env var:

```
export AVOID_AI_DEFAULT_MODE=strict
```

Or create `~/.config/avoid-ai/config.json`:

```json
{ "defaultMode": "strict" }
```

## Tests

```
npm test
```

17 tests covering the scanner, prewrite hook, and config module.

## Works alongside caveman mode

Both plugins can be active at the same time. avoid-ai controls vocabulary and structure. caveman controls response length. Combined: concise, human-sounding responses with no AI-isms.

## License

MIT

## Roadmap

### MCP server (planned)

Programmatic Unicode scanner as an MCP tool. Decodes and inspects text for AI-specific characters: em dashes, invisible Unicode watermarks (U+200B, U+FEFF, U+00AD, non-breaking spaces), and structural entropy signals. Exposes as a tool Claude can call inline during generation, not just as a CLI script.
