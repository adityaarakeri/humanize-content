# Platform Rules

Register defaults per platform. User samples always override these. Nothing here overrides
the Three Laws or the hard-banned moves; in particular, no platform gets em dashes and no
platform gets forced sass.

---

## Option defaults per platform

`plainness` (standard, plain, very-plain) and `polish` (clean, loose, texting) are defined in
SKILL.md Step 1b. Defaults when the user and their samples say nothing:

| Platform | plainness | polish |
|---|---|---|
| Messages reply | plain | loose |
| Slack reply | plain | clean |
| X reply | plain | clean |
| Everything else | standard | clean |

Messages reply is the only platform whose grammar default changes, because copy-edited prose
is the most visible tell in a text. Loose is a ceiling, not a quota: a short, natural reply
stays as written. `texting` is never a platform default. Samples beat these defaults, and the
Three Laws and hard bans beat everything. Rules: `references/plainness.md` and the Polish
levels section of `references/overcorrection.md`.

---

## Blog post / long-form article

**Voice**: first person if the user writes that way. A person explaining something they
actually understand, at the depth they actually have.

- Open mid-thought, with a scene the user supplied, or with the claim itself. Never with
  scene-setting ("In today's...") or an agenda ("In this article, I will...").
- Headers in sentence case, conversational where it fits ("Why this keeps failing", not
  "Failure Analysis"), and only where a reader would scan for them.
- Paragraphs 1 to 4 sentences, uneven on purpose but not on a schedule (O6).
- End on the last real point. A recommendation, an honest limitation, or an open question
  the user actually holds. No summaries.

## X post

**Voice**: direct and compressed. Strong claims only if the user holds them (O7).

- First line stands alone.
- One idea per post. In threads, each post works alone and moves the piece forward.
- Lowercase only if the user's own posts are lowercase (check samples; see O3).
- No hashtag blocks (P5-HASHTAG). Two specific tags at most, usually none.
- No engagement-bait closers ("What do you think?", "Let that sink in").
- Numbers only if real (Law 1).

## X reply

**Voice**: one person answering another in public. Shorter and plainer than an X post.

- Needs the parent post. If it was not supplied, ask for it. A reply written blind is generic.
- No hook line, no thread structure, no standalone framing. The reply leans on the parent.
- One point. Add something true (an answer, a correction, a real data point) or say less.
- Do not restate the parent post (R3-ACKLOOP). No "Great point", no "This!", no "Thanks for
  sharing" (R5). A generic thank-you is flattery even when it is short. Cut it.
- Do not take a side the user has not taken (O7). If the reply needs a stance, ask for it.
- No hashtags. No question tacked on the end, including a rephrased one or a "how do you handle X?" that the draft did not contain.
- Match the user's samples for case, punctuation, and length. Without samples, plain sentences.
- Never longer than the source draft unless the user asks. Cutting is usually the fix.

## LinkedIn post

**Voice**: professional and warm without performing either.

- First line carries the post. A claim or a real event, not "Excited to announce".
- Line breaks between thoughts are native to the platform; use them, but not after every
  single sentence like a metronome (S4-RHYTHM applies to line breaks too).
- Personal stories only when supplied. Vulnerability that was not lived is O4-FAKESTORY.
- No "Agree?", no "Follow for more", no recap-flattery of your own post in the comments.
- Watch the LinkedIn-specific tells hard: "Here's what nobody tells you", "I was today years
  old", "Let that sink in", broetry one-word lines.

## LinkedIn reply (comment on a post or thread)

**Voice**: courteous and specific, like a colleague commenting. No post shape.

- Needs the post or comment being answered. Ask if missing.
- One to three sentences. No hook line, no line break after every sentence, no sign-off.
- Skip the compliment opener ("Great insights!", "Thanks for sharing") (R5). If thanks is due,
  one plain clause, then substance.
- Do not summarize the post back to its author (R3-ACKLOOP).
- Agreement has to say what it agrees with and why. A generic "So true" is not a reply.
- Personal experience only when the user supplied it (O4). Otherwise ask or stay general.
- No "Agree?", no question appended to farm replies.

## Hacker News

**Voice**: technically precise, low ego, zero marketing.

- Show HN shape: what it is in one sentence, why it exists, what is technically interesting,
  current state and limitations, link. In that order, in prose.
- Every claim either has evidence or an explicit personal hedge ("in my testing", only if
  the user actually tested).
- Name prior art. HN will find it anyway; naming it first reads as competence.
- Absolutely no Tier 1 or Tier 2 vocabulary. One "leverage" can sink a launch thread.
- Limitations stated plainly beat limitations discovered by commenters.

## Email

**Voice**: however the user writes email. Check samples first; email is where voice mismatch
is most obvious to recipients who know the sender.

- Cold outreach: a specific, true observation about the recipient's work, one clear ask,
  under 6 sentences. No "I hope this email finds you well", no "Quick question" subjects.
- Updates: most important thing first. Bad news stated plainly in the first two sentences.
- Match the recipient's register when replying; mirror their formality, not their tells.
- Sign-off consistent with the body. A casual email that ends "Best regards," reads
  assembled.

## README / technical documentation

**Voice**: direct, zero fluff, respects the reader's time. This is the register where
"humanize" means "get out of the way", not "add personality".

- First paragraph: what it does, who it is for. Immediately.
- Install and usage: exact commands, real examples, no narrative between them.
- Gotchas stated honestly where the reader will hit them ("Windows needs X first").
- Active voice, imperative mood.
- No feature lists that read like marketing (S7-BARELIST carve-out applies: parameter tables
  and flag lists are legitimately lists).
- The occasional dry aside is fine if the user's docs have them. One, not per section.

## Slack reply

**Voice**: a coworker in a thread. Fast, plain, and to the point.

- Answer first. Context after, only if the reader needs it.
- Replies belong in the thread they answer. Do not restate the question (R3-ACKLOOP).
- Short is normal. A single line is a complete reply. Break at thought boundaries if longer
  (S9-WALLREPLY), and use a short list only when the content really is a list.
- `@` mentions only for people who must act or who were asked something.
- Formal sign-offs, greetings, and "Hope you're well" do not belong.
- Lowercase, dropped punctuation, or emoji only if the user's own Slack samples do it (O3).
  Do not manufacture casualness. Polish defaults to clean here; samples or a named `polish`
  option can move it to loose.
- Keep code, commands, links, and channel or user references byte for byte (Law 3).
- Bad news or a "no" is stated in the first sentence, without cushioning.

## Messages reply (SMS, iMessage, WhatsApp)

**Voice**: how the user actually texts that person. This is the most personal register here
and the easiest to get wrong.

- Needs the incoming message. Ask for it, and for who it is from if the register depends on it.
- Match the user's texting samples for length, contractions, punctuation, and emoji. Without
  samples, write plain short sentences and stop. Do not add slang or abbreviations (O3).
- Defaults are plainness plain and polish loose: casual grammar is allowed (a comma splice,
  an "And" opener, a dropped final period), never required, and capped by O13. No deliberate
  typos (O2). Lowercase starts and no final punctuation need `polish: texting`, which needs
  an explicit request or samples that show it.
- Usually one to two sentences. One message, not a block of paragraphs (S9-WALLREPLY).
- No greeting or sign-off unless the user's texts have them.
- Do not mirror the other person's tells. Mirror their formality only.
- No offer-to-adjust closers, however worded ("let me know", "just tell me if", "happy to change
  anything"). A confirmation ends when the confirmation ends.
- Do not invent plans, times, places, or commitments. Anything the user has not said goes in a
  `[FILL: ...]` prompt (Law 1). A fake "see you at 7" is a real problem.
- Sensitive messages (apologies, bad news, conflict) keep the user's actual position. Do not
  soften or sharpen it.

## GitHub issues and PR comments

**Voice**: person to person. This register has its own dedicated tells.

- Never one unbroken wall paragraph (S9-WALLREPLY). Break at thought boundaries.
- No recap-flattery openers (R5). If thanks is due, one plain clause, then substance.
- No restating the other person's question back at them (R3-ACKLOOP).
- Short is credible. A three-line reply that answers beats twelve lines that orbit.
- Code review comments: point at the line, state the issue, suggest the fix, stop.
