#!/usr/bin/env node
/**
 * Stop the Ralph autostart background daemon.
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const pidPath = join(__dir, '..', 'data', '.ralph-autostart.pid');

if (!existsSync(pidPath)) {
  console.log('Ralph autostart is not running (no pid file)');
  process.exit(0);
}

const pid = Number(readFileSync(pidPath, 'utf8').trim());
if (!pid || Number.isNaN(pid)) {
  unlinkSync(pidPath);
  console.log('Removed stale pid file');
  process.exit(0);
}

try {
  process.kill(pid, 'SIGTERM');
  console.log(`Sent SIGTERM to Ralph autostart (pid ${pid})`);
} catch (err) {
  if (err.code === 'ESRCH') {
    unlinkSync(pidPath);
    console.log('Process not found — removed stale pid file');
  } else {
    console.error(`Failed to stop pid ${pid}: ${err.message}`);
    process.exit(1);
  }
}