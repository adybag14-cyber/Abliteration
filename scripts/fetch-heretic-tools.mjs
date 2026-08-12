#!/usr/bin/env node
/**
 * Sync immutable Heretic reference files from the pinned GitHub *tag*.
 * Default pin: v1.4.0 (PyPI heretic-llm 1.4.0, 2026-06-14).
 *
 * Never fetch master/main silently. Post-1.4.0 master uses the plugin
 * scorer schema ([scorer.KeywordRate] keyword_markers, …) which breaks
 * handbook factory/thinking profiles (1.3/1.4 classic keys still work
 * on 1.4.0). Override only with HERETIC_GIT_REF=<tag>, never master.
 */
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'sources', 'heretic-tools');
mkdirSync(outDir, { recursive: true });

const REPO = 'p-e-w/heretic';
const PINNED_TAG = process.env.HERETIC_GIT_REF || 'v1.4.0';
const PINNED_PYPI = '1.4.0';

function assertPinnedRef(ref) {
  const normalized = String(ref)
    .trim()
    .replace(/^refs\/(heads|tags)\//i, '')
    .toLowerCase();
  if (['master', 'main', 'head', 'origin/master', 'origin/main'].includes(normalized)) {
    throw new Error(
      `Refusing to fetch Heretic ${ref}. Pin a release tag (default v1.4.0). ` +
        'Post-1.4.0 master uses plugin scorer schema incompatible with handbook profiles.',
    );
  }
}

assertPinnedRef(PINNED_TAG);

const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${PINNED_TAG}`;

const FILES = [
  {
    key: 'config.default.toml',
    url: `${RAW_BASE}/config.default.toml`,
    local: 'config.default.toml',
  },
  {
    key: 'pyproject.toml.reference',
    url: `${RAW_BASE}/pyproject.toml`,
    local: 'pyproject.toml.reference',
  },
  {
    key: 'uv.lock.reference',
    url: `${RAW_BASE}/uv.lock`,
    local: 'uv.lock.reference',
  },
  {
    key: 'config.noslop.toml',
    url: `${RAW_BASE}/config.noslop.toml`,
    local: 'config.noslop.toml',
  },
  {
    key: 'config.nohumor.toml',
    url: `${RAW_BASE}/config.nohumor.toml`,
    local: 'config.nohumor.toml',
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

function applyPinMetadata(upstream, stamp) {
  upstream.project = 'heretic';
  upstream.primary_repo = `https://github.com/${REPO}`;
  upstream.mirror_repo = 'https://codeberg.org/p-e-w/heretic';
  upstream.pypi_package = 'heretic-llm';
  upstream.pypi_version = PINNED_PYPI;
  upstream.pinned_git_ref = PINNED_TAG;
  upstream.pinned_tree = `https://github.com/${REPO}/tree/${PINNED_TAG}`;
  upstream.default_branch = 'master';
  upstream.synced_at = stamp;
  upstream.synced_by = 'scripts/fetch-heretic-tools.mjs';
  upstream.pin_notes =
    'Handbook pin is heretic-llm 1.4.0 / git tag v1.4.0. ' +
    'Do not fetch master: post-1.4.0 master uses plugin scorer schema ' +
    '([scorer.KeywordRate] keyword_markers) which breaks handbook factory/thinking profiles. ' +
    'Classic 1.3/1.4 keys still work on PyPI 1.4.0. Live docs: https://heretic-project.org/tutorial';
  upstream.install = {
    pip: `pip install heretic-llm==${PINNED_PYPI} bitsandbytes accelerate`,
    uv:
      `git clone --branch ${PINNED_TAG} https://github.com/${REPO}.git && ` +
      'cd heretic && uv run heretic --help',
  };
  return upstream;
}

async function main() {
  console.log(`Pin: heretic ${PINNED_TAG} (PyPI heretic-llm==${PINNED_PYPI})`);
  console.log(`Refusing silent master. Override only via HERETIC_GIT_REF=<tag>.\n`);

  const upstreamPath = join(outDir, 'UPSTREAM.json');
  let upstream = JSON.parse(readFileSync(upstreamPath, 'utf8'));
  const stamp = new Date().toISOString();
  applyPinMetadata(upstream, stamp);

  for (const f of FILES) {
    const body = await fetchText(f.url);
    const path = join(outDir, f.local);
    writeFileSync(path, body, 'utf8');
    const hash = sha256(body);
    upstream.pinned_files[f.key] = {
      url: f.url,
      local: `sources/heretic-tools/${f.local}`,
      sha256: hash,
      bytes: body.length,
      synced_at: stamp,
      git_ref: PINNED_TAG,
    };
    console.log(`OK  ${f.local} (${body.length} bytes) sha256=${hash.slice(0, 12)}…`);
  }

  writeFileSync(upstreamPath, JSON.stringify(upstream, null, 2) + '\n');
  console.log(`\nUpdated ${upstreamPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
