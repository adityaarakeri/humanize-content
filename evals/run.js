#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scan, computeMetrics } = require('../scripts/check.js');
const { cases } = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));

// Ignore explanatory notes when checking the text the user would publish.
function rewriteBody(output) {
  let fence;
  let offset = 0;
  for (const line of output.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length
          && !marker[2].trim()) fence = undefined;
    } else if (marker) {
      fence = marker[1];
    } else {
      const heading = line.replace(/\*\*/g, '').replace(/^\s*#{1,6}\s+/, '').trim();
      if (/^(?:What changed|Needs your input)\s*:?\s*$/i.test(heading)) return output.slice(0, offset);
    }
    offset += line.length + 1;
  }
  return output;
}

function codeSpans(text) {
  return text.match(/^([`~]{3,})[^\n]*\n[\s\S]*?^\1[ \t]*(?=\n|$)|(?<!`)(`+)(?!`)[^\n]*?\2(?!`)/gm) || [];
}

function findingMatches(check, output) {
  let headingSeverity;
  const matches = [];
  for (const raw of output.split('\n')) {
    const line = raw.replace(/\*\*/g, '').replace(/`/g, '');
    const ids = line.match(/\b[A-Z][0-9]+-[A-Z0-9]+\b/g) || [];
    const severities = [...new Set(line.match(/\bP[012]\b(?!-)/g) || [])];
    if (!ids.length && /^\s*(?:#{1,6}\s*)?P[012]\b/.test(line)) {
      headingSeverity = severities[0];
    } else if (/^\s*#{1,6}\s/.test(line) && !ids.length) {
      headingSeverity = undefined;
    }
    if (ids.includes(check.id)) {
      matches.push((severities.length === 1 ? severities[0] : severities.length ? null : headingSeverity) === check.severity
        && (!check.quote || line.toLowerCase().includes(check.quote.toLowerCase())));
    }
  }
  return matches.length > 0 && matches.every(Boolean);
}

function runCheck(check, output, input) {
  switch (check.type) {
    case 'contains': return output.includes(check.value);
    case 'rewrite_contains': return rewriteBody(output).includes(check.value);
    case 'not_contains': return !output.includes(check.value);
    case 'regex': return new RegExp(check.value, check.flags || '').test(output);
    case 'not_regex': return !new RegExp(check.value, check.flags || '').test(output);
    case 'rewrite_not_regex': return !new RegExp(check.value, check.flags || '').test(rewriteBody(output));
    case 'scanner_no_p0': return !scan(rewriteBody(output)).some((f) => f.sev === 'P0');
    case 'max_grade': {
      // Approximate Flesch-Kincaid grade of the rewritten text, same measure as check.js --metrics.
      const grade = computeMetrics(rewriteBody(output)).fkGrade;
      return grade !== null && grade <= check.value;
    }
    case 'preserve_code':
      return JSON.stringify(codeSpans(input)) === JSON.stringify(codeSpans(rewriteBody(output)));
    case 'finding': return findingMatches(check, output);
    default: throw new Error(`unknown check type: ${check.type}`);
  }
}

function describe(check) {
  const what = check.type === 'finding' ? `${check.id} at ${check.severity} quoting ${JSON.stringify(check.quote)}`
    : check.type === 'preserve_code' ? 'preserve code spans exactly, in order, in the rewrite'
    : check.type === 'nonempty' ? 'nonempty response'
    : check.type === 'scanner_no_p0' ? 'scanner reports no P0 in rewritten text'
    : check.type === 'max_grade' ? `approx. grade of rewritten text at most ${check.value}`
    : `${check.type} ${JSON.stringify(check.value)}`;
  return check.why ? `${what} (${check.why})` : what;
}

function grade(c, output) {
  return [{ check: { type: 'nonempty' }, ok: output.trim().length > 0 },
    ...c.checks.map((check) => ({ check, ok: runCheck(check, output, c.input) }))];
}

function promptFor(c) {
  const lines = [`Use the humanize-content skill in ${c.mode} mode. Target platform: ${c.platform}.`];
  if (c.options) {
    lines.push(`Options: ${Object.entries(c.options).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  }
  if (c.voice_samples) {
    lines.push('', 'Samples of how I write:');
    c.voice_samples.forEach((s, i) => lines.push('', `Sample ${i + 1}:`, s));
  }
  lines.push('', 'Text:', '', c.input);
  return lines.join('\n');
}

function selfTest() {
  let failures = 0;
  for (const c of cases) {
    const pass = grade(c, c.fixtures.pass);
    const badFixtures = [c.fixtures.fail, ...(c.fixtures.failures || [])];
    const passOk = pass.every((r) => r.ok);
    const uncaught = badFixtures.filter((output) => grade(c, output).every((r) => r.ok));
    console.log(`${passOk && !uncaught.length ? 'ok  ' : 'FAIL'} ${c.id}`);
    pass.filter((r) => !r.ok).forEach((r) => console.error(`       good fixture failed: ${describe(r.check)}`));
    if (!passOk) failures++;
    if (uncaught.length) {
      failures += uncaught.length;
      console.error(`       ${uncaught.length} bad fixture(s) passed every check`);
    }
  }
  return failures;
}

function gradeDir(dir) {
  let failures = 0;
  let missing = 0;
  for (const c of cases) {
    const file = path.join(dir, `${c.id}.md`);
    if (!fs.existsSync(file)) {
      console.log(`skip ${c.id} (no ${path.relative(process.cwd(), file)})`);
      missing++;
      continue;
    }
    const results = grade(c, fs.readFileSync(file, 'utf8'));
    const ok = results.every((r) => r.ok);
    console.log(`${ok ? 'pass' : 'FAIL'} ${c.id}  [${c.law}]`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`       ${describe(r.check)}`));
    if (!ok) failures++;
  }
  const graded = cases.length - missing;
  if (!graded) {
    console.error('no eval outputs found; save at least one response before grading');
    return 1;
  }
  console.log(`\n${graded - failures}/${graded} graded cases pass${missing ? `, ${missing} skipped` : ''}`);
  return failures;
}

function main(args) {
  if (args.length === 1 && args[0] === '--self-test') return selfTest() ? 1 : 0;
  if (args.length === 1 && args[0] === '--list') {
    cases.forEach((c) => console.log(`${c.id.padEnd(26)} ${c.mode.padEnd(8)} ${c.law}`));
    return 0;
  }
  if (args.length === 2 && args[0] === '--prompt') {
    const c = cases.find((x) => x.id === args[1]);
    if (!c) { console.error(`no case "${args[1]}". Try --list.`); return 2; }
    console.log(promptFor(c));
    return 0;
  }
  if (args.length === 1 && !args[0].startsWith('-')) return gradeDir(args[0]) ? 1 : 0;
  console.error('usage: node evals/run.js --self-test | --list | --prompt <id> | <outputs-dir>');
  return 2;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { cases, grade, promptFor, describe };
