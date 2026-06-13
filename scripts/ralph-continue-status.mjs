#!/usr/bin/env node
/** Show Ralph continuation + backlog status. */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const cont = readJson(join(root, 'data', 'ralph-continuation.json'));
const backlog = readJson(join(root, 'data', 'ralph-backlog.json'));
const pidPath = join(root, 'data', '.ralph-continue.pid');
const pid = existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8').trim()) : null;

const pending = (backlog?.tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress');

console.log('Ralph continuation status\n');
console.log(`  enabled:     ${cont?.enabled ? 'YES' : 'NO'}`);
console.log(`  mode:        ${cont?.mode || '(none)'}`);
console.log(`  max_turns:   ${cont?.max_turns || '—'}`);
console.log(`  headless:    ${alive(pid) ? `running pid ${pid}` : 'not running'}`);
console.log(`  backlog:     ${pending.length} pending/in_progress`);
if (pending[0]) console.log(`  next task:   ${pending[0].id} — ${pending[0].title}`);
console.log(`  handoff:     data/ralph-agent-handoff.md`);
console.log(`  log:         data/ralph-continue.log`);