# Vocabulary Tiers

This file is the source of truth for vocabulary. `patterns.md` summarizes it and
`scripts/check.js` implements it; a test fails if the scanner and this file drift apart.

Four tiers, plus a short list of filler transitions. Tier logic matters: a Tier 1 word is
evidence about how the text was produced. A Tier 3 word is just wordiness, which humans
produce too, so never let Tier 3 hits alone push a document toward an "AI-written" verdict
in Detect mode.

Replacements are suggestions, not mandates. The best replacement is usually the plainest word
the sentence survives with, and sometimes that is deletion.

---

## Tier 1: frequency markers (P0 when used as filler)

Words whose usage jumped measurably after ChatGPT's release, plus close companions. The best
public evidence is the excess-vocabulary analysis of PubMed abstracts (Kobak et al., 2025),
where "delves" is the headline example.

Severity depends on use. As filler these are P0. Many of them also have honest literal uses
("a robust estimator", "navigate to the settings page", "harness" on a horse), and those are
not tells at all. You judge which one you are looking at; the scanner cannot, so it reports
most of them as P1 and leaves the call to you. The **Scanner** column says what it reports.

| Flag | Replace with | Scanner |
|---|---|---|
| delve (into) | dig into, look at, get into, cover | P0 |
| tapestry | mix, range, combination, or restructure | P0 |
| testament (to) | proof of, shows that | P0 |
| plethora | plenty, lots, or the actual number | P0 |
| multifaceted | varied, or list the actual facets | P0 |
| embark (on) | start, begin | P0 |
| bustling | busy, or delete | P0 |
| unwavering | steady, consistent | P0 |
| landscape (metaphorical) | field, market, space, or name the actual thing | P1 |
| navigate (metaphorical) | handle, deal with, work through | P1 |
| journey (metaphorical) | process, path, or name the actual steps | P1 |
| realm | area, field | P1 |
| foster | build, grow, encourage | P1 |
| garner | get, earn, attract | P1 |
| bolster | support, strengthen | P1 |
| underscore | show, point to, confirm | P1 |
| showcase | show | P1 |
| pivotal | key, important, or state why it matters | P1 |
| crucial (filler) | important, or delete | P1 |
| vibrant | busy, active, or a concrete descriptor | P1 |
| boast(s) | has, includes | P1 |
| seamless(ly) | smooth(ly), works without extra steps, or delete | P1 |
| robust (filler) | reliable, solid, well-tested | P1 |
| leverage (verb) | use | P1 |
| harness | use | P1 |
| holistic | complete, end to end, whole | P1 |
| elevate | improve, raise | P1 |
| empower | let, enable, help | P1 |
| unlock | enable, open up, or state the concrete gain | P1 |
| spearhead | lead, run | P1 |
| meticulous(ly) | careful(ly), or show the care with a detail | P1 |
| intricate | complex, detailed | P1 |
| myriad | many, or the actual number | P1 |
| beacon | example, or restructure | P1 |

## Tier 2: cluster signals (P1 when 3+ distinct words appear or one repeats)

Hype and corporate vocabulary. One of these alone is a style choice. A cluster is a tell.

transformative, revolutionary, revolutionize, disruptive, disrupt, state-of-the-art,
best-in-class, world-class, next-generation, next-gen, game-changer, game-changing, paradigm
(shift), cutting-edge, synergy, innovative (empty), value-add, thought leadership, ecosystem
(loose), stakeholders (non-corporate), actionable insights, pain points, moving the needle,
low-hanging fruit, deep dive (noun), granular (insights/data), bandwidth (attention),
streamline(d), scalable (empty), frictionless, turnkey, mission-critical (empty),
battle-tested (empty), production-grade (empty), enterprise-grade (empty).

Fix: swap for the concrete claim behind the word. "Battle-tested" becomes "has run in prod at
[FILL: where] since [FILL: when]", or gets cut.

The scanner reports the cluster as one document-level P1 finding listing the words it found.

## Tier 3: stiffness markers (P2, clarity edits, weight low in Detect mode)

| Flag | Replace with |
|---|---|
| in order to | to |
| due to the fact that | because |
| prior to | before |
| subsequent to | after |
| utilize, utilization | use |
| commence | start |
| endeavor | try, effort |
| facilitate | help, make easier |
| ascertain | find out, confirm |
| in the event that | if |
| at this point in time | now |
| on a regular basis | regularly |
| in close proximity to | near |
| a wide range of | many, or the list |
| a number of | several, or the number |
| with regard to | about |
| in terms of | usually delete |
| the fact that | usually delete |
| plays a crucial role in | matters for, drives, or the concrete mechanism |

### Filler transitions (P2 alone, P1 when stacked)

Sentence-opening connectives from essay templates: "Furthermore,", "Moreover,",
"Additionally,", "In addition,", "Ultimately,", "Overall,". One in a long piece is ordinary.
Two or more in the same piece is a pattern.

- Fix: most can be deleted outright; the sentence order already carries the logic. Where a
  connective is needed, use "and", "also", "so", or "but".
- Do not replace them with forced sass (O1-SASS). Swapping "Furthermore," for a "here's the
  thing" pivot trades a P2 stiffness tell for a P0 overcorrection tell.

## Tier 4: cliché scene-setters and boilerplate phrases (P1)

Delete the phrase; the sentence almost always survives.

- "In today's fast-paced world / digital landscape / competitive market"
- "In the dynamic world of X" / "In the ever-evolving landscape of X"
- "As the world continues to evolve" / "Now more than ever" / "In an era of"
- "Whether you're a beginner or a seasoned professional"
- "Without further ado" / "It goes without saying" / "Needless to say"
- "It's worth noting that" / "It's important to note that"
- "In conclusion" / "In summary" / "To sum up" / "At the end of the day"
- "No fluff" / "Shouting into the void"
- "Look no further" / "Say goodbye to X, say hello to Y"
- Multi-word boilerplate that repeats or stacks: "the integration of", "community-driven",
  "long-term sustainability", "the future of X". One use can be fine; repetition or a stack
  of three or more distinct boilerplate phrases in one piece is the tell.

## Title shapes (P1)

Flag formulaic title structures: "From X to Y: ...", "Master X in N Days", "X: A Comprehensive
Guide", "Unlocking X", "The Ultimate Guide to X", "N Reasons Why X". Rewrite around the actual
claim of the piece.

---

## What NOT to do with these lists

- Do not synonym-cycle to dodge a flag (C11-SYNCYCLE). If "developers" is the right word five
  times, write it five times.
- Do not ban common words in their honest uses. "Important" is allowed when something is
  important. "Navigate" is allowed on a boat. Tolkien used "delve" and he was not a chatbot.
  The tell is density and emptiness, not the dictionary entry.
- Do not run replacements blind. Every swap must keep the sentence true and idiomatic, and
  the result must pass the O family check.
