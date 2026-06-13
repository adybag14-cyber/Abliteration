#!/usr/bin/env node
/**
 * Count lines in eval JSONL corpora and print a summary table.
 *
 *   npm run eval:stats
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const evalDir = join(root, 'data', 'eval');
const examplesDir = join(root, 'data', 'examples');

function countJsonl(path) {
  if (!existsSync(path)) return { lines: 0, missing: true };
  const text = readFileSync(path, 'utf8').trim();
  if (!text) return { lines: 0, missing: false };
  return { lines: text.split('\n').filter(Boolean).length, missing: false };
}

function countTxt(path) {
  if (!existsSync(path)) return { lines: 0, missing: true };
  const text = readFileSync(path, 'utf8').trim();
  if (!text) return { lines: 0, missing: false };
  return { lines: text.split('\n').filter(Boolean).length, missing: false };
}

function walkJsonl(dir, rel = '') {
  const rows = [];
  if (!existsSync(dir)) return rows;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) rows.push(...walkJsonl(p, r));
    else if (e.name.endsWith('.jsonl')) {
      const c = countJsonl(p);
      rows.push({ file: `data/eval/${r}`.replace(/\\/g, '/'), ...c });
    } else if (e.name.endsWith('.txt')) {
      const c = countTxt(p);
      rows.push({ file: `data/eval/${r}`.replace(/\\/g, '/'), ...c, txt: true });
    }
  }
  return rows;
}

function main() {
  const evalRows = walkJsonl(evalDir);
  const exampleRows = [];
  if (existsSync(examplesDir)) {
    for (const e of readdirSync(examplesDir)) {
      if (!e.endsWith('.jsonl')) continue;
      const c = countJsonl(join(examplesDir, e));
      exampleRows.push({ file: `data/examples/${e}`, ...c });
    }
  }

  const all = [...evalRows, ...exampleRows].sort((a, b) => a.file.localeCompare(b.file));
  let total = 0;

  console.log('Eval corpus stats\n');
  console.log('File'.padEnd(52) + 'Lines');
  console.log('-'.repeat(60));

  for (const row of all) {
    if (row.missing) {
      console.log(`${row.file.padEnd(52)}MISSING`);
      continue;
    }
    total += row.lines;
    console.log(`${row.file.padEnd(52)}${row.lines}`);
  }

  console.log('-'.repeat(60));
  console.log(`${'TOTAL'.padEnd(52)}${total}`);

  console.log('\nNotable corpora:');
  console.log('  • cybergym-subset-sample.jsonl — local CyberGym vuln-repro proxy (see docs/use-cases/cybergym-benchmark.md and evaluation.md)');
  console.log('  • jarvis-safe-eval.jsonl — filtered safe tool prompts from Jarvis pack for repair/adapter eval');
}

main();