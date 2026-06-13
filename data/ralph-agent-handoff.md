# Ralph agent handoff

Updated: 2026-06-13T20:16:00.947Z

## Current task

_No pending tasks — add items to `data/ralph-backlog.json`._

## Workflow

```text
1. npm run ralph:next
2. Implement the current task
3. npm run ralph
4. npm run ralph:next -- --complete <id>
5. If more tasks pending → goto 1 (do NOT stop)
6. npm run ralph:turn-end -- --message "summary"
```
