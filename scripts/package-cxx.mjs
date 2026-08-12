#!/usr/bin/env node
/**
 * Pack abliterate-cxx + README + LICENSE for a CI target triple.
 *
 *   node scripts/package-cxx.mjs --build-dir cxx/ci-build --triple linux-x64 --compiler linux-x64-gcc15
 */
import { spawnSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const buildDir = arg('--build-dir', join(root, 'cxx', 'build'));
const triple = arg('--triple', 'unknown');
const compiler = arg('--compiler', '');
const distRoot = join(root, 'cxx', 'dist');
const pkgName = `abliterate-cxx-${triple}`;
const pkgDir = join(distRoot, pkgName);

function findBinary(dir, base) {
  const names = [base, `${base}.exe`];
  for (const n of names) {
    const p = join(dir, n);
    if (existsSync(p)) return p;
  }
  for (const sub of ['Release', 'Debug', 'MinSizeRel', 'RelWithDebInfo']) {
    for (const n of names) {
      const p = join(dir, sub, n);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

const cli = findBinary(buildDir, 'abliterate-cxx');
if (!cli) {
  console.error(`no abliterate-cxx in ${buildDir}`);
  console.error(existsSync(buildDir) ? readdirSync(buildDir).join(', ') : '(missing dir)');
  process.exit(1);
}

mkdirSync(pkgDir, { recursive: true });
const exeName = cli.endsWith('.exe') ? 'abliterate-cxx.exe' : 'abliterate-cxx';
copyFileSync(cli, join(pkgDir, exeName));
copyFileSync(join(root, 'cxx', 'README.md'), join(pkgDir, 'README.md'));
copyFileSync(join(root, 'cxx', 'GETTING-STARTED.md'), join(pkgDir, 'GETTING-STARTED.md'));
copyFileSync(join(root, 'cxx', 'INSTALL.txt'), join(pkgDir, 'INSTALL.txt'));
copyFileSync(join(root, 'LICENSE'), join(pkgDir, 'LICENSE'));
copyFileSync(join(root, 'docs', 'cxx26-platform.md'), join(pkgDir, 'cxx26-platform.md'));
copyFileSync(join(root, 'docs', 'cxx26-researcher-guide.md'), join(pkgDir, 'cxx26-researcher-guide.md'));
const exSrc = join(root, 'cxx', 'examples');
const exDst = join(pkgDir, 'examples');
mkdirSync(exDst, { recursive: true });
for (const name of readdirSync(exSrc)) {
  copyFileSync(join(exSrc, name), join(exDst, name));
}

writeFileSync(
  join(pkgDir, 'BUILD.txt'),
  [
    `package=${pkgName}`,
    `compiler=${compiler}`,
    `triple=${triple}`,
    `source=${cli}`,
    `built=${new Date().toISOString()}`,
    '',
    'First hour:',
    '  ./abliterate-cxx guide',
    '  ./abliterate-cxx doctor',
    '  ./abliterate-cxx demo',
    'Requires ISO C++26 (cplusplus=202400).',
    '',
  ].join('\n'),
);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: distRoot, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || '');
    throw new Error(`${cmd} ${args.join(' ')} failed (${r.status})`);
  }
}

const archive = `${pkgName}.tar.gz`;
run('tar', ['-czf', archive, pkgName]);
console.log(`wrote ${join(distRoot, archive)}`);

if (triple.startsWith('windows')) {
  const zip = `${pkgName}.zip`;
  const zippered = spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Force -Path '${pkgDir}' -DestinationPath '${join(distRoot, zip)}'`], {
    encoding: 'utf8',
  });
  if (zippered.status === 0) console.log(`wrote ${join(distRoot, zip)}`);
  else {
    const zip2 = spawnSync('zip', ['-r', zip, pkgName], { cwd: distRoot, encoding: 'utf8' });
    if (zip2.status === 0) console.log(`wrote ${join(distRoot, zip)}`);
    else console.warn('zip optional; tar.gz is the release artifact');
  }
}
