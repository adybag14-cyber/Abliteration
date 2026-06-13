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
```

Status log: `data/ralph-status.json`

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
```

**Do not stop** on first validation failure — fix and re-run until `✓ Ralph validate PASSED`.

---

## Related

- [toolchain-safetensors-gguf-lora.md](toolchain-safetensors-gguf-lora.md)
- [../sources/heretic-tools/IMPORT.md](../sources/heretic-tools/IMPORT.md)
- [../references.md](../references.md)