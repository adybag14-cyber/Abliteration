#!/usr/bin/env node
/**
 * Headless doc fetcher — GitHub raw READMEs + public docs sites.
 * Uses Playwright Chromium by default; pass --firefox to use Firefox.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'sources', 'fetched');
mkdirSync(outDir, { recursive: true });

const useFirefox = process.argv.includes('--firefox');
const browserType = useFirefox ? 'firefox' : 'chromium';

const TARGETS = [
  {
    id: 'heretic-readme',
    url: 'https://raw.githubusercontent.com/p-e-w/heretic/master/README.md',
    kind: 'raw',
  },
  {
    id: 'llm-abliteration-readme',
    url: 'https://raw.githubusercontent.com/jim-plus/llm-abliteration/main/README.md',
    kind: 'raw',
  },
  {
    id: 'refusal-direction-readme',
    url: 'https://raw.githubusercontent.com/andyrdt/refusal_direction/main/README.md',
    kind: 'raw',
  },
  {
    id: 'heretic-config',
    url: 'https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml',
    kind: 'raw',
  },
  {
    id: 'abliteration-llms-txt',
    url: 'https://docs.abliteration.ai/llms.txt',
    kind: 'raw',
  },
  {
    id: 'cybergym-arxiv',
    url: 'https://arxiv.org/abs/2506.02548',
    kind: 'page',
  },
  {
    id: 'openhands-readme',
    url: 'https://raw.githubusercontent.com/OpenHands/OpenHands/main/README.md',
    kind: 'raw',
  },
  {
    id: 'hashcat-readme',
    url: 'https://raw.githubusercontent.com/hashcat/hashcat/master/README.md',
    kind: 'raw',
  },
  {
    id: 'kali-metapackages',
    url: 'https://www.kali.org/docs/general-use/metapackages/',
    kind: 'page',
  },
  {
    id: 'zig-readme',
    url: 'https://raw.githubusercontent.com/ziglang/zig/master/README.md',
    kind: 'raw',
  },
  {
    id: 'zig-canonical-readme',
    url: 'https://raw.githubusercontent.com/adybag14-cyber/zig/master/README.md',
    kind: 'raw',
  },
  {
    id: 'zig-lang-reference',
    url: 'https://ziglang.org/documentation/master/',
    kind: 'page',
  },
  {
    id: 'heretic-github',
    url: 'https://github.com/p-e-w/heretic',
    kind: 'page',
  },
  {
    id: 'transformer-lens-readme',
    url: 'https://raw.githubusercontent.com/TransformerLensOrg/TransformerLens/main/README.md',
    kind: 'raw',
  },
  {
    id: 'abliteration-docs',
    url: 'https://docs.abliteration.ai/what-is-abliteration',
    kind: 'page',
  },
  {
    id: 'arxiv-2406-11717',
    url: 'https://arxiv.org/abs/2406.11717',
    kind: 'page',
  },
  // —— Extended toolkit & community forks ——
  {
    id: 'abliterix-readme',
    url: 'https://raw.githubusercontent.com/wuwangzhang1216/abliterix/main/README.md',
    kind: 'raw',
  },
  {
    id: 'erisforge-readme',
    url: 'https://raw.githubusercontent.com/Tsadoq/ErisForge/main/README.md',
    kind: 'raw',
  },
  {
    id: 'nous-llm-abliteration-readme',
    url: 'https://raw.githubusercontent.com/NousResearch/llm-abliteration/main/README.md',
    kind: 'raw',
  },
  {
    id: 'deccp-readme',
    url: 'https://raw.githubusercontent.com/AUGMXNT/deccp/main/README.md',
    kind: 'raw',
  },
  {
    id: 'failspy-abliterator-readme',
    url: 'https://raw.githubusercontent.com/FailSpy/abliterator/main/README.md',
    kind: 'raw',
  },
  {
    id: 'remove-refusals-readme',
    url: 'https://raw.githubusercontent.com/Sumandora/remove-refusals-with-transformers/main/README.md',
    kind: 'raw',
  },
  {
    id: 'circuit-breakers-readme',
    url: 'https://raw.githubusercontent.com/GraySwanAI/circuit-breakers/main/README.md',
    kind: 'raw',
  },
  {
    id: 'obliteratus-readme',
    url: 'https://raw.githubusercontent.com/elder-plinius/OBLITERATUS/main/README.md',
    kind: 'raw',
  },
  // —— Key papers (abstract pages) ——
  {
    id: 'arxiv-2512-13655',
    url: 'https://arxiv.org/abs/2512.13655',
    kind: 'page',
  },
  {
    id: 'arxiv-2602-02132',
    url: 'https://arxiv.org/abs/2602.02132',
    kind: 'page',
  },
  {
    id: 'arxiv-2502-17420',
    url: 'https://arxiv.org/abs/2502.17420',
    kind: 'page',
  },
  // —— Live docs & blogs ——
  {
    id: 'heretic-mintlify-abliteration',
    url: 'https://p-e-w-heretic.mintlify.app/concepts/abliteration',
    kind: 'page',
  },
  {
    id: 'grimjim-projected-blog',
    url: 'https://huggingface.co/blog/grimjim/projected-abliteration',
    kind: 'page',
  },
  {
    id: 'grimjim-normpreserve-blog',
    url: 'https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration',
    kind: 'page',
  },
  {
    id: 'abliteration-ai-index',
    url: 'https://docs.abliteration.ai/',
    kind: 'page',
  },
];

async function fetchRaw(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'abliteration-doc-fetcher/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
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

  for (const t of TARGETS) {
    const out = join(outDir, `${t.id}.txt`);
    const stamp = new Date().toISOString();
    try {
      let body;
      if (t.kind === 'raw') {
        try {
          body = await fetchRaw(t.url);
        } catch {
          await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          body = await page.locator('body').innerText();
        }
      } else {
        await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90000 });
        body = await page.locator('body').innerText();
      }
      const header = `# fetched: ${stamp}\n# url: ${t.url}\n# browser: ${browserType}\n\n`;
      writeFileSync(out, header + body.slice(0, 120000), 'utf8');
      manifest.push({ ...t, ok: true, bytes: body.length, out });
      console.log(`OK  ${t.id} (${body.length} bytes)`);
    } catch (err) {
      manifest.push({ ...t, ok: false, error: String(err) });
      console.error(`FAIL ${t.id}: ${err}`);
    }
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();
  console.log(`\nWrote ${manifest.filter((m) => m.ok).length}/${TARGETS.length} files to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});