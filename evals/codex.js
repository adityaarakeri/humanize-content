#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createHash } = require('crypto');
const { cases, grade, promptFor, describe } = require('./run.js');
const ROOT = path.resolve(__dirname, '..');
const HELP = 'usage: node evals/codex.js --model <model> [--trials 3] [--case <id>] [--effort medium] [--out <directory>] [--codex <executable-or-js>]';

function options(args) {
  const result = { trials: 3, effort: 'medium', out: path.join(__dirname, 'outputs') };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!['--model', '--trials', '--case', '--effort', '--out', '--codex'].includes(key)
        || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(HELP);
    result[key.slice(2)] = args[i + 1];
  }
  result.trials = Number(result.trials);
  if (!result.model || !Number.isSafeInteger(result.trials) || result.trials < 1) throw new Error(HELP);
  if (!['minimal', 'low', 'medium', 'high', 'xhigh'].includes(result.effort)) throw new Error('unsupported reasoning effort');
  if (result.case && !cases.some((c) => c.id === result.case)) throw new Error('unknown case: ' + result.case);
  return result;
}

function executable(custom) {
  if (custom) {
    const resolved = path.resolve(custom);
    if (!fs.statSync(resolved).isFile()) throw new Error('Codex executable is not a file');
    if (/\.(?:cmd|bat|ps1)$/i.test(resolved)) throw new Error('Use the native Codex executable or npm bin/codex.js, not a shell shim');
    return /\.[cm]?js$/i.test(resolved) ? [process.execPath, resolved] : [resolved];
  }
  if (process.platform !== 'win32') return ['codex'];
  // Bypass npm's PowerShell shim: its native pipeline can encode input as ASCII.
  for (const entry of (process.env.PATH || '').split(path.delimiter)) {
    if (!entry) continue;
    const dir = entry.replace(/^"|"$/g, '');
    const native = path.join(dir, 'codex.exe');
    if (fs.existsSync(native)) return [native];
    const npm = path.join(dir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (fs.existsSync(npm)) return [process.execPath, npm];
  }
  throw new Error('Codex not found; install the CLI or pass --codex with its executable or bin/codex.js');
}

function invoke(command, args, input, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0], [...command.slice(1), ...args], {
      cwd, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let inputError;
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.stdin.on('error', (error) => { inputError = error; });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (inputError && code === 0) return reject(inputError);
      resolve({ code, signal, stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8') });
    });
    child.stdin.end(Buffer.from(input || '', 'utf8'));
  });
}

function copySkill(destination, source = ROOT) {
  fs.mkdirSync(destination, { recursive: true });
  for (const name of ['SKILL.md', 'references', 'scripts']) {
    fs.cpSync(path.join(source, name), path.join(destination, name), { recursive: true });
  }
}

function summarize(results, selected, trials) {
  return selected.map((c) => {
    const attempts = results.filter((r) => r.id === c.id);
    return { id: c.id, passed: attempts.filter((r) => r.passed).length,
      completed: attempts.length, expected: trials };
  });
}

async function main(args) {
  if (args.length === 1 && args[0] === '--help') { console.log(HELP); return 0; }
  const config = options(args);
  const command = executable(config.codex);
  const version = await invoke(command, ['--version'], '', ROOT);
  if (version.code !== 0) throw new Error('Cannot run Codex: ' + version.stderr);
  const selected = cases.filter((c) => !config.case || c.id === config.case);
  const parent = path.resolve(config.out);
  fs.mkdirSync(parent, { recursive: true });
  const runDir = fs.mkdtempSync(path.join(parent, 'codex-' + new Date().toISOString().replace(/[:.]/g, '-') + '-'));
  const snapshot = path.join(runDir, 'snapshot');
  copySkill(snapshot);
  fs.copyFileSync(path.join(__dirname, 'cases.json'), path.join(snapshot, 'cases.json'));
  fs.copyFileSync(path.join(__dirname, 'run.js'), path.join(snapshot, 'grader.js'));
  fs.copyFileSync(__filename, path.join(snapshot, 'runner.js'));
  const workspace = fs.mkdtempSync(path.join(runDir, '.workspace-'));
  const skillDir = path.join(workspace, '.agents', 'skills', 'humanize-content');
  copySkill(skillDir, snapshot);
  const report = {
    startedAt: new Date().toISOString(), cliVersion: version.stdout.trim(),
    nodeVersion: process.version, platform: process.platform,
    model: config.model, reasoningEffort: config.effort,
    trials: config.trials, acceptance: 'Every selected case must pass every trial',
    configPolicy: 'ignore-user-config; existing CLI authentication; read-only sandbox',
    skillSha256: createHash('sha256').update(fs.readFileSync(path.join(snapshot, 'SKILL.md'))).digest('hex'),
    results: [], summary: [], error: null,
  };
  const reportFile = path.join(runDir, 'report.json');
  const save = () => {
    report.summary = summarize(report.results, selected, config.trials);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  };
  console.log('Run directory: ' + runDir);
  save();
  try {
    for (let trial = 1; trial <= config.trials; trial++) {
      const trialDir = path.join(runDir, 'trial-' + trial);
      fs.mkdirSync(trialDir);
      for (const c of selected) {
        const prompt = promptFor(c);
        const output = path.join(trialDir, c.id + '.md');
        const prefix = path.join(trialDir, c.id);
        fs.writeFileSync(prefix + '.prompt.txt', prompt);
        const cliArgs = ['exec', '--ignore-user-config', '--json', '--ephemeral',
          '--skip-git-repo-check', '--sandbox', 'read-only', '--model', config.model,
          '-c', 'model_reasoning_effort=' + JSON.stringify(config.effort),
          '-C', workspace, '-o', output, '-'];
        const started = Date.now();
        const result = await invoke(command, cliArgs, prompt, workspace);
        fs.writeFileSync(prefix + '.jsonl', result.stdout);
        fs.writeFileSync(prefix + '.stderr.log', result.stderr);
        const record = { id: c.id, trial, elapsedMs: Date.now() - started,
          exitCode: result.code, passed: false, failedChecks: [], usage: null,
          skillReadObserved: false, arguments: cliArgs };
        report.results.push(record);
        if (result.code !== 0) throw new Error(`Codex failed for ${c.id}, trial ${trial}: exit ${result.code}, signal ${result.signal}; see stderr log`);
        const events = result.stdout.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
        const completion = events.find((e) => e.type === 'turn.completed');
        if (!completion || events.some((e) => e.type === 'turn.failed' || e.type === 'error')) {
          throw new Error(`Codex did not complete ${c.id}; see JSONL trace`);
        }
        record.usage = completion.usage || null;
        record.skillReadObserved = events.some((e) => e.type === 'item.completed'
          && e.item?.type === 'command_execution' && e.item.exit_code === 0
          && e.item.command.includes('SKILL.md'));
        if (!fs.existsSync(output)) throw new Error('Codex completed without an output file: ' + c.id);
        record.failedChecks = grade(c, fs.readFileSync(output, 'utf8'))
          .filter((r) => !r.ok).map((r) => describe(r.check));
        record.passed = record.failedChecks.length === 0;
        console.log(`trial ${trial} ${record.passed ? 'pass' : 'FAIL'} ${c.id}`);
        save();
      }
    }
  } catch (error) {
    report.error = error.message;
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    save();
    const target = path.resolve(workspace);
    if (!target.startsWith(path.resolve(runDir) + path.sep) || fs.lstatSync(target).isSymbolicLink()) {
      throw new Error('Refusing to remove unexpected workspace path: ' + target);
    }
    fs.rmSync(target, { recursive: true });
    console.log('Report: ' + reportFile);
  }
  const passed = report.results.filter((r) => r.passed).length;
  console.log(`${passed}/${report.results.length} attempts passed`);
  for (const row of report.summary) console.log(`${row.id}: ${row.passed}/${row.expected}`);
  return passed === report.results.length ? 0 : 1;
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; })
    .catch((error) => { console.error(error.message); process.exitCode = 2; });
}
