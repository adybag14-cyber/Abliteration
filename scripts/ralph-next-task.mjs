#!/usr/bin/env node
/**
 * Pick the next development task from the Ralph backlog.
 *
 *   npm run ralph:next
 *   npm run ralph:next -- --complete dev-001
 *   npm run ralph:next -- --list
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const backlogPath = join(root, 'data', 'ralph-backlog.json');
const handoffPath = join(root, 'data', 'ralph-agent-handoff.md');

const args = process.argv.slice(2);

function stamp() {
  return new Date().toISOString();
}

function loadBacklog() {
  if (!existsSync(backlogPath)) {
    console.error(`Missing ${backlogPath}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(backlogPath, 'utf8'));
}

function saveBacklog(backlog) {
  backlog.updated_at = stamp();
  writeFileSync(backlogPath, JSON.stringify(backlog, null, 2) + '\n');
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => a.priority - b.priority);
}

function nextPending(tasks) {
  return sortTasks(tasks).find((t) => t.status === 'pending' || t.status === 'in_progress');
}

function writeHandoff(backlog, task) {
  const pending = sortTasks(backlog.tasks).filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const lines = [
    '# Ralph agent handoff',
    '',
    `Updated: ${stamp()}`,
    '',
    '## Current task',
    '',
  ];

  if (task) {
    lines.push(
      `**${task.id}** — ${task.title}`,
      '',
      `Status: \`${task.status}\``,
      `Priority: ${task.priority}`,
      '',
      '### Files',
      ...task.files.map((f) => `- \`${f}\``),
      '',
      '### Acceptance',
      task.acceptance,
      '',
    );
  } else {
    lines.push('_No pending tasks — add items to `data/ralph-backlog.json`._', '');
  }

  lines.push('## Workflow', '', '```text', '1. npm run ralph:next', '2. Implement the current task', '3. npm run ralph', '4. npm run ralph:next -- --complete <id>', '5. If more tasks pending → goto 1 (do NOT stop)', '6. npm run ralph:turn-end -- --message "summary"', '```', '');

  if (pending.length > 1) {
    lines.push('## Queue', '');
    for (const t of pending) {
      const mark = t.id === task?.id ? '→' : ' ';
      lines.push(`${mark} **${t.id}** [${t.status}] ${t.title}`);
    }
    lines.push('');
  }

  writeFileSync(handoffPath, lines.join('\n'));
}

function completeTask(backlog, id) {
  const task = backlog.tasks.find((t) => t.id === id);
  if (!task) {
    console.error(`Unknown task id: ${id}`);
    process.exit(1);
  }
  task.status = 'done';
  task.completed_at = stamp();
  saveBacklog(backlog);
  console.log(`✓ Completed ${id}: ${task.title}`);
  return nextPending(backlog.tasks);
}

function main() {
  const backlog = loadBacklog();

  const completeIdx = args.indexOf('--complete');
  if (completeIdx >= 0) {
    const id = args[completeIdx + 1];
    if (!id) {
      console.error('Usage: ralph:next -- --complete <task-id>');
      process.exit(1);
    }
    const next = completeTask(backlog, id);
    writeHandoff(backlog, next);
    if (next) {
      console.log(`\nNext task: ${next.id} — ${next.title}`);
    } else {
      console.log('\nBacklog clear — add new tasks to data/ralph-backlog.json');
    }
    process.exit(0);
  }

  if (args.includes('--list')) {
    for (const t of sortTasks(backlog.tasks)) {
      console.log(`[${t.status.padEnd(11)}] ${t.id}  ${t.title}`);
    }
    process.exit(0);
  }

  const task = nextPending(backlog.tasks);
  if (!task) {
    writeHandoff(backlog, null);
    console.log('Backlog clear — no pending development tasks.');
    process.exit(0);
  }

  if (task.status === 'pending') {
    task.status = 'in_progress';
    task.started_at = stamp();
    saveBacklog(backlog);
  }

  writeHandoff(backlog, task);

  console.log(`\n═══ Ralph next task ═══\n`);
  console.log(`ID:       ${task.id}`);
  console.log(`Title:    ${task.title}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Files:    ${task.files.join(', ')}`);
  console.log(`Accept:   ${task.acceptance}`);
  console.log(`\nHandoff → ${handoffPath}`);
  console.log(`\nImplement this task before ending your turn. Do NOT stop if more tasks are pending.`);
}

main();