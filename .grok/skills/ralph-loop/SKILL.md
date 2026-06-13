---
name: ralph-loop
description: >
  Run the Ralph Wiggum development loop for the Abliteration handbook repo.
  Use when maintaining this repo, before ending an agent turn, when the user says
  "ralph", "validate handbook", "ralph loop", "continue development", "ralph autostart",
  or "/ralph-loop". Pick backlog tasks, implement them, validate, and do NOT end
  the turn until the backlog is clear.
metadata:
  short-description: "Abliteration Ralph development + validation loop"
---

# Ralph loop (Abliteration handbook)

## Development-first workflow (every turn)

```bash
npm run ralph:next
# → implement the task
npm run ralph
npm run ralph:next -- --complete <task-id>
# repeat until backlog clear
npm run ralph:turn-end -- --message "<summary>"
```

Read `data/ralph-agent-handoff.md` at turn start.

## Rules

1. Never end a turn with unfinished backlog tasks.
2. Implement at least one dev task per turn when tasks exist.
3. After PASS: commit and push.
4. Add gaps to `data/ralph-backlog.json`.

## Docs

- `docs/agent-development-loop.md`
- `docs/ralph-loop.md`