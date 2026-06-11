---
name: avoid-ai-detect
description: >
  This skill should be used when the user says "detect AI patterns in this", "audit this
  text", "flag AI-isms", "scan this for AI writing", "is this AI-written", "clean up this
  text", "check this for AI smell", or invokes "/avoid-ai detect". One-shot audit of
  user-provided text -- flag what's wrong, optionally rewrite. Does NOT apply to Claude's
  own responses; that's the avoid-ai mode skill.
---

# Avoid-AI Detect -- Audit User Text

Audit the provided text for AI writing patterns. Do not apply to Claude's own response.

## Modes

**detect** (default when invoked as `/avoid-ai detect`) -- flag only. No rewrite.

**rewrite** -- flag and return clean version. Invoke: `/avoid-ai detect --rewrite` or "rewrite this too".

**edit** -- edit a named file in place with minimal targeted changes. Invoke: point at a file.

## Severity tiers

### P0 -- Credibility killers (flag immediately)
- Cutoff disclaimers ("As of my last update", "I don't have access to real-time data")
- Chatbot artifacts ("Great question!", "I hope this helps!", "Certainly!")
- Vague attributions without sources ("Experts believe", "Studies show")
- Significance inflation ("marking a pivotal moment in the evolution of...")
- Chatbot citation markup leaks (citeturn0search0, contentReference[oaicite:0])
- AI-tool URL parameters (utm_source=chatgpt.com, utm_source=claude.ai)
- Unfilled placeholders ([Your Name], [INSERT SOURCE URL], 2025-XX-XX)
- **Invisible Unicode characters** -- near-definitive AI fingerprints:
  - Non-breaking spaces (U+00A0, U+202F, U+2007) substituted for regular spaces
  - Zero-width characters (U+200B, U+200C, U+200D, U+FEFF) used as invisible watermarks
  - Soft hyphens (U+00AD) in unexpected positions
  - Detection: paste into a plain-text editor that shows Unicode, or run `cat -A` / hex dump. Fix: strip all non-standard Unicode spacing and zero-width chars, replace with regular spaces or nothing.

### P1 -- Obvious AI smell (flag before publishing)
- Tier-1 words: delve, leverage, robust, seamless, meticulous, utilize, holistic, actionable, impactful, pivotal, paradigm, embark, testament to, game-changer, showcase, intricate, ever-evolving, cutting-edge, comprehensive
- Template phrases and slot-fill constructions
- "Let's" transition openers (Let's explore, Let's dive in)
- Generic future-narrative closers ("may become one of the most important narratives...")
- Stacked hedges ("could potentially", "may eventually")
- Formulaic openings ("In the rapidly evolving world of...")
- Bold overuse (more than one bolded phrase per major section)
- Em dash (U+2014): absolute zero. In prose flag as P1, in markup/labels also flag. No exceptions.
- Social endorsement closers ("This one is worth your time:", "Thank me later")
- Bullet lists of bare noun phrases (5+ short adj+noun items, no verbs)
- Reasoning chain artifacts ("Let me think step by step", "Breaking this down")
- Emoji at start of bullet points or section headers (💡, 🚀, 📌 etc.)
- Backtick/monospace applied to ordinary words that aren't code, commands, or file paths
- Tier-2 word clusters: 2+ of harness/navigate/foster/elevate/unleash/streamline/empower/bolster/spearhead/resonate/revolutionize/facilitate/cornerstone/paramount/transformative in same paragraph

### P2 -- Stylistic polish (flag when time allows)
- Generic conclusions ("The future looks bright", "Only time will tell")
- Compulsive rule of three
- Uniform paragraph and sentence length
- Copula avoidance (serves as, features, boasts)
- Transition phrases (Moreover, Furthermore, Additionally)
- Synonym cycling (rotating developer/engineer/practitioner/builder in same paragraph)
- Inline-header lists (bold that repeats the verb)
- Title-case subheadings (should be sentence case)

## Output format (detect mode)

For each finding:
```
[P0/P1/P2] "[quoted text]" -- rule violated. Suggested fix.
```

Then: severity summary -- count of P0, P1, P2 findings.

If 5+ P1 hits across 3+ categories with uniform sentence/paragraph length: recommend full rewrite rather than patching.

## Output format (rewrite mode)

1. Audit: list findings as above
2. Rewrite: clean version with all findings resolved
3. Diff summary: what changed and why (one line per category fixed)

## Tier-1 word reference (always replace)

delve, leverage, robust, comprehensive, cutting-edge, pivotal, seamless, meticulous, utilize, holistic, actionable, impactful, paradigm, embark, beacon, testament to, underscores, game-changer, deep dive, unpack, showcase, intricate, ever-evolving, enduring, daunting, thought leader, best practices, at its core, synergy, in order to, due to the fact that, serves as, boasts, features (verb), commence, ascertain, endeavor, keen (intensifier), embrace (metaphor), nestled, vibrant, thriving, bustling, interplay, landscape (metaphor), realm, tapestry, watershed moment

## Tier-2 (flag when 2+ in same paragraph)

harness, navigate, foster, elevate, unleash, streamline, empower, bolster, spearhead, resonate, revolutionize, facilitate, underpin, nuanced, crucial, multifaceted, ecosystem (metaphor), myriad, plethora, encompass, catalyze, reimagine, galvanize, augment, cultivate, illuminate, elucidate, juxtapose, transformative, cornerstone, paramount, poised (to), burgeoning, nascent, quintessential, overarching, underpinning

## Russian-language text

For Russian text, load `references/russian-patterns.md`. It contains 110+ Russian stop-words, Russian-specific constructions (negative parallelism, closing banners, rhetorical openers), and output format guidance. Apply the same P0/P1/P2 severity tiers.
