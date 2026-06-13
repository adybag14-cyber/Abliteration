#!/usr/bin/env node
/**
 * Grok SessionStart hook — refresh handoff when Ralph continuation is enabled.
 */
import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const contPath = join(root, 'data', 'ralph-continuation.json');

function main() {
  if (!existsSync(contPath)) return;
  let cont;
  try {
    cont = JSON.parse(readFileSync(contPath, 'utf8'));
  } catch {
    return;
  }
  if (!cont.enabled) return;

  spawnSync('node', ['scripts/ralph-next-task.mjs'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  process.stderr.write('[ralph] SessionStart: handoff refreshed — read data/ralph-agent-handoff.md\n');
}

main();