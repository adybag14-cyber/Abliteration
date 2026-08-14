#!/usr/bin/env node
/**
 * Extract a packaged archive into a temp dir (no repo cwd) and run the first-hour loop.
 *
 *   node scripts/smoke-cxx-package.mjs --archive cxx/dist/abliterate-cxx-windows-x64-msvc.tar.gz
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
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

function windowsSystemTar() {
  const p = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  return existsSync(p) ? p : null;
}

/** MSYS/Git-Bash GNU tar treats `C:\...` as an escaped relative path. */
function posixify(p) {
  const abs = resolve(p);
  if (process.platform !== 'win32') return abs;
  const m = abs.match(/^([A-Za-z]):[\\/](.*)$/);
  if (!m) return abs.replace(/\\/g, '/');
  return `/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}`;
}

function extractTarGz(archivePath, destDir) {
  const attempts = [];
  const sysTar = process.platform === 'win32' ? windowsSystemTar() : null;
  if (sysTar) {
    attempts.push({ bin: sysTar, archive: archivePath, dest: destDir });
  }
  attempts.push({ bin: 'tar', archive: posixify(archivePath), dest: posixify(destDir) });
  attempts.push({ bin: 'tar', archive: archivePath, dest: destDir });

  const errors = [];
  for (const a of attempts) {
    const r = spawnSync(a.bin, ['-xzf', a.archive, '-C', a.dest], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (r.status === 0) {
      console.log(`extracted with ${a.bin} -C ${a.dest}`);
      return;
    }
    const msg = `${a.bin} -xzf ${a.archive} -C ${a.dest} -> ${r.status}\n${r.stderr || r.stdout || ''}`;
    errors.push(msg.trim());
  }
  process.stderr.write(errors.join('\n') + '\n');
  process.exit(1);
}

function extractArchive(archivePath, destDir) {
  if (archivePath.toLowerCase().endsWith('.zip')) {
    const dest = destDir.replace(/'/g, "''");
    const src = resolve(archivePath).replace(/'/g, "''");
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -Force -Path '${src}' -DestinationPath '${dest}'`],
      { encoding: 'utf8', windowsHide: true },
    );
    if (r.status !== 0) {
      process.stderr.write(r.stderr || r.stdout || '');
      process.exit(1);
    }
    console.log(`extracted zip with Expand-Archive -C ${destDir}`);
    return;
  }
  extractTarGz(archivePath, destDir);
}

extractArchive(archive, lab);

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

// Hour-1: doctor+demo must work from a different cwd via the absolute exe path
// (Windows argv[0] is often just the filename).
const alien = mkdtempSync(join(tmpdir(), 'abliterate-alien-cwd-'));
function runAbs(args) {
  const cmd = wrap ? wrap.split(/\s+/).concat([exe, ...args]) : [exe, ...args];
  console.log(`> (cwd=${alien})`, cmd.join(' '));
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: alien, encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) {
    console.error(`smoke fail (foreign cwd): ${args.join(' ')} exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return r.stdout || '';
}
const doctorAbs = runAbs(['doctor']);
if (!/examples/i.test(doctorAbs)) {
  console.error('doctor from foreign cwd did not report examples/');
  process.exit(1);
}
const demoAbs = runAbs(['demo']);
if (!demoAbs.includes('estimate') || !demoAbs.includes('eval')) {
  console.error('demo from foreign cwd did not print estimate/eval');
  process.exit(1);
}
console.log(`smoke ok  lab=${lab}  alien=${alien}  root_unused=${root}`);
