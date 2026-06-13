#!/usr/bin/env node
/**
 * Seed Ralph backlog when empty — rotating improvement waves for the handbook.
 *
 *   npm run ralph:seed
 *   npm run ralph:seed -- --force   # append wave even if tasks pending
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const backlogPath = join(root, 'data', 'ralph-backlog.json');

const WAVES = [
  [
    {
      title: 'eval-driven-workflow: corpus table with eval:stats counts + npm scripts',
      files: ['instructions/eval-driven-workflow.md'],
      acceptance: 'Table lists jarvis-safe, cybergym-subset, eval:stats command',
    },
    {
      title: 'package.json: eval:cybergym script for cybergym-eval-stub.py',
      files: ['package.json', 'docs/use-cases/cybergym-benchmark.md'],
      acceptance: 'npm run eval:cybergym -- --print-flow works',
    },
    {
      title: 'low-vram guide: link config.low-vram.toml + projected abliteration technique',
      files: ['instructions/low-vram-abliteration.md', 'techniques/projected-norm-preserving-abliteration.md'],
      acceptance: 'Cross-links between low-vram guide and projected technique doc',
    },
    {
      title: 'factory-firmware-qa use-case: eval-driven-workflow + hardware eval JSONL',
      files: ['docs/use-cases/factory-firmware-qa.md'],
      acceptance: 'Links eval-driven-workflow and hardware-factory-prompts.jsonl',
    },
  ],
  [
    {
      title: 'pentest-cyber-analysis: OSINT eval corpus + osint-pentest-prompts.jsonl',
      files: ['docs/use-cases/pentest-cyber-analysis.md', 'docs/evaluation.md'],
      acceptance: 'Pentest use-case links osint eval and tools/README',
    },
    {
      title: 'model-family-guide: Heretic config profiles table',
      files: ['instructions/model-family-guide.md', 'docs/tools/heretic-tools-reference.md'],
      acceptance: 'Guide table maps Qwen/Gemma/Llama to config profiles',
    },
    {
      title: 'advanced-abliteration-workflow: LoRA export + toolchain cross-links',
      files: ['instructions/advanced-abliteration-workflow.md', 'docs/toolchain-safetensors-gguf-lora.md'],
      acceptance: 'Workflow links export-abliteration-lora.py and toolchain doc',
    },
    {
      title: 'comparative benchmarks: DECCP/ErisForge install one-liners in references.md',
      files: ['docs/comparative-abliteration-benchmarks.md', 'references.md'],
      acceptance: 'references.md has install/run pointers for alternative tools',
    },
  ],
  [
    {
      title: 'troubleshooting-encyclopedia: thinking-model + low-vram symptom rows',
      files: ['instructions/troubleshooting-encyclopedia.md'],
      acceptance: 'New rows for CoT skip misconfig and 8GB OOM',
    },
    {
      title: 'hardware-command-catalog: link platform-eval-sample.jsonl',
      files: ['docs/hardware-command-catalog.md', 'data/eval/platform-eval-sample.jsonl'],
      acceptance: 'Catalog references platform eval sample for agent testing',
    },
    {
      title: 'context7.md: refresh abliteration + Heretic library IDs if stale',
      files: ['docs/context7.md'],
      acceptance: 'Context7 section lists heretic-llm and llm-abliteration lookup hints',
    },
    {
      title: 'ralph-loop.md: link ralph-turn-continuation + ralph:seed + ralph:monitor',
      files: ['docs/ralph-loop.md', 'package.json'],
      acceptance: 'Docs list seed and monitor npm scripts',
    },
  ],
  [
    {
      title: 'agent-development-loop: document ralph:regress pre-commit gate',
      files: ['docs/agent-development-loop.md', 'scripts/ralph-regress.mjs'],
      acceptance: 'Playbook lists npm run ralph:regress before commit when watch/headless touched files',
    },
    {
      title: 'ralph-turn-continuation: regress gate + seed dedupe behavior',
      files: ['docs/ralph-turn-continuation.md'],
      acceptance: 'Doc explains regress on backlog clear and seed skips done task titles',
    },
    {
      title: 'evaluation.md: xstest-overrefusal + zig-security corpus rows',
      files: ['docs/evaluation.md', 'scripts/count-eval-prompts.mjs'],
      acceptance: 'Corpus table documents xstest-overrefusal-sample and zig-security-prompts jsonl',
    },
    {
      title: 'beginner guide: hardware-tool-gate.py + platform eval sample',
      files: ['instructions/beginner-local-model-guide.md', 'scripts/hardware-tool-gate.py'],
      acceptance: 'Guide mentions hardware gate script and platform-eval-sample.jsonl',
    },
  ],
  [
    {
      title: 'README: add ralph:regress + ralph:monitor to quick commands',
      files: ['README.md', 'package.json'],
      acceptance: 'README lists regress and monitor npm scripts with one-line descriptions',
    },
    {
      title: 'ralph-loop.md: document ralph:regress gate and when to run it',
      files: ['docs/ralph-loop.md'],
      acceptance: 'ralph-loop.md has regress section matching agent-development-loop pre-commit rule',
    },
    {
      title: 'risks-and-ethics: link eval-driven-workflow + capability sanity gates',
      files: ['docs/risks-and-ethics.md', 'instructions/eval-driven-workflow.md'],
      acceptance: 'Ethics doc references eval workflow and post-abliteration capability checks',
    },
    {
      title: 'advanced-techniques-catalog: cross-link projected + MoE hybrid techniques',
      files: ['docs/advanced-techniques-catalog.md', 'techniques/moe-hybrid-abliteration.md'],
      acceptance: 'Catalog table rows link projected-norm-preserving and moe-hybrid docs',
    },
  ],
];

function stamp() {
  return new Date().toISOString();
}

function loadBacklog() {
  if (!existsSync(backlogPath)) {
    return { version: 1, updated_at: stamp(), tasks: [], wave_index: 0 };
  }
  return JSON.parse(readFileSync(backlogPath, 'utf8'));
}

function nextId(tasks) {
  const nums = (tasks || []).map((t) => Number(String(t.id).replace('dev-', '')) || 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

function pendingCount(tasks) {
  return (tasks || []).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
}

function main(depth = 0) {
  const force = process.argv.includes('--force');
  const backlog = loadBacklog();
  const pending = pendingCount(backlog.tasks);

  if (pending > 0 && !force) {
    console.log(`Backlog has ${pending} active task(s) — skip seed (use --force to append)`);
    process.exit(0);
  }

  if (depth >= WAVES.length) {
    console.log('All waves exhausted — nothing new to seed');
    process.exit(0);
  }

  const waveIdx = backlog.wave_index ?? 0;
  const wave = WAVES[waveIdx % WAVES.length];
  let id = nextId(backlog.tasks);
  const priority = id;

  const doneTitles = new Set(
    (backlog.tasks || []).filter((t) => t.status === 'done').map((t) => t.title),
  );

  for (const item of wave) {
    if (doneTitles.has(item.title)) continue;
    backlog.tasks.push({
      id: `dev-${String(id).padStart(3, '0')}`,
      title: item.title,
      status: 'pending',
      priority: id,
      files: item.files,
      acceptance: item.acceptance,
    });
    id++;
  }

  const added = backlog.tasks.filter((t) => t.status === 'pending').length - pending;
  if (added === 0) {
    backlog.wave_index = waveIdx + 1;
    backlog.updated_at = stamp();
    writeFileSync(backlogPath, JSON.stringify(backlog, null, 2) + '\n');
    console.log(`Wave ${waveIdx + 1} already done — advancing to next wave`);
    return main(depth + 1);
  }

  backlog.wave_index = waveIdx + 1;
  backlog.updated_at = stamp();
  backlog.last_seeded_at = stamp();
  writeFileSync(backlogPath, JSON.stringify(backlog, null, 2) + '\n');

  console.log(`Seeded wave ${waveIdx + 1} → ${wave.length} tasks (dev-${String(priority).padStart(3, '0')} …)`);
  for (const t of wave) {
    console.log(`  • ${t.title}`);
  }
}

main();