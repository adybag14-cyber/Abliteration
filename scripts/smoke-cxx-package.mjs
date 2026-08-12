#!/usr/bin/env node
/**
 * Extract a packaged archive into a temp dir (no repo cwd) and run the first-hour loop.
 *
 *   node scripts/smoke-cxx-package.mjs --archive cxx/dist/abliterate-cxx-windows-x64-gcc15.tar.gz
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const archive = arg('--archive');
if (!archive || !existsSync(archive)) {
  console.error('smoke-cxx-package: --archive FILE required');
  process.exit(2);
}

const wrap = arg('--wrap', ''); // e.g. arch -x86_64
const lab = mkdtempSync(join(tmpdir(), 'abliterate-lab-'));
const tar = spawnSync('tar', ['-xzf', archive, '-C', lab], { encoding: 'utf8' });
if (tar.status !== 0) {
  process.stderr.write(tar.stderr || '');
  process.exit(1);
}

function findExe(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      const hit = findExe(p);
      if (hit) return hit;
    }
    if (name.name === 'abliterate-cxx' || name.name === 'abliterate-cxx.exe') return p;
  }
  return null;
}

const exe = findExe(lab);
if (!exe) {
  console.error('no abliterate-cxx in archive');
  process.exit(1);
}
const cwd = dirname(exe);

function run(args) {
  const cmd = wrap ? wrap.split(/\s+/).concat([exe, ...args]) : [exe, ...args];
  console.log('>', cmd.join(' '));
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) {
    console.error(`smoke fail: ${args.join(' ')} exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return r.stdout || '';
}

run(['doctor']);
const demo = run(['demo']);
if (!demo.includes('estimate') || !demo.includes('eval')) {
  console.error('demo did not print estimate/eval');
  process.exit(1);
}
run(['estimate', '--mode', 'dim', '--bad', 'examples/tiny-bad.txt', '--good', 'examples/tiny-good.txt', '--out', 'r.txt']);
if (!existsSync(join(cwd, 'r.txt'))) {
  console.error('estimate did not write r.txt next to the binary');
  process.exit(1);
}
run(['apply', '--mode', 'orba-directional', '--weight', 'examples/tiny-W.txt', '--direction', 'r.txt', '--out', 'W2.txt']);
const ev = run(['eval', '--jsonl', 'examples/generations.jsonl']);
if (!ev.includes('"n": 5') && !ev.includes('"n":5')) {
  console.error('eval n != 5');
  process.exit(1);
}
if (!ev.includes('false_refusal')) {
  console.error('eval missing false_refusal');
  process.exit(1);
}
console.log(`smoke ok  lab=${lab}  root_unused=${root}`);
