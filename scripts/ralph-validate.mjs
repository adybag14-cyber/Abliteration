#!/usr/bin/env node
/**
 * Ralph Wiggum validation — check handbook integrity (links, data, scripts, pins).
 * Exit 0 = all pass. Exit 1 = errors printed.
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function walkMd(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const norm = p.replace(/\\/g, '/');
      if (['node_modules', '.git', 'sources/zig-canonical', 'cxx/dist', 'cxx/build', 'cxx/ci-build'].some((x) => norm.includes(x))) continue;
      walkMd(p, out);
    } else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function validateMarkdownLinks() {
  const mdFiles = walkMd(root);
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let broken = 0;
  for (const file of mdFiles) {
    const text = readFileSync(file, 'utf8');
    const dir = dirname(file);
    let m;
    while ((m = linkRe.exec(text))) {
      let target = m[1].split('#')[0].trim();
      if (!target || target.startsWith('http') || target.startsWith('mailto:')) continue;
      const resolved = target.startsWith('/')
        ? join(root, target.slice(1))
        : resolve(dir, target);
      if (!existsSync(resolved)) {
        err(`broken link: ${file.replace(root + '\\', '').replace(root + '/', '')} -> ${m[1]}`);
        broken++;
      }
    }
  }
  return { mdFiles: mdFiles.length, broken };
}

function validateJsonl(dir) {
  let files = 0;
  let lines = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const sub = validateJsonl(p);
      files += sub.files;
      lines += sub.lines;
      continue;
    }
    if (!e.name.endsWith('.jsonl')) continue;
    files++;
    const text = readFileSync(p, 'utf8').trim();
    if (!text) continue;
    for (const [i, line] of text.split('\n').entries()) {
      lines++;
      try {
        JSON.parse(line);
      } catch {
        err(`invalid JSONL ${p}:${i + 1}`);
      }
    }
  }
  return { files, lines };
}

function validateRequiredFiles() {
  const required = [
    'README.md',
    'package.json',
    'sources/heretic-tools/config.default.toml',
    'sources/heretic-tools/config.low-vram.toml',
    'sources/heretic-tools/config.production.toml',
    'sources/heretic-tools/config.thinking-model.toml',
    'sources/heretic-tools/config.factory-qa.toml',
    'sources/heretic-tools/config.noslop.toml',
    'sources/heretic-tools/config.nohumor.toml',
    'sources/heretic-tools/UPSTREAM.json',
    'data/heretic-models-registry.seed.jsonl',
    'docs/toolchain-safetensors-gguf-lora.md',
    'docs/complete-curriculum.md',
    'docs/setup-encyclopedia.md',
    'docs/bleeding-edge.md',
    'docs/cxx26-platform.md',
    'docs/cxx26-researcher-guide.md',
    'docs/paper-term-map.md',
    'cxx/GETTING-STARTED.md',
    'cxx/examples/tiny-bad.txt',
    'cxx/CMakeLists.txt',
    'cxx/src/main.cpp',
    'cxx/include/abliteration/ops.hpp',
    '.github/workflows/cxx26-platform.yml',
    'scripts/package-cxx.mjs',
    'scripts/smoke-cxx-package.mjs',
    'instructions/method-cookbook.md',
    'scripts/ralph-validate.mjs',
    'scripts/ralph-loop.mjs',
    'scripts/ralph-turn-end.mjs',
    'scripts/ralph-autostart.mjs',
    'scripts/ralph-next-task.mjs',
    'scripts/count-eval-prompts.mjs',
    'data/ralph-backlog.json',
    'docs/agent-development-loop.md',
    'docs/ralph-turn-continuation.md',
    'scripts/ralph-continue-on.mjs',
    'scripts/ralph-seed-backlog.mjs',
    'scripts/ralph-monitor.mjs',
    'scripts/ralph-regress.mjs',
    'scripts/puppeteer-live-audit.mjs',
    'AGENTS.md',
    'scripts/export-abliteration-lora.py',
    'scripts/fetch-heretic-tools.mjs',
    'scripts/fetch-hf-heretic-models.mjs',
    'scripts/prepare-contrast-set.py',
    'scripts/compare-abliteration-evals.py',
    'scripts/experiment-manifest.py',
    'scripts/test-advanced-tools.py',
    'methods/contrast-set-design.md',
    'methods/direction-diagnostics-and-localization.md',
    'methods/protected-subspace-abliteration.md',
    'techniques/advanced-experimental-methods.md',
    'docs/experiment-provenance.md',
    '.grok/skills/ralph-loop/SKILL.md',
    '.grok/skills/abliteration-experiment/SKILL.md',
    '.grok/skills/handbook-research-refresh/SKILL.md',
    'index.html',
    'vite.config.ts',
    'components.json',
    'src/App.tsx',
    'src/index.css',
    'src/App.test.tsx',
    '.github/workflows/pages.yml',
    '.github/workflows/guide-ci.yml',
    'public/.nojekyll',
    'public/favicon.svg',
  ];
  for (const rel of required) {
    if (!existsSync(join(root, rel))) err(`missing required file: ${rel}`);
  }
}

function validatePackageScripts() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
    const matches = [...cmd.matchAll(/node\s+(\S+\.mjs)/g)];
    for (const m of matches) {
      const scriptPath = join(root, m[1].replace(/\//g, '\\'));
      const alt = join(root, m[1]);
      if (!existsSync(scriptPath) && !existsSync(alt)) {
        err(`package.json script "${name}" references missing ${m[1]}`);
      }
    }
  }
}

function validateUpstreamJson() {
  const p = join(root, 'sources/heretic-tools/UPSTREAM.json');
  const u = JSON.parse(readFileSync(p, 'utf8'));
  if (!u.pinned_files) err('UPSTREAM.json missing pinned_files');
  for (const [key, meta] of Object.entries(u.pinned_files || {})) {
    const local = join(root, meta.local);
    if (!existsSync(local)) err(`UPSTREAM pin missing on disk: ${meta.local}`);
    if (!meta.sha256) warn(`UPSTREAM pin ${key} has no sha256 — run npm run fetch:heretic`);
  }
}

function validateCxx26Workflow() {
  const p = join(root, '.github/workflows/cxx26-platform.yml');
  if (!existsSync(p)) {
    err('missing C++26 workflow');
    return;
  }
  const y = readFileSync(p, 'utf8');
  const required = [
    'linux-x64-gcc15',
    'abliterate-cxx-${{ matrix.name }}',
    'SHA256SUMS',
    'smoke-cxx-package.mjs',
    'linux-x64-clang20',
    'linux-arm64-gcc15',
    'linux-arm64-clang20',
    'windows-x64-clang',
    'windows-x64-msvc',
    'windows-arm64-msvc',
    'macos-arm64-llvm',
    'macos-x64-llvm',
    'cplusplus=202400',
    'cxx-nightly',
    '-std=c++26',
  ];
  for (const token of required) {
    if (!y.includes(token)) err(`cxx26-platform.yml missing ${token}`);
  }
}

function validateCxxArchiveNames() {
  const stale = [
    'abliterate-cxx-windows-x64.tar.gz',
    'abliterate-cxx-linux-x64.tar.gz',
    'abliterate-cxx-macos-arm64.tar.gz',
    'abliterate-cxx-macos-x64.tar.gz',
  ];
  const files = [
    'docs/cxx26-researcher-guide.md',
    'cxx/GETTING-STARTED.md',
    'cxx/INSTALL.txt',
    'cxx/RELEASE-NOTES.md',
    'src/lib/utils.ts',
    'src/components/path-finder.tsx',
    'README.md',
  ];
  for (const rel of files) {
    const text = readFileSync(join(root, rel), 'utf8');
    for (const name of stale) {
      if (text.includes(name)) err(`${rel} still uses colliding archive name ${name}`);
    }
  }
  const guide = readFileSync(join(root, 'docs/cxx26-researcher-guide.md'), 'utf8');
  for (const need of ['windows-x64-msvc', 'linux-x64-gcc15', 'macos-arm64-llvm']) {
    if (!guide.includes(need)) err(`cxx26-researcher-guide.md missing ${need}`);
  }
}

function validatePythonScripts() {
  const scripts = [
    'scripts/export-abliteration-lora.py',
    'scripts/hardware-tool-gate.py',
    'scripts/validate-dataset.py',
    'scripts/check_env.py',
    'scripts/filter-jarvis-eval.py',
    'scripts/cybergym-eval-stub.py',
    'scripts/prepare-contrast-set.py',
    'scripts/compare-abliteration-evals.py',
    'scripts/experiment-manifest.py',
    'scripts/test-advanced-tools.py',
    'scripts/abliteration_math.py',
    'scripts/estimate-refusal-direction.py',
    'scripts/apply-weight-abliteration.py',
    'scripts/inference-hook-ablation.py',
    'scripts/eval-refusal-rate.py',
  ];
  for (const rel of scripts) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const r = spawnSync('python', ['-m', 'py_compile', p], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) err(`Python syntax error: ${rel} — ${r.stderr || r.stdout}`);
  }
}

function validateProjectSkills() {
  const skillsRoot = join(root, '.grok', 'skills');
  if (!existsSync(skillsRoot)) {
    err('missing .grok/skills');
    return;
  }
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(skillsRoot, entry.name, 'SKILL.md');
    const uiPath = join(skillsRoot, entry.name, 'agents', 'openai.yaml');
    if (!existsSync(skillPath)) {
      err(`skill ${entry.name} missing SKILL.md`);
      continue;
    }
    const text = readFileSync(skillPath, 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      err(`skill ${entry.name} has invalid frontmatter`);
      continue;
    }
    const keys = [...match[1].matchAll(/^([A-Za-z][A-Za-z0-9_-]*):/gm)].map((item) => item[1]);
    for (const required of ['name', 'description']) {
      if (!keys.includes(required)) err(`skill ${entry.name} missing frontmatter ${required}`);
    }
    for (const key of keys) {
      if (!['name', 'description'].includes(key)) err(`skill ${entry.name} unsupported frontmatter key ${key}`);
    }
    const declared = match[1].match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
    if (declared !== entry.name) err(`skill folder/name mismatch: ${entry.name} vs ${declared}`);
    if (!existsSync(uiPath)) {
      err(`skill ${entry.name} missing agents/openai.yaml`);
    } else {
      const ui = readFileSync(uiPath, 'utf8');
      for (const key of ['display_name:', 'short_description:', 'default_prompt:']) {
        if (!ui.includes(key)) err(`skill ${entry.name} UI metadata missing ${key}`);
      }
      if (!ui.includes(`$${entry.name}`)) err(`skill ${entry.name} default_prompt must mention $${entry.name}`);
    }
  }
}

function validateTechniqueIds() {
  const catalog = readFileSync(join(root, 'docs', 'advanced-techniques-catalog.md'), 'utf8');
  const ids = [...catalog.matchAll(/^\|\s*T(\d{2})\s*\|/gm)].map((match) => Number(match[1]));
  const unique = new Set(ids);
  if (ids.length !== unique.size) err('advanced technique catalog has duplicate T-IDs');
  const expected = Array.from({ length: ids.length }, (_, index) => index + 1);
  if (ids.some((value, index) => value !== expected[index])) {
    err(`advanced technique catalog IDs must be contiguous T01..T${String(ids.length).padStart(2, '0')}`);
  }
}

function readJsonlRows(rel) {
  const path = join(root, rel);
  return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function validateAdvancedExampleSchemas() {
  const contrast = readJsonlRows('data/examples/contrast-set.sample.jsonl');
  const labels = new Set();
  for (const [index, row] of contrast.entries()) {
    if (!row.id || !row.prompt || !row.category || !['bad', 'good'].includes(row.label)) {
      err(`contrast-set.sample.jsonl row ${index + 1} violates the advanced contrast schema`);
    }
    labels.add(row.label);
  }
  if (!labels.has('bad') || !labels.has('good')) err('contrast sample must include bad and good labels');

  const before = readJsonlRows('data/examples/eval-before.sample.jsonl');
  const after = readJsonlRows('data/examples/eval-after.sample.jsonl');
  const beforeIds = before.map((row) => row.id).sort();
  const afterIds = after.map((row) => row.id).sort();
  if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) err('paired eval samples must have identical IDs');
  for (const [name, rows] of [['before', before], ['after', after]]) {
    for (const [index, row] of rows.entries()) {
      if (!row.id || !['target_refusal', 'benign', 'capability'].includes(row.cohort) || typeof row.refused !== 'boolean') {
        err(`eval-${name}.sample.jsonl row ${index + 1} violates the paired eval schema`);
      }
    }
  }
}

function validateAdvancedToolTests() {
  const result = spawnSync('python', ['scripts/test-advanced-tools.py'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) err(`advanced tool regression tests failed — ${result.stderr || result.stdout}`);
}

function validateEvalTxt() {
  for (const f of ['factory-bad-prompts.txt', 'factory-good-prompts.txt']) {
    const p = join(root, 'data/eval', f);
    if (!existsSync(p)) err(`missing ${p}`);
    else {
      const lines = readFileSync(p, 'utf8').trim().split('\n').filter(Boolean);
      if (lines.length < 5) warn(`${f} has only ${lines.length} lines`);
    }
  }
}

function main() {
  console.log('Ralph validate — abliteration handbook\n');

  const links = validateMarkdownLinks();
  console.log(`  markdown: ${links.mdFiles} files, ${links.broken} broken links`);

  validateRequiredFiles();
  validateCxx26Workflow();
  validateCxxArchiveNames();
  validatePackageScripts();
  validateUpstreamJson();
  validateProjectSkills();
  validateTechniqueIds();
  validateAdvancedExampleSchemas();

  const jsonl = validateJsonl(join(root, 'data'));
  console.log(`  jsonl: ${jsonl.files} files, ${jsonl.lines} lines`);

  validateEvalTxt();
  validatePythonScripts();
  validateAdvancedToolTests();

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }

  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log('\n✓ Ralph validate PASSED — no errors');
  process.exit(0);
}

main();
