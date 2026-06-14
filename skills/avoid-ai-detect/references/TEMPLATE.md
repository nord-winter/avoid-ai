# [Language name] AI-writing patterns

Use this reference when auditing [language]-language text.

## Forbidden constructions

**[Construction name]** -- brief description, why it's an AI tell.
- Example 1
- Example 2
- Fix: what to do instead.

**[Construction name]:**
- Example
- Fix: ...

## Stop-words (always flag)

Words that appear at statistically elevated rates in AI-generated [language] text. Flag each occurrence as P1.

- word1
- word2
- word3

## Structural patterns

**[Pattern name]:**
- Description
- Example
- Fix: ...

## Script-specific scanner notes

<!-- Optional. Use when the language uses a non-Latin script. -->

If the text is [language]-primary (>[X]% of alphabetic chars are [script]), the homoglyph detector should skip [script] characters to avoid false positives. The scanner handles this automatically when Cyrillic exceeds Latin character count -- document any exceptions here.

## Research basis

The stop-word list should be grounded in frequency analysis of AI-generated vs. human-written text in this language. See `docs/references.md` for the methodology and sources behind the English and Russian lists (excess vocabulary studies, stylometric analysis, Unicode artifact investigations). Apply the same approach: identify words or constructions that appear at statistically elevated rates in LLM output compared to native speaker text.

## Output format guidance

<!-- Optional. Notes on how severity tiers apply differently in this language. -->

Apply the same P0/P1/P2 tiers as English. Language-specific exceptions:
- [Exception, if any]
