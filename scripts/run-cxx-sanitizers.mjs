#!/usr/bin/env node
/** Configure, build, and run the hostile-input suites with ASan + UBSan. */
import { spawnSync } from 'node:child_process';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { windowsVisualStudioEnvironment } from './lib/windows-vs-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'cxx');
const build = join(source, 'build-sanitized');
const compiler = process.env.CXX || 'clang++';
const runtimeEnv = { ...windowsVisualStudioEnvironment(process.env), NO_COLOR: '1' };

if (process.platform === 'win32') {
  const resource = spawnSync(compiler, ['-print-resource-dir'], { encoding: 'utf8', env: runtimeEnv, windowsHide: true });
  if (resource.status !== 0 || !resource.stdout.trim()) {
    process.stderr.write(resource.stderr || 'cannot locate the Clang sanitizer runtime\n');
    process.exit(resource.status ?? 2);
  }
  const runtimeDirectory = join(resource.stdout.trim(), 'lib', 'windows');
  const pathKey = Object.keys(runtimeEnv).find((key) => key.toLowerCase() === 'path') || 'PATH';
  runtimeEnv[pathKey] = `${runtimeDirectory}${delimiter}${runtimeEnv[pathKey] || ''}`;
  runtimeEnv.ASAN_OPTIONS = 'strict_string_checks=1';
} else {
  runtimeEnv.ASAN_OPTIONS = 'detect_leaks=1:strict_string_checks=1';
}

function run(bin, args) {
  console.log(`> ${bin} ${args.join(' ')}`);
  const result = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    env: runtimeEnv,
  });
  if (result.error) {
    console.error(`${bin}: ${result.error.message}`);
    process.exit(1);
  }
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('cmake', [
  '--fresh',
  '-S', source,
  '-B', build,
  '-G', 'Ninja',
  '-DCMAKE_BUILD_TYPE=Debug',
  `-DCMAKE_CXX_COMPILER=${compiler}`,
  '-DABLITERATE_ENABLE_SANITIZERS=ON',
  '-DABLITERATE_ENABLE_HARDENING=OFF',
  '-DABLITERATE_WARNINGS_AS_ERRORS=ON',
]);
run('cmake', ['--build', build, '--config', 'Debug', '--verbose']);
run('ctest', ['--test-dir', build, '--build-config', 'Debug', '--output-on-failure']);

console.log(`sanitizers ok  compiler=${compiler}  build=${build}`);
