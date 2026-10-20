# Pattern Catalog

Every pattern has an ID, a severity, a fix, and where relevant a carve-out for legitimate use.
Quote the ID in Detect mode findings.

Severities: P0 definite tell, P1 strong signal, P2 judgment call.

Seven families: P (punctuation and formatting), V (vocabulary), S (structure), C (content),
R (register), F (fingerprints), and O (overcorrection, in `overcorrection.md`). Two entries
support the `plainness` and `polish` options: V5-PLAINNESS and R10-OVERPOLISH.

A naming wart to know about: the P family's IDs start with "P" and so do the severities, so
you will see entries like "P1-EMDASH (P0)". The part before the hyphen is the ID, the part in
parentheses is the severity. Renaming the family is planned for 3.0 because it changes IDs.

---

## P family: Punctuation and formatting

### P1-EMDASH (P0)
Em dashes, spaced or unspaced, including double hyphens used as dashes. The most widely known
AI tell in circulation, and this skill bans it outright (see "Opinionated defaults" in the
README if you fork it and want them back).

- Before: the same sentence with the aside wrapped in unspaced dashes, "She opened the
  book[EMDASH]its pages brittle[EMDASH]and found a map..." (character U+2014, deliberately
  not typed here so the character appears nowhere in this repo outside test fixtures).
- Fix: commas, periods, colons, parentheses, or restructure. There is no carve-out.
- Double hyphens count when they stand in for a dash between words ("fast--really fast", or
  spaced " -- "). CLI flags like `--json` do not.

### P1-ENDASH (P2)
A spaced en dash (U+2013) doing an em dash's job: "the fix [ENDASH] if you can call it that".
Weaker signal than the em dash, since some style guides use it this way on purpose.

- Fix: same as P1-EMDASH. Carve-out: unspaced en dashes in ranges ("pages 10[ENDASH]12") are
  correct and never flagged.

### P2-BOLD (P1)
Bold scattered through prose to simulate emphasis, especially bolded openings of list items
that restate the item ("**Speed:** Speed improved by...").

- Fix: write the point directly. Reserve bold for genuine reference lookups (CLI flags, keys).

### P3-EMOJI (P1)
Emoji as section headers or bullet decorations (rocket, lightbulb, checkmark). Near-universal
in LLM marketing output.

- Fix: delete. Carve-out: platforms where the user's own voice uses them, confirmed by samples.

### P4-TITLECASE (P2)
Headings in Title Case Where Every Word Is Capitalized, especially inconsistently.

- Fix: sentence case, unless the user's house style says otherwise.

### P5-HASHTAG (P0 at 6+, P1 at 4+)
Trailing hashtag blocks. Six or more tags is near-universal in LLM social output and rare in
human posts.

- Fix: two or three specific tags, or none.

### P6-LISTPERIOD (P1)
List labels punctuated with a period instead of a colon: "- **Intros.** Years of conferences."

- Fix: "- **Intros:** years of conferences." or drop the label.

### P7-HYPHENSTACK (P1)
Stacked hyphenated modifiers: "a high-quality, well-architected, future-proof solution."
Related: hyphens where none belong ("in real-time", "out-of-the-box" as adverbs, "code-base").

- Fix: keep the one modifier that matters. "in real time", "works out of the box", "codebase".
- Carve-out: legitimate compound modifiers before nouns ("real-time analytics").

---

## V family: Vocabulary

Full tiered lists live in `vocabulary.md`. Summary of the tier logic:

### V1-TIER1 (P0/P1 per word)
Words whose usage spiked measurably after ChatGPT (PubMed excess-vocabulary data, Kobak et al.
2025): delve, tapestry, testament, plethora, multifaceted, embark, bustling, unwavering,
landscape and navigate and journey (metaphorical), realm, foster, garner, bolster, underscore,
showcase, pivotal, crucial (filler), vibrant, boast, seamless, robust (filler), leverage,
harness, holistic, elevate, empower, unlock, spearhead, meticulous, intricate, myriad, beacon.
One or two filler hits flag the passage. Use the per-word severity from
`vocabulary.md` in Detect mode too; identifying filler does not promote a P1 word to P0.

- Scanner: P0 or P1 per word. Words with common literal uses scan as P1 so a reader makes the
  call; `vocabulary.md` has the per-word column.

### V2-CLUSTER (P1)
Hype and corporate vocabulary that flags when 3+ distinct words appear or one repeats:
transformative, revolutionary, disruptive, state-of-the-art, best-in-class, next-generation,
game-changer, paradigm, cutting-edge, synergy, actionable insights, pain points, ecosystem
(loose), stakeholders (non-corporate context), streamline, deep dive, and the rest of Tier 2.

### V3-STIFF (P2)
Wordiness that reads machine-formal: in order to, due to the fact that, prior to, subsequent
to, utilize, commence, endeavor, facilitate, in the event that, at this point in time,
a wide range of, plays a crucial role in. These are clarity edits; alone they do not prove
AI authorship, so weight them lower in Detect mode.

### V3-TRANSITION (P2 alone, P1 when stacked)
Essay-template openers: "Furthermore,", "Moreover,", "Additionally,", "In addition,",
"Ultimately,", "Overall,". Two or more in one piece is the tell.

- Fix: delete, or use "and", "also", "so", "but". Never replace with a sass pivot (O1-SASS).

### V5-PLAINNESS (P2)
Polished or abstract register that is not an AI marker but reads as written-for-a-memo:
"substantive point", "useful frame", nominalizations ("the implementation of the cache",
"make a determination"), and words a typical reader would not say aloud when a common one
exists. Judgment only in Rewrite mode, unless the user set `plainness` to plain or very-plain.
Technical terms the audience needs are never a hit.

- Fix: `references/plainness.md` (swap table, nominalization fixes, process).
- Scanner: P2 only with `--plainness <level>`, when the approximate Flesch-Kincaid grade
  exceeds the level ceiling (standard 12, plain 9, very-plain 7). Skipped under 20 words.

### V4-CLICHE (P1): cliché scene-setters
"In today's fast-paced digital landscape", "In the dynamic world of X", "As the world
continues to evolve", "In an era of", "Now more than ever". Delete the phrase entirely; the
sentence almost always survives without it.

---

## S family: Structure

### S1-TRIPLET (P1)
Rule-of-three abuse: triplets where the third element is padding. "Faster, cleaner, and more
maintainable" where "more maintainable" adds nothing.

- Fix: keep the items that carry weight, even if that leaves two, or one.
- Carve-out: triplets where all three items are load-bearing and specific.

### S2-NOTJUSTX (P0)
"It's not just X, it's Y." Also: "This isn't about X. It's about Y.", "No X. No Y. Just Z.",
"X isn't the point. Y is."

- Fix: state Y directly. If the contrast genuinely matters, name the actual tradeoff.

### S3-HERESWHY (P1)
Sentences opening with "Here's": "Here's why that matters", "Here's the deal", "Here's what
nobody tells you". Also "That's the real X" ("That's the real unlock").

- Fix: delete the frame, state the thing.

### S4-RHYTHM (P1)
Uniform rhythm: all sentences 15 to 25 words, all paragraphs the same height. Reads like a
metronome.

- Fix: genuine variance. Short sentence. Then a longer one that takes its time getting where
  it is going. Do not alternate mechanically; that is its own pattern.

### S5-INLINEHEADER (P1)
Inline-header bullet lists where the bold label restates the content. See P2-BOLD.

### S6-LISTINFLATION (P1)
"Here are 7 reasons why..." where 3 reasons carry all the weight. Also: converting flowing
prose into bullets because "people don't read".

- Fix: cut to the items that matter; prefer prose when the ideas connect.

### S7-BARELIST (P1)
Bullet lists of bare noun phrases with no verbs or numbers: "Stable mining efficiency /
Reliable pool connectivity / Optimized performance".

- Fix: prose, or rewrite each item as a full claim with a verb and a number.
- Carve-out: changelogs, parameter docs, ingredient lists, where bare NPs are correct.

### S8-HEADERGLUT (P1)
Five headers in 200 words. "Overview:", "Key Points:", "Conclusion:" scaffolding.

- Fix: merge sections; use headers only where a reader would actually scan for them.

### S9-WALLREPLY (P1)
Chat, issue, or PR replies delivered as one unbroken 4+ sentence paragraph, the default LLM
reply shape.

- Fix: break at thought boundaries, the way a person actually types a reply.

### S10-QOPENER (P1)
Rhetorical question openers: "What if there were a better way to X?"

- Fix: lead with the claim.

### S11-RESHUFFLE (P2, writer-side test)
If you can swap two body paragraphs and nothing breaks, the piece has no argument, just
accumulation. Also the treadmill test: ask of each paragraph "what is actually new here?"

- Fix: restructure so each paragraph depends on the previous one, or cut.

---

## C family: Content

### C1-INFLATION (P0)
Significance inflation: "marking a watershed moment", "a pivotal step in the evolution of",
"poised to disrupt".

- Fix: the factual version. "was founded in 2019 to solve X."

### C2-PROMO (P0)
Promotional language: "vibrant startup nestled in the heart of Boulder's thriving tech
ecosystem", "breathtaking", "renowned".

- Fix: plain description. "a Boulder startup."

### C3-VAGUEATTR (P0)
Vague attribution: "Experts believe", "Studies show", "It is widely regarded".

- Fix: name the source, or cut the claim. Never invent a source (Law 1).
- Scanner: P1, since it cannot see whether a real citation follows the phrase.

### C4-HEDGESTACK (P1)
Stacked hedges: "could potentially create", "may eventually help unlock".

- Fix: pick one hedge. Each additional hedge cancels the previous one.

### C5-FUTURECLOSER (P1)
Unfalsifiable future-narrative closers: "may become one of the most important stories of the
coming decade", "the future looks bright", "only time will tell".

- Fix: a falsifiable prediction, a specific closing thought, or just stop.

### C6-GAPFILL (P0)
Speculative gap-filling stated as fact: "maintains a low profile", "likely began his career
in". The model guessing to fill a biography-shaped hole.

- Fix: cut, or replace with a sourced fact from the user.

### C7-FALSERANGE (P1)
False ranges: "covering everything from the Big Bang to dark matter."

- Fix: list the actual topics.

### C8-FALSECONCESSION (P1)
"While X has limitations, it remains remarkable." A concession-shaped sentence containing no
concession.

- Fix: name the real limitation and the real tradeoff, or cut.

### C9-INGCHAIN (P1)
Superficial -ing analysis chains: "symbolizing... reflecting... showcasing... highlighting..."

- Fix: replace with a specific fact, or cut the clause.

### C10-NAMEDROP (P1)
Notability stacking: "featured in NYT, BBC, and Wired" as free-floating credibility.

- Fix: one specific citation doing real work: "In a 2024 NYT interview she argued X."

### C11-SYNCYCLE (P1)
Synonym cycling to avoid repeating a word: developers, then engineers, then practitioners,
then builders, all meaning the same people.

- Fix: repeat the clear word. Humans repeat words.

### C12-COPULA (P1)
Copula avoidance: "serves as", "functions as", "features", "boasts", "offers", "presents"
where "is" and "has" belong.

- Fix: is, has.

---

## R family: Register

### R1-CHATBOT (P0)
Chatbot residue: "Certainly!", "Great question!", "I hope this helps", "Feel free to reach
out", "Let me know if you'd like".

- Fix: delete entirely.
- Scanner: P1 for the bare forms "Feel free to" and "Let me know if", because people type them
  in real emails all the time. Judge those in context.

### R2-LETS (P1)
"Let's explore", "Let's dive in", "Let's break this down".

- Fix: start with the point.

### R3-ACKLOOP (P1)
Acknowledgment loops: "You're asking about X. To answer your question,".

- Fix: answer.

### R4-NOTEWORTHY (P1)
Confidence-calibration filler: "It's worth noting", "Interestingly,", "Surprisingly,",
"Notably,".

- Fix: let the fact speak. If it is genuinely surprising, the reader will notice.

### R5-RECAPFLATTERY (P1)
Openers that recap the other person's work back at them with praise before getting to the
point: "Thanks for all the legwork here, the migration script and rollback plan you worked
through are what made this possible."

- Fix: substance first. If thanks is warranted, one plain clause.

### R6-NARRATEDCANDOR (P2)
Announcing honesty instead of being honest: "I want to be upfront:", "Two caveats I'd rather
flag now than have you discover later:".

- Fix: state the caveats.
- Carve-out: genuine conflict-of-interest disclosure ("full disclosure, I own shares").

### R7-LINGERCLAIM (P1)
Manufactured lingering attention: "I can't stop thinking about this", "The line I keep coming
back to:", with no reason given.

- Fix: open on the thing itself.
- Carve-out: keep the frame when a concrete reason follows.

### R8-EMOTIONFLAT (P1)
Flat-pack emotion: "What surprised me most", "I was fascinated to discover", attached to
nothing surprising or fascinating.

- Fix: earn the emotion with a specific, or cut the claim.

### R9-COTLEAK (P0)
Reasoning-chain leakage: "Let me think through this step by step", "Breaking this down",
appearing in final copy.

- Fix: conclusion first, then evidence.

### R10-OVERPOLISH (P2)
Casual-platform output (Slack, Messages, X reply, GitHub comment) in which every sentence is
complete, fully punctuated, and joined with formal connectives. Reads as copy-edited prose in
a register that is not. Judgment call; the scanner cannot see it, though `--metrics` helps
(a long mean sentence, near-zero contraction rate, and low sentence-length spread on a short
reply are the signs).

- Fix: only if `polish` is loose or texting. Allow the casual grammar in
  `overcorrection.md` (Polish levels), within the O13 cap. At polish clean, report it in
  Detect mode and leave the text alone.
- Carve-out: a short clean reply ("Yes, still on for tonight.") is not over-polished. Plain and
  correct is fine.

---

## F family: Fingerprints

### F1-PLACEHOLDER (P0)
"[Your Name]", "[INSERT SOURCE]", "[Company]", "2025-XX-XX", "Lorem ipsum" shipped in copy.

### F2-CITEMARKUP (P0)
Chatbot citation tokens: "citeturn0search0", "oai_citation", "contentReference[oaicite".

### F3-UTMSOURCE (P0)
AI-tool URL parameters: "utm_source=chatgpt.com", "utm_source=copilot".

- Fix for all three: fill, strip, or delete. These are near-definitive tells; one hit is
  enough to sink a document's credibility.

---

## Using the catalog

In Detect mode: report every hit as `ID (severity): "quoted text"` grouped by severity.

In Rewrite mode: fix P0 always, P1 unless intentional (say so if you keep one), P2 by
judgment. Then run the O family from `overcorrection.md` against your own output before
returning it. That second pass is where this skill earns its keep.
