#!/usr/bin/env node
/**
 * Watchdog — restart headless Ralph when it exits but backlog still has tasks.
 *
 *   npm run ralph:continue:watch
 *   RALPH_CONTINUE_MAX_RESTARTS=5 npm run ralph:continue:watch
 */
import { existsSync, readFileSync, appendFileSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const backlogPath = join(root, 'data', 'ralph-backlog.json');
const logPath = join(root, 'data', 'ralph-continue.log');
const maxRestarts = Number(process.env.RALPH_CONTINUE_MAX_RESTARTS || '10');
const pauseMs = Number(process.env.RALPH_CONTINUE_RESTART_PAUSE_MS || '15000');

function stamp() {
  return new Date().toISOString();
}

function pendingCount() {
  if (!existsSync(backlogPath)) return 0;
  const b = JSON.parse(readFileSync(backlogPath, 'utf8'));
  return (b.tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
}

function runOnce() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(__dir, 'ralph-continue-on.mjs')], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function waitForHeadlessExit() {
  const pidPath = join(root, 'data', '.ralph-continue.pid');
  return new Promise((resolve) => {
    const check = () => {
      if (!existsSync(pidPath)) {
        resolve();
        return;
      }
      const pid = Number(readFileSync(pidPath, 'utf8').trim());
      try {
        process.kill(pid, 0);
        setTimeout(check, 3000);
      } catch {
        resolve();
      }
    };
    setTimeout(check, 5000);
  });
}

async function main() {
  let restarts = 0;
  appendFileSync(logPath, `\n[${stamp()}] WATCH start (max_restarts=${maxRestarts})\n`);

  while (restarts <= maxRestarts) {
    const pending = pendingCount();
    if (!pending) {
      console.log('Backlog clear — watch exiting');
      break;
    }

    console.log(`\n═══ Ralph watch cycle ${restarts + 1} (${pending} tasks) ═══`);
    await runOnce();
    await waitForHeadlessExit();

    const still = pendingCount();
    if (!still) {
      console.log('Backlog cleared during headless run');
      break;
    }

    restarts++;
    if (restarts > maxRestarts) {
      console.error(`Max restarts (${maxRestarts}) reached — ${still} tasks remain`);
      break;
    }

    console.log(`Headless exited with ${still} tasks left — restart in ${pauseMs}ms`);
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}

main();