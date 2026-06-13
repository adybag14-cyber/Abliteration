# Agent development loop

Ralph is not just validation — it drives **continuous handbook development** across agent turns.

---

## The loop

```text
1. npm run ralph:next              # claim next backlog task
2. Implement (docs, scripts, fetch, fixes)
3. npm run ralph                   # validate → refresh → re-validate
4. npm run ralph:next -- --complete <id>
5. If more tasks pending → goto 1   # DO NOT STOP
6. npm run ralph:turn-end -- --message "summary"
```

`ralph:turn-end` **exits 2** if the backlog still has `pending` or `in_progress` tasks (use `--force` only when intentionally pausing).

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

1. **Never end a turn with an unfinished backlog** unless the user explicitly stops you.
2. Complete at least one backlog task per turn when tasks exist.
3. After substantive changes: `git add -A && git commit && git push`.
4. Refresh upstream when task requires it: `npm run fetch:all`.
5. Read `data/ralph-agent-handoff.md` at the start of each turn.

---

## Turn continuations (multi-turn without typing)

```bash
npm run ralph:continue:on       # headless grok --max-turns
npm run ralph:continue:status
npm run ralph:continue:off
```

→ [ralph-turn-continuation.md](ralph-turn-continuation.md)

---

## Related

- [ralph-loop.md](ralph-loop.md) — validation commands
- [ralph-turn-continuation.md](ralph-turn-continuation.md) — how to turn on agent turns
- [evaluation.md](evaluation.md) — eval corpora (`npm run eval:stats`)
- [comparative-abliteration-benchmarks.md](comparative-abliteration-benchmarks.md) — tool selection evidence