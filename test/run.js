#!/usr/bin/env node
'use strict';

// Tests for scripts/check.js and for the catalog it implements. Zero dependencies.
//
// Sections:
//   fixtures     the two sample documents
//   rules        each scanner rule fires on a minimal example
//   false pos    things that look like tells but are not
//   masking      code, comments, markers, tables
//   cli          exit codes, --json, --help, bad input
//   catalog      scanner and reference files agree (drift guard)
//   repo         the repo passes its own rules

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { scan, RULES, TIER1 } = require('../scripts/check.js');

const ROOT = path.join(__dirname, '..');
const CHECK = path.join(ROOT, 'scripts', 'check.js');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

let failures = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ok: ${msg}`);
  } else {
    console.error(`  FAIL: ${msg}`);
    failures++;
  }
}
const ids = (text) => scan(text).map((f) => `${f.id}/${f.sev}`);
const has = (text, id, sev) => scan(text).some((f) => f.id === id && (!sev || f.sev === sev));
const clean = (text) => scan(text).length === 0;

// ---------------------------------------------------------------------------
console.log('fixtures');
const ai = scan(read('test', 'fixtures', 'ai-sample.md'));
const aiIds = new Set(ai.map((f) => f.id));
assert(ai.some((f) => f.sev === 'P0'), 'ai-sample has P0 findings');
for (const id of ['P1-EMDASH', 'S2-NOTJUSTX', 'V1-TIER1', 'F1-PLACEHOLDER', 'O1-SASS', 'P5-HASHTAG', 'R1-CHATBOT', 'V4-CLICHE', 'C3-VAGUEATTR', 'C4-HEDGESTACK', 'C5-FUTURECLOSER', 'S3-HERESWHY', 'R2-LETS']) {
  assert(aiIds.has(id), `ai-sample: detects ${id}`);
}
assert(clean(read('test', 'fixtures', 'human-sample.md')), 'human-sample: no findings at all');

// ---------------------------------------------------------------------------
console.log('rules');
assert(has('She paused\u2014then left.', 'P1-EMDASH', 'P0'), 'em dash character');
assert(has('It was fast--really fast.', 'P1-EMDASH', 'P0'), 'unspaced double hyphen between words');
assert(has('It was fast -- really fast.', 'P1-EMDASH', 'P0'), 'spaced double hyphen');
assert(has('The fix \u2013 if you can call it that \u2013 works.', 'P1-ENDASH', 'P2'), 'spaced en dash');
assert(has('- **Speed.** It got faster.', 'P6-LISTPERIOD', 'P1'), 'bold list label with period');
assert(has('Sources: citeturn0search0', 'F2-CITEMARKUP', 'P0'), 'chatbot citation markup');
assert(has('see https://x.com/a?utm_source=chatgpt.com', 'F3-UTMSOURCE', 'P0'), 'AI-tool utm_source');
assert(has('Feel free to ask questions.', 'R1-CHATBOT', 'P1'), 'bare "feel free to" is P1');
assert(has('Feel free to reach out anytime.', 'R1-CHATBOT', 'P0'), 'full "feel free to reach out" is P0');
assert(!ids('Feel free to reach out anytime.').includes('R1-CHATBOT/P1'), 'full form is not double counted as P1');
assert(has('It is worth noting that caching helps.', 'R4-NOTEWORTHY', 'P1'), '"it is worth noting"');
assert(has('No meetings. No slides. Just code.', 'S2-NOTJUSTX', 'P0'), '"No X. No Y. Just Z."');
assert(has("That's the real unlock.", 'S3-HERESWHY', 'P1'), '"that\'s the real X"');
assert(has("Here's the thing: caching.", 'O1-SASS', 'P0'), '"here\'s the thing" is O1 sass');
assert(!has("Here's the thing: caching.", 'S3-HERESWHY'), '"here\'s the thing" is not double counted as S3');
assert(has('Then it hit me: caching.', 'O1-SASS', 'P0'), '"then it hit me"');
assert(has('We delve into caching.', 'V1-TIER1', 'P0'), 'Tier 1 P0 word');
assert(has('We foster a culture of testing.', 'V1-TIER1', 'P1'), 'Tier 1 P1 word');
assert(has('A transformative, cutting-edge, best-in-class platform.', 'V2-CLUSTER', 'P1'), 'Tier 2: three distinct words');
assert(has('A deep dive. Then another deep dive.', 'V2-CLUSTER', 'P1'), 'Tier 2: one word repeated');
assert(!has('A deep dive into caching.', 'V2-CLUSTER'), 'Tier 2: a single use is not a cluster');
assert(has('We utilize caching.', 'V3-STIFF', 'P2'), 'Tier 3 stiffness');
assert(has('Furthermore, it is fast.', 'V3-TRANSITION', 'P2'), 'one filler transition is P2');
assert(has('Furthermore, it is fast. Moreover, it is cheap.', 'V3-TRANSITION', 'P1'), 'stacked filler transitions are P1');
assert(has('Bold everywhere. ' + '**x** word word word '.repeat(40), 'P2-BOLD', 'P1'), 'bold density');
assert(has('#a1 #b2 #c3 #d4', 'P5-HASHTAG', 'P1'), '4 hashtags is P1');
assert(has('Plain text\u200B here.', 'O11-DETECTORBAIT', 'P0'), 'zero-width space');
assert(has('The p\u0430ssword field.', 'O11-DETECTORBAIT', 'P0'), 'Cyrillic homoglyph inside a Latin word');
assert(has('abc\u200Ddef', 'O11-DETECTORBAIT', 'P0'), 'zero-width joiner between Latin letters');

// ---------------------------------------------------------------------------
console.log('false positives');
assert(clean('Run the tool with --json to get output.'), 'CLI flag in prose');
assert(clean('Use `--` to end options, like `git checkout -- file`.'), 'end-of-options -- inside backticks');
assert(clean('Read pages 10\u201312.'), 'unspaced en dash in a range');
assert(clean('\uFEFFHello there.'), 'BOM at the start of a file');
assert(clean('Family: \u{1F468}\u200D\u{1F469}\u200D\u{1F467}'), 'ZWJ inside an emoji sequence');
assert(clean('She works in foster care.'), 'literal "foster care"');
assert(clean('The test harness runs nightly.'), 'noun "test harness"');
assert(clean('Name the file with an underscore prefix.'), 'literal "underscore prefix"');
assert(clean('A deep dive into caching.'), 'single Tier 2 word');
assert(clean('Please navigate to the settings page.'), 'literal "navigate to"');

// ---------------------------------------------------------------------------
console.log('masking');
assert(clean('```js\nconst x = a--b; // utilize delve\u2014dash\n```'), 'backtick fences');
assert(clean('~~~\nwe delve here\n~~~'), 'tilde fences');
assert(clean('Prose.\n\n    const x = y -- z; // delve\n\nMore prose.'), 'indented code block');
assert(clean('Text <pre>we delve</pre> and <code>a--b</code>.'), 'html pre and code');
assert(clean('Text <!-- we delve here --> more.'), 'html comments');
assert(clean('Use `--force` or `a--b` or `delve()`.'), 'inline code');
assert(clean('We delve deep. <!-- ai-pattern-example -->'), 'line marker');
assert(clean('<!-- ai-pattern-examples:start -->\nWe delve.\nCertainly!\n<!-- ai-pattern-examples:end -->\nClean.'), 'block markers');
assert(has('<!-- ai-pattern-examples:start -->\nok\n<!-- ai-pattern-examples:end -->\nWe delve.', 'V1-TIER1'), 'text after a block end is scanned again');
assert(clean('---\ntitle: x\n---\n\n| a | b |\n|---|---|\n| -- | -- |\n| 1 | 2 |'), 'frontmatter and table separators');
assert(scan('line one\n\n```\na\n```\nWe delve.').find((f) => f.id === 'V1-TIER1').line === 6, 'line numbers survive masking');

// ---------------------------------------------------------------------------
console.log('cli');
const run = (args, input) => spawnSync(process.execPath, [CHECK, ...args], { input, encoding: 'utf8' });
let r = run(['--help']);
assert(r.status === 0 && r.stdout.includes('usage:'), '--help prints usage and exits 0');
r = run(['--bogus', 'README.md']);
assert(r.status === 2, 'unknown option exits 2');
r = run([]);
assert(r.status === 2, 'no files exits 2');
r = run(['-'], 'We delve into it.');
assert(r.status === 1, 'P0 on stdin exits 1');
r = run(['-'], 'Plain sentence.');
assert(r.status === 0, 'clean stdin exits 0');
r = run(['-'], 'We foster growth.');
assert(r.status === 0, 'P1-only exits 0');
r = run(['--json', path.join(ROOT, 'README.md'), path.join(ROOT, 'CHANGELOG.md')]);
let parsed = null;
try { parsed = JSON.parse(r.stdout); } catch (_) { /* reported below */ }
assert(Array.isArray(parsed) && parsed.length === 2, '--json with two files prints one valid JSON array');
r = run(['--json', '-'], 'We delve.');
try { parsed = JSON.parse(r.stdout); } catch (_) { parsed = null; }
assert(parsed && !Array.isArray(parsed) && parsed.findings.length > 0, '--json with one input prints one object');
r = run(['does-not-exist.md', path.join(ROOT, 'README.md')]);
assert(r.status === 2 && r.stdout.includes('README.md'), 'unreadable file exits 2 but still scans the rest');
const evalRun = spawnSync(process.execPath, [path.join(ROOT, 'evals', 'run.js'), path.join(ROOT, 'evals', '__missing_outputs__')], { encoding: 'utf8' });
assert(evalRun.status === 1 && evalRun.stderr.includes('no eval outputs found'), 'grading no eval outputs fails');

// ---------------------------------------------------------------------------
console.log('catalog');
const vocab = read('references', 'vocabulary.md');
const tier1Section = vocab.split('## Tier 1')[1].split('\n## ')[0];
const docTier1 = new Map();
for (const row of tier1Section.split('\n')) {
  const m = row.match(/^\|\s*([^|]+?)\s*\|[^|]*\|\s*(P[012])\s*\|$/);
  if (m) docTier1.set(m[1].split('(')[0].trim().toLowerCase(), m[2]);
}
assert(docTier1.size >= 30, `vocabulary.md Tier 1 table parsed (${docTier1.size} rows)`);
const scanTier1 = new Map(TIER1.map((t) => [t.word, t.sev]));
const missingInScanner = [...docTier1.keys()].filter((w) => !scanTier1.has(w));
const missingInDocs = [...scanTier1.keys()].filter((w) => !docTier1.has(w));
const sevMismatch = [...docTier1].filter(([w, s]) => scanTier1.has(w) && scanTier1.get(w) !== s).map(([w]) => w);
assert(missingInScanner.length === 0, `every Tier 1 word is scanned${missingInScanner.length ? ': missing ' + missingInScanner.join(', ') : ''}`);
assert(missingInDocs.length === 0, `every scanned Tier 1 word is documented${missingInDocs.length ? ': missing ' + missingInDocs.join(', ') : ''}`);
assert(sevMismatch.length === 0, `Tier 1 scanner severities match vocabulary.md${sevMismatch.length ? ': ' + sevMismatch.join(', ') : ''}`);

// Every ID the scanner can emit has a catalog entry whose heading or "- Scanner:" line names that severity.
const catalog = read('references', 'patterns.md') + '\n' + read('references', 'overcorrection.md');
const entries = new Map();
for (const block of catalog.split(/\n(?=### )/)) {
  const h = block.match(/^### ([A-Z0-9]+-[A-Z0-9]+)\s*(\([^)]*\))?/);
  if (!h) continue;
  const sevs = new Set([...(h[2] || '').matchAll(/P[012]/g)].map((m) => m[0]));
  const scannerLine = block.match(/^- Scanner:.*$/m);
  if (scannerLine) for (const m of scannerLine[0].matchAll(/P[012]/g)) sevs.add(m[0]);
  entries.set(h[1], sevs);
}
const emitted = new Map();
for (const rule of RULES) {
  if (!emitted.has(rule.id)) emitted.set(rule.id, new Set());
  emitted.get(rule.id).add(rule.sev);
  if (rule.stack) emitted.get(rule.id).add('P1');
}
for (const [id, sevs] of [['P5-HASHTAG', ['P0', 'P1']], ['P2-BOLD', ['P1']], ['V2-CLUSTER', ['P1']], ['O11-DETECTORBAIT', ['P0']]]) {
  emitted.set(id, new Set(sevs));
}
for (const [id, sevs] of emitted) {
  const entry = entries.get(id);
  const bad = entry ? [...sevs].filter((s) => !entry.has(s)) : [];
  assert(entry && bad.length === 0, `${id} is documented${bad.length ? ' but severity ' + bad.join('/') + ' is not' : ''}`);
}

// ---------------------------------------------------------------------------
console.log('repo');
for (const f of ['SKILL.md', 'README.md', 'CHANGELOG.md']) {
  const found = scan(read(f));
  assert(found.length === 0, `${f} passes its own scan${found.length ? ': ' + found.map((x) => `${x.id} L${x.line}`).join(', ') : ''}`);
}
const skipDirs = new Set(['.git', 'node_modules', 'fixtures']);
const withEmDash = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(e.name) || (dir === path.join(ROOT, 'evals') && e.name === 'outputs')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (fs.readFileSync(p, 'utf8').includes('\u2014')) withEmDash.push(path.relative(ROOT, p));
  }
})(ROOT);
assert(withEmDash.length === 0, `no em dash characters outside fixtures${withEmDash.length ? ': ' + withEmDash.join(', ') : ''}`);

// ---------------------------------------------------------------------------
if (failures > 0) {
  console.error(`\n${failures} failing assertion(s)`);
  process.exit(1);
}
console.log('\nall tests passed');
