# Ralph turn continuations

The validate daemon (`ralph:autostart`) **cannot** start new agent turns — only an agent or Grok scheduler can. This doc explains how to turn on **real** multi-turn development.

---

## Three layers

| Layer | Command | What it does |
|-------|---------|--------------|
| **Backlog** | `npm run ralph:next` | Picks the next dev task |
| **Validate daemon** | `npm run ralph:autostart` | Background `npm run ralph` every 2 min |
| **Turn continuations** | `npm run ralph:continue:on` | Spawns headless Grok with `--max-turns` |

You need **turn continuations** for the agent to keep working across turns without you typing the next message.

---

## Turn ON (recommended)

```bash
cd C:\Users\adyba\Desktop\abliteration
npm run ralph:continue:on
```

This:

1. Seeds backlog tasks if empty
2. Sets `data/ralph-continuation.json` → `enabled: true`
3. Spawns `grok -p ... --max-turns 12 --yolo` in the background

The headless agent chains up to **12 turns** in one process, implementing backlog tasks, validating, committing.

**Check status:**

```bash
npm run ralph:continue:status
# log: data/ralph-continue.log
```

**Turn OFF:**

```bash
npm run ralph:continue:off
```

Override turn count: `RALPH_CONTINUE_MAX_TURNS=20 npm run ralph:continue:on`

**Auto-restart** when headless exits early but backlog remains:

```bash
npm run ralph:continue:watch
```

---

## Troubleshooting headless runs

If `data/ralph-continue.log` shows `read_file` errors or `max turns reached` with unfinished backlog:

1. Check `npm run ralph:continue:status`
2. Use `npm run ralph:continue:watch` (re-spawns until backlog clear)
3. Or continue manually in this chat: `ralph continue — read data/ralph-agent-handoff.md`

Headless uses `--prompt-file` + `--permission-mode bypassPermissions` + `--cwd` set to the repo.

---

## Interactive TUI alternative (`/loop`)

If you work in the Grok chat UI (not headless):

```bash
npm run ralph:continue:on -- --loop
```

Copy the printed `/loop 5m ...` command into Grok. That fires a **new agent turn every 5 minutes**.

Cancel via Tasks pane (`Ctrl+B`) or `scheduler_delete`.

---

## Grok hooks (automatic handoff refresh)

Project hooks live in `.grok/hooks/ralph-continuation.json`:

- **SessionStart** → refresh `data/ralph-agent-handoff.md`
- **Stop** → log stop + refresh handoff when continuation enabled

**One-time setup** — trust this repo for hooks:

Add to `C:\Users\adyba\.grok\trusted-hook-projects` (one path per line):

```
C:\Users\adyba\Desktop\abliteration
```

Reload hooks: `/hooks` → press `r`.

---

## What does NOT continue turns

| Thing | Why |
|-------|-----|
| `ralph:autostart` daemon | Node script — validates only |
| `ralph:turn-end` | Logs turn; does not spawn Grok |
| Stop hook alone | Refreshes handoff; does not submit next prompt |

---

## Backlog-clear gates (regress + seed dedupe)

The turn continuation + monitor system protects automated development with two key behaviors when the last pending task is completed (backlog transitions 1+ → 0 pending).

### Regress gate on backlog clear

`scripts/ralph-monitor.mjs` (cycle function) detects backlog-clear transitions:

```js
if (prevPending > 0 && pending === 0 && !headlessRunning()) {
  if (gitDirty()) {
    runRegress();  // blocks on failure
    state.last_regress_at = stamp();
  } else {
    log('backlog cleared — tree clean, skip regress');
  }
}
```

- Only fires for **monitor-driven** clears (not when headless Grok is the active agent).
- Runs the full `npm run ralph:regress` pre-commit gate if the tree has uncommitted changes from the just-finished dev task(s).
- `ralph:regress` runs in sequence (exit 1 on first failure):
  1. `node scripts/ralph-validate.mjs`
  2. `node scripts/ralph-loop.mjs --skip-fetch --max 1` (ralph-ci)
  3. `node scripts/count-eval-prompts.mjs` (eval-stats)
  4. `python scripts/cybergym-eval-stub.py --print-flow`
  5. `py_compile` for: cybergym-eval-stub.py, filter-jarvis-eval.py, export-abliteration-lora.py, hardware-tool-gate.py, check_env.py
- On PASS: `✓ Ralph regress PASSED — no regressions detected`
- This gate is **mandatory** for any changes produced under `ralph:continue:watch`, headless continuations, or the monitor daemon. It is the final automated safety before the monitor seeds the next wave and/or restarts watch.

Manual agents completing the last task in a turn should also run `npm run ralph:regress` before `git commit` when the flow originated from watch/headless (see agent-development-loop.md "Pre-commit gate for watch/headless work").

If the tree is already clean after completion (e.g. previous commit + only status updates), the monitor skips the gate to avoid unnecessary work.

### Seed deduplication (title-based skip)

`scripts/ralph-seed-backlog.mjs` (and the call from `ralph-monitor` / `ralph-continue-on` bootstrap) prevents re-work:

```js
const doneTitles = new Set(
  (backlog.tasks || []).filter((t) => t.status === 'done').map((t) => t.title),
);

for (const item of wave) {
  if (doneTitles.has(item.title)) continue;
  // ... push new pending dev-NNN task
}
```

- Dedupes **by exact `title` string** (not by id or files).
- If an entire wave's items are all already done, it auto-advances `wave_index`, updates `updated_at`, and recurses to the next wave (depth-limited).
- Actual additions set `last_seeded_at`; skipped waves still advance the index.
- `npm run ralph:seed -- --force` bypasses the pending>0 guard **and** will still apply the done-title skip (to append a wave's remaining items).
- WAVES are defined inline in the seed script (rotating 4-wave history of handbook improvements). New substantive tasks are typically discovered by the agent during work and added via editing `data/ralph-backlog.json` + updating handoff, or by extending the last wave.

This guarantees the autonomous multi-turn loop (monitor + continue:on) never re-queues work that was already marked `done`, even across sessions or wave re-seeds.

### Lifecycle summary (monitor + continuations)

1. Agent finishes last task → `npm run ralph:next -- --complete <id>`
2. (Automated) monitor detects pending→0 transition.
3. If dirty: runs regress gate (must pass).
4. Seeds next wave (deduping done titles; may advance wave_index).
5. If still pending and no watch/headless: starts `ralph:continue:watch`.
6. Repeat until waves exhausted.

See also:
- `scripts/ralph-monitor.mjs` (transition logic + runRegress/runSeed)
- `scripts/ralph-regress.mjs` (the gate script)
- `scripts/ralph-seed-backlog.mjs` (WAVES + doneTitles + nextId logic)
- `data/ralph-backlog.json` (wave_index, last_seeded_at, task statuses)
- `data/ralph-monitor-state.json` (last_pending / last_regress_at)
- `agent-development-loop.md` (agent rules + pre-commit gate)

## Related

- [agent-development-loop.md](agent-development-loop.md)
- [ralph-loop.md](ralph-loop.md)