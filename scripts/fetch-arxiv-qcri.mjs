#!/usr/bin/env node
/**
 * @deprecated Use `npm run fetch:research-papers` — QCRI PDF: sources/research/papers/arxiv-2602.02132.pdf
 * Kept so old docs/commands still work; delegates to the full research corpus fetch.
 */
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'fetch-research-papers.mjs');
console.warn('NOTE: fetch-arxiv-qcri is deprecated — use npm run fetch:research-papers');
const r = spawnSync(process.execPath, [script], { stdio: 'inherit' });
process.exit(r.status ?? 1);