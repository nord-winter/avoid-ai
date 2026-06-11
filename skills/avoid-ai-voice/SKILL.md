---
name: avoid-ai-voice
description: >
  This skill should be used when the user wants to set up a voice profile so Claude
  writes in their style, says "write in my voice", "write like me", "set up my voice",
  "fill in my about-me", "profile my writing style", "build voice profile", or wants
  Claude to stop sounding generic and start matching their personal tone and vocabulary.
---

# Avoid-AI Voice -- Write in the User's Voice

Apply the user's voice profile to every response. No generic AI tone, no filler vocabulary.

## What this is

A voice profile tells Claude whose voice to write in. Without one, Claude defaults to a generic professional tone. With one, Claude matches specific vocabulary, sentence rhythm, tone, and topics the user owns.

This skill does two things: helps build the profile if it doesn't exist, and applies it when it does.

## Step 1 -- Check if a profile exists

Look for `about-me.md` in the current working directory or any connected folder. If found, read it before writing anything. If not found, run Step 2.

## Step 2 -- Build the profile (if missing)

Interview the user. Ask questions one at a time, not in a list. Start with the highest-signal questions:

1. What do you do -- in verbs, not job titles?
2. Who reads your writing, and what should they do after reading?
3. Three adjectives for how you sound. Three for how you never want to sound.
4. Ten words you use constantly.
5. Ten words that immediately signal someone else wrote it.
6. Short punchy sentences or long structured ones?
7. Paste a text you wrote that sounds like you. Why is it you?
8. Paste a text that sounds nothing like you. What's wrong with it?

After collecting answers: assemble an `about-me.md` file using the structure below. Ask the user to save it in their working folder.

If the user is in a hurry, the minimum viable profile is questions 1, 3, 7, and 8.

## Step 3 -- Apply the profile

Before writing anything, read `about-me.md`. Then:

- Use vocabulary from "Words I use". Avoid words from "Words I never use".
- Match sentence length and rhythm from the examples section.
- Stay within the topics and positions the user owns.
- Use the tone adjectives as a filter on every sentence.
- Facts about the user: take only from `about-me.md`. Do not invent.
- After drafting: run a quick self-check against `anti-ai-writing-style.md` if present.

## about-me.md structure

```markdown
# about-me.md

## Who I am
(What I do -- verbs, not title. Who I write for. What they should do after reading.)

## Audience
(Role and level. What they know and don't. What they fear. What they actually want.
How they describe their own problem. What stops their scroll.)

## Voice and tone
(3 adjectives -- how I sound. 3 anti-adjectives -- how I never want to sound.
"ты" or "вы" / "you" informal or formal. Humor style. "I", "we", or impersonal. Direct or open-ended.)

## Vocabulary
**Words I use:** (10 words from my lexicon)
**Words I never use:** (my personal stop-words beyond the standard anti-ai list)
**Terms I keep in the original language:** (what I don't translate)
**Numbers:** (digits "5" or spelled out "five". Emoji -- yes/no, which ones max.)

## Sentence structure
(Short punchy or long with subclauses. Ideas per sentence. Start with conjunctions?
Long paragraphs or 1-2 lines. Lists or prose. How I emphasize.)

## Topics and limits
(What I write about -- my territory. What I never write about. What I believe that many disagree with.
Which common advice in my field I consider harmful.)

## Format rules by channel
(LinkedIn post / email / Telegram / proposal -- how they differ.
Comfortable length. How I write headlines. How I write calls to action.)

## Facts about me
(So Claude doesn't invent. 3-5 repeating facts: numbers, credentials, cases.
My framework or method name. Associations. A failure I mention openly.)

## My examples ← most important section

**Text that sounds like me #1:** (paste a real piece)
**Text that sounds like me #2:**
**Text that sounds like me #3:**
**Anti-example -- sounds nothing like me:** (paste it. Claude will know where not to go.)
**The phrase that identifies me without my name:**
```

## Self-check after drafting

Before outputting:
- Does this sound like the examples in `about-me.md`?
- Does it avoid every word from "Words I never use"?
- Did I invent any facts not in the profile?
- Would the user recognize this as their own writing?

If no to any: revise before outputting.

## Commands

- `/avoid-ai-voice` -- activate voice mode (reads `about-me.md` if present)
- `/avoid-ai-voice build` -- start the interview to build `about-me.md`
- `/avoid-ai-voice check` -- audit the last response against the voice profile
