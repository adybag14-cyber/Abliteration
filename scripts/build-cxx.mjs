#!/usr/bin/env node
/**
 * Build the C++26 abliterate-cxx CLI + tests.
 * Always passes -std=c++26 (or MSVC /std:c++latest). Does not fall back to C++20.
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const cxx = join(root, 'cxx');
const outDir = join(cxx, 'build');
mkdirSync(outDir, { recursive: true });

const isWin = process.platform === 'win32';
const candidates = isWin
  ? [
      'C:\\Users\\adyba\\gcc\\bin\\g++.exe',
      'g++',
      'clang++',
    ]
  : ['g++', 'clang++'];

function findCompiler() {
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  return null;
}

const cc = findCompiler();
if (!cc) {
  console.error('No g++/clang++ found. Install a C++26 toolchain (GCC 15+ / Clang 20+).');
  process.exit(2);
}

const exe = join(outDir, isWin ? 'abliterate-cxx.exe' : 'abliterate-cxx');
const testExe = join(outDir, isWin ? 'abliterate-cxx-tests.exe' : 'abliterate-cxx-tests');
const inc = join(cxx, 'include');
const flags = ['-std=c++26', '-Wall', '-Wextra', '-O2', `-I${inc}`];

function compile(label, src, dest) {
  const args = [...flags, src, '-o', dest];
  console.log(`> ${cc} ${args.join(' ')}`);
  const r = spawnSync(cc, args, { cwd: root, encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) {
    console.error(`compile failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

compile('cli', join(cxx, 'src', 'main.cpp'), exe);
compile('tests', join(cxx, 'tests', 'test_ops.cpp'), testExe);
console.log(`built ${exe}`);
console.log(`built ${testExe}`);
console.log('dialect: -std=c++26');
