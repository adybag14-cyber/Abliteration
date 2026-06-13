#!/usr/bin/env node
/**
 * Disable Ralph turn continuations and stop headless grok if running.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const contPath = join(root, 'data', 'ralph-continuation.json');
const pidPath = join(root, 'data', '.ralph-continue.pid');

function stamp() {
  return new Date().toISOString();
}

function stopPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Stopped headless Ralph (pid ${pid})`);
    return true;
  } catch (err) {
    if (err.code === 'ESRCH') {
      console.log('Headless process already exited');
      return false;
    }
    throw err;
  }
}

function main() {
  if (existsSync(pidPath)) {
    const pid = Number(readFileSync(pidPath, 'utf8').trim());
    if (pid) stopPid(pid);
    unlinkSync(pidPath);
  }

  let prev = {};
  if (existsSync(contPath)) {
    try {
      prev = JSON.parse(readFileSync(contPath, 'utf8'));
    } catch {
      prev = {};
    }
  }

  writeFileSync(
    contPath,
    JSON.stringify({ ...prev, enabled: false, stopped_at: stamp() }, null, 2) + '\n',
  );

  console.log('Ralph turn continuations OFF');
}

main();