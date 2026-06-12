# Getting started with avoid-ai

This is a Claude Code plugin. It runs silently in the background and changes how Claude writes. Once installed, you don't need to do anything special -- the effect is immediate.

## Install in 30 seconds

```bash
git clone https://github.com/nord-winter/avoid-ai ~/.claude/plugins/avoid-ai
```

Restart Claude Code. Done.

First response you get from Claude will start with `avoid-ai: on` to confirm it's active.

## See it working

Open Claude Code and ask anything. Notice what's missing: no "delve into", no "leverage", no "it's worth noting that", no em dashes everywhere. That's the plugin doing its job.

To check the mode:

```
/avoid-ai help
```

To run a stricter audit that also catches stylistic patterns (uniform paragraph lengths, transition boilerplate):

```
/avoid-ai strict
```

To turn it off temporarily:

```
/avoid-ai off
```

## Scan your own text

The plugin includes a CLI scanner you can run on any file:

```bash
node src/scripts/check.js path/to/your-text.md
```

It prints every problem with line and column number, severity (P0/P1), and the Unicode codepoint. Run with `--fix` to get a cleaned copy: invisible characters are stripped, and typographic substitutes (em dash, ellipsis, smart quotes) are replaced with their keyboard equivalents. Homoglyphs are the one exception -- they get a marker since silently substituting Cyrillic with Latin could corrupt meaning.

## How the plugin is structured

Four skills handle user-facing commands. Three hooks run automatically.

The skills live in `skills/` and follow standard Claude Code SKILL.md format. Each skill file is self-contained: description, rules, examples. Claude reads them when you invoke a command.

The hooks live in `src/hooks/` and run on three events:

- `avoid-ai-activate.js` fires on SessionStart. It injects the full ruleset into context so Claude knows the rules from the first message.
- `avoid-ai-mode-tracker.js` fires on every user message. It re-injects a compact reminder so the rules stay in Claude's attention throughout a long session.
- `avoid-ai-prewrite.js` fires before Claude writes any file. If the content contains an em dash or en dash, the write is blocked and Claude gets an error message explaining what to fix.

The scanner (`src/scripts/check.js`) is standalone Node.js with no dependencies. It checks for 20+ forbidden characters including invisible Unicode watermarks, typographic substitutes, and homoglyphs.

## Build your voice profile

The default mode strips AI patterns. The voice mode goes further: it makes Claude write in *your* style specifically.

```
/avoid-ai-voice build
```

This starts an 8-question interview. Paste examples of your writing. Claude assembles an `about-me.md` profile and reads it before every response from that point on.

The minimum viable profile is questions 1, 3, 7, and 8 (what you do, your tone adjectives, a text that sounds like you, a text that doesn't).

## Detect AI patterns in text you received

To audit text you got from somewhere else (another model, a contractor, a content tool):

```
/avoid-ai detect [paste your text here]
```

Add `--rewrite` to get a clean version back:

```
/avoid-ai detect --rewrite [text]
```

For Russian text, the detector loads a separate reference with 110+ Russian-specific stop-words and constructions automatically.

## Run the tests

```bash
cd ~/.claude/plugins/avoid-ai
npm test
```

22 tests. They cover the scanner, the prewrite hook, and the config module. All should pass in under two seconds.

## Add a new pattern

To add a word to the banned list: edit `skills/avoid-ai/SKILL.md` under the appropriate tier table.

To add a new invisible Unicode character to the scanner: add a line to the `CHECKS` array in `src/scripts/check.js`. Use `\uXXXX` escape notation, not the literal character.

To add a new hook behavior: see the existing hooks for structure. The Claude Code hook API sends JSON on stdin and reads JSON (or plain text for SessionStart) on stdout.

## What's planned next

See `docs/roadmap.md`. The main item is an MCP server that exposes the scanner as a tool Claude can call inline during generation, not just as a post-hoc CLI check.
