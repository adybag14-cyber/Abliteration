#!/usr/bin/env node
/**
 * Grok Stop hook — log turn end and refresh continuation handoff.
 * Invoked automatically when an agent turn ends (if project hooks trusted).
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const contPath = join(root, 'data', 'ralph-continuation.json');
const backlogPath = join(root, 'data', 'ralph-backlog.json');

function stamp() {
  return new Date().toISOString();
}

function loadContinuation() {
  if (!existsSync(contPath)) return { enabled: false };
  try {
    return JSON.parse(readFileSync(contPath, 'utf8'));
  } catch {
    return { enabled: false };
  }
}

function pendingCount() {
  if (!existsSync(backlogPath)) return 0;
  try {
    const b = JSON.parse(readFileSync(backlogPath, 'utf8'));
    return (b.tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  } catch {
    return 0;
  }
}

function main() {
  const cont = loadContinuation();
  const pending = pendingCount();

  if (cont.enabled) {
    spawnSync('node', ['scripts/ralph-next-task.mjs'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' });
  }

  writeFileSync(
    contPath,
    JSON.stringify(
      {
        ...cont,
        last_stop_at: stamp(),
        pending_tasks: pending,
        hook_fired: true,
      },
      null,
      2,
    ) + '\n',
  );

  if (cont.enabled && pending > 0) {
    process.stderr.write(`[ralph] Stop hook: ${pending} backlog task(s) remain — continuation should pick up\n`);
  }
}

main();