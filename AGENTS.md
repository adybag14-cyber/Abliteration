# Abliteration — agent rules

## Ralph turn continuations

When `data/ralph-continuation.json` has `"enabled": true`, or the user says **ralph continue**:

1. Read `data/ralph-agent-handoff.md` first.
2. Run `npm run ralph:next` and **implement** the task (not validate-only).
3. `npm run ralph` → fix failures → `npm run ralph:next -- --complete <id>`.
4. **Keep going** until backlog has no `pending`/`in_progress` tasks.
5. Commit and push passing changes.
6. `npm run ralph:turn-end` only when backlog is clear.

## Turn on continuations

```bash
npm run ralph:continue:on          # headless grok --max-turns (chains agent turns)
npm run ralph:continue:status
npm run ralph:continue:off
```

Interactive TUI alternative: `npm run ralph:continue:on -- --loop` (prints `/loop` command).

## Hooks

Project hooks in `.grok/hooks/` require trust: add this repo path to `~/.grok/trusted-hook-projects`.

Docs: `docs/ralph-turn-continuation.md`