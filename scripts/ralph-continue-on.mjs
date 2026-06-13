#!/usr/bin/env node
/**
 * Enable Ralph turn continuations.
 *
 * Modes:
 *   npm run ralph:continue:on              # headless grok --max-turns (default)
 *   npm run ralph:continue:on -- --loop    # print /loop command for interactive TUI
 *   npm run ralph:continue:on -- --daemon    # validate daemon only (no agent turns)
 *
 * Headless mode spawns grok with --max-turns so the agent chains multiple turns
 * without waiting for you to type the next message.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dataDir = join(root, 'data');
const contPath = join(dataDir, 'ralph-continuation.json');
const pidPath = join(dataDir, '.ralph-continue.pid');
const logPath = join(dataDir, 'ralph-continue.log');
const promptPath = join(root, 'scripts', 'ralph-continue-prompt.txt');
const backlogPath = join(dataDir, 'ralph-backlog.json');

const args = process.argv.slice(2);
const loopMode = args.includes('--loop');
const daemonOnly = args.includes('--daemon');
const maxTurns = Number(process.env.RALPH_CONTINUE_MAX_TURNS || '12');

function stamp() {
  return new Date().toISOString();
}

function grokBin() {
  const candidates = [
    process.env.GROK_BIN,
    join(process.env.USERPROFILE || '', '.grok', 'bin', 'grok.exe'),
    'grok',
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.includes('/') || c.includes('\\')) {
      if (existsSync(c)) return c;
    } else {
      return c;
    }
  }
  return 'grok';
}

function seedBacklogIfEmpty() {
  if (!existsSync(backlogPath)) return;
  const backlog = JSON.parse(readFileSync(backlogPath, 'utf8'));
  const pending = (backlog.tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress');
  if (pending.length > 0) return;

  const nextId = Math.max(0, ...(backlog.tasks || []).map((t) => Number(String(t.id).replace('dev-', '')) || 0)) + 1;
  backlog.tasks.push(
    {
      id: `dev-${String(nextId).padStart(3, '0')}`,
      title: 'CyberGym eval runner script stub',
      status: 'pending',
      priority: nextId,
      files: ['scripts/cybergym-eval-stub.py', 'docs/use-cases/cybergym-benchmark.md'],
      acceptance: 'Stub script documents eval flow; benchmark doc links script',
    },
    {
      id: `dev-${String(nextId + 1).padStart(3, '0')}`,
      title: 'Thinking-model guide: link thinking-model.toml + eval gates',
      status: 'pending',
      priority: nextId + 1,
      files: ['instructions/thinking-models-guide.md'],
      acceptance: 'Guide references config.thinking-model.toml and eval-driven-workflow',
    },
    {
      id: `dev-${String(nextId + 2).padStart(3, '0')}`,
      title: 'Toolchain doc: abliterate.cpp WIP status table update',
      status: 'pending',
      priority: nextId + 2,
      files: ['docs/toolchain-safetensors-gguf-lora.md', 'methods/gguf-export-notes.md'],
      acceptance: 'Both docs have consistent abliterate.cpp status and links',
    },
  );
  backlog.updated_at = stamp();
  writeFileSync(backlogPath, JSON.stringify(backlog, null, 2) + '\n');
  console.log(`Seeded ${3} new backlog tasks (was empty)`);
}

function writeContinuation(mode) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    contPath,
    JSON.stringify(
      {
        enabled: true,
        mode,
        max_turns: maxTurns,
        started_at: stamp(),
        grok_bin: grokBin(),
        cwd: root,
      },
      null,
      2,
    ) + '\n',
  );
}

function printLoopCommand() {
  const prompt =
    'Ralph continue: read data/ralph-agent-handoff.md in abliteration repo, npm run ralph:next, implement task, npm run ralph, complete task, commit+push. Repeat until backlog clear.';
  console.log('\n═══ Interactive TUI: paste this in Grok ═══\n');
  console.log(`/loop 5m ${prompt}`);
  console.log('\nCancel later with scheduler_list / scheduler_delete, or Ctrl+B tasks pane.\n');
}

function spawnHeadless() {
  const grok = grokBin();
  const grokArgs = [
    '--prompt-file',
    promptPath,
    '--cwd',
    root,
    '--max-turns',
    String(maxTurns),
    '--yolo',
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'plain',
  ];

  console.log(`Spawning headless continuation: ${grok} --max-turns ${maxTurns}`);
  appendFileSync(logPath, `\n[${stamp()}] START ${grok} ${grokArgs.slice(0, 2).join(' ')} ...\n`);

  const child = spawn(grok, grokArgs, {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout?.on('data', (d) => appendFileSync(logPath, d));
  child.stderr?.on('data', (d) => appendFileSync(logPath, d));
  child.unref();

  writeFileSync(pidPath, String(child.pid) + '\n');
  console.log(`Headless Ralph running (pid ${child.pid})`);
  console.log(`Log: ${logPath}`);
  return child.pid;
}

function main() {
  seedBacklogIfEmpty();

  if (loopMode) {
    writeContinuation('loop');
    printLoopCommand();
    process.exit(0);
  }

  if (daemonOnly) {
    writeContinuation('daemon');
    spawn(process.execPath, [join(root, 'scripts', 'ralph-autostart.mjs')], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
    console.log('Validate daemon only — does NOT spawn agent turns.');
    console.log('For real turn continuations use: npm run ralph:continue:on');
    process.exit(0);
  }

  writeContinuation('headless');
  spawnHeadless();
  console.log('\nTurn continuations ON (headless multi-turn).');
  console.log('Stop: npm run ralph:continue:off');
  console.log('Status: npm run ralph:continue:status');
}

main();