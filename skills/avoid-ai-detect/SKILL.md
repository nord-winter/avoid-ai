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
  - Zero-width chars: U+200B (ZWSP), U+200C (ZWNJ), U+200D (ZWJ), U+FEFF (BOM), U+2060 (word joiner)
  - Non-breaking spaces: U+00A0, U+202F (narrow NBSP), U+2007 (figure space)
  - Soft hyphen: U+00AD -- invisible unless the word wraps
  - Invisible math operators: U+2061 (function application), U+2062 (invisible times), U+2064 (invisible plus)
  - Mongolian vowel separator: U+180E -- zero legitimate use in English or Russian
  - Detection: run `node src/scripts/check.js file.md`, or `cat -A` / hex dump. Fix: strip all non-standard Unicode spacing and zero-width chars.
- **Homoglyphs** -- Cyrillic or Greek letters substituted for visually identical Latin ones. Codepoints differ, glyphs look identical. Flag as P0. Run `node src/scripts/check.js` to detect.

### P1 -- Obvious AI smell (flag before publishing)
- Tier-1 words: delve, leverage, robust, seamless, meticulous, utilize, holistic, actionable, impactful, pivotal, paradigm, embark, testament to, game-changer, showcase, intricate, ever-evolving, cutting-edge, comprehensive
- Template phrases and slot-fill constructions
- "Let's" transition openers (Let's explore, Let's dive in)
- Generic future-narrative closers ("may become one of the most important narratives...")
- Stacked hedges ("could potentially", "may eventually")
- Formulaic openings ("In the rapidly evolving world of...")
- Bold overuse (more than one bolded phrase per major section)
- Em dash (U+2014) and en dash (U+2013): absolute zero. Flag in prose and markup. No exceptions.
- Double hyphen `--` used as em dash substitute: P1. Typewriter convention, not a keyboard character. Replace with `,` or rewrite the clause as two sentences.
- Ellipsis character (U+2026): flag as P1. Should be three separate dots.
- Typographic apostrophe (U+2019) and curly quotes (U+201C, U+201D): flag as P1. Should be straight ASCII versions.
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

CRITICAL: Claude must never use the em dash character (U+2014) in its own audit output. The prewrite hook does not intercept chat responses -- self-discipline is required. Use a single hyphen as separator: ` - `.

For each finding:
```
[P0/P1/P2] "[quoted text]" - rule violated. Suggested fix.
```

The separator above is a single hyphen. Never use em dash or double hyphen in output.

Then: severity summary -- count of P0, P1, P2 findings.

If 5+ P1 hits across 3+ categories with uniform sentence/paragraph length: recommend full rewrite rather than patching.

## Output format (rewrite mode)

**Section 1 - Audit** (same as detect mode, listed findings with severity tags)

**Section 2 - Rewrite** (fenced code block, ALWAYS):

The rewrite MUST be inside a markdown fenced block so the user gets a copy button and the exact characters are preserved. Never dump rewrite as prose outside a code block.

````
Rewrite:

```
[clean text here, verbatim, with all original markdown intact:
 backticks, tables, headers, code spans -- all preserved exactly as they should appear]
```
````

Rules for the fenced block:
- Preserve all inline code (`backticks`) as-is
- Preserve markdown tables with correct pipe alignment
- Do NOT add any explanatory prose inside the block
- One blank line between the label `Rewrite:` and the opening fence

**Section 3 - Changes** (outside the block, one line per fix category):

```
Changes: [what was fixed] -> [what replaced it]. [what was fixed] -> [what replaced it].
```

Example of correct full output:

---

Audit:

[P1] "The tool lied to the browser: reported 768px, container is 1200px. On DPR=1 the browser picks `768w` and stretches - blurry." - double hyphen `--` used as em dash. Rewrite as two sentences.

Rewrite:

```
The tool lied to the browser: reported 768px, container is 1200px. On DPR=1 the browser picks `768w` and stretches it. Result: blurry.
```

Changes: `--` removed, clause split into two sentences.

## Tier-1 word reference (always replace)

delve, leverage, robust, comprehensive, cutting-edge, pivotal, seamless, meticulous, utilize, holistic, actionable, impactful, paradigm, embark, beacon, testament to, underscores, game-changer, deep dive, unpack, showcase, intricate, ever-evolving, enduring, daunting, thought leader, best practices, at its core, synergy, in order to, due to the fact that, serves as, boasts, features (verb), commence, ascertain, endeavor, keen (intensifier), embrace (metaphor), nestled, vibrant, thriving, bustling, interplay, landscape (metaphor), realm, tapestry, watershed moment

## Tier-2 (flag when 2+ in same paragraph)

harness, navigate, foster, elevate, unleash, streamline, empower, bolster, spearhead, resonate, revolutionize, facilitate, underpin, nuanced, crucial, multifaceted, ecosystem (metaphor), myriad, plethora, encompass, catalyze, reimagine, galvanize, augment, cultivate, illuminate, elucidate, juxtapose, transformative, cornerstone, paramount, poised (to), burgeoning, nascent, quintessential, overarching, underpinning

## Russian-language text

For Russian text, load `references/russian-patterns.md`. It contains 110+ Russian stop-words, Russian-specific constructions (negative parallelism, closing banners, rhetorical openers), and output format guidance. Apply the same P0/P1/P2 severity tiers.
