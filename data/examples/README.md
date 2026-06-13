# Platform command examples (generated)

**2,492 commands** and **16,782 agent prompts** across Windows, macOS, and Zig.

Counts are authoritative in `manifest.json` — refresh with `npm run eval:stats` after regen.

Regenerate:

```bash
python scripts/generate-platform-examples.py
```

## Files

| File | Rows | Description |
|------|------|-------------|
| `windows-commands.jsonl` | 915 | WMIC, PowerShell CIM, DiskPart, netsh, event logs |
| `macos-commands.jsonl` | 607 | system_profiler, ioreg, diskutil, sysctl, security |
| `zig-commands.jsonl` | 970 | cross-compile matrix, build flags, sanitizers |
| `platform-commands-all.jsonl` | 2,492 | Union of all commands |
| `windows-prompts.jsonl` | 7,320 | 8 prompt templates × Windows commands |
| `macos-prompts.jsonl` | 3,642 | 6 templates × macOS commands |
| `zig-prompts.jsonl` | 5,820 | 6 templates × Zig commands |
| `zig-code-snippets.jsonl` | 64 | Canonical-derived Zig code (ptrcast, fuzz, sanitize) |
| `platform-prompts-all.jsonl` | 16,782 | Full prompt corpus for SFT/DPO |
| `manifest.json` | — | Counts and metadata |

Eval (security): [../eval/zig-security-prompts.jsonl](../eval/zig-security-prompts.jsonl) — see [../../docs/tools/zig-advanced-techniques.md](../../docs/tools/zig-advanced-techniques.md)

## JSONL schema

**Command row:**

```json
{"platform":"windows","category":"wmic","command":"cmd /c wmic diskdrive get Model,Size","purpose":"WMIC diskdrive inventory","risk":"read_only"}
```

**Prompt row:**

```json
{"platform":"zig","category":"cross_compile","prompt":"Cross-compile with Zig: cross-build for x86_64-windows-gnu.","command":"zig build -Dtarget=x86_64-windows-gnu","expected":"tool_call"}
```

## Use with abliteration

1. Filter `platform-prompts-all.jsonl` by `platform` for factory bench training
2. Merge with Jarvis SFT data for tool-call repair
3. Eval: sample prompts per platform — see `../eval/platform-eval-sample.jsonl`