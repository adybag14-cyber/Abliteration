# Agent development loop

Ralph is not just validation — it drives **continuous handbook development** across agent turns.

---

## Autonomous multi-turn Ralph development loop (exact protocol)

**Read `data/ralph-agent-handoff.md` and `data/ralph-backlog.json` first at the start of every turn.**

You are in autonomous multi-turn mode. Do NOT stop until the backlog is clear or you hit max turns (see `data/ralph-continuation.json` for headless `--max-turns`).

Each turn (repeat immediately, no waiting for user):

1. Read `data/ralph-agent-handoff.md` and `data/ralph-backlog.json`
2. `npm run ralph:next` — implement the claimed task fully
3. `npm run ralph` — fix any validation errors
4. `npm run ralph:next -- --complete <task-id>`
5. If more pending tasks → continue immediately (same session, no waiting for user)
6. `git add -A && git commit && git push` when you have passing changes
7. When backlog clear: `npm run ralph:turn-end -- --message "summary"`

`ralph:turn-end` **exits 2** if the backlog still has `pending` or `in_progress` tasks (use `--force` only when intentionally pausing). Never end a turn with unfinished backlog tasks.

**If backlog is empty:** add 3–5 new dev-* tasks to `data/ralph-backlog.json` (docs, scripts, cross-links) then continue (do not call turn-end).

Prefer substantive handbook improvements (new docs, better cross-links, script enhancements, use-case expansions, technique details) over pure validation-only passes.

See also root [AGENTS.md](../AGENTS.md) (Ralph turn continuation rules) and the packaged skill [.grok/skills/ralph-loop/SKILL.md](../.grok/skills/ralph-loop/SKILL.md) (use when user says "ralph loop", "continue development", or invokes `/ralph-loop`). When `ralph-continuation.json` has `enabled: true`, the agent must chain turns headless until backlog is clear.

See root [AGENTS.md](../AGENTS.md) and the skill for invocation rules.

When changes originated from `ralph:continue:watch`, headless (`ralph:continue:on`), or monitor: run `npm run ralph:regress` before commit (see "Rules for agents" and [ralph-turn-continuation.md](ralph-turn-continuation.md)).

---

## Walkthrough of one full autonomous turn

Follow the exact protocol in the section above (the 7-step list that matches the handoff + AGENTS.md + user query for ralph continue mode):

1. **Read first**: Open `data/ralph-agent-handoff.md` (live current task + files + acceptance) and `data/ralph-backlog.json` (full queue + wave state).
2. **Claim**: `npm run ralph:next` — this sets the task to `in_progress`, stamps `started_at`, rewrites the handoff.md, and prints the details (id, title, files, accept).
3. **Implement substantively**: Edit the listed files (use search/replace or add new sections). For a cross-link task: add bidirectional references. For a doc task: expand with tables, command examples, or new subsections. Run targeted tests (e.g. `npm run eval:stats`, `python -m py_compile ...`). Prefer real handbook value (new content, better navigation, accurate cross-refs) over placeholder edits.
4. **Validate the wave**: `npm run ralph` (runs validate → optional fetch+build on fail → re-validate, up to 3 iters by default). Iterate fixes until `✓ Ralph loop DONE`.
5. **Mark complete**: `npm run ralph:next -- --complete dev-0NN` — sets `done` + `completed_at`, writes next handoff (or "clear" message).
6. **If more pending**: Immediately repeat from step 1 (no user interaction).
7. **Passing changes**: `git add -A && git commit -m "ralph: complete dev-0NN + dev-0MM: <short summary of handbook improvements>" && git push`.
8. **Backlog now clear?** Seed 3-5 new tasks manually (or `npm run ralph:seed -- --force`), `npm run ralph:next` to claim, continue the loop. Only when you intentionally stop with clear backlog: `npm run ralph:turn-end -- --message "completed wave: added X cross-links, expanded Y evals, fixed Z scripts"`.

This walkthrough implements the numbered protocol steps above. The ralph-loop skill and continuation mode drive repeated execution of these steps.

This loop (plus the regress gate and seed dedupe) is what enables the headless `ralph:continue:on` multi-turn runs.

---

## Backlog seeding when empty

If at turn start (or after completing the last task) the backlog shows no pending tasks:

- Manually add **3–5 new dev-* tasks** to `data/ralph-backlog.json` (docs, scripts, cross-links) then continue.
- Give each: unique `id` (next dev-NNN), `title`, `status: "pending"`, `priority` (sequential), `files: [...]`, `acceptance: "..."`.
- Or run `npm run ralph:seed` (it appends from rotating predefined waves, skipping any already-done by exact title; advances `wave_index`; use `--force` to bypass pending guard).
- Then immediately `npm run ralph:next` to claim the first new one and continue the loop **without calling turn-end**.

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

See `scripts/ralph-seed-backlog.mjs` (WAVES array + doneTitles dedupe) and `data/ralph-backlog.json` for current state.

---

## Backlog

| File | Purpose |
|------|---------|
| `data/ralph-backlog.json` | Prioritized task queue (`id`, `title`, `status`, `files`, `acceptance`) |
| `data/ralph-agent-handoff.md` | Human/agent-readable next-task prompt |

Add tasks when you discover gaps:

```json
{
  "id": "dev-009",
  "title": "Short description",
  "status": "pending",
  "priority": 9,
  "files": ["docs/example.md"],
  "acceptance": "How to verify done"
}
```

List queue: `npm run ralph:next -- --list`

---

## Background daemon

`ralph:autostart` validates on an interval and writes a **dev handoff reminder** when validation passes but backlog tasks remain. It cannot write code — only agents can.

```bash
npm run ralph:autostart          # foreground
npm run ralph:autostart:stop     # stop background instance
```

---

## Rules for agents

1. **Never end a turn with an unfinished backlog** unless the user explicitly stops you. (ralph:turn-end will block with exit 2.)
2. Complete at least one backlog task per turn when tasks exist. Implement claimed tasks fully before completing. Prefer substantive handbook improvements.
3. After substantive changes (or a clean wave of tasks): `git add -A && git commit && git push`.
4. **Pre-commit gate for watch/headless work**: Before committing any changes produced by `ralph:continue:watch`, headless turns (`ralph:continue:on`), monitor daemon (`ralph:monitor -- --loop`), or when git is dirty after backlog clear (pending → 0) — run `npm run ralph:regress`. This is mandatory for automated dev output.
5. Refresh upstream when task requires it: `npm run fetch:all`.
6. Read `data/ralph-agent-handoff.md` and `data/ralph-backlog.json` at the start of each turn.
7. When backlog empties during a session: seed 3-5 new dev tasks (or ralph:seed) then continue the loop without ending the turn.
8. Commit/push **before** or as part of reaching clear + turn-end for the wave. Use descriptive commit messages that reference the dev- ids or summary of handbook improvements.
9. In headless/continuation mode (ralph-continuation.json enabled), keep chaining via ralph:next until clear — the max-turns limit and watch daemon help survive interruptions.
10. Follow root [AGENTS.md](../AGENTS.md) Ralph continuation rules exactly (read handoff, ralph:next + implement, ralph, complete, keep going, commit, turn-end only on clear).

---

## Turn continuations (multi-turn without typing)

Enable headless chaining for the exact loop above:

```bash
npm run ralph:continue:on        # sets continuation.json + spawns grok --max-turns (headless)
npm run ralph:continue:status
npm run ralph:continue:off
npm run ralph:continue:watch     # auto-restart watchdog (re-spawns on exit if backlog remains)
```

Recommended unattended:

```bash
npm run ralph:monitor -- --loop  # every 90s: seed if empty, start watch if pending+idle, run regress on clear+dirty
npm run ralph:seed               # seed next wave (dedupes done titles; --force to bypass pending guard)
```

Monitor log: `data/ralph-monitor.log` — auto-seeds, manages watch/continue pids via state files.

**Before every commit** from watch/headless/monitor output (or dirty tree after backlog clear):

```bash
npm run ralph:regress   # validate + ralph:ci + eval scripts + py_compile  (see ralph-regress.mjs)
```

See full details in [ralph-turn-continuation.md](ralph-turn-continuation.md) (backlog-clear gates, regress on pending→0, seed dedupe by title, lifecycle).

The continuation + monitor system + this dev loop together enable true autonomous multi-turn handbook evolution.

---

## Related

- [ralph-loop.md](ralph-loop.md) — validation commands + ralph:next / turn-end usage
- [ralph-turn-continuation.md](ralph-turn-continuation.md) — enable multi-turn (continue:on, monitor, watch), backlog-clear gates (regress + seed dedupe)
- [data/ralph-agent-handoff.md](../data/ralph-agent-handoff.md) — live current task + workflow reminder (always read first)
- [data/ralph-backlog.json](../data/ralph-backlog.json) — the task queue (edit to seed new waves)
- [evaluation.md](evaluation.md) — eval corpora (`npm run eval:stats`)
- [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) — tool selection evidence
- scripts/: `ralph-next-task.mjs`, `ralph-loop.mjs`, `ralph-turn-end.mjs`, `ralph-seed-backlog.mjs`, `ralph-regress.mjs`, `ralph-monitor.mjs` (authoritative logic)