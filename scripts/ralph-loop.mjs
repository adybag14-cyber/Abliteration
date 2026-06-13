#!/usr/bin/env node
/**
 * Ralph Wiggum loop — validate → refresh pins/docs → re-validate until clean or max iterations.
 *
 *   npm run ralph              # one full cycle
 *   npm run ralph -- --max 5   # up to 5 iterations
 *   npm run ralph -- --skip-fetch   # validate only
 *
 * Agent pattern: keep running until `ralph-validate` exits 0, then commit.
 */
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const args = process.argv.slice(2);
const maxIter = Number(args.find((a, i) => args[i - 1] === '--max') || process.env.RALPH_MAX_ITER || '3');
const skipFetch = args.includes('--skip-fetch');
const statusPath = join(root, 'data', 'ralph-status.json');

function run(cmd, cmdArgs = []) {
  console.log(`\n> ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status ?? 1;
}

function stamp() {
  return new Date().toISOString();
}

async function cycle(iter) {
  console.log(`\n═══ Ralph iteration ${iter}/${maxIter} ═══ ${stamp()}`);

  const validateStatus = run('node', ['scripts/ralph-validate.mjs']);
  if (validateStatus === 0) {
    return { ok: true, iter, validateStatus };
  }

  if (skipFetch) {
    return { ok: false, iter, validateStatus, reason: 'validate_failed_skip_fetch' };
  }

  console.log('\nValidate failed — running refresh steps…');
  run('node', ['scripts/fetch-heretic-tools.mjs']);
  run('node', ['scripts/build-heretic-models-doc.mjs']);

  const revalidate = run('node', ['scripts/ralph-validate.mjs']);
  return { ok: revalidate === 0, iter, validateStatus: revalidate, refreshed: true };
}

async function main() {
  const log = { started_at: stamp(), max_iter: maxIter, skip_fetch: skipFetch, iterations: [] };

  for (let i = 1; i <= maxIter; i++) {
    const result = await cycle(i);
    log.iterations.push({ ...result, at: stamp() });
    if (result.ok) {
      log.completed_at = stamp();
      log.status = 'PASS';
      writeFileSync(statusPath, JSON.stringify(log, null, 2) + '\n');
      console.log(`\n🍩 Ralph loop DONE at iteration ${i} — handbook validated`);
      process.exit(0);
    }
    console.log(`\nIteration ${i} did not pass — ${i < maxIter ? 'retrying…' : 'giving up'}`);
  }

  log.completed_at = stamp();
  log.status = 'FAIL';
  writeFileSync(statusPath, JSON.stringify(log, null, 2) + '\n');
  console.error('\nRalph loop FAILED after max iterations — fix errors above');
  process.exit(1);
}

main();