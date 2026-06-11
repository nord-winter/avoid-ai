---
name: avoid-ai-help
description: >
  This skill should be used when the user says "avoid-ai help", "/avoid-ai help",
  "what avoid-ai commands", "how do I use avoid-ai", "avoid-ai reference", "show avoid-ai
  rules", or wants a quick reference for the avoid-ai plugin's commands, modes, and blocked
  patterns.
---

# Avoid-AI - Quick Reference

## What it does

Persistent mode. Strips AI-isms from Claude's own responses every session.
Like caveman mode for token compression, but for writing quality.

## Commands

| Command | Effect |
|---|---|
| `/avoid-ai` or `/avoid-ai on` | Activate at level **on** (P0+P1) |
| `/avoid-ai strict` | Activate at level **strict** (P0+P1+P2) |
| `/avoid-ai off` | Deactivate |
| `/avoid-ai detect [text]` | Audit provided text for AI-isms |
| `/avoid-ai detect --rewrite [text]` | Audit + return clean version |
| `/avoid-ai help` | This card |
| `/avoid-ai-voice` | Set up or apply voice profile |
| `/avoid-ai-voice build` | Interview to build `about-me.md` |

Natural language also works: "avoid-ai on", "turn off avoid-ai", "scan this for AI patterns", "write in my voice".

## Levels

**on** (default) - P0+P1. Blocks credibility killers and obvious AI smell.
**strict** - P0+P1+P2. Full audit including stylistic polish (paragraph uniformity, copula avoidance, etc).

## What gets blocked (P0+P1)

**Words:** delve, leverage, robust, seamless, meticulous, utilize, holistic, actionable, impactful, pivotal, paradigm, embark, testament to, game-changer, showcase, intricate, ever-evolving, cutting-edge, comprehensive, deep dive, unpack, underscores, tapestry, realm, landscape (metaphor), in order to → to, serves as → is, boasts → has, due to the fact that → because

**Patterns:**
- "It's worth noting that" / "Notably" - just state the fact
- "In today's X" / "In an era where" - cut or give specific context
- "Let's explore / dive in / examine" - just start with the point
- "The future looks bright" / "Only time will tell" - generic closers, cut
- "Could potentially" / "may eventually" - stacked hedges, pick one
- "Great question!" / "I hope this helps!" - chatbot artifacts
- "Breaking this down" / "Let me think step by step" - reasoning artifacts
- "The catch?" / "Here's the thing." / "Plot twist:" - infomercial hooks
- "Moreover" / "Furthermore" / "Additionally" - restructure or use "and"
- "While X is impressive, Y remains a challenge" - vague false balance

## Two modes compared

| | avoid-ai | caveman |
|---|---|---|
| Goal | Human-sounding writing | Compressed writing |
| Axis | Vocabulary + structure | Token count |
| Activates | SessionStart hook | SessionStart hook |
| Per-turn | UserPromptSubmit | UserPromptSubmit |
| Stackable | Yes - both can be active | Yes |

Both active? Claude writes concise human-sounding responses with no AI-isms and no fluff.
