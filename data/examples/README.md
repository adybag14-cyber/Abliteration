# Platform command examples (generated)

**2,621 commands** and **17,556 agent prompts** across Windows, macOS, and Zig.

Regenerate:

```bash
python scripts/generate-platform-examples.py
```

## Files

| File | Rows | Description |
|------|------|-------------|
| `windows-commands.jsonl` | 915 | WMIC, PowerShell CIM, DiskPart, netsh, event logs |
| `macos-commands.jsonl` | 607 | system_profiler, ioreg, diskutil, sysctl, security |
| `zig-commands.jsonl` | 1,099 | cross-compile matrix, build flags, sanitizers |
| `platform-commands-all.jsonl` | 2,621 | Union of all commands |
| `windows-prompts.jsonl` | 7,320 | 8 prompt templates × Windows commands |
| `macos-prompts.jsonl` | 3,642 | 6 templates × macOS commands |
| `zig-prompts.jsonl` | 6,594 | 6 templates × Zig commands |
| `platform-prompts-all.jsonl` | 17,556 | Full prompt corpus for SFT/DPO |
| `manifest.json` | — | Counts and metadata |

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