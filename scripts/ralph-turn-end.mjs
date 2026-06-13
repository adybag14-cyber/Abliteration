#!/usr/bin/env node
/**
 * Agent turn-end hook — log the turn and ensure the Ralph autostart daemon is running.
 *
 *   npm run ralph:turn-end
 *   npm run ralph:turn-end -- --message "fixed broken links"
 *
 * Agents MUST run this before ending any turn that touched the handbook.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dataDir = join(root, 'data');
const turnsPath = join(dataDir, 'ralph-turns.jsonl');
const signalPath = join(dataDir, 'ralph-autostart.signal.json');
const pidPath = join(dataDir, '.ralph-autostart.pid');

const args = process.argv.slice(2);
const messageIdx = args.indexOf('--message');
const message = messageIdx >= 0 ? args[messageIdx + 1] || '' : process.env.RALPH_TURN_MESSAGE || '';

function stamp() {
  return new Date().toISOString();
}

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

function logTurn() {
  const entry = {
    at: stamp(),
    pid: process.pid,
    cwd: root,
    message: message || null,
    agent: process.env.GROK_AGENT || process.env.CURSOR_AGENT || 'unknown',
  };
  appendFileSync(turnsPath, JSON.stringify(entry) + '\n');
  console.log(`Ralph turn-end logged → ${turnsPath}`);
  return entry;
}

function writeSignal(entry) {
  const signal = {
    requested_at: entry.at,
    message: entry.message,
    turn_count: readTurnCount(),
  };
  writeFileSync(signalPath, JSON.stringify(signal, null, 2) + '\n');
  console.log(`Ralph signal written → ${signalPath}`);
}

function readTurnCount() {
  if (!existsSync(turnsPath)) return 1;
  return readFileSync(turnsPath, 'utf8').trim().split('\n').filter(Boolean).length;
}

function isDaemonAlive() {
  if (!existsSync(pidPath)) return false;
  const pid = Number(readFileSync(pidPath, 'utf8').trim());
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function spawnAutostart() {
  const script = join(root, 'scripts', 'ralph-autostart.mjs');
  const child = spawn(process.execPath, [script, '--from-turn-end'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  console.log(`Ralph autostart spawned (pid ${child.pid})`);
  return child.pid;
}

function main() {
  ensureDataDir();
  const entry = logTurn();
  writeSignal(entry);

  if (isDaemonAlive()) {
    const pid = readFileSync(pidPath, 'utf8').trim();
    console.log(`Ralph autostart already running (pid ${pid}) — signal queued`);
    process.exit(0);
  }

  spawnAutostart();
  console.log('Ralph autostart daemon starting in background');
  process.exit(0);
}

main();