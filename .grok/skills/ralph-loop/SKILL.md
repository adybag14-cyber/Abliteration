---
name: ralph-loop
description: >
  Run the Ralph Wiggum validate-refresh loop for the Abliteration handbook repo.
  Use when maintaining this repo, before ending an agent turn, when the user says
  "ralph", "validate handbook", "ralph loop", "ralph autostart", or "/ralph-loop".
  Always run ralph:turn-end before finishing a turn.
metadata:
  short-description: "Abliteration Ralph Wiggum maintenance loop"
---

# Ralph loop (Abliteration handbook)

## Every turn (mandatory before ending)

```bash
npm run ralph:turn-end -- --message "<short summary of what you changed>"
```

This logs the turn and keeps the background `ralph:autostart` daemon running.

## Fix-and-iterate workflow

```bash
npm run ralph
```

If FAIL: read errors, fix files, repeat until `✓ Ralph validate PASSED`.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run validate` | Single validation pass |
| `npm run ralph` | validate → refresh pins → re-validate (max 3) |
| `npm run ralph:turn-end` | Agent turn hook + autostart daemon |
| `npm run ralph:autostart:stop` | Stop background daemon |

## Status files

- `data/ralph-status.json` — last loop result
- `data/ralph-autostart-status.json` — daemon state
- `data/ralph-turns.jsonl` — turn-end log

## Rules

1. Do not stop on first validation failure — fix and re-run.
2. After PASS with uncommitted changes: `git add -A && git commit && git push`.
3. Always run `ralph:turn-end` as the last shell command before ending your turn.
4. Read `docs/ralph-loop.md` for full details.