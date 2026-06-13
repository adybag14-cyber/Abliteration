#!/usr/bin/env node
/**
 * Ralph monitor — seed backlog if empty, start watch if idle, log status each cycle.
 *
 *   npm run ralph:monitor              # one check
 *   npm run ralph:monitor -- --loop    # continuous (default 90s interval)
 */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dataDir = join(root, 'data');
const backlogPath = join(dataDir, 'ralph-backlog.json');
const watchPidPath = join(dataDir, '.ralph-monitor.pid');
const logPath = join(dataDir, 'ralph-monitor.log');
const continuePidPath = join(dataDir, '.ralph-continue.pid');

const args = process.argv.slice(2);
const loop = args.includes('--loop');
const intervalMs = Number(process.env.RALPH_MONITOR_INTERVAL_MS || '90000');

function stamp() {
  return new Date().toISOString();
}

function log(msg) {
  const line = `[${stamp()}] ${msg}`;
  appendFileSync(logPath, line + '\n');
  console.log(line);
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function pendingCount() {
  const b = readJson(backlogPath);
  if (!b?.tasks) return 0;
  return b.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
}

function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function watchRunning() {
  if (!existsSync(watchPidPath)) return false;
  return isAlive(Number(readFileSync(watchPidPath, 'utf8').trim()));
}

function headlessRunning() {
  if (!existsSync(continuePidPath)) return false;
  return isAlive(Number(readFileSync(continuePidPath, 'utf8').trim()));
}

function runSeed() {
  const r = spawnSync(process.execPath, [join(__dir, 'ralph-seed-backlog.mjs')], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

function startWatch() {
  if (watchRunning()) {
    log('watch already running');
    return;
  }
  const child = spawn(process.execPath, [join(__dir, 'ralph-continue-watch.mjs')], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(watchPidPath, String(child.pid) + '\n');
  log(`started ralph:continue:watch (pid ${child.pid})`);
}

function cycle() {
  mkdirSync(dataDir, { recursive: true });
  let pending = pendingCount();

  if (pending === 0) {
    log('backlog empty — seeding next wave');
    runSeed();
    pending = pendingCount();
  }

  const hl = headlessRunning();
  const wr = watchRunning();

  log(`status: pending=${pending} headless=${hl ? 'yes' : 'no'} watch=${wr ? 'yes' : 'no'}`);

  if (pending > 0 && !wr && !hl) {
    startWatch();
  } else if (pending === 0 && !wr) {
    log('backlog clear, watch idle — will seed next cycle');
  }
}

function main() {
  if (loop) {
    log(`monitor loop start (interval ${intervalMs}ms)`);
    const tick = () => {
      cycle();
      setTimeout(tick, intervalMs);
    };
    tick();
  } else {
    cycle();
  }
}

main();