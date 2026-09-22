#!/usr/bin/env node
/**
 * Build the C++26 abliterate-cxx CLI + tests.
 * Always passes -std=c++26 (or MSVC /std:c++latest). Does not fall back to C++20.
 */
import { spawnSync } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { windowsVisualStudioEnvironment } from './lib/windows-vs-env.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const cxx = join(root, 'cxx');
const outDir = join(cxx, 'build');
mkdirSync(outDir, { recursive: true });

const isWin = process.platform === 'win32';
const compilerEnvironment = windowsVisualStudioEnvironment(process.env);
const candidates = process.env.CXX
  ? [process.env.CXX]
  : [...new Set(['clang++', 'g++'])];

function findCompiler() {
  for (const c of candidates) {
    const version = spawnSync(c, ['--version'], { encoding: 'utf8', env: compilerEnvironment, windowsHide: true });
    if (version.status !== 0) continue;
    const probe = spawnSync(c, ['-std=c++26', '-x', 'c++', '-', '-fsyntax-only'], {
      encoding: 'utf8',
      env: compilerEnvironment,
      input: '#include <algorithm>\n#include <vector>\nint main() { std::vector<int> v; return static_cast<int>(v.size()); }\n',
      windowsHide: true,
    });
    if (probe.status === 0) return c;
    process.stderr.write(`Skipping ${c}: C++26 standard-library probe failed\n${probe.stderr || ''}`);
  }
  return null;
}

const cc = findCompiler();
if (!cc) {
  console.error('No clang++/g++ found. Install a C++26 toolchain (Clang 22+ or GCC 16+ recommended).');
  process.exit(2);
}

const exe = join(outDir, isWin ? 'abliterate-cxx.exe' : 'abliterate-cxx');
const testExe = join(outDir, isWin ? 'abliterate-cxx-tests.exe' : 'abliterate-cxx-tests');
const inc = join(cxx, 'include');
const target = `${process.platform}-${process.arch}`;
const flags = [
  '-std=c++26',
  '-Wall',
  '-Wextra',
  '-Wpedantic',
  '-Wshadow',
  '-Wconversion',
  '-Wsign-conversion',
  '-fstack-protector-strong',
  '-O2',
  `-I${inc}`,
  '-DABLITERATE_VERSION="1.2.0"',
  `-DABLITERATE_TARGET="${target}"`,
];

function compile(label, src, dest) {
  const args = [...flags, src, '-o', dest];
  console.log(`> ${cc} ${args.join(' ')}`);
  const r = spawnSync(cc, args, { cwd: root, encoding: 'utf8', env: compilerEnvironment, windowsHide: true });
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
console.log(`compiler: ${cc}`);
