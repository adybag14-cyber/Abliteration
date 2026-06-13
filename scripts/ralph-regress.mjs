#!/usr/bin/env node
/**
 * Regression gate — run before committing Ralph watch output.
 *
 *   npm run ralph:regress
 *
 * Exit 0 = safe to commit. Exit 1 = regression detected.
 */
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

function run(label, cmd, args = []) {
  console.log(`\n> ${label}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.error(`\n✗ REGRESSION: ${label} failed (exit ${r.status ?? 1})`);
    process.exit(1);
  }
}

console.log('Ralph regress — pre-commit gate\n');

run('validate', 'node', ['scripts/ralph-validate.mjs']);
run('ralph-ci', 'node', ['scripts/ralph-loop.mjs', '--skip-fetch', '--max', '1']);
run('eval-stats', 'node', ['scripts/count-eval-prompts.mjs']);
run('eval-cybergym', process.platform === 'win32' ? 'python' : 'python3', [
  'scripts/cybergym-eval-stub.py',
  '--print-flow',
]);

const pyScripts = [
  'scripts/cybergym-eval-stub.py',
  'scripts/filter-jarvis-eval.py',
  'scripts/export-abliteration-lora.py',
  'scripts/hardware-tool-gate.py',
  'scripts/check_env.py',
];
for (const rel of pyScripts) {
  run(`py_compile ${rel}`, process.platform === 'win32' ? 'python' : 'python3', ['-m', 'py_compile', rel]);
}

console.log('\n✓ Ralph regress PASSED — no regressions detected');