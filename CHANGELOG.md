# Changelog

## Unreleased

- Added platform targets for X replies, LinkedIn replies, Slack replies, and Messages replies
  (SMS, iMessage, WhatsApp). Renamed the X and LinkedIn sections to "X post" and "LinkedIn
  post". Split Slack and Messages out of the GitHub chat-reply section. Replies now ask for the
  message being answered and must not add a stance, anecdote, or plan.
- Added five eval cases covering the new targets.
- Added Codex installation instructions and a repeated live eval runner with UTF-8 transport,
  temporary skill installation, snapshots, and reports of every attempt.
- Made FILL prompts mandatory for unsupported measurable improvements, while keeping supplied
  measurements intact.
- Required byte-for-byte preservation of code spans, delimiters, whitespace, and their order.
  Protected code and verbatim quotations retain their punctuation.
- Made the vocabulary table authoritative for word-level Detect severities.
- Strengthened graders to check ID/severity pairs, source excerpts, protected spans in the
  rewrite, and empty responses. Added regression fixtures and two boundary cases.
- Added offline runner tests to CI and excluded generated eval outputs from source checks.
- Fixed the directory grader accepting runs with no response files.

## 2.1.0 (2026-09-29)

A consistency and packaging release. No change to the Three Laws or the banned-move list.

### Fixed
- 2.0.0 listed a CI workflow and an editorconfig that were never committed. Both are here now,
  plus a `.gitignore`.
- Vocabulary tiers disagreed between `vocabulary.md`, `patterns.md`, and the scanner (`leverage`,
  `harness`, `bolster`, `spearhead`, `synergy`, `paradigm`, `game-changer`, `cutting-edge`,
  `deep dive`).
  `vocabulary.md` is now the single source of truth, and a test fails if the others drift.
- Scanner: `--json` flagged as a double-hyphen dash. Double hyphens now only count between
  words or when spaced.
- Scanner: indented code blocks, HTML comments, `<pre>`/`<code>`, tilde fences, and table
  separator rows were scanned as prose. They're masked now.
- Scanner: `--json` with several files printed invalid JSON. It prints an array now.
- Scanner: `--help` was read as a filename, unknown flags were not rejected, and one unreadable
  file stopped the whole run.
- `npm run check` skipped `SKILL.md`, although the README said every non-catalog file passes
  its own gate. It is scanned now and passes.
- `P1-ENDASH` was emitted by the scanner but not documented. It has a catalog entry now.
- The skill said six pattern families; there are seven. The F family is now in `SKILL.md`.
- The severity model in `SKILL.md` listed forced sass as P1 while the catalog says P0. It is P0
  everywhere now.
- Law 2's example named the wrong tiers. It now reads V3-TRANSITION (P2) traded for O1-SASS (P0).
- The README install command contained an unfilled placeholder. It now works from any clone.

### Added
- Scanner rules: O11-DETECTORBAIT (zero-width characters, Latin/Cyrillic homoglyphs),
  V2-CLUSTER (Tier 2 density), V3-STIFF, V3-TRANSITION (stacked essay transitions), the missing
  Tier 1 words, `then it hit me`, and bare `feel free to` / `let me know if` at P1.
- Block markers `<!-- ai-pattern-examples:start -->` / `:end` for quoting tells in docs.
- Filler transitions (`Furthermore`, `Moreover`, and friends) are back in the catalog. v1 had
  them and 2.0.0 dropped them.
- `- Scanner:` lines in the catalog wherever the scanner reports a different severity than a
  reader would, with the reason.
- Behavior evals (`evals/`): seven cases covering the Three Laws, opinion implants, voice
  samples versus the em dash ban, and Detect mode, each with a good and bad fixture that CI
  grades.
- Tests grew from 18 assertions to over 100, including false-positive cases, CLI behavior, a
  catalog drift check, and a repo-wide em dash check.
- Step 4 of the workflow now runs the scanner on the rewrite when Node is available.

### Changed
- The em dash ban is stated as this skill's position instead of as one user's rule, and the
  README explains how to lift it in a fork.
- The description says "read like a person wrote them" instead of "pass as human-written",
  matching the skill's stance on detector evasion.
- Tier 1 frequency claims now cite Kobak et al. (Science Advances, 2025). The earlier
  attribution to a 2025 Helsinki essay study could not be verified and was removed.
- `package.json` is `private` (so a stray `npm publish` does nothing) and gained `files`,
  `author`, and `eval` / `ci` scripts.

### Not changed yet
- Pattern IDs in the P family still share a prefix with severities ("P1-EMDASH (P0)").
  Renaming them changes IDs, so it waits for 3.0.

## 2.0.0 (2026-08-23)

Full rewrite. Breaking change in philosophy, drop-in replacement in practice (same skill
name, so it replaces a v1 install).

### Added
- Three Laws: never fabricate, never introduce a tell while removing one, preserve meaning
  exactly. `[FILL: ...]` prompts replace invented specifics.
- Overcorrection catalog (O family): forced sass, fake typos, fake anecdotes, opinion
  implants, mechanical variance, detector-bait tricks. Self-audit against it is a mandatory
  step.
- Voice fingerprinting from user samples (`references/voice-capture.md`).
- Detect and Patch modes alongside the default Rewrite mode, with P0/P1/P2 severities and
  stable pattern IDs.
- Structural, content, and register patterns v1 lacked: rule-of-three padding,
  "It's not just X, it's Y", hedge stacks, vague attribution, hashtag stuffing, unfilled
  placeholders, citation markup, AI-tool UTM parameters, wall-of-text replies,
  recap-flattery openers, narrated candor, synonym cycling, copula avoidance.
- `scripts/check.js`: zero-dependency deterministic scanner with code/URL masking, JSON
  output, and CI-friendly exit codes. Fixture tests in `test/`.
- GitHub-ready packaging: CI workflow, license, editorconfig, npm scripts.

### Changed
- Platform rules rewritten. GitHub issues, PR comments, and chat replies added as a
  register with its own tells.
- Vocabulary reorganized into four weighted tiers so stiffness fixes cannot tip an
  AI-authorship verdict on their own.

### Removed
- All em dash guidance. v1 recommended em dashes for asides; they are now a P0 tell, banned
  with no carve-out.
- "Here's the thing" and similar forced-sass replacements. v1 taught them as fixes; they <!-- ai-pattern-example -->
  are now flagged as O1-SASS.
- The instruction to add first-person anecdotes and opinions freely. Both now require user
  supplied material (Laws against fabrication and opinion implants).

## 1.0.0

Initial version: zombie word list, rhythm and opinion techniques, platform rules.
