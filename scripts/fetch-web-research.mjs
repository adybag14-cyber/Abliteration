#!/usr/bin/env node
/**
 * Supplemental web research fetcher — DuckDuckGo HTML lite + arXiv abstract pages.
 * Use when static GitHub raw URLs miss community forks, papers, or toolkit updates.
 *
 *   npm run fetch:web-research
 *   npm run fetch:web-research -- --firefox
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'sources', 'fetched');
mkdirSync(outDir, { recursive: true });

const useFirefox = process.argv.includes('--firefox');
const browserType = useFirefox ? 'firefox' : 'chromium';

/** Curated queries — expand when handbook adds new tool families */
const SEARCH_QUERIES = [
  { id: 'search-abliteration-heretic', q: 'LLM abliteration heretic optuna refusal direction 2025 2026' },
  { id: 'search-abliterix', q: 'abliterix wuwangzhang heretic MoE abliteration' },
  { id: 'search-erisforge-deccp', q: 'ErisForge DECCP llm abliteration GSM8K capability' },
  { id: 'search-comparative-benchmark', q: 'arXiv 2512.13655 comparative abliteration methods' },
  { id: 'search-circuit-breakers', q: 'GraySwan circuit breakers LLM safety training' },
  { id: 'search-gemma4-abliterated', q: 'Gemma 4 abliterated tool calling heretic' },
  { id: 'search-projected-abliteration', q: 'projected norm preserving abliteration grimjim' },
  { id: 'search-multi-direction-refusal', q: 'QCRI refusal more than single direction 2602.02132' },
];

/** Direct pages not covered by fetch-docs.mjs raw targets */
const DIRECT_PAGES = [
  { id: 'arxiv-2512-13655', url: 'https://arxiv.org/abs/2512.13655', kind: 'page' },
  { id: 'arxiv-2602-02132', url: 'https://arxiv.org/abs/2602.02132', kind: 'page' },
  { id: 'arxiv-2502-17420', url: 'https://arxiv.org/abs/2502.17420', kind: 'page' },
  { id: 'heretic-mintlify-concepts', url: 'https://p-e-w-heretic.mintlify.app/concepts/abliteration', kind: 'page' },
  { id: 'huggingface-heretic-models', url: 'https://huggingface.co/models?other=heretic', kind: 'page' },
  { id: 'abliteration-ai-index', url: 'https://docs.abliteration.ai/', kind: 'page' },
];

async function fetchRaw(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'abliteration-web-research/1.0',
      Accept: 'text/html,application/xhtml+xml,text/plain,*/*',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function extractDdgSnippets(html) {
  const snippets = [];
  const resultRe = /<a[^>]+class="result__a"[^>]*>([^<]*)<\/a>/gi;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const titles = [...html.matchAll(resultRe)].map((m) => m[1].trim());
  const bodies = [...html.matchAll(snippetRe)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  for (let i = 0; i < Math.min(titles.length, 12); i++) {
    snippets.push({ title: titles[i], snippet: bodies[i] || '' });
  }
  return snippets;
}

async function main() {
  const { chromium, firefox } = await import('playwright');
  const launcher = useFirefox ? firefox : chromium;
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
  });
  const page = await context.newPage();
  const manifest = [];
  const stamp = new Date().toISOString();

  for (const sq of SEARCH_QUERIES) {
    const out = join(outDir, `${sq.id}.txt`);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(sq.q)}`;
    try {
      let html;
      try {
        html = await fetchRaw(url);
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        html = await page.content();
      }
      const hits = extractDdgSnippets(html);
      const body =
        `# fetched: ${stamp}\n# query: ${sq.q}\n# url: ${url}\n# browser: ${browserType}\n# hits: ${hits.length}\n\n` +
        hits.map((h, i) => `${i + 1}. ${h.title}\n   ${h.snippet}`).join('\n\n');
      writeFileSync(out, body.slice(0, 80000), 'utf8');
      manifest.push({ ...sq, url, ok: true, hits: hits.length, out });
      console.log(`OK  ${sq.id} (${hits.length} hits)`);
      await page.waitForTimeout(1200);
    } catch (err) {
      manifest.push({ ...sq, ok: false, error: String(err) });
      console.error(`FAIL ${sq.id}: ${err}`);
    }
  }

  for (const t of DIRECT_PAGES) {
    const out = join(outDir, `${t.id}.txt`);
    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(1500);
      const body = await page.locator('body').innerText();
      const header = `# fetched: ${stamp}\n# url: ${t.url}\n# browser: ${browserType}\n\n`;
      writeFileSync(out, header + body.slice(0, 120000), 'utf8');
      manifest.push({ ...t, ok: true, bytes: body.length, out });
      console.log(`OK  ${t.id} (${body.length} bytes)`);
    } catch (err) {
      manifest.push({ ...t, ok: false, error: String(err) });
      console.error(`FAIL ${t.id}: ${err}`);
    }
  }

  writeFileSync(join(outDir, 'web-research-manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();
  const ok = manifest.filter((m) => m.ok).length;
  console.log(`\nWrote ${ok}/${manifest.length} web-research files to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});