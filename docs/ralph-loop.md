# Ralph Wiggum loop (agent maintenance)

Continuous **validate → refresh → re-validate** cycle for this handbook. Named after the [Ralph Wiggum agent pattern](https://ghuntley.com/ralph/) — keep iterating until the task is done.

---

## Commands

```bash
npm install

# Single validation pass (CI / pre-commit)
npm run validate

# Full loop: validate → fetch pins → rebuild docs → re-validate (max 3)
npm run ralph

# Validate only, no network
npm run ralph -- --skip-fetch

# More iterations
npm run ralph -- --max 5

# Agent turn-end hook (spawns background daemon if needed)
npm run ralph:turn-end
npm run ralph:turn-end -- --message "fixed broken links"

# Background daemon (validate loop every 2 min by default)
npm run ralph:autostart
npm run ralph:autostart:stop

# Turn continuations + unattended monitor
npm run ralph:continue:watch
npm run ralph:monitor -- --loop
npm run ralph:seed
npm run ralph:regress              # pre-commit regression gate
```

→ [ralph-turn-continuation.md](ralph-turn-continuation.md) · [agent-development-loop.md](agent-development-loop.md)

Status logs:

| File | Purpose |
|------|---------|
| `data/ralph-status.json` | Last `ralph-loop` result |
| `data/ralph-turns.jsonl` | Agent turn-end events |
| `data/ralph-autostart-status.json` | Daemon state |
| `data/ralph-autostart.log` | Daemon stdout/stderr |
| `data/.ralph-autostart.pid` | Single-instance lock |

---

## Development loop (primary)

Ralph drives **continued repo development**, not just validation. See [agent-development-loop.md](agent-development-loop.md) for the complete agent playbook (and root [AGENTS.md](../AGENTS.md) + [.grok/skills/ralph-loop/SKILL.md](../.grok/skills/ralph-loop/SKILL.md)).

```bash
npm run ralph:next                              # claim next backlog task (read handoff + backlog first)
npm run ralph:next -- --complete dev-001        # mark done, show next
npm run ralph:next -- --list                    # full queue
```

Backlog: `data/ralph-backlog.json` · Handoff: `data/ralph-agent-handoff.md`

**Do not end your turn** while backlog has unfinished tasks — `ralph:turn-end` exits **2** until clear. If backlog empties, seed 3–5 new tasks (docs/scripts/cross-links) and continue the autonomous loop.

## Autonomous multi-turn Ralph development loop (full protocol)

**Read `data/ralph-agent-handoff.md` and `data/ralph-backlog.json` first at the start of every turn.**

You are in autonomous multi-turn mode. Do NOT stop until the backlog is clear or you hit max turns (see `data/ralph-continuation.json` enabled + `max_turns` for headless chaining).

Each turn (repeat immediately, no waiting for user):

1. Read `data/ralph-agent-handoff.md` and `data/ralph-backlog.json`
2. `npm run ralph:next` — implement the claimed task fully
3. `npm run ralph` — fix any validation errors
4. `npm run ralph:next -- --complete <task-id>`
5. If more pending tasks → continue immediately (same session, no waiting for user)
6. `git add -A && git commit && git push` when you have passing changes
7. When backlog clear: `npm run ralph:turn-end -- --message "summary"`

`ralph:turn-end` **exits 2** if the backlog still has `pending` or `in_progress` tasks (use `--force` only when intentionally pausing). Never end a turn with unfinished backlog tasks.

**If backlog is empty:** add 3–5 new dev-* tasks to `data/ralph-backlog.json` (docs, scripts, cross-links) then continue.

Prefer substantive handbook improvements (new docs, better cross-links, script enhancements, use-case expansions, technique details) over pure validation-only passes.

See also root [AGENTS.md](../AGENTS.md) (Ralph turn continuation rules) and the packaged skill [.grok/skills/ralph-loop/SKILL.md](../.grok/skills/ralph-loop/SKILL.md) — invoked automatically on "ralph", "ralph loop", "validate handbook", `/ralph-loop` etc. Follow the loop in [agent-development-loop.md](agent-development-loop.md) for the authoritative agent playbook.

## Inside `npm run ralph` (the validate+refresh step of every dev turn)

`ralph` (implemented in `scripts/ralph-loop.mjs`) runs:

- Always: `node scripts/ralph-validate.mjs`
- On failure (and not `--skip-fetch`): runs `fetch-heretic-tools`, `build-heretic-models-doc`, then re-validate.
- Up to `--max` iterations (default 3 from env or arg). Exits 0 on first clean validate.
- Writes `data/ralph-status.json` with full log (iterations, timestamps, PASS/FAIL).

Use inside the autonomous protocol (step 3):

```bash
npm run ralph                 # full (fetch on fail)
npm run ralph -- --skip-fetch # fast validate only (preferred in regress gate)
npm run ralph -- --max 5
```

On PASS you get `🍩 Ralph loop DONE at iteration N — handbook validated`.

Fix any markdown link, jsonl, script, or required-file errors reported by validate before completing the task.

---

## Backlog seeding when empty

If at turn start (or after completing the last task) the backlog shows no pending tasks:

- Manually add **3–5 new dev-* tasks** to `data/ralph-backlog.json` (docs, scripts, cross-links) then continue.
- Give each: unique `id` (next dev-NNN), `title`, `status: "pending"`, `priority` (sequential), `files: [...]`, `acceptance: "..."`.
- Or run `npm run ralph:seed` (it appends from rotating predefined waves, skipping any already-done by exact title; advances `wave_index`; use `--force` to bypass pending guard).
- Then immediately `npm run ralph:next` to claim the first new one and continue the loop.

Example new task entry (insert before closing `]` of tasks array):

```json
{
  "id": "dev-048",
  "title": "cross-link new use-case in beginner guide and overview",
  "status": "pending",
  "priority": 48,
  "files": ["instructions/beginner-local-model-guide.md", "docs/overview.md"],
  "acceptance": "Beginner guide and overview reference the new use-case doc with navigation"
}
```

**Good seeding practice**: Choose tasks that add real value and cross-links (e.g. connect a new eval corpus to instructions + docs/evaluation.md + use-case pages, expand a technique with cross-refs, improve script docs or add usage examples in README). Avoid trivial validation-only or already-covered items. After manual seed, bump `wave_index` and set `last_seeded_at` to now (the seed script does this automatically).

Update `wave_index` / `last_seeded_at` if manually seeding. After seeding, proceed with the loop.

See `scripts/ralph-seed-backlog.mjs` (WAVES array + doneTitles dedupe) and `data/ralph-backlog.json` for current state. The authoritative rules live in [agent-development-loop.md](agent-development-loop.md).

---

## Pre-commit regression gate (`ralph:regress`)

**Mandatory before committing** any changes produced by:

- `ralph:continue:watch`
- headless turns (`ralph:continue:on`)
- monitor daemon (`ralph:monitor -- --loop`)
- or when git is dirty after backlog clear (pending → 0)

```bash
npm run ralph:regress   # validate + ralph:ci + eval scripts + py_compile
```

Runs in strict order (fails fast on exit != 0):

1. `node scripts/ralph-validate.mjs`
2. `node scripts/ralph-loop.mjs --skip-fetch --max 1` (ralph:ci)
3. `node scripts/count-eval-prompts.mjs` (eval:stats)
4. `python scripts/cybergym-eval-stub.py --print-flow` (eval:cybergym)
5. `py_compile` for: cybergym-eval-stub.py, filter-jarvis-eval.py, export-abliteration-lora.py, hardware-tool-gate.py, check_env.py

On PASS: `✓ Ralph regress PASSED — no regressions detected`

See dedicated rules in [agent-development-loop.md](agent-development-loop.md#rules-for-agents) ("Pre-commit gate for watch/headless work") and [ralph-turn-continuation.md](ralph-turn-continuation.md#backlog-clear-gates-regress--seed-dedupe).

This section matches the pre-commit gate requirement from agent-development-loop.md.

---

## Autostart (agent turn-end)

**After backlog is clear**, before ending any agent turn:

```bash
npm run ralph:turn-end
```

This:

1. Appends a line to `data/ralph-turns.jsonl`
2. Writes `data/ralph-autostart.signal.json` (wakes the daemon)
3. Spawns `ralph-autostart` in the background if not already running

The daemon loops `npm run ralph` on an interval (default **120s**, override with `RALPH_AUTOSTART_INTERVAL_MS`). When validation passes but dev tasks remain, it refreshes `data/ralph-agent-handoff.md`.

```bash
# Foreground (debug)
npm run ralph:autostart

# Stop background instance
npm run ralph:autostart:stop
```

---

## What `ralph-validate` checks

| Check | Catches |
|-------|---------|
| Markdown internal links | Broken `../path` references |
| Required files | Heretic pins, toolchain docs, scripts |
| `package.json` scripts | Missing `.mjs` targets |
| `UPSTREAM.json` | Missing sha256 or pin files on disk |
| `data/**/*.jsonl` | Invalid JSON per line |
| Factory `.txt` prompts | Missing eval exports |
| Python scripts | `py_compile` syntax errors |

Exit **0** = safe to commit. Exit **1** = fix before push.

---

## Validation + refresh cycle (the `npm run ralph` engine)

Inside every dev turn (step 3 of the autonomous multi-turn protocol above), use:

```text
1. npm run ralph
2. If FAIL → read errors → fix docs/code/scripts → goto 1
3. If PASS → (after completing task(s) via ralph:next -- --complete) consider git add/commit/push for the wave
4. Optional: npm run fetch:all (full upstream + HF registry) then ralph again
```

**Do not stop** on first validation failure — fix and re-run until `✓ Ralph validate PASSED` (or `ralph:ci` for fast pre-commit checks).

See the full autonomous dev loop + turn-end + seeding rules in the sections above and in [agent-development-loop.md](agent-development-loop.md). The `ralph:turn-end` (which also starts the maintenance daemon) is called **only after backlog is clear** (no pending/in_progress). When clear you may choose to seed new dev tasks instead and keep developing in the same session.

---

## Related

- [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)
- [../sources/heretic-tools/IMPORT.md](../sources/heretic-tools/IMPORT.md)
- [../references.md](../references.md)