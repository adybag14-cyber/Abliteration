#!/usr/bin/env node
/**
 * Ralph autostart daemon — background validate → refresh loop triggered by agent turns.
 *
 *   npm run ralph:autostart          # foreground (Ctrl+C to stop)
 *   npm run ralph:autostart:stop     # stop background daemon
 *
 * Single instance via data/.ralph-autostart.pid
 * Logs: data/ralph-autostart.log, data/ralph-autostart-status.json
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dataDir = join(root, 'data');
const pidPath = join(dataDir, '.ralph-autostart.pid');
const logPath = join(dataDir, 'ralph-autostart.log');
const statusPath = join(dataDir, 'ralph-autostart-status.json');
const signalPath = join(dataDir, 'ralph-autostart.signal.json');

const args = process.argv.slice(2);
const fromTurnEnd = args.includes('--from-turn-end');
const intervalMs = Number(process.env.RALPH_AUTOSTART_INTERVAL_MS || '120000');
const maxCycles = Number(process.env.RALPH_AUTOSTART_MAX_CYCLES || '0'); // 0 = unlimited
const skipFetch = args.includes('--skip-fetch') || process.env.RALPH_AUTOSTART_SKIP_FETCH === '1';

function stamp() {
  return new Date().toISOString();
}

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

function log(msg) {
  const line = `[${stamp()}] ${msg}\n`;
  appendFileSync(logPath, line);
  console.log(msg);
}

function writeStatus(patch) {
  let prev = {};
  if (existsSync(statusPath)) {
    try {
      prev = JSON.parse(readFileSync(statusPath, 'utf8'));
    } catch {
      prev = {};
    }
  }
  const next = { ...prev, ...patch, updated_at: stamp() };
  writeFileSync(statusPath, JSON.stringify(next, null, 2) + '\n');
}

function acquireLock() {
  if (existsSync(pidPath)) {
    const oldPid = Number(readFileSync(pidPath, 'utf8').trim());
    if (oldPid && !Number.isNaN(oldPid)) {
      try {
        process.kill(oldPid, 0);
        console.error(`Ralph autostart already running (pid ${oldPid})`);
        process.exit(1);
      } catch {
        /* stale pid file */
      }
    }
  }
  writeFileSync(pidPath, String(process.pid) + '\n');
}

function releaseLock() {
  if (existsSync(pidPath)) {
    const pid = Number(readFileSync(pidPath, 'utf8').trim());
    if (pid === process.pid) unlinkSync(pidPath);
  }
}

function readSignal() {
  if (!existsSync(signalPath)) return null;
  try {
    return JSON.parse(readFileSync(signalPath, 'utf8'));
  } catch {
    return null;
  }
}

function runRalph() {
  const ralphArgs = ['scripts/ralph-loop.mjs', '--max', process.env.RALPH_MAX_ITER || '3'];
  if (skipFetch) ralphArgs.push('--skip-fetch');
  log(`> node ${ralphArgs.join(' ')}`);
  const r = spawnSync('node', ralphArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.stdout) appendFileSync(logPath, r.stdout);
  if (r.stderr) appendFileSync(logPath, r.stderr);
  return r.status ?? 1;
}

function gitDirty() {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return null;
  return Boolean(r.stdout?.trim());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
  let cycle = 0;
  let lastSignalAt = null;

  while (maxCycles === 0 || cycle < maxCycles) {
    cycle++;
    const signal = readSignal();
    const signalChanged = signal?.requested_at && signal.requested_at !== lastSignalAt;

    log(`═══ Ralph autostart cycle ${cycle} ═══`);
    writeStatus({
      running: true,
      pid: process.pid,
      cycle,
      from_turn_end: fromTurnEnd,
      interval_ms: intervalMs,
      last_signal_at: signal?.requested_at || null,
      signal_changed: signalChanged,
    });

    if (signalChanged) {
      lastSignalAt = signal.requested_at;
      log(`Turn-end signal: ${signal.message || '(no message)'}`);
    }

    const exitCode = runRalph();
    const dirty = gitDirty();

    writeStatus({
      last_cycle_at: stamp(),
      last_exit_code: exitCode,
      git_dirty: dirty,
      last_result: exitCode === 0 ? 'PASS' : 'FAIL',
    });

    if (exitCode === 0) {
      log('Ralph cycle PASSED');
    } else {
      log('Ralph cycle FAILED — will retry after interval');
    }

    if (dirty === true) {
      log('Git working tree has uncommitted changes');
    }

    if (maxCycles > 0 && cycle >= maxCycles) break;
    log(`Sleeping ${intervalMs}ms…`);
    await sleep(intervalMs);
  }

  log('Ralph autostart daemon exiting');
  writeStatus({ running: false, stopped_at: stamp() });
}

function main() {
  ensureDataDir();
  acquireLock();

  writeStatus({
    started_at: stamp(),
    running: true,
    pid: process.pid,
    from_turn_end: fromTurnEnd,
    skip_fetch: skipFetch,
  });

  log(`Ralph autostart daemon started (pid ${process.pid})`);

  const shutdown = () => {
    log('Ralph autostart received shutdown');
    releaseLock();
    writeStatus({ running: false, stopped_at: stamp() });
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', releaseLock);

  loop().catch((err) => {
    log(`Fatal: ${err.message}`);
    releaseLock();
    process.exit(1);
  });
}

main();