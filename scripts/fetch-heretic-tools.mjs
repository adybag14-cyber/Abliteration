#!/usr/bin/env node
/**
 * Sync immutable Heretic reference files from GitHub raw (master).
 * Updates sources/heretic-tools/UPSTREAM.json with sha256 + timestamp.
 */
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'sources', 'heretic-tools');
mkdirSync(outDir, { recursive: true });

const FILES = [
  {
    key: 'config.default.toml',
    url: 'https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml',
    local: 'config.default.toml',
  },
  {
    key: 'pyproject.toml.reference',
    url: 'https://raw.githubusercontent.com/p-e-w/heretic/master/pyproject.toml',
    local: 'pyproject.toml.reference',
  },
  {
    key: 'uv.lock.reference',
    url: 'https://raw.githubusercontent.com/p-e-w/heretic/master/uv.lock',
    local: 'uv.lock.reference',
  },
];

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'abliteration-heretic-sync/1.0 (+github.com/adybag14-cyber/Abliteration)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function main() {
  const upstreamPath = join(outDir, 'UPSTREAM.json');
  let upstream = JSON.parse(readFileSync(upstreamPath, 'utf8'));
  const stamp = new Date().toISOString();
  upstream.synced_at = stamp;

  for (const f of FILES) {
    const body = await fetchText(f.url);
    const path = join(outDir, f.local);
    writeFileSync(path, body, 'utf8');
    const hash = sha256(body);
    upstream.pinned_files[f.key].sha256 = hash;
    upstream.pinned_files[f.key].bytes = body.length;
    upstream.pinned_files[f.key].synced_at = stamp;
    console.log(`OK  ${f.local} (${body.length} bytes) sha256=${hash.slice(0, 12)}…`);
  }

  writeFileSync(upstreamPath, JSON.stringify(upstream, null, 2) + '\n');
  console.log(`\nUpdated ${upstreamPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});