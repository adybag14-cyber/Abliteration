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

function main() {
  const force = process.argv.includes('--force');
  const backlog = loadBacklog();
  const pending = pendingCount(backlog.tasks);

  if (pending > 0 && !force) {
    console.log(`Backlog has ${pending} active task(s) — skip seed (use --force to append)`);
    process.exit(0);
  }

  const waveIdx = backlog.wave_index ?? 0;
  const wave = WAVES[waveIdx % WAVES.length];
  let id = nextId(backlog.tasks);
  const priority = id;

  for (const item of wave) {
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