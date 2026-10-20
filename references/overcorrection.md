# Overcorrection Catalog (O family)

The tells that humanizers add. Every one of these came from real "make it sound human" output,
including v1 of this very skill. Run this list against your own rewrite in Step 4, always.

Think of it like antibiotic resistance. The first generation of AI detection keyed on stiff
formal writing, so rewrites swung casual. Now the casual swing is itself the signature.
Text that opens with "Okay so real talk:" reads more machine-made in 2026 than "Furthermore"
does, because only machines imitating humans write like that on purpose.

---

### O1-SASS (P0)
Forced-sass pivots installed as "personality": "Here's the thing:", "But here's the truth:",
"The result?", "The kicker?", "Hot take:", "And honestly?", "Then it hit me:", "Let that sink
in", "Real talk:". v1 of this skill literally instructed replacing "Furthermore" with "And
here's the thing", which swaps a P2 stiffness tell (V3-TRANSITION) for a P0 overcorrection
tell.

- Fix: "But". "So". Or nothing. Most human transitions are invisible.

### O2-FAKETYPO (P0)
Deliberate typos, dropped capitalization, "teh", missing periods, inserted to simulate
imperfection. Humans make errors randomly; a rewrite that places them deliberately places
them detectably, and readers who spot one on purpose lose all trust in the text.

- Fix: never. Write cleanly. Human texture comes from rhythm and word choice, not damage.
- Not covered: lowercase starts and dropped final punctuation under `polish: texting`. That is
  a register the user asked for or their samples show, not simulated damage. Misspellings,
  letter swaps, and wrong-word errors are never allowed at any polish level.

### O3-FAKESLANG (P1)
Slang and vibes pasted onto a register that does not carry them: "ngl this API kinda slaps"
in enterprise docs, "vibes" in a runbook, "chef's kiss" anywhere near production incident
notes.

- Fix: match the register the user actually writes in. Check samples. When in doubt, plainer.

### O4-FAKESTORY (P0)
Invented anecdotes: "I've seen this go wrong so many times", "A client once told me", "Last
week I deployed and watched everything catch fire", when nothing of the sort was supplied.
This is fabrication (Law 1) wearing a trench coat.

- Fix: first-person experience only when supplied by the user, or bracketed as a FILL prompt.

### O5-HONESTYSPAM (P1)
"Honestly", "to be fair", "I'll be honest", "frankly" sprinkled more than once per piece.
One earned concession reads human. Three read like a template for reading human.

- Fix: at most one, and only where a real concession follows it.

### O6-MECHVARIANCE (P1)
Mechanical sentence variance: short-long-short-long alternation, or one dramatic fragment
per paragraph like clockwork. Variance applied on a schedule is uniformity with extra steps.

- Fix: vary because the content demands it. Some paragraphs are legitimately even.

### O7-OPINIONIMPLANT (P0)
Installing a strong opinion the author never expressed: "I'll die on this hill", "X is
genuinely better and I'm tired of pretending otherwise", added to a neutral source text.
The author now publicly holds a position they never took.

- Fix: sharpen stances that exist in the source. For neutral text, ask the user for their
  actual take or leave it neutral.

### O8-QUIRKYASIDE (P1)
Parenthetical asides installed at regular intervals to feel conversational (yes, like this
one) (and this one) (you see the problem).

- Fix: at most one or two per piece, and only where the aside carries information.

### O9-FRAGMENTSPAM (P1)
Sentence fragments. For emphasis. Everywhere. Constantly.

- Fix: a fragment lands because it is rare. One per section, at most.

### O10-CONTRAMAX (P2)
Contraction rate cranked to 100% including places a human would not contract, especially in
emphatic or formal spots ("that'll not be necessary", contracting inside quoted formal text).

- Fix: contractions where natural speech has them, full forms where emphasis or register
  wants them.

### O11-DETECTORBAIT (P0)
Tricks aimed at fooling detectors rather than readers: homoglyph substitution, zero-width
characters, spaced-out punctuation, randomized synonyms mid-sentence. These are detectable
as tricks, and they degrade the writing for every human reader.

- Fix: never. This skill makes text read human, it does not launder it.
- Scanner: flags zero-width characters (U+200B, U+200C, U+200D, U+2060, and U+FEFF anywhere
  but the very start of a file) and words that mix Latin and Cyrillic letters.

### O12-VOICEDRIFT (P1)
The rewrite has a voice, but not the user's voice. Their samples show short declarative
sentences and no questions; the rewrite is full of winding clauses and rhetorical questions.
Clean of tells, still not theirs.

- Fix: fingerprint first (voice-capture.md), rewrite second. When samples exist, they beat
  every default in this skill.

### O13-LOOSEOVERSHOOT (P1)
Looseness from the `polish` option applied past what the register carries: a comma splice in
every sentence, "And" or "So" opening each line, "gonna" and "kinda" in a reply that has no
other casual marks, a dropped period on every message. Loose devices on a schedule are
O6-MECHVARIANCE with a different costume.

- Fix: at most one loose device per three sentences, placed where speech would actually run on.
  A reply that is already short and natural needs none. If the user's samples show fewer
  devices than that, use fewer.

---

## Polish levels

The `polish` option (clean, loose, texting) permits casual grammar. Permission is a ceiling,
not a quota. The goal is text that is not copy-edited to death in a casual register
(R10-OVERPOLISH), without crossing into O2, O3, O9, or O13.

| Level | Permits | Never |
|---|---|---|
| clean | Standard written grammar and punctuation. Default everywhere except Messages reply. | n/a |
| loose | Comma splices and run-ons where speech runs on. "And", "So", "But" openers. A dropped final period on a one-line reply. Fragments inside the O9 cap. Natural contractions. | Slang, abbreviations, misspellings, lowercase "i", any deliberate error. |
| texting | Everything in loose, plus lowercase sentence starts, no final punctuation, "gonna", "gotta", "kinda", "wanna", "yeah", "nope". | Slang or abbreviations not in the user's samples (ngl, tbh, lol, fr), misspellings, emoji not in samples. |

Rules:

1. **Defaults.** clean, except Messages reply, which defaults to loose. texting is never a
   default and is never inferred from the platform alone. It needs an explicit request or
   samples that show it.
2. **Samples win over defaults.** If the user's texts are fully punctuated, a Messages reply
   stays clean. A named option sets the ceiling; samples still supply the habits.
3. **The Laws and hard bans win over polish.** No em dash, no invented fact, no altered
   protected span, no deliberate typo, at any level.
4. **Never loosen protected material.** Names, numbers, quotes, code, URLs, and commitments
   stay exactly as written.
5. **Stay below caricature.** If a reader would picture a model performing casualness, cut it.
6. **Do not loosen where the register is formal.** Email to a stranger, LinkedIn, docs, and
   READMEs ignore loose unless the user explicitly asks, and even then one device per piece.
7. **Do not lower the content bar.** Loose grammar is not vagueness. Every fact survives.

Example (loose, Slack, source: "I have completed the migration. All services are operating on
the new cluster."): "Migration's done, everything's on the new cluster now." One contraction
pair, no slang, no added fact, and it stops.

---

## The final read test

After the O pass, read the piece as the intended audience, once, at full speed. Ask exactly
two questions:

1. Does any sentence make me picture a model trying to sound like a person?
2. Would the user be comfortable claiming every sentence, opinion, and fact as their own?

The answer to the first must be no and the answer to the second must be yes before you
return anything.
