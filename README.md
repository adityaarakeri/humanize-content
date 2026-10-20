# humanize-content

A Codex and Claude skill that rewrites AI-sounding text into something a specific person would
actually
publish. It strips out the known tells. Just as important, it refuses to add the new ones most
humanizers install: forced sass, fake anecdotes, invented numbers, performative typos.

It ships with a zero-dependency scanner you can run in CI, and a small set of behavior evals
that check whether the model actually follows the rules.

## Runbook

Open [the step-by-step runbook](docs/index.html) in a browser for Codex, Claude Code, and
OpenCode setup, copyable commands, writing modes, scanner checks, and eval instructions.

## Why v2

v1 had a problem I only noticed after reading current detection research: some of its "human"
techniques had become top-tier AI tells. It told the model to use em dashes for asides. It
suggested replacing `Furthermore` with `And here's the thing`. Those are exactly what people
scan for now. The skill was laundering one signature into another.

v2 is built around three rules that override everything else:

1. **Never fabricate.** No invented numbers, anecdotes, or opinions. Gaps come back to you as
   `[FILL: ...]` prompts instead of confident lies. A common humanizer failure is "fixing" a
   vague claim by making up a number. That is worse than the vague claim.
2. **Never introduce a tell while removing one.** Every rewrite is audited against the same
   catalog as the input, plus a separate catalog of tells that humanizers add.
3. **Preserve meaning exactly.** The style changes. The facts, claims, code, and links don't.

## What it catches

Seven pattern families, each with stable IDs, a severity (P0 definite, P1 strong signal, P2
judgment call), before/after fixes, and carve-outs for legitimate uses:

- **P**, punctuation and formatting: em dashes, bold spam, emoji headers, hashtag blocks,
  list-label periods, hyphen stacking
- **V**, vocabulary: four tiers, from words with measured post-ChatGPT frequency spikes down
  to plain wordiness. They're weighted so a wordiness fix can't tip a verdict toward
  "AI-written" on its own.
- **S**, structure: rule-of-three padding, `It's not just X, it's Y`, uniform rhythm, bare
  noun lists, wall-of-text replies, too many headers
- **C**, content: significance inflation, promotional language, vague attribution, hedge
  stacks, speculative gap-filling, unfalsifiable closers, synonym cycling
- **R**, register: chatbot residue, recap-flattery openers, narrated candor, reasoning-chain
  leakage
- **F**, fingerprints: unfilled placeholders, chatbot citation markup, AI-tool UTM parameters
- **O**, overcorrection: the tells humanizers add. Forced sass, fake typos, opinion implants,
  mechanical variance, detector-bait tricks. This family is what separates it from
  delete-the-buzzwords tools.

It also does voice fingerprinting. Give it two or three samples of your writing and it matches
your sentence rhythm, connectives, and punctuation habits. Without samples you get "generic
human", which is a detectable style of its own.

## Plainness and polish

Removing tells leaves text clean but often sterile and over-edited. Two optional dials fix
that. Both default to the old behavior.

- `plainness`: `standard` (default), `plain` (about grade 9 or lower, common words, verbs over
  nominalizations), `very-plain` (about grade 7 or lower, short everyday words). Technical
  terms the audience needs and every fact stay. Rules: `references/plainness.md`.
- `polish`: `clean` (default), `loose` (comma splices, "And"/"So" openers, a dropped final
  period), `texting` (adds lowercase starts and "gonna"/"kinda"). Loose is a ceiling, not a
  quota, and never slang or typos. Rules: Polish levels in `references/overcorrection.md`.

Ask in plain words ("simpler words", "more casual", "like a text"). Messages replies default to
plain and loose; Slack and X replies default to plain and clean; everything else is unchanged.
Your voice samples beat the defaults, and the Three Laws and banned moves beat everything.
Deliberate typos stay banned at every level. Design notes:
`docs/design/authenticity-options.md`.

## Platform targets

Name where the text is going and the skill applies that platform's register from
`references/platform-rules.md`:

- X post and X reply
- LinkedIn post and LinkedIn reply
- Slack reply
- Messages reply (SMS, iMessage, WhatsApp)

Also covered: blog, Hacker News, email, README, and GitHub issues and PR comments. Replies ask
for the message being answered, stay at or below the draft's length, and never add a stance,
anecdote, or plan you did not give.

## What it won't do

It won't help text slip past a detector while reading worse to a person. Zero-width
characters, homoglyphs, and deliberate typos are banned outright, and the scanner flags them.
The goal is writing that a human reader takes as yours because it is in your voice and every
claim in it is true. If you're somewhere that requires you to disclose AI help, this skill
doesn't change that.

## Layout

```
humanize-content/
├── SKILL.md                  # entry point: laws, banned moves, workflow, modes
├── references/
│   ├── patterns.md           # full catalog with IDs, severities, and fixes
│   ├── vocabulary.md         # tiered word lists (source of truth for the V family)
│   ├── overcorrection.md     # tells that humanizers introduce, plus polish levels
│   ├── plainness.md          # plain-word rules, swap lists, nominalization fixes
│   ├── platform-rules.md     # blog, X/LinkedIn posts and replies, Slack, messages, HN, email, README, GitHub
│   └── voice-capture.md      # building a voice fingerprint from samples
├── docs/design/
│   └── authenticity-options.md   # design notes for plainness, polish, typo policy
├── scripts/
│   └── check.js              # zero-dependency scanner (Node 18+)
├── test/
│   ├── run.js                # scanner tests plus catalog drift checks
│   └── fixtures/
└── evals/
    ├── cases.json            # behavior cases for the Three Laws
    └── run.js                # grades model outputs against the cases
```

## Install

**Codex.** Codex loads local skills from `.agents/skills` in a repository or
`~/.agents/skills` for your user account
([Codex skill locations](https://learn.chatgpt.com/docs/build-skills)).
From this repo's root, install the skill for use in any project:

```bash
mkdir -p ~/.agents/skills
ln -s "$PWD" ~/.agents/skills/humanize-content
```

For a copy instead of a symlink, use `cp -r . ~/.agents/skills/humanize-content`.
On Windows PowerShell, copy the skill files with:

```powershell
$skill = Join-Path $HOME '.agents/skills/humanize-content'
New-Item -ItemType Directory -Force -Path $skill | Out-Null
Copy-Item SKILL.md -Destination $skill
Copy-Item references, scripts -Destination $skill -Recurse
```

For one project only, use that project's `.agents/skills` directory instead.
Restart Codex if the skill does not appear after installation. The same
`SKILL.md` and references work in both Codex and Claude.

In Codex, use `/skills` to find it or mention `$humanize-content` in your prompt.

**Claude Code.** From a clone of this repo, copy or symlink it into your skills folder:

```bash
ln -s "$PWD" ~/.claude/skills/humanize-content      # symlink, so git pull updates it
cp -r . ~/.claude/skills/humanize-content           # or a plain copy
```

**Claude.ai.** Zip the folder and upload it in the skills settings. The skill keeps the
`humanize-content` name, so it replaces an older install.

Then ask for it in plain words: "humanize this", "make this sound less like AI", "audit this
draft for AI tells" (Detect mode, no rewriting), or "light pass on this file, keep what's
already fine" (Patch mode).

## The scanner on its own

The scanner is handy outside the skill, for example as a docs gate in CI:

```bash
node scripts/check.js path/to/draft.md            # human-readable report
node scripts/check.js --json a.md b.md            # JSON (an array when you pass several files)
cat draft.md | node scripts/check.js -            # stdin
node scripts/check.js --metrics draft.md          # add readability and rhythm numbers
node scripts/check.js --plainness plain draft.md  # P2 finding if the grade is over the ceiling
node scripts/check.js --help
```

`--metrics` reports word and sentence counts, sentence length mean and spread, mean word
length, an approximate Flesch-Kincaid grade, contraction rate, and the share of words with
three or more syllables. Syllables are estimated, so treat the grade as a rough ceiling check,
not a score. In `--json` the numbers sit under a `metrics` key that only appears when
requested. `--plainness standard|plain|very-plain` adds a P2 `V5-PLAINNESS` finding when the
grade is over 12, 9, or 7 (and the text has 20 or more words). Neither flag changes the exit
code or the default output. Code, URLs, and comments are not measured.

It exits 1 on any P0 finding, 2 on a usage or read error, and 0 otherwise, so it drops straight
into a pipeline. P1 and P2 findings are printed but never fail the build.

Before matching anything, it blanks out code fences, indented code blocks, inline code, HTML
comments, `<pre>` and `<code>` blocks, table separator rows, and URLs (but it keeps any
`utm_source` parameter visible). Line numbers stay correct.

If a doc has to quote tells as examples, mark them so the scanner skips them:

```markdown
A line ending in this marker is skipped. <!-- ai-pattern-example -->

<!-- ai-pattern-examples:start -->
Everything in here is skipped.
<!-- ai-pattern-examples:end -->
```

Known trade-offs, both chosen to avoid false alarms:

- A command written in plain prose, like git checkout followed by a spaced double hyphen,
  looks exactly like a dash to the scanner. Put commands in backticks and the problem goes
  away.
- A nested list indented four spaces right after a blank line gets treated as code and
  skipped. That can hide a tell, but it never invents one.

What it can't do: the scanner catches the mechanical patterns, meaning the P, V, and F
families plus a slice of the others. Structure, content, and register mostly need a reader. A
clean scan means the mechanical tells are gone, not that the text sounds human.

## Behavior evals

The scanner tests prove the regexes work. They don't prove the model behaves. Think of it
this way: testing the smoke detector with a lighter tells you the detector works, but not
whether the cook burns the toast. The evals watch the cook.

Each case in `evals/cases.json` is an input plus checks on the output. For example, a vague
"builds got significantly faster" must come back with a `[FILL: ...]` prompt and no invented
figures, and a README rewrite must keep the code block and URL byte for byte.

```bash
node evals/run.js --list                          # see the cases
node evals/run.js --prompt law1-vague-metrics     # the prompt to give Codex or Claude
# run each prompt with the skill installed, save the reply as evals/outputs/<id>.md
node evals/run.js evals/outputs                   # grade them
```

CI runs `node evals/run.js --self-test`, which grades a known-good and a known-bad output for
every case. That keeps the checks honest: if a bad output ever passes, the check is too loose
and the build fails. Grading an empty outputs directory also fails, so a skipped run cannot
look like a passing eval.

### Repeated Codex evals

With Node 18+ and an authenticated Codex CLI installed, run:

~~~bash
node evals/codex.js --model gpt-6-astra --trials 3
node evals/codex.js --model gpt-6-astra --trials 3 --case law1-vague-metrics
~~~

Choose a model available to your account. The model argument is required; reasoning effort
defaults to medium and can be set with `--effort`. The runner sends UTF-8 directly to Codex,
including on Windows, and creates a temporary repository skill installation. It uses
`codex exec` with a read-only sandbox and existing CLI authentication. User CLI configuration
is ignored so model selection is explicit. Global instructions and skills may still affect
responses. Windows npm installs are launched through their JavaScript entry point, bypassing
the PowerShell shim.

Each invocation creates a new directory under `evals/outputs/`. It saves the skill and grader
snapshots, case definitions, prompts, responses, traces, and a `report.json` with model, CLI
version, reasoning effort, latency, token usage, failed checks, and pass counts per case.
The temporary installation is removed after the run. Earlier results are never overwritten.
Use `--out` to choose another parent directory, or `--codex` to specify a native executable or
JavaScript CLI entry point. Run `node evals/codex.js --help` for the options.

The acceptance threshold is every selected case passing every trial. Exit codes are 0 when
all pass, 1 for a writing quality failure, and 2 for invalid arguments or a CLI failure.
A CLI failure stops the run and leaves a report of completed and uncompleted cases.
To grade a saved trial again, pass its `trial-1` directory to `node evals/run.js`.

The cases include supplied measurements that must not gain FILL prompts and protected
code whose punctuation must survive. Graders check exact code spans in the rewrite, required
FILL prompts in the passage, and Detect IDs paired with their severities and source excerpts.
A `max_grade` check caps the approximate grade of the rewrite for plainness cases. The loose
polish cases check that casual grammar never brings slang, typos, or invented facts.
They reject empty responses and include regression fixtures from live failures. The checks
cover specific requirements; a reader still needs to judge voice and semantic fidelity.
Repeated trials expose variation but do not prove reliability on all writing.

Live evals use your Codex account and run only when requested. CI uses a fake CLI process to
test the runner's encoding, repeated attempts, error handling, and output files without model
calls. Generated runs stay ignored by Git and are excluded from the source prose scan.

## Opinionated defaults

This skill bans em dashes in rewritten prose, including when your voice samples use them.
Protected code and verbatim quotations keep their original punctuation under Law 3. That's a
deliberate position, since the em dash is the most widely cited AI tell right now. If you fork
it and want them back, remove the em dash bullet from the hard-banned list in `SKILL.md`, the
`P1-EMDASH` entry in `references/patterns.md`, and the matching rules in `scripts/check.js`.
The tests will point out anything you missed.

## Development

```bash
npm run ci        # everything CI runs: lint, test, eval self-test, self-scan
npm test          # scanner tests, catalog drift checks, repo checks
npm run eval      # eval self-test
npm run check     # scan SKILL.md, README, and CHANGELOG with the scanner
```

There's nothing to install. The whole repo runs on plain Node.

The test suite includes a drift check. The catalog and the scanner describe the same patterns
in two places, and those two drift apart quietly, like two copies of a spreadsheet. So the
tests read `vocabulary.md` and `patterns.md` and fail if a Tier 1 word is missing from the
scanner, if the scanner emits an ID the catalog doesn't document, or if the severities
disagree.

Adding a pattern, in order:

1. Add the entry to `references/patterns.md` (or `overcorrection.md`) with an ID and severity.
   If the scanner reports it at a different severity, add a `- Scanner: P1 (reason)` line.
2. Add the rule to `scripts/check.js`, if it's mechanical.
3. Add a firing test and a false-positive test to `test/run.js`.
4. Run `npm run ci`.

The reference catalogs quote banned patterns on purpose, so they're left out of the self-scan.
Everything else has to pass its own gate, and the tests also check that no file outside the
fixtures and generated eval outputs contains an em dash character.

## Sources

- [How to spot when writing is AI: 6 elements of a robot's style](https://huntingthemuse.net/library/how-to-tell-if-writing-is-ai),
  Hunting the Muse. Em dashes, forced sass, buzzwords, cliché phrases, formulaic structure.
- Kobak et al., [Delving into LLM-assisted writing in biomedical publications through excess vocabulary](https://www.science.org/doi/10.1126/sciadv.adt3813), <!-- ai-pattern-example -->
  Science Advances, 2025 ([arXiv](https://arxiv.org/abs/2406.07016)). The frequency evidence
  behind Tier 1.
- [conorbronsdon/avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing), whose
  pattern catalog this one builds on.

The no-fabrication law, the overcorrection family, voice fingerprinting, and the behavior
evals are what this project adds on top of that work.

## License

MIT
