# Voice Capture

How to build a voice fingerprint from user samples, and why it beats every default in this
skill when samples exist.

The idea, by analogy: removing AI tells is like removing static from a recording. Necessary,
but after the static is gone you still need it to be the right singer. A de-noised track in
the wrong voice fails differently but just as completely. The fingerprint is how you get the
right singer.

---

## When to run this

- The user provided past writing in this conversation, in project files, or via memory.
- The user says "in my voice", "like I write", "match my style".
- The content will be published under the user's name (posts, emails, READMEs). For these,
  proactively ask for one or two samples if none exist; it takes ten seconds and changes
  everything downstream.

Skip it for anonymous or house-style content, and fall back to platform-rules.md.

## What to extract

Read 2 or 3 samples (300+ words total is enough; more is better). Note, concretely:

**Rhythm**
- Typical sentence length and the spread. Do they ever write a 3-word sentence? A 40-word one?
- Paragraph height. One-liners common or rare?
- Fragments: do they use them at all? How often?

**Lexicon**
- Contraction rate: near-total, mixed, or formal.
- Favorite connectives: "so", "but", "which means", "anyway", "that said". Steal these; they
  are the highest-value transfer in the whole fingerprint.
- Recurring words and constructions they personally lean on. Every writer has five.
- Technical vocabulary level: do they say "the DB" or "the database" or "Postgres"?

**Stance**
- Do they hedge? How ("I think", "probably", "IMO", or not at all)?
- Do they express opinions directly? Dry understatement or open enthusiasm?
- Humor: none, dry, self-deprecating, absurd? Never install humor of a type they do not use.

**Mechanics**
- Punctuation habits: parentheses, colons, semicolons, ellipses, exclamation marks. Match
  their rates, not this skill's defaults.
- Capitalization in casual registers.
- Emoji: which ones, how often, where. Zero is a common and important answer.
- Formatting: do they use bullets in emails? Bold in posts? Headers in short docs?

**Openers and closers**
- How do their pieces start? Mid-thought, with context, with the ask?
- How do they sign off emails and end posts? Copy it exactly.

## Applying it

Write the fingerprint as a 6 to 10 line internal note before rewriting. Every rewrite
decision consults it. Where the fingerprint conflicts with a platform default, the
fingerprint wins. Where it conflicts with the Three Laws or the hard-banned list, the laws
win: if the user's own samples are full of em dashes, replace them anyway (this skill bans
them outright) and note that you did.

## What not to do

- Do not exaggerate the fingerprint into caricature. If they use one parenthetical per post,
  one per post is the number, not three.
- Do not transfer tells from their samples. If their old writing has "delve" in it (plenty of
  pre-2022 human writing does), the fingerprint captures their rhythm and stance, not their
  worst words.
- Do not claim the fingerprint knows things it does not. Two samples give you rhythm and
  lexicon, not their opinion on the topic at hand. Opinions still come from the user (O7).
