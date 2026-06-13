#!/usr/bin/env node
/**
 * Fetch arXiv:2602.02132 PDF + extract plain text for handbook offline use.
 *   npm run fetch:arxiv-qcri
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'sources', 'fetched');
mkdirSync(outDir, { recursive: true });

const PDF_URL = 'https://arxiv.org/pdf/2602.02132';
const pdfPath = join(outDir, 'arxiv-2602-02132.pdf');
const txtPath = join(outDir, 'arxiv-2602-02132.txt');
const stamp = new Date().toISOString();

async function main() {
  console.log(`Fetching ${PDF_URL} ...`);
  const res = await fetch(PDF_URL, {
    headers: { 'User-Agent': 'abliteration-handbook/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(pdfPath, buf);
  console.log(`OK  PDF → ${pdfPath} (${buf.length} bytes)`);

  let text = '';
  try {
    execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { stdio: 'pipe' });
    const { readFileSync } = await import('fs');
    text = readFileSync(txtPath, 'utf8');
  } catch {
    console.warn('WARN pdftotext unavailable — trying pypdf ...');
    try {
      execSync(
        `python -c "from pypdf import PdfReader; r=PdfReader(r'${pdfPath.replace(/\\/g, '/')}'); open(r'${txtPath.replace(/\\/g, '/')}', 'w', encoding='utf-8').write('\\n'.join((p.extract_text() or '') for p in r.pages))"`,
        { stdio: 'pipe', shell: true }
      );
      const { readFileSync } = await import('fs');
      text = readFileSync(txtPath, 'utf8');
    } catch (e) {
      console.error('FAIL text extraction:', e.message);
      process.exit(1);
    }
  }

  const header = `# fetched: ${stamp}\n# url: ${PDF_URL}\n# paper: arXiv:2602.02132\n# tool: fetch-arxiv-qcri.mjs\n\n`;
  writeFileSync(txtPath, header + text, 'utf8');
  console.log(`OK  text → ${txtPath} (${text.length} chars)`);

  writeFileSync(
    join(outDir, 'arxiv-qcri-manifest.json'),
    JSON.stringify(
      {
        id: 'arxiv-2602-02132',
        url: PDF_URL,
        pdf: pdfPath,
        txt: txtPath,
        pdf_bytes: buf.length,
        txt_chars: text.length,
        fetched: stamp,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});