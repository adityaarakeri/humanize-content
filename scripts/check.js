#!/usr/bin/env node
'use strict';

/*
 * check.js: deterministic scanner for the mechanical AI-writing patterns in
 * references/patterns.md, references/vocabulary.md, and references/overcorrection.md.
 *
 * Zero dependencies. Node >= 18.
 *
 * Usage:
 *   node scripts/check.js <file> [file...]
 *   node scripts/check.js --json <file> [file...]
 *   cat draft.md | node scripts/check.js -
 *   node scripts/check.js --help
 *
 * Exit codes: 0 clean or P1/P2 only, 1 any P0 finding, 2 usage or IO error.
 * With --json, one file prints one object; several files print an array of objects.
 *
 * Scope: this catches what regex can catch. Most structure, content, register,
 * and overcorrection tells need a reader. A clean scan means the mechanical
 * tells are gone, not that the text sounds human.
 *
 * Skipping quoted examples in docs:
 *   a line ending in   <!-- ai-pattern-example -->    is skipped
 *   everything between <!-- ai-pattern-examples:start --> and
 *                      <!-- ai-pattern-examples:end -->   is skipped
 */

const fs = require('fs');

const EM = '\u2014';
const EN = '\u2013';

const USAGE = `usage: node scripts/check.js [--json] <file|-> [file...]

  -           read from stdin
  --json      machine-readable output (array when more than one file)
  -h, --help  show this help

exit codes: 0 no P0 findings, 1 at least one P0, 2 usage or IO error`;

// ---------------------------------------------------------------------------
// Vocabulary data. Keys must match the Flag column of references/vocabulary.md
// (text before any parenthesis). test/run.js fails if they drift apart.
// ---------------------------------------------------------------------------

const TIER1 = [
  // P0: no common literal use outside filler
  { word: 'delve', sev: 'P0', re: 'delv(?:e|es|ed|ing)' },
  { word: 'tapestry', sev: 'P0', re: 'tapestr(?:y|ies)' },
  { word: 'testament', sev: 'P0', re: 'testament to' },
  { word: 'plethora', sev: 'P0', re: 'plethora' },
  { word: 'multifaceted', sev: 'P0', re: 'multi-?faceted' },
  { word: 'embark', sev: 'P0', re: 'embark(?:s|ed|ing)? (?:on|upon)' },
  { word: 'bustling', sev: 'P0', re: 'bustling' },
  { word: 'unwavering', sev: 'P0', re: 'unwavering(?:ly)?' },
  // P1: honest literal uses exist, so a reader makes the call
  { word: 'landscape', sev: 'P1', re: '(?:digital|competitive|business|tech|technology|evolving|ever-changing|ever-evolving|current|modern|regulatory|security|threat|AI|media|political) landscape|landscape of' },
  { word: 'navigate', sev: 'P1', re: 'navigat(?:e|es|ed|ing) (?:the |this |these |today\'s )?(?:complex|complexit|challeng|evolving|ever|world|landscape|uncertain|digital|modern|intricac|nuance)' },
  { word: 'journey', sev: 'P1', re: '(?:your|our|their|this) (?:[a-z]+ )?journey' },
  { word: 'realm', sev: 'P1', re: 'realms?' },
  { word: 'foster', sev: 'P1', re: 'foster(?:s|ed|ing)?(?! (?:care|parent|home|child|famil|kid|dog|cat|pet))' },
  { word: 'garner', sev: 'P1', re: 'garner(?:s|ed|ing)?' },
  { word: 'bolster', sev: 'P1', re: 'bolster(?:s|ed|ing)?' },
  { word: 'underscore', sev: 'P1', re: 'underscor(?:e|es|ed|ing)(?! (?:character|prefix|suffix|separator))' },
  { word: 'showcase', sev: 'P1', re: 'showcas(?:e|es|ed|ing)' },
  { word: 'pivotal', sev: 'P1', re: 'pivotal' },
  { word: 'crucial', sev: 'P1', re: 'crucial(?:ly)?' },
  { word: 'vibrant', sev: 'P1', re: 'vibrant' },
  { word: 'boast', sev: 'P1', re: 'boast(?:s|ed|ing)?' },
  { word: 'seamless', sev: 'P1', re: 'seamless(?:ly)?' },
  { word: 'robust', sev: 'P1', re: 'robust(?:ly|ness)?' },
  { word: 'leverage', sev: 'P1', re: 'leverag(?:e|es|ed|ing)' },
  { word: 'harness', sev: 'P1', re: 'harness(?:es|ed|ing)? (?:the|its|their|your|our|this|these|that|those)' },
  { word: 'holistic', sev: 'P1', re: 'holistic(?:ally)?' },
  { word: 'elevate', sev: 'P1', re: 'elevat(?:e|es|ed|ing) (?:your|the|our|their|its)' },
  { word: 'empower', sev: 'P1', re: 'empower(?:s|ed|ing|ment)?' },
  { word: 'unlock', sev: 'P1', re: 'unlock(?:s|ed|ing)? (?:the |new |your |its |their )?(?:full )?(?:potential|possibilit|value|insight|opportunit|growth|power)' },
  { word: 'spearhead', sev: 'P1', re: 'spearhead(?:s|ed|ing)?' },
  { word: 'meticulous', sev: 'P1', re: 'meticulous(?:ly)?' },
  { word: 'intricate', sev: 'P1', re: 'intricate(?:ly)?|intricacies' },
  { word: 'myriad', sev: 'P1', re: 'myriad' },
  { word: 'beacon', sev: 'P1', re: 'beacon of' },
];

// Tier 2: counted across the whole document. 3+ distinct, or any one repeated, is P1.
const TIER2 = [
  ['transformative', 'transformative'],
  ['revolutionary', 'revolutionar(?:y|ize|izes|ized|izing)'],
  ['disruptive', 'disruptive|disruptor'],
  ['state-of-the-art', 'state[- ]of[- ]the[- ]art'],
  ['best-in-class', 'best[- ]in[- ]class'],
  ['world-class', 'world[- ]class'],
  ['next-generation', 'next[- ]gen(?:eration)?'],
  ['game-changer', 'game[- ]chang(?:er|ers|ing)'],
  ['paradigm', 'paradigm(?:s| shift)?'],
  ['cutting-edge', 'cutting[- ]edge'],
  ['synergy', 'synerg(?:y|ies|istic)'],
  ['innovative', 'innovative'],
  ['value-add', 'value[- ]add'],
  ['thought leadership', 'thought leadership'],
  ['ecosystem', 'ecosystems?'],
  ['stakeholders', 'stakeholders?'],
  ['actionable insights', 'actionable insights?'],
  ['pain points', 'pain points?'],
  ['moving the needle', 'mov(?:e|es|ing) the needle'],
  ['low-hanging fruit', 'low[- ]hanging fruit'],
  ['deep dive', 'deep[- ]dives?'],
  ['granular', 'granular (?:insights?|data|visibility|control)'],
  ['streamline', 'streamlin(?:e|es|ed|ing)'],
  ['frictionless', 'frictionless'],
  ['turnkey', 'turnkey'],
  ['mission-critical', 'mission[- ]critical'],
  ['battle-tested', 'battle[- ]tested'],
  ['production-grade', 'production[- ]grade'],
  ['enterprise-grade', 'enterprise[- ]grade'],
].map(([word, re]) => ({ word, re: new RegExp(`\\b(?:${re})\\b`, 'gi') }));

const wordAlt = (list) => list.map((t) => `(?:${t.re})`).join('|');

// ---------------------------------------------------------------------------
// Per-line rules. `stack: n` means: P2 per hit, promoted to P1 once the
// document has n or more hits of that rule.
// ---------------------------------------------------------------------------

const RULES = [
  // P family: punctuation and formatting
  { id: 'P1-EMDASH', sev: 'P0', re: new RegExp(EM, 'g'), label: 'em dash' },
  // A dash between words ("fast--really") or spaced (" -- "). CLI flags like --json are left alone.
  { id: 'P1-EMDASH', sev: 'P0', re: /(?<=[A-Za-z0-9.,;:)'"\]])--(?=[A-Za-z0-9('"])|(?<=\s)--(?=\s)/g, label: 'double hyphen used as dash' },
  { id: 'P1-ENDASH', sev: 'P2', re: new RegExp(' ' + EN + ' ', 'g'), label: 'spaced en dash used as em dash' },
  { id: 'P6-LISTPERIOD', sev: 'P1', re: /^\s*[-*]\s+\*\*[^*\n]{2,40}\.\*\*\s+\S/gm, label: 'bold list label ending in period' },

  // F family: fingerprints
  { id: 'F1-PLACEHOLDER', sev: 'P0', re: /\[(?:your name|insert [a-z ]+|company name|company|date)\]|\b20\d\d-XX-XX\b|lorem ipsum/gi, label: 'unfilled placeholder' },
  { id: 'F2-CITEMARKUP', sev: 'P0', re: /citeturn\d|oai_citation|contentReference\[oaicite/g, label: 'chatbot citation markup' },
  { id: 'F3-UTMSOURCE', sev: 'P0', re: /utm_source=(?:chatgpt|copilot|openai|gemini|perplexity|claude)/gi, label: 'AI-tool URL parameter' },

  // R family (mechanical subset)
  { id: 'R1-CHATBOT', sev: 'P0', re: /(?:^|\s)certainly!|\b(?:great question|i hope this helps|feel free to reach out|let me know if you(?:'d| would) like|as a large language model|as an ai(?:,| i))\b/gi, label: 'chatbot residue' },
  { id: 'R1-CHATBOT', sev: 'P1', re: /\b(?:feel free to(?! reach out)|let me know if(?! you(?:'d| would) like))\b/gi, label: 'chatbot residue (bare form, check context)' },
  { id: 'R2-LETS', sev: 'P1', re: /\blet's (?:dive in|explore|break (?:this|it) down|unpack)\b/gi, label: '"let\'s dive in" style opener' },
  { id: 'R4-NOTEWORTHY', sev: 'P1', re: /\bit(?:'s| is) (?:worth noting|important to note|important to remember)\b/gi, label: 'confidence-calibration filler' },

  // S family (mechanical subset)
  { id: 'S2-NOTJUSTX', sev: 'P0', re: /\b(?:it|this|that)(?:'s| is)? not just (?:about )?[^.,;:\n]{2,40}[,;] (?:it|this|that)(?:'s| is)\b/gi, label: '"not just X, it\'s Y"' },
  { id: 'S2-NOTJUSTX', sev: 'P0', re: /\bno [a-z]+\. no [a-z]+\. just [a-z]+\./gi, label: '"No X. No Y. Just Z."' },
  { id: 'S3-HERESWHY', sev: 'P1', re: /\bhere(?:'s| is) (?:why|the deal|what nobody)/gi, label: '"here\'s why" frame' },
  { id: 'S3-HERESWHY', sev: 'P1', re: /\bthat(?:'s| is) the real [a-z]+\b/gi, label: '"that\'s the real X"' },

  // O family (mechanical subset)
  { id: 'O1-SASS', sev: 'P0', re: /\b(?:(?:but )?here(?:'s| is) the (?:thing|truth|kicker|catch)\b|hot take:|real talk:|let that sink in|the kicker\?|the catch\?|the result\?|and honestly\?|then i realized:|then it hit me)/gi, label: 'forced-sass pivot' },

  // C family (mechanical subset)
  { id: 'C3-VAGUEATTR', sev: 'P1', re: /\b(?:experts (?:believe|agree|say)|studies (?:show|suggest|indicate)|it is widely (?:regarded|believed|known))\b/gi, label: 'vague attribution' },
  { id: 'C4-HEDGESTACK', sev: 'P1', re: /\b(?:could|may|might) (?:potentially|possibly|eventually|perhaps)\b/gi, label: 'stacked hedge' },
  { id: 'C5-FUTURECLOSER', sev: 'P1', re: /\b(?:the future looks bright|only time will tell|remains to be seen)\b/gi, label: 'unfalsifiable closer' },

  // V family
  { id: 'V1-TIER1', sev: 'P0', re: new RegExp(`\\b(?:${wordAlt(TIER1.filter((t) => t.sev === 'P0'))})\\b`, 'gi'), label: 'Tier 1 vocabulary' },
  { id: 'V1-TIER1', sev: 'P1', re: new RegExp(`\\b(?:${wordAlt(TIER1.filter((t) => t.sev === 'P1'))})\\b`, 'gi'), label: 'Tier 1 vocabulary (check: filler or literal?)' },
  { id: 'V3-STIFF', sev: 'P2', re: /\b(?:in order to|due to the fact that|prior to|subsequent to|utiliz(?:e|es|ed|ing|ation)|commenc(?:e|es|ed|ing)|endeavou?rs?|facilitat(?:e|es|ed|ing)|ascertain(?:s|ed)?|in the event that|at this point in time|on a regular basis|in close proximity to|a wide range of|with regard to|plays? a crucial role in)\b/gi, label: 'stiffness marker' },
  { id: 'V3-TRANSITION', sev: 'P2', stack: 2, re: /(?:^|[.!?]\s+|^\s*[-*]\s+)(?:furthermore|moreover|additionally|in addition|ultimately|overall),/gim, label: 'essay-template transition' },
  { id: 'V4-CLICHE', sev: 'P1', re: /\bin today's (?:fast[- ]paced|digital|ever[- ]changing|competitive|modern|dynamic)[a-z -]*\b|\bin the (?:dynamic|ever[- ]evolving) (?:world|landscape) of\b|\bnow more than ever\b|\bin an era of\b|\bwithout further ado\b|\bit goes without saying\b|\bneedless to say\b|\bat the end of the day\b|\bin conclusion\b/gi, label: 'clich\u00E9 scene-setter / boilerplate' },
  { id: 'V4-CLICHE', sev: 'P1', re: /\bwhether you(?:'re| are) a (?:beginner|novice|seasoned|complete)/gi, label: '"whether you\'re a beginner or..." frame' },
];

// ---------------------------------------------------------------------------
// Masking: replace non-prose with spaces, keeping line numbers intact.
// ---------------------------------------------------------------------------

const blank = (m) => m.replace(/[^\n]/g, ' ');

function maskNonProse(text) {
  let t = text
    .replace(/<!--\s*ai-pattern-examples:start\s*-->[\s\S]*?<!--\s*ai-pattern-examples:end\s*-->/g, blank)
    .replace(/^.*<!--\s*ai-pattern-example\s*-->.*$/gm, blank)
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, blank)
    .replace(/<code\b[\s\S]*?<\/code>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\bhttps?:\/\/[^\s)>\]]+/g, (m) => {
      // keep utm_source visible to F3, mask the rest of the URL
      const utm = m.match(/utm_source=[a-z.]+/i);
      return utm ? ' '.repeat(m.length - utm[0].length) + utm[0] : ' '.repeat(m.length);
    });

  // Indented code blocks (4 spaces or a tab) that follow a blank line, and table
  // separator rows. Trade-off: a nested list indented 4 spaces after a blank line
  // is skipped too. That can hide a tell, but it never invents one.
  const lines = t.split('\n');
  let inIndented = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBlank = line.trim() === '';
    const indented = /^(?: {4}|\t)/.test(line);
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    if (indented && (prevBlank || inIndented)) {
      lines[i] = blank(line);
      inIndented = true;
    } else if (!isBlank) {
      inIndented = false;
    }
    if (/^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(line)) lines[i] = blank(line);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Document-level checks
// ---------------------------------------------------------------------------

function densityFindings(masked) {
  const out = [];
  const tags = masked.match(/(^|\s)#[A-Za-z]\w+/g) || [];
  if (tags.length >= 6) {
    out.push({ id: 'P5-HASHTAG', sev: 'P0', line: 0, label: `${tags.length} hashtags`, excerpt: tags.slice(0, 6).join(' ').trim() + ' ...' });
  } else if (tags.length >= 4) {
    out.push({ id: 'P5-HASHTAG', sev: 'P1', line: 0, label: `${tags.length} hashtags`, excerpt: tags.join(' ').trim() });
  }

  const bold = (masked.match(/\*\*[^*\n]+\*\*/g) || []).length;
  const words = (masked.match(/\S+/g) || []).length;
  if (words > 120 && bold / Math.max(words, 1) > 0.03) {
    out.push({ id: 'P2-BOLD', sev: 'P1', line: 0, label: `${bold} bold spans in ${words} words`, excerpt: '' });
  }

  const counts = [];
  for (const t of TIER2) {
    t.re.lastIndex = 0;
    const n = (masked.match(t.re) || []).length;
    if (n > 0) counts.push([t.word, n]);
  }
  if (counts.length >= 3 || counts.some(([, n]) => n >= 2)) {
    out.push({ id: 'V2-CLUSTER', sev: 'P1', line: 0, label: `Tier 2 cluster (${counts.length} distinct)`, excerpt: counts.map(([w, n]) => (n > 1 ? `${w} x${n}` : w)).join(', ') });
  }
  return out;
}

// O11: runs on raw text, because a zero-width character is a problem anywhere, code included.
function detectorBait(text) {
  const out = [];
  const lines = text.split('\n');
  const latin = /[A-Za-z]/;
  lines.forEach((line, i) => {
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '\u200B' || c === '\u2060' || (c === '\uFEFF' && !(i === 0 && j === 0))) {
        out.push({ id: 'O11-DETECTORBAIT', sev: 'P0', line: i + 1, label: `zero-width character U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`, excerpt: line.trim().slice(0, 100) });
      } else if (c === '\u200C' || c === '\u200D') {
        // legitimate inside emoji sequences and some scripts; suspicious between Latin letters
        if (latin.test(line[j - 1] || '') || latin.test(line[j + 1] || '')) {
          out.push({ id: 'O11-DETECTORBAIT', sev: 'P0', line: i + 1, label: `zero-width joiner/non-joiner in Latin text`, excerpt: line.trim().slice(0, 100) });
        }
      }
    }
    const mixed = line.match(/[A-Za-z]+[\u0400-\u04FF]+[A-Za-z\u0400-\u04FF]*|[\u0400-\u04FF]+[A-Za-z]+[A-Za-z\u0400-\u04FF]*/g);
    if (mixed) {
      for (const w of mixed) {
        out.push({ id: 'O11-DETECTORBAIT', sev: 'P0', line: i + 1, label: `mixed Latin/Cyrillic word (homoglyph): "${w}"`, excerpt: line.trim().slice(0, 100) });
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------------------

function scan(text) {
  const masked = maskNonProse(text);
  const lines = masked.split('\n');
  const findings = [];
  for (const rule of RULES) {
    const hits = [];
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        hits.push({ id: rule.id, sev: rule.sev, line: i + 1, label: rule.label, excerpt: line.trim().slice(0, 100) });
        if (m.index === rule.re.lastIndex) rule.re.lastIndex++;
      }
    });
    if (rule.stack && hits.length >= rule.stack) {
      for (const h of hits) {
        h.sev = 'P1';
        h.label += ` (${hits.length} in this document)`;
      }
    }
    findings.push(...hits);
  }
  findings.push(...densityFindings(masked));
  findings.push(...detectorBait(text));
  const order = { P0: 0, P1: 1, P2: 2 };
  findings.sort((a, b) => order[a.sev] - order[b.sev] || a.line - b.line);
  return findings;
}

function report(name, findings) {
  if (findings.length === 0) {
    console.log(`${name}: clean (mechanical patterns only; structure and register still need a reader)`);
    return;
  }
  console.log(`${name}: ${findings.length} finding(s)`);
  for (const f of findings) {
    const loc = f.line ? `L${f.line}` : 'doc';
    console.log(`  [${f.sev}] ${f.id} ${loc}: ${f.label}${f.excerpt ? '  | ' + f.excerpt : ''}`);
  }
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log(USAGE);
    return 0;
  }
  const asJson = args.includes('--json');
  const unknown = args.filter((a) => a.startsWith('-') && a !== '-' && a !== '--json');
  const files = args.filter((a) => a === '-' || !a.startsWith('-'));
  if (unknown.length > 0 || files.length === 0) {
    if (unknown.length > 0) console.error(`unknown option: ${unknown.join(' ')}`);
    console.error(USAGE);
    return 2;
  }

  let exitCode = 0;
  const results = [];
  for (const f of files) {
    let text;
    try {
      text = f === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(f, 'utf8');
    } catch (e) {
      console.error(`cannot read ${f}: ${e.message}`);
      exitCode = 2;
      continue;
    }
    const findings = scan(text);
    if (asJson) results.push({ file: f, findings });
    else report(f, findings);
    if (exitCode === 0 && findings.some((x) => x.sev === 'P0')) exitCode = 1;
  }
  if (asJson) {
    const payload = files.length === 1 ? (results[0] || { file: files[0], findings: [], error: 'unreadable' }) : results;
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  }
  return exitCode;
}

if (require.main === module) process.exitCode = main(process.argv);
module.exports = { scan, RULES, TIER1, TIER2, maskNonProse };
