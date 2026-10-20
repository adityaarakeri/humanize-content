'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { grade, cases } = require('../evals/run.js');
const detect = cases.find((c) => c.id === 'detect-mode-findings');
assert(grade(detect, detect.fixtures.pass).every((r) => r.ok));
for (const c of cases) {
  assert(grade(c, '').some((r) => !r.ok), c.id + ': empty output must fail');
  for (const bad of [c.fixtures.fail, ...(c.fixtures.failures || [])]) {
    assert(grade(c, bad).some((r) => !r.ok), c.id + ': bad fixture must fail');
  }
}
assert(grade(detect, detect.fixtures.pass.replace('P0 P1-EMDASH', 'P1 P1-EMDASH')).some((r) => !r.ok));
assert(grade(detect, detect.fixtures.pass + '\n- P0 V1-TIER1: "digital landscape"').some((r) => !r.ok),
  'contradictory severity must fail even if another occurrence is correct');
assert(grade(detect, detect.fixtures.pass.replace('"digital landscape"', '"landscape"')).every((r) => r.ok), 'the exact flagged word is a valid source excerpt');
assert(grade(detect, detect.fixtures.pass.replace('P1 V1-TIER1: "digital landscape"', 'P1 V1-TIER1: "digital landscape" - catalog severity P1')).every((r) => r.ok), 'repeating the same severity in an explanation is valid');
const grouped = detect.fixtures.pass.replace(/- P0 /g, '- ').replace('**Findings**', '**P0: Definite tells**');
assert(grade(detect, grouped).every((r) => r.ok), 'supports severity headings and per-line overrides');
const preservation = cases.find((c) => c.id === 'law3-preserve-code-urls');
assert(grade(preservation, preservation.fixtures.pass.replace('`npm install -g acme-cli@2.3.1`', '') +
  '\n**What changed**\n`npm install -g acme-cli@2.3.1`').some((r) => !r.ok),
  'protected spans in notes do not repair missing spans in the rewrite');


const protectedHeading = { input: '```text\nWhat changed\n```', checks: [{ type: 'preserve_code' }] };
assert(grade(protectedHeading, protectedHeading.input).every((r) => r.ok),
  'section-like content inside a code fence stays protected');
const ordinaryProse = { input: '', checks: [{ type: 'rewrite_contains', value: '[FILL:' }] };
assert(grade(ordinaryProse, 'What changed was the speed [FILL: before and after].').every((r) => r.ok),
  'ordinary prose beginning with What changed is not a notes heading');

const hardText = 'The utilization of comprehensive methodologies necessitated substantial reevaluation of organizational infrastructure considerations. Implementation of those recommendations demonstrated considerable improvement.';
const gradeCase = { input: '', checks: [{ type: 'max_grade', value: 7 }] };
assert(grade(gradeCase, 'We built a cache. It made reads faster. We kept the old path as a backup.').every((r) => r.ok), 'max_grade passes simple text');
assert(grade(gradeCase, hardText).some((r) => !r.ok), 'max_grade fails dense text');
assert(grade(gradeCase, 'Short and plain.\n\nWhat changed:\n- ' + hardText).every((r) => r.ok), 'max_grade ignores the change log');
assert(grade(gradeCase, '').some((r) => !r.ok), 'max_grade fails empty output');
const optionCase = cases.find((c) => c.options);
assert(optionCase && require('../evals/run.js').promptFor(optionCase).includes('Options: '), 'cases with options put them in the prompt');

const bodyOnly = { input: '', checks: [{ type: 'rewrite_not_regex', value: 'valuable insight' }] };
assert(grade(bodyOnly, 'Short reply.\n\nWhat changed:\n- Cut the valuable insight opener.').every((r) => r.ok),
  'rewrite_not_regex ignores the change log');
assert(grade(bodyOnly, 'A valuable insight.\n\nWhat changed:\n- none').some((r) => !r.ok),
  'rewrite_not_regex still fails on the rewritten text');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'humanize-eval-test-'));
const fake = path.join(temp, 'fake codex.cjs');
const runner = path.resolve(__dirname, '../evals/codex.js');
const outputRoot = path.join(temp, 'runs with spaces');
const fixture = detect.fixtures.pass;
fs.writeFileSync(fake, `
const fs = require('fs');
const assert = require('assert/strict');
const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('codex-cli test'); process.exit(0); }
const get = (key) => args[args.indexOf(key) + 1];
assert(args.includes('--ignore-user-config'));
assert.equal(get('--sandbox'), 'read-only');
assert(fs.existsSync('.agents/skills/humanize-content/SKILL.md'));
assert(fs.existsSync('.agents/skills/humanize-content/references/patterns.md'));
assert(!fs.existsSync('cases.json'));
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  assert(input.includes(String.fromCharCode(0x2014)), 'UTF-8 em dash must reach Codex unchanged');
  if (get('--model') === 'process-failure') { console.error('test process failure'); process.exit(5); }
  if (get('--model') !== 'missing-output') {
    fs.writeFileSync(get('-o'), get('--model') === 'quality-failure' ? '' : ${JSON.stringify(fixture)});
  }
  console.log(JSON.stringify({type:'item.completed', item:{type:'command_execution', exit_code:0, command:'read SKILL.md'}}));
  console.log(JSON.stringify({type:'turn.completed', usage:{input_tokens:10, output_tokens:5}}));
});
`);
const invoke = (model, trials = 1) => spawnSync(process.execPath,
  [runner, '--model', model, '--trials', String(trials), '--case', detect.id,
    '--codex', fake, '--out', outputRoot], { encoding: 'utf8' });
const reports = () => fs.readdirSync(outputRoot).map((name) => {
  const dir = path.join(outputRoot, name);
  assert(!fs.readdirSync(dir).some((n) => n.startsWith('.workspace-')), 'temporary workspace cleaned');
  assert(fs.existsSync(path.join(dir, 'snapshot', 'SKILL.md')));
  return JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8'));
});
try {
  let run = invoke('test-model', 2);
  assert.equal(run.status, 0, run.stderr);
  let report = reports()[0];
  assert.equal(report.cliVersion, 'codex-cli test');
  assert.equal(report.model, 'test-model');
  assert.equal(report.results.length, 2);
  assert.equal(report.summary[0].passed, 2);
  assert.equal(report.results[0].usage.input_tokens, 10);
  assert.equal(report.results[0].skillReadObserved, true);
  run = invoke('quality-failure');
  assert.equal(run.status, 1, run.stderr);
  report = reports().find((r) => r.model === 'quality-failure');
  assert.equal(report.summary[0].passed, 0);
  assert(report.results[0].failedChecks.includes('nonempty response'));
  run = invoke('process-failure', 2);
  assert.equal(run.status, 2);
  report = reports().find((r) => r.model === 'process-failure');
  assert.equal(report.results.length, 1, 'process failures stop the run');
  assert(report.error.includes('exit 5'));
  run = invoke('missing-output');
  assert.equal(run.status, 2);
  assert(reports().find((r) => r.model === 'missing-output').error.includes('without an output'));
  const count = fs.readdirSync(outputRoot).length;
  run = invoke('test-model', 0);
  assert.equal(run.status, 2);
  assert.equal(fs.readdirSync(outputRoot).length, count, 'invalid args do not start a run');
} finally {
  const target = path.resolve(temp);
  assert(target.startsWith(path.resolve(os.tmpdir()) + path.sep));
  assert(!fs.lstatSync(target).isSymbolicLink());
  fs.rmSync(target, { recursive: true });
}
console.log('eval grader and runner tests passed');
