# Plainness

Rules for the `plainness` option (standard, plain, very-plain). Removing AI words is not the
same as writing plainly. A draft can have no Tier 1 words and still read like a memo: abstract
nouns, nominalizations, "substantive point", "useful frame". This file is the fix.

Plainness changes word choice and sentence build. It never changes what the text says (Law 3)
and never adds anything the source lacked (Law 1).

---

## Levels

| Level | Grade ceiling (approx) | Mean sentence | What to do |
|---|---|---|---|
| standard | none | none | Current behavior. Apply the tier replacements and stop. |
| plain | 9 | 16 words or fewer | Prefer words a typical adult reader uses in speech. Verbs over nominalizations. Concrete over abstract. |
| very-plain | 7 | 12 words or fewer | Short everyday words. Subject, verb, object. One idea per sentence. |

The grade comes from `node scripts/check.js --metrics`. It is approximate (syllables are
guessed). Use it to catch a draft that is clearly over the ceiling, not to chase a number.

The ceiling is not a quota. Keep real rhythm (S4-RHYTHM, O6): a 4-word sentence next to a
20-word one is fine. Do not split every long sentence into same-size pieces.

## Never do these to reach a level

- **Never dumb down a technical term the audience needs.** "JSONB", "idempotent", "p99",
  "OAuth scope" stay. Plainness is for the words around the term, not the term. Do not add a
  gloss the source did not have unless the user asked for a lay audience.
- **Never drop a fact, number, qualifier, or caveat** to make a sentence shorter (Law 3). If a
  sentence cannot get plainer without losing something, leave it and say so.
- **Never swap in slang or a casual tone** to sound plain. Plain is not casual. That is the
  `polish` option, and it has its own limits (O3, O13).
- **Never change protected spans** (code, URLs, quotes).
- **Never invent an example** to explain something simply (Law 1).

## Word swaps beyond the AI tiers

These are not AI markers. They are polished register. In plain and very-plain, prefer the
right column unless the left word is a term the audience needs.

<!-- ai-pattern-examples:start -->
| Polished | Plain |
|---|---|
| substantive | real, actual, main |
| salient, pertinent | main, relevant, important |
| exacerbate | make worse |
| mitigate, ameliorate | reduce, ease, improve |
| elucidate | explain |
| obviate | remove the need for |
| necessitate, require | need |
| proliferate | spread, multiply |
| culminate in | end in, lead to |
| aggregate | total, combine |
| illustrate, demonstrate, indicate | show |
| approximately | about |
| sufficient | enough |
| numerous | many |
| additional | more, extra |
| assistance | help |
| purchase | buy |
| obtain | get |
| attempt | try |
| regarding, concerning | about |
| individuals | people |
| methodology | method, way |
| implementation | setup, build, the work |
| functionality | feature, what it does |
| optimal | best |
| initial | first |
| subsequent | next, later |
| viable | workable |
| paramount | most important |
| contemporary | current, modern |
| ubiquitous | everywhere |
| nuanced | subtle, more complicated than that |
| useful frame, helpful lens | a way to think about it |
| substantive point | real point |
| stakeholders (non-corporate) | the people affected, or name them |
<!-- ai-pattern-examples:end -->

## Nominalizations

A nominalization turns a verb into a noun and then needs a weak verb to carry it. Put the verb
back.

<!-- ai-pattern-examples:start -->
| Nominalized | Verb form |
|---|---|
| the implementation of the cache | we built the cache |
| make a determination | decide |
| provide an explanation of | explain |
| conduct an evaluation of | test, check |
| give consideration to | consider |
| has the ability to | can |
| is indicative of | shows |
| a reduction in latency | latency dropped |
| in the absence of | without |
| the majority of | most |
| a number of | several, some |
| in spite of the fact that | although |
| for the purpose of | to |
<!-- ai-pattern-examples:end -->

Fix: find the noun that hides an action, make that action the verb, and make the person or
thing doing it the subject. Active voice follows.

## Process for a plainness pass

1. Rewrite for tells first (Step 3). Plainness is a second layer, not a substitute.
2. Mark sentences with abstract subjects and nominalizations (see the table above).
3. Swap words from the table. Keep any term the audience needs.
4. Split only sentences that carry two ideas. Leave short ones alone.
5. Run `node scripts/check.js --metrics --plainness <level> -`. A V5-PLAINNESS finding means
   the draft is still over the ceiling; look for the longest sentences and the 3-syllable-plus
   words first.
6. Reread against the source: every fact, number, and caveat still there?

## Example (very-plain)

<!-- ai-pattern-examples:start -->
Source: "The utilization of connection pooling facilitated a substantial reduction in tail
latency, with p99 decreasing from 840 ms to 210 ms."
<!-- ai-pattern-examples:end -->

Rewrite: "Connection pooling cut tail latency. p99 dropped from 840 ms to 210 ms."

Kept: the term "p99", both numbers. Removed: nominalization, stiffness, filler adjective.
(If the source had no numbers, "substantial" would need a FILL prompt per Law 1, not a
replacement figure.)
