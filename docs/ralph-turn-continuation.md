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

## Related

- [agent-development-loop.md](agent-development-loop.md)
- [ralph-loop.md](ralph-loop.md)