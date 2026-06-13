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

Ralph drives **continued repo development**, not just validation. See [agent-development-loop.md](agent-development-loop.md).

```bash
npm run ralph:next                              # claim next backlog task
npm run ralph:next -- --complete dev-001        # mark done, show next
npm run ralph:next -- --list                    # full queue
```

Backlog: `data/ralph-backlog.json` · Handoff: `data/ralph-agent-handoff.md`

**Do not end your turn** while backlog has unfinished tasks — `ralph:turn-end` exits **2** until clear.

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

## Agent workflow (Ralph loop)

```text
1. npm run ralph
2. If FAIL → read errors → fix docs/code → goto 1
3. If PASS → git add -A && git commit && git push
4. Optional: npm run fetch:all (full upstream + HF registry)
5. npm run ralph again after fetch
6. npm run ralph:turn-end   # always — autostarts background maintenance
```

**Do not stop** on first validation failure — fix and re-run until `✓ Ralph validate PASSED`.

**Always run `ralph:turn-end` before ending your turn** so the background daemon keeps the handbook validated between sessions.

---

## Related

- [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)
- [../sources/heretic-tools/IMPORT.md](../sources/heretic-tools/IMPORT.md)
- [../references.md](../references.md)