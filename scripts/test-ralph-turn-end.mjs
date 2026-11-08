import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

test('log-only checks the backlog and records a turn without signaling or spawning', () => {
  const root = mkdtempSync(join(tmpdir(), 'ralph-log-only-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'data'));
    copyFileSync(new URL('./ralph-turn-end.mjs', import.meta.url), join(root, 'scripts/ralph-turn-end.mjs'));
    writeFileSync(join(root, 'data/ralph-backlog.json'), JSON.stringify({ tasks: [{ id: 'unfinished', status: 'pending' }] }));
    const run = () => spawnSync(process.execPath, [join(root, 'scripts/ralph-turn-end.mjs'), '--log-only', '--message', 'test'], { encoding: 'utf8', windowsHide: true });
    assert.equal(run().status, 2);
    assert.equal(existsSync(join(root, 'data/ralph-turns.jsonl')), false);
    writeFileSync(join(root, 'data/ralph-backlog.json'), JSON.stringify({ tasks: [] }));
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(readFileSync(join(root, 'data/ralph-turns.jsonl'), 'utf8')).message, 'test');
    assert.equal(existsSync(join(root, 'data/ralph-autostart.signal.json')), false);
    assert.equal(existsSync(join(root, 'data/.ralph-autostart.pid')), false);
    assert.doesNotMatch(result.stdout, /spawned|already running/);
  } finally {
    assert.equal(dirname(realpathSync(root)), realpathSync(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});
