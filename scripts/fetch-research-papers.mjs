#!/usr/bin/env node
/**
 * Fetch handbook research corpus: arXiv PDFs + text + key GitHub READMEs.
 *   npm run fetch:research-papers
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..');
const rel = (p) => relative(repoRoot, p).replace(/\\/g, '/');
const paperDir = join(repoRoot, 'sources', 'research', 'papers');
const readmeDir = join(repoRoot, 'sources', 'research', 'readmes');
mkdirSync(paperDir, { recursive: true });
mkdirSync(readmeDir, { recursive: true });

const PAPERS = [
  { id: '2406.11717', title: 'Refusal in LLMs Is Mediated by a Single Direction (Arditi, NeurIPS 2024)' },
  { id: '2502.17420', title: 'Geometry of Refusal — Concept Cones (TUM)' },
  { id: '2505.19056', title: 'Embarrassingly Simple Defense Against Abliteration (extended-refusal)' },
  { id: '2506.00085', title: 'COSMIC — Generalized Refusal Direction ID' },
  { id: '2510.02768', title: 'Safety Pretraining under Abliteration (SmolLM2)' },
  { id: '2512.13655', title: 'Comparative Abliteration Methods (Young)' },
  { id: '2602.02132', title: 'More to Refusal than Single Direction (QCRI)' },
  { id: '2603.22061', title: 'Failure of Topic-Matched Contrast Baselines' },
  { id: '2605.26526', title: 'Open-Weight Defenses vs Abliteration + Prefilling' },
  { id: '2606.05396', title: 'Code LLMs — Refusal vs Capability (abliteration)' },
];

const READMES = [
  { id: 'refusal-direction-readme', url: 'https://raw.githubusercontent.com/andyrdt/refusal_direction/main/README.md' },
  { id: 'cosmic-readme', url: 'https://raw.githubusercontent.com/wang-research-lab/COSMIC/main/README.md' },
  { id: 'abliteration-comparison-readme', url: 'https://raw.githubusercontent.com/ricyoung/abliteration-comparison/main/README.md' },
  { id: 'safety-pretraining-readme', url: 'https://raw.githubusercontent.com/shashankskagnihotri/safety_pretraining/main/README.md' },
];

const stamp = new Date().toISOString();
const manifest = { fetched: stamp, papers: [], readmes: [] };

async function fetchPdf(id) {
  const url = `https://arxiv.org/pdf/${id}`;
  const pdfPath = join(paperDir, `arxiv-${id}.pdf`);
  const txtPath = join(paperDir, `arxiv-${id}.txt`);
  const res = await fetch(url, { headers: { 'User-Agent': 'abliteration-handbook/1.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(pdfPath, buf);

  let text = '';
  try {
    execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { stdio: 'pipe' });
    text = readFileSync(txtPath, 'utf8');
  } catch {
    try {
      execSync(
        `python -c "from pypdf import PdfReader; r=PdfReader(r'${pdfPath.replace(/\\/g, '/')}'); open(r'${txtPath.replace(/\\/g, '/')}', 'w', encoding='utf-8').write('\\n'.join((p.extract_text() or '') for p in r.pages))"`,
        { shell: true, stdio: 'pipe' }
      );
      text = readFileSync(txtPath, 'utf8');
    } catch (e) {
      console.warn(`WARN ${id}: no text extract — ${e.message}`);
    }
  }
  if (text) {
    const header = `# fetched: ${stamp}\n# arxiv: ${id}\n# url: ${url}\n\n`;
    writeFileSync(txtPath, header + text, 'utf8');
  }
  manifest.papers.push({
    id,
    url,
    pdf: rel(pdfPath),
    txt: rel(txtPath),
    pdf_bytes: buf.length,
    txt_chars: text.length,
  });
  console.log(`OK  arxiv:${id} (${buf.length} bytes, ${text.length} chars)`);
}

async function fetchReadme({ id, url }) {
  const out = join(readmeDir, `${id}.md`);
  const res = await fetch(url, { headers: { 'User-Agent': 'abliteration-handbook/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  let body = await res.text();
  // Upstream READMEs may use site-relative /pipeline/ paths — not valid in handbook link check
  body = body.replace(/\]\(\/pipeline\/runs\/([^)]+)\)/g, '](https://github.com/andyrdt/refusal_direction/tree/main/pipeline/runs/$1)');
  writeFileSync(out, `# fetched: ${stamp}\n# url: ${url}\n\n${body}`, 'utf8');
  manifest.readmes.push({ id, url, out: rel(out), bytes: body.length });
  console.log(`OK  ${id} (${body.length} bytes)`);
}

async function main() {
  for (const p of PAPERS) {
    try {
      await fetchPdf(p.id);
    } catch (e) {
      console.error(`FAIL arxiv:${p.id}: ${e.message}`);
      manifest.papers.push({ id: p.id, ok: false, error: String(e) });
    }
  }
  for (const r of READMES) {
    try {
      await fetchReadme(r);
    } catch (e) {
      console.error(`FAIL ${r.id}: ${e.message}`);
      manifest.readmes.push({ ...r, ok: false, error: String(e) });
    }
  }
  writeFileSync(join(repoRoot, 'sources', 'research', 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest → sources/research/manifest.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});