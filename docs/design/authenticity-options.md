# Authenticity options: plainness and polish

Status: plainness and polish implemented in 2.2. Habits and the em-dash question are future work.

## Problem

The skill removes AI tells well. It has no positive model of what a real person sounds like, so
output comes back clean but sterile and over-polished. Four gaps:

1. **No plainness control.** `vocabulary.md` only flags AI-marker words. Tier 3 stiffness is P2
   and low weight. Nothing pushes toward common words a typical reader knows, and nothing flags
   abstract, polished register ("substantive point", "useful frame") or nominalizations ("the
   implementation of the cache" instead of "we built the cache").
2. **Over-polish is never a tell.** O9 caps fragments and O10 caps contractions, but nothing
   permits loose casual grammar: run-ons, comma splices, "And" or "So" openers, "gonna" or
   "kinda", a dropped final period. Every output is copy-edited prose, which is wrong for a Slack
   or text reply.
3. **The scanner only reports negatives.** There are no readability or rhythm numbers, so
   "too polished" and "too hard to read" cannot be checked.
4. **Evals only assert absence of tells.** Nothing checks that output got simpler or that
   looseness stayed under caricature.

## Option model

Two independent options, both optional. Defaults preserve current behavior except where noted.

### plainness: standard | plain | very-plain

| Level | Target (Flesch-Kincaid, approx) | Word choice | Sentences |
|---|---|---|---|
| standard | no ceiling (scanner flags above 12) | Current behavior. AI-tier swaps only. | No new rule. |
| plain | grade 9 or below, aim 7 to 9 | Common words a typical adult reader knows. Verbs over nominalizations. No abstract meta-words ("framework", "frame", "substantive") where a concrete word works. | Mean length about 16 words or fewer. |
| very-plain | grade 7 or below, aim 5 to 7 | Short everyday words. Concrete subject then verb. One idea per sentence. | Mean length about 12 words or fewer. |

The grade is a ceiling, not a quota. Do not flatten rhythm to hit it (S4-RHYTHM, O6): a
4-word sentence next to a 20-word one is still right. Do not lower the grade by deleting facts
(Law 3) or by replacing a technical term the audience needs ("JSONB", "idempotent" in an API
doc). Keep the term. Never add a gloss the source did not have unless the user asked for a
lay audience.

### polish: clean | loose | texting

| Level | Permits | Still banned |
|---|---|---|
| clean | Current behavior: standard written grammar and punctuation. | Nothing new. |
| loose | Comma splices and run-ons where speech would not pause. "And", "So", "But" openers. A dropped final period on a one-line reply. Fragments within the O9 cap. Contractions at natural rates. | Slang, abbreviations, misspellings, lowercase "i", any deliberate error. |
| texting | Everything in loose, plus lowercase sentence starts, no final punctuation, "gonna", "gotta", "kinda", "wanna", "yeah", "nope". | Slang and abbreviations not in the user's samples (ngl, tbh, lol, fr), misspellings, emoji not in samples. |

Guardrails for loose and texting (full text in `references/overcorrection.md`):

- Looseness is a ceiling, not a quota. One loose device per three sentences at most, never on a
  schedule (O13-LOOSEOVERSHOOT, new, P1).
- It must stay below caricature. If a reader would picture a model performing casualness, it
  is O3-FAKESLANG or O9-FRAGMENTSPAM, not loose.
- Never inside protected spans, names, numbers, quotes, or code (Law 3).
- `texting` is never a default and never inferred from a platform alone. It needs an explicit
  request ("like a text") or samples that show it.

New judgment pattern R10-OVERPOLISH (P2): casual-platform output where every sentence is a
complete, fully punctuated, copy-edited sentence with formal connectives. In Detect mode it is
a finding. In Rewrite mode it is fixed only if the polish level allows looseness, since a user
who asked for clean gets clean.

### Defaults per platform

| Platform | plainness | polish | Reason |
|---|---|---|---|
| Messages reply | plain | loose | Spoken register. Copy-edited prose is the most visible tell here. Loose permits, it does not require: a short clean reply stays as is. |
| Slack reply | plain | clean | Same reasoning for words, but Slack text is typed at work and readers expect punctuation. Samples can move it to loose. |
| X reply | plain | clean | Short replies read better in common words. |
| Everything else | standard | clean | Preserves current behavior. README and docs especially must not lose precision. |

Only Messages reply changes grammar defaults. Plainness defaults to plain on replies because the
swap list is low risk and replies are capped at draft length.

### Interaction with other rules

Precedence, highest first:

1. The Three Laws and hard-banned moves. Looseness never produces an em dash, an invented fact,
   a deliberate typo, or an altered protected span.
2. An option the user names in this request.
3. Voice samples. Samples win over platform defaults and over anything inferred. If a user's
   texts are fully punctuated, a Messages reply stays clean even though the platform default is
   loose. A named option beats samples only for what the option sets (grade ceiling, which
   devices are permitted); samples still supply connectives, rhythm, and habits.
4. Inferred options ("simpler words" means plain; "more casual" means loose; "like a text"
   means texting).
5. Platform default, then global default (standard, clean).

## Typos and spelling mistakes

Position: **random typo injection stays banned** (O2-FAKETYPO). Reasons:

1. An LLM cannot be random. Injected errors cluster in detectable places and kinds, so they
   become a signature.
2. Real modern errors are autocorrect-style: a wrong real word (form for from, their for there),
   a missing apostrophe, a doubled word, a dropped word. They are not letter swaps like "teh".
   Faking those convincingly is harder than it looks, and the cheap form is wrong.
3. On professional platforms a spotted fake typo costs credibility with the exact readers the
   user wants to keep.
4. It sits on the O11-DETECTORBAIT line. It is an edit aimed at a detector's view of the text,
   not at a reader.

Replacement, **future work, not implemented**: a `habits: from-samples` option that reproduces
systematic quirks the user's samples actually show, consistently rather than randomly. Examples:
lowercase "i", no apostrophes in texts, no Oxford comma, "alot", the user's own dash usage. A
quirk that appears in every sample is a habit; a one-off slip is not copied.

If error injection were ever added, it must be:

- opt-in and off by default
- rare: at most 1 per roughly 150 words
- realistic types only (wrong real word, missing apostrophe, doubled word, dropped word)
- never in names, numbers, code, or URLs
- blocked on LinkedIn, email, and docs unless the user explicitly asks

The texting level above is not typo injection. Lowercase starts and dropped final punctuation
are a register the user chose, not simulated damage. O2-FAKETYPO is reworded to say so.

## Scanner metrics design

New opt-in flags on `scripts/check.js`. Default output and the existing `--json` shape do not
change.

- `--metrics`: adds a metrics block to the report, and a `metrics` key to each JSON result
  object. Fields: `words`, `sentences`, `meanSentenceLength`, `sdSentenceLength`,
  `meanWordLength`, `fkGrade`, `contractions`, `contractionRate`, `longWordShare`.
- `--plainness <standard|plain|very-plain>`: emits `V5-PLAINNESS` at P2 when the approximate
  grade exceeds the level ceiling (12, 9, 7). Never changes the exit code. Skipped below 20
  words, since grade is unstable on short text.
- Measured text: the same masked prose the pattern scan uses (code fences, inline code, URLs,
  comments, example markers stripped), with markdown markers removed.
- Sentences: split on terminal punctuation and on line breaks, so list items and headings count.
- Syllables: a vowel-group heuristic with silent-e handling. Approximate, and documented as
  such. It is good enough to rank drafts and trip a ceiling, not to publish a grade.
- Contraction rate: contractions divided by contractions plus uncontracted pairs that could have
  been contracted ("do not", "it is"). Null when there are no opportunities.
- Long word share: words of 3 or more syllables, as a fraction.

## Eval design

- New check type `max_grade` (value N): the approximate grade of the rewritten text (change log
  excluded) must be at most N. It reuses the scanner metrics, so the eval and the scanner agree.
- Case `plain-very-plain-jargon`: jargon-heavy paragraph, very-plain, bans specific fancy words,
  keeps the numbers, caps the grade.
- Case `polish-loose-slack`: Slack reply with loose polish. Asserts no slang, no invented
  facts, no chatbot residue. Does not require looseness, since it is a ceiling.
- Case `polish-loose-no-typos`: loose polish and O2 still holds. No deliberate typos, no
  lowercase "i", no letter-swap misspellings.
- Every case ships a pass fixture and fail fixtures. `--self-test` proves the checks reject
  the bad ones.

## Out of scope

- `habits: from-samples` (designed above, not built)
- Variants (multiple rewrites per request)
- Persona presets ("founder voice", "engineer voice")
- Relaxing the em dash ban when samples use em dashes (open question for later; today samples
  lose to the hard ban)
- Error injection of any kind
