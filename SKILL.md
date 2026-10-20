---
name: humanize-content
description: >
  Rewrite AI-generated or robotic-sounding text so it reads like one specific person wrote it,
  without introducing the second-order tells that most "humanizers" add. Use this skill whenever
  the user wants to: humanize text, make content sound less like AI, remove AI writing patterns
  or AI-isms, audit a draft for AI tells, add voice to writing, fix stiff or corporate copy, or
  make drafts read like a person wrote them. Also trigger on phrases like "make this sound human",
  "this sounds like ChatGPT", "remove the AI smell", "de-AI this", "audit this for tells", or
  any variation. Works on blog posts, X posts, X replies, LinkedIn posts, LinkedIn replies,
  Slack replies, text message replies, emails, READMEs, docs, HN posts, and GitHub issues and
  PR comments. Also handles "simpler words", "plain English", "more casual", and "less polished"
  requests through the plainness and polish options. Always use this skill for humanization work, never
  freestyle it: it contains a strict no-fabrication rule, an anti-overcorrection layer, and a
  banned-move list (including em dashes) that ad-hoc rewriting will violate.
---

# Humanize Content v2.2

Rewrite text so it reads like a specific person wrote it. Not "casual". Not "sassy". A person.

v2 exists because most humanizers, including v1 of this skill, fail in two directions at once:

1. They miss tells. Em dashes, rule-of-three, "It's not just X, it's Y", hedge stacks.
2. They add tells. Forced sass ("Here's the thing:"), fake anecdotes, invented numbers, <!-- ai-pattern-example -->
   performative lowercase. Detectors and humans both catch these now.

This skill closes both gaps.

---

## The Three Laws (non-negotiable, override everything else in this skill)

### Law 1: Never fabricate

Do not invent numbers, names, dates, quotes, anecdotes, benchmarks, or "personal experience"
that is not in the source text or supplied by the user. "Specificity" achieved by making things
up is worse than the AI tell it replaces. When the text needs a concrete detail you do not have,
insert a bracketed prompt for the user instead:

> Vague:   "This made our builds significantly faster."
> WRONG:   "This took our builds from 4 minutes to 40 seconds."   (invented)
> RIGHT:   "This cut our build time [FILL: from X to Y, your real numbers]."

Collect these as a short "Needs your input" list after the rewrite. An honest gap beats a
confident lie every time.

For claims of measurable improvement with no supporting measurement, a FILL prompt is
mandatory in the rewritten passage. This includes vague claims about speed, cost, accuracy,
reliability, or scale. Keep the claimed direction of change and request the missing baseline,
result, or comparison. Merely repeating "significantly faster" does not satisfy this rule.
Do not add FILL prompts to measurements already supplied or to ordinary opinions that do not
claim a measurable result. If the user asks for text only, keep necessary FILL prompts in it.

### Law 2: Never introduce a tell while removing one

Every replacement you write must itself pass the pattern catalog. The classic failure is
swapping "Furthermore," for "And here's the thing," which trades a P2 stiffness tell <!-- ai-pattern-example -->
(V3-TRANSITION) for a P0 overcorrection tell (O1-SASS). Before returning anything, run your
own rewrite through the same audit you ran on the input. See `references/overcorrection.md`
for the full list of humanizer-introduced tells.

### Law 3: Preserve meaning exactly

Facts, claims, numbers, names, URLs, code blocks, inline code, quoted material, and the
author's actual position must survive the rewrite unchanged. You are changing how it sounds,
not what it says. If a claim is so vague it cannot survive honest rewriting, flag it, do not
"fix" it by inventing content (see Law 1).

Treat inline code and fenced code blocks as protected spans. Copy them byte for byte,
including delimiters, fence language, whitespace, and newlines, in their original order.
Never combine commands into a new block, convert inline code to a block, reformat a command,
or change a URL. Edit the surrounding prose. Before returning, compare every protected span
with the source. Law 3 also protects punctuation inside code and verbatim quotations; flag
any conflict with a style rule instead of changing that material.

---

## Hard-banned moves

These are never acceptable in output, regardless of platform or voice profile:

<!-- ai-pattern-examples:start -->
- Em dashes. None. Not spaced, not unspaced, not "just one for effect". Use commas, periods,
  colons, parentheses, or restructure. This is the single most cited AI tell in circulation,
  and this skill takes the strict position on it.
- Forced-sass pivots: "Here's the thing:", "But here's the truth:", "The result?",
  "The kicker?", "The catch?", "Hot take:", "And honestly?", "Then I realized:",
  "Let that sink in."
- "It's not just X, it's Y" and its cousins ("This isn't about X. It's about Y.",
  "No X. No Y. Just Z.").
- Rule-of-three padding: triplets where the third item exists for rhythm, not content.
- Fake imperfection: deliberate typos, random lowercase, "lol" sprinkled into professional
  copy, stuttered "I... I just think", manufactured self-interruptions.
- Invented lived experience: "I've seen this go wrong so many times" when no such experience
  was supplied. First person is allowed only when the user is the author and the experience
  is real or clearly marked as needing their input.
- Chatbot residue: "Certainly!", "Great question", "I hope this helps", "Feel free to",
  "Let me know if", "Let's dive in", "Let's break this down".
- Unfilled placeholders shipped as final copy: "[Your Name]", "[INSERT SOURCE]",
  "2025-XX-XX". (Bracketed FILL prompts from Law 1 are fine because they are explicitly
  handed back to the user, never shipped.)
- Detector bait: zero-width characters, homoglyphs, or any other trick aimed at a detector
  rather than a reader (O11-DETECTORBAIT). This skill makes text read human; it does not
  disguise text whose origin someone is entitled to know.
<!-- ai-pattern-examples:end -->

---

## Workflow

### Step 0: Establish mode

Three modes. Infer from the request, default to Rewrite.

- **Rewrite** (default): audit, rewrite, self-audit, return clean text plus a short change log.
- **Detect**: audit only. Return findings grouped by severity with quoted text and pattern IDs.
  Do not touch the text. Trigger words: "audit", "detect", "flag", "scan", "just check".
- **Patch**: minimal in-place edits to an existing file, preserving everything already human.
  Return a diff-style summary, not the full file. Trigger: the user points at a file and asks
  for a light pass.

### Step 1: Capture the voice target

Before rewriting a single sentence, decide whose voice this is. In order of preference:

1. **User samples.** If the user has provided past writing (in this chat, in project files, or
   on request), build a quick voice fingerprint from it: typical sentence length spread,
   contraction rate, favorite connectives, formality level, punctuation habits, how they open
   and close. Match it. Full method: `references/voice-capture.md`.
2. **Stated profile.** If the user names a register (blunt, warm, technical, dry), apply it.
3. **Platform default.** Fall back to `references/platform-rules.md` for the target platform.

Platform targets (name one in the request, for example "humanize this as a Slack reply"):

| Target | Section in `platform-rules.md` |
|---|---|
| X post | X post |
| X reply | X reply |
| LinkedIn post | LinkedIn post |
| LinkedIn reply | LinkedIn reply |
| Slack reply | Slack reply |
| Messages reply (SMS, iMessage, WhatsApp) | Messages reply |

Replies work differently from posts. They answer something, so ask for the message being
answered if it was not supplied. Cut generic compliments and thank-yous, including short ones like "Thanks for sharing" (R5). Keep them at or below the draft's length. Do not add a stance,
an anecdote, or a commitment the user did not give you (Law 1, O4, O7). If the draft is already
short and clean, return it with minimal edits and say so.

Never skip this step. "Generic human" is not a voice, and generic-human output is exactly
what detectors are trained on.

### Step 1b: Set the options

Two optional dials control how plain and how polished the rewrite is. Clean output that is
also sterile and copy-edited is the failure they address. Both default to the old behavior.

| Option | Values | Default |
|---|---|---|
| `plainness` | `standard`, `plain`, `very-plain` | `standard` |
| `polish` | `clean`, `loose`, `texting` | `clean` |

- **plainness** sets word choice and sentence build. `plain` targets about grade 9 or lower:
  common words, verbs over nominalizations. `very-plain` targets about grade 7 or lower: short
  everyday words, one idea per sentence. Never dumb down a technical term the audience needs,
  never drop a fact (Law 3). Rules and swap lists: `references/plainness.md`.
- **polish** sets grammar looseness. `loose` permits comma splices, "And"/"So"/"But" openers,
  and a dropped final period on a one-line reply. `texting` adds lowercase starts, no final
  punctuation, and "gonna"/"kinda". Both are ceilings, not quotas, capped at about one loose
  device per three sentences (O13). Rules: Polish levels in `references/overcorrection.md`.

Infer from the request: "simpler words", "plain English", "less fancy", "too formal" means
`plain`. "Explain it simply", "for a general audience", "dumb it down" means `very-plain`.
"More casual", "less polished", "too perfect", "sounds copy-edited" means `loose`. "Like a
text", "like I'd text it" means `texting`. "More casual" alone never means `texting`.

Defaults by platform: Messages reply is `plain` and `loose`; Slack reply and X reply are
`plain` and `clean`; everything else is `standard` and `clean`. Table in
`references/platform-rules.md`.

Precedence, highest first:

1. The Three Laws and the hard-banned moves. Looseness never makes an em dash, an invented
   fact, a deliberate typo (O2), or a changed protected span.
2. An option the user names in this request. It sets the ceiling and the permitted devices.
3. Voice samples. They beat platform defaults and anything inferred, and they supply the
   habits a named option does not set. Fully punctuated texts keep a Messages reply clean.
4. Options inferred from the wording of the request.
5. Platform default, then the global default.

Keep a one-line note of the chosen levels next to the voice fingerprint.

### Step 2: Audit the input

Read `references/patterns.md` and scan the text against the full catalog. Note every hit with
its pattern ID. The catalog covers seven families:

- **P: Punctuation and formatting** (em dashes, bold overuse, emoji headers, title case,
  hashtag stuffing, list-label periods)
- **V: Vocabulary** (tiered word and phrase lists in `references/vocabulary.md`, plus
  polished-register plainness in `references/plainness.md`)
- **S: Structure** (rule of three, uniform rhythm, "It's not just X", inline-header lists,
  numbered-list inflation, wall-of-text replies, excessive headers)
- **C: Content** (significance inflation, promotional language, vague attribution,
  hedge-stacked predictions, speculative gap-filling, generic conclusions)
- **R: Register** (chatbot artifacts, sycophancy, narrated candor, recap-flattery openers,
  acknowledgment loops, over-polish in casual registers)
- **F: Fingerprints** (unfilled placeholders, chatbot citation markup, AI-tool UTM parameters)
- **O: Overcorrection** (the humanizer-introduced tells in `references/overcorrection.md`)

If Node 18+ is available, run the deterministic scanner for a second opinion on the
mechanical patterns:

```bash
node scripts/check.js path/to/draft.md
cat draft.md | node scripts/check.js -
```

The scanner catches the P, V, and F families plus a mechanical slice of the others. S, C, R,
and O mostly need your judgment; the scanner cannot tell an honest anecdote from a fake one,
or a literal "robust" from a filler one. <!-- ai-pattern-example -->

### Step 3: Rewrite (Rewrite and Patch modes)

Work top down. For each flagged passage, apply the fix from the catalog. Then do the additive
work that pure tell-removal skips:

- **Rhythm**: vary sentence length for real. A 4-word sentence next to a 30-word one. Vary
  paragraph length too. Do not achieve variety mechanically (short-long-short-long is its own
  pattern).
- **Real connectives**: "and", "but", "so", "also", "still", "which means". Sentences are
  allowed to just follow each other; most human transitions are invisible.
- **Position**: if the source takes a stance, sharpen it. If it does not, do not invent one.
  Ask the user what they actually think, or leave it neutral. A fake opinion is fabrication.
- **Specificity**: pull concrete details forward if they exist in the source. If they do not,
  bracket a FILL prompt (Law 1).
- **Openings and closings**: cut throat-clearing openers, cut summary endings. End on the last
  real point. It is fine for a piece to just stop.
- **Plainness**: apply the chosen level from Step 1b with `references/plainness.md`. Swap
  polished words for common ones, turn nominalizations back into verbs, keep needed technical
  terms, keep every fact.
- **Polish**: at `loose` or `texting`, let the grammar relax as far as Step 1b permits and
  no further. Do it where speech would run on, not on a schedule. Casual registers that come
  back fully copy-edited are an R10-OVERPOLISH miss.

### Step 4: Self-audit

Run your rewrite through the same catalog, including `references/overcorrection.md`. This pass
is mandatory, not optional polish. Things that most often survive pass one: a leftover em dash,
a rule-of-three you wrote yourself, uniform paragraph lengths, one "Here's why" you typed on <!-- ai-pattern-example -->
autopilot. Fix, then re-check the fixes.

Check that every unsupported measurable improvement has a FILL prompt and that every
protected span matches the source. Do this before the style scan.

Also check the options: no polished word the plainness level should have swapped
(V5-PLAINNESS), no loose device past the cap (O13), no deliberate typo at any level (O2), and
no fact lost to make a sentence simpler (Law 3).

If Node is available, also pipe your rewrite through `node scripts/check.js -`. Any P0 it
reports must be fixed before you return. It is cheap insurance against the leftover em dash.
When plainness is set, add `--metrics --plainness <level>` to see the approximate grade and
sentence stats. A V5-PLAINNESS finding means the draft is over the ceiling.

### Step 5: Return

Rewrite mode output, in this order:

1. The rewritten text, ready to paste. No preamble.
2. **Needs your input**: bracketed FILL items, if any.
3. **What changed**: 3 to 6 bullets naming the pattern families you fixed. Skip this if the
   user asked for the text only.

Detect mode output:

1. **Findings**: each hit with severity (P0 definite tell, P1 strong signal, P2 judgment
   call), the quoted text, and the pattern ID. Use one finding per line in the form
   `- P0 P1-EMDASH: "quoted passage" - explanation`. Repeat the severity on each line,
   even under a severity heading. Use the catalog severity, and use the per-word severity
   in `references/vocabulary.md` for V1-TIER1. Do not assign one severity to a group of
   IDs with different severities. The P1 in P1-EMDASH is part of its ID, not its severity.
2. **Read**: one short paragraph on whether the piece overall reads AI-written, human, or
   mixed, and which two fixes matter most.

---

## Severity model

- **P0**: definite tells. Em dashes, chatbot residue, unfilled placeholders, "It's not just
  X, it's Y", forced sass, invented stories or opinions, Tier 1 words marked P0 in the
  vocabulary table.
  Always fix.
- **P1**: strong signals. Rule-of-three clusters, uniform rhythm, hedge stacks, stacked essay
  transitions, Tier 2 vocabulary in clusters. Fix unless the user explicitly wants them.
- **P2**: judgment calls. A single "robust" in a security doc, an intentional list, a <!-- ai-pattern-example -->
  triplet where all three items carry weight. Flag in Detect mode, use judgment in Rewrite
  mode, and say what you decided.

---

## Reference files

Read before working, in this order:

1. `references/patterns.md`: the full pattern catalog with IDs, before/after pairs, and
   carve-outs for legitimate uses. Always read this.
2. `references/vocabulary.md`: tiered word and phrase lists with replacements. Always read
   for Rewrite mode.
3. `references/overcorrection.md`: tells that humanizers introduce. Always read before
   Step 4.
4. `references/platform-rules.md`: per-platform register rules. Read when platform is known.
5. `references/voice-capture.md`: building a voice fingerprint from user samples. Read when
   samples are available.
6. `references/plainness.md`: plain-word rules, swap lists, nominalization fixes. Read when
   plainness is `plain` or `very-plain`.

The polish rules live in the Polish levels section of `references/overcorrection.md`, which
you read before Step 4 anyway.

---

## What "much better" means here, concretely

If you are tempted to skip steps, remember what this version fixes:

- v1 of this skill told you to use em dashes and "Here's the thing". Both are P0 tells now. <!-- ai-pattern-example -->
- Popular humanizer skills delete tells but leave corpses: flat, voiceless text that is
  "clean" and still obviously machine-made. The additive work in Step 3 is the actual job.
- A common humanizer failure is inventing facts to fake specificity. Law 1 exists because a
  rewrite that lies is a failed rewrite, whatever a detector says.
