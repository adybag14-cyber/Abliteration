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
      if (['node_modules', '.git', 'sources/zig-canonical'].some((x) => p.includes(x))) continue;
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
    'sources/heretic-tools/UPSTREAM.json',
    'data/heretic-models-registry.seed.jsonl',
    'docs/toolchain-safetensors-gguf-lora.md',
    'scripts/ralph-validate.mjs',
    'scripts/ralph-loop.mjs',
    'scripts/ralph-turn-end.mjs',
    'scripts/ralph-autostart.mjs',
    'scripts/export-abliteration-lora.py',
    'scripts/fetch-heretic-tools.mjs',
    'scripts/fetch-hf-heretic-models.mjs',
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

function validatePythonScripts() {
  const scripts = [
    'scripts/export-abliteration-lora.py',
    'scripts/hardware-tool-gate.py',
    'scripts/validate-dataset.py',
    'scripts/check_env.py',
  ];
  for (const rel of scripts) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const r = spawnSync('python', ['-m', 'py_compile', p], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) err(`Python syntax error: ${rel} — ${r.stderr || r.stdout}`);
  }
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
  validatePackageScripts();
  validateUpstreamJson();

  const jsonl = validateJsonl(join(root, 'data'));
  console.log(`  jsonl: ${jsonl.files} files, ${jsonl.lines} lines`);

  validateEvalTxt();
  validatePythonScripts();

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