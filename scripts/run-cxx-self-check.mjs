#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const exe = join(root, 'cxx', 'build', isWin ? 'abliterate-cxx.exe' : 'abliterate-cxx');
if (!existsSync(exe)) {
  const b = spawnSync(process.execPath, [join(root, 'scripts', 'build-cxx.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
const r = spawnSync(exe, ['self-check'], { cwd: root, encoding: 'utf8' });
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status ?? 1);
