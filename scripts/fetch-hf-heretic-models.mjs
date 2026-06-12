#!/usr/bin/env node
/**
 * Fetch Hugging Face models tagged `heretic` via Playwright (bypasses bot blocks on raw curl).
 * Writes data/heretic-models-hf-snapshot.json and merges data/heretic-models-registry.jsonl
 */
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });

const useFirefox = process.argv.includes('--firefox');
const maxPages = Number(process.env.HF_MAX_PAGES || '40');
const limit = Number(process.env.HF_PAGE_SIZE || '100');

const REGISTRY_PATH = join(dataDir, 'heretic-models-registry.jsonl');
const SNAPSHOT_PATH = join(dataDir, 'heretic-models-hf-snapshot.json');
const SEED_PATH = join(dataDir, 'heretic-models-registry.seed.jsonl');

const HF_LIST_URL = 'https://huggingface.co/models?other=heretic&sort=downloads&full=true';

async function fetchPageViaBrowser(page, url) {
  return page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }, url);
}

function parseLinkCursor(linkHeader) {
  if (!linkHeader) return null;
  const m = linkHeader.match(/cursor=([^&>]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchAllModels(page) {
  const all = [];
  let cursor = null;
  let pageNum = 0;

  while (pageNum < maxPages) {
    const apiUrl = cursor
      ? `https://huggingface.co/api/models?other=heretic&limit=${limit}&cursor=${encodeURIComponent(cursor)}&full=true`
      : `https://huggingface.co/api/models?other=heretic&limit=${limit}&full=true`;

    const batch = await page.evaluate(async (u) => {
      const r = await fetch(u, { credentials: 'include' });
      const link = r.headers.get('link');
      const data = await r.json();
      return { data, link };
    }, apiUrl);

    const rows = Array.isArray(batch.data) ? batch.data : [];
    if (rows.length === 0) break;
    all.push(...rows);
    console.log(`  API page ${pageNum + 1}: +${rows.length} (total ${all.length})`);

    const next = parseLinkCursor(batch.link);
    if (!next || rows.length < limit) break;
    cursor = next;
    pageNum += 1;
  }

  return all;
}

const ABLITERATION_TAGS = new Set(['heretic', 'abliterated', 'decensored']);

function isHereticRelated(m) {
  const id = m.id || m.modelId || '';
  const tags = m.tags || [];
  if (tags.some((t) => ABLITERATION_TAGS.has(t))) return true;
  if (/\b(heretic|abliterat)/i.test(id)) return true;
  const base = m.config?.base_model || m.cardData?.base_model || '';
  if (/\b(heretic|abliterat)/i.test(base)) return true;
  return false;
}

function normalizeRow(m, fetchedAt) {
  const tags = m.tags || [];
  const openWeights = !tags.includes('gated') && !tags.includes('private');
  const hereticTag = tags.includes('heretic');
  const abliteratedTag = tags.includes('abliterated');
  return {
    model_id: m.id || m.modelId,
    author: (m.id || '').split('/')[0] || null,
    base_model: m.config?.base_model || m.cardData?.base_model || null,
    pipeline_tag: m.pipeline_tag || null,
    library_name: m.library_name || null,
    downloads: m.downloads ?? null,
    likes: m.likes ?? null,
    tags,
    open_weights: openWeights,
    gated: tags.includes('gated'),
    source: 'huggingface',
    heretic_tag: hereticTag,
    abliterated_tag: abliteratedTag,
    status: hereticTag ? 'published_heretic' : abliteratedTag ? 'community_abliterated' : 'published_hf',
    attempted_by: (m.id || '').split('/')[0] || 'community',
    url: `https://huggingface.co/${m.id}`,
    fetched_at: fetchedAt,
  };
}

function loadSeedRows() {
  try {
    const text = readFileSync(SEED_PATH, 'utf8');
    return text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function loadExistingRegistry() {
  try {
    const text = readFileSync(REGISTRY_PATH, 'utf8');
    return text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function mergeRegistry(seed, hfRows, existing) {
  const byId = new Map();
  // Drop prior HF scrape rows so re-fetch does not accumulate API noise.
  for (const row of existing) {
    if (row.source === 'huggingface' && row.fetched_at) continue;
    byId.set(row.model_id, row);
  }
  for (const row of seed) {
    const prev = byId.get(row.model_id) || {};
    byId.set(row.model_id, { ...prev, ...row, seed: true });
  }
  for (const row of hfRows) {
    const prev = byId.get(row.model_id) || {};
    byId.set(row.model_id, {
      ...prev,
      ...row,
      handbook_notes: prev.handbook_notes || row.handbook_notes || null,
      attempted_by: prev.attempted_by && prev.attempted_by !== 'community' ? prev.attempted_by : row.attempted_by,
      status: prev.status && prev.status.startsWith('handbook') ? prev.status : row.status,
      vram_profile: prev.vram_profile || null,
    });
  }
  return [...byId.values()].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

async function launchBrowser(chromium, firefox) {
  const tryLaunch = async (name, launcher) => {
    const browser = await launcher.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1400, height: 900 },
      locale: 'en-US',
    });
    const page = await context.newPage();
    console.log(`Browser: ${name}`);
    console.log(`Warming session: ${HF_LIST_URL}`);
    await page.goto(HF_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(2000);
    return { browser, page, browserName: name };
  };

  if (useFirefox) return tryLaunch('firefox', firefox);
  try {
    return await tryLaunch('chromium', chromium);
  } catch (err) {
    console.warn(`Chromium failed (${err.message}) — retrying with Firefox…`);
    return tryLaunch('firefox', firefox);
  }
}

async function main() {
  const { chromium, firefox } = await import('playwright');
  const { browser, page, browserName } = await launchBrowser(chromium, firefox);
  const fetchedAt = new Date().toISOString();

  console.log('Fetching via in-page HF API…');
  const raw = await fetchAllModels(page);
  await browser.close();

  const related = raw.filter(isHereticRelated);
  console.log(`Filtered ${related.length} heretic/abliterated models from ${raw.length} API rows`);
  const hfRows = related.map((m) => normalizeRow(m, fetchedAt));
  const snapshot = {
    fetched_at: fetchedAt,
    browser: browserName,
    list_url: HF_LIST_URL,
    api_rows_fetched: raw.length,
    count: hfRows.length,
    open_weights_count: hfRows.filter((r) => r.open_weights).length,
    heretic_tag_count: hfRows.filter((r) => r.heretic_tag).length,
    models: hfRows,
  };
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');

  const seed = loadSeedRows();
  const existing = loadExistingRegistry();
  const merged = mergeRegistry(seed, hfRows, existing);
  const jsonl = merged.map((r) => JSON.stringify(r)).join('\n') + '\n';
  writeFileSync(REGISTRY_PATH, jsonl);

  console.log(`\nWrote ${hfRows.length} HF models → ${SNAPSHOT_PATH}`);
  console.log(`Registry: ${merged.length} rows → ${REGISTRY_PATH}`);
  console.log(`Open weights: ${snapshot.open_weights_count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});