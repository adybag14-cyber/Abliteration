import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

FILES = {
    "sft": DATA / "sft_train.jsonl",
    "dpo": DATA / "dpo_train.jsonl",
    "eval": DATA / "eval_prompts.jsonl",
}

REQUIRED_PLACEHOLDERS = [
    "[SECRET_READ_COMMAND]",
    "[CREDENTIAL_DUMP_COMMAND]",
    "[BROWSER_COOKIE_READ_COMMAND]",
    "[PRIVATE_KEY_READ_COMMAND]",
    "[DESTRUCTIVE_DELETE_COMMAND]",
    "[PERSISTENCE_INSTALL_COMMAND]",
    "[BACKDOOR_COMMAND]",
    "[SECURITY_EVASION_COMMAND]",
    "[EXFILTRATION_COMMAND]",
    "[UNAUTHORIZED_SCAN_COMMAND]",
    "[MALWARE_EXECUTION_COMMAND]",
    "[UNKNOWN_REMOTE_SCRIPT_COMMAND]",
]

# These are warning checks to catch accidental inclusion of secrets or dangerous syntax.
# The dataset intentionally uses placeholder labels instead of runnable harmful commands.
BANNED_SUBSTRINGS = [
    "BEGIN RSA PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
    "api_key=",
    "access_token=",
    "password=",
    "passwd=",
    ".ssh/id_rsa",
    "shadow",
    "cookies.sqlite",
    "login data",
]


def read_jsonl(path):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                raise SystemExit(f"JSON error in {path} line {i}: {e}")
    return rows


def all_text(obj):
    if isinstance(obj, dict):
        return "\n".join(all_text(v) for v in obj.values())
    if isinstance(obj, list):
        return "\n".join(all_text(v) for v in obj)
    return str(obj)


def validate_sft(rows):
    for i, row in enumerate(rows, 1):
        if "messages" not in row or not isinstance(row["messages"], list):
            raise SystemExit(f"SFT row {i} missing messages list")
        roles = [m.get("role") for m in row["messages"]]
        if roles != ["system", "user", "assistant"]:
            raise SystemExit(f"SFT row {i} roles should be system,user,assistant, got {roles}")
        for m in row["messages"]:
            if not isinstance(m.get("content"), str) or not m["content"].strip():
                raise SystemExit(f"SFT row {i} has empty content")


def validate_dpo(rows):
    for i, row in enumerate(rows, 1):
        for key in ["prompt", "chosen", "rejected"]:
            if key not in row or not isinstance(row[key], str) or not row[key].strip():
                raise SystemExit(f"DPO row {i} missing non-empty {key}")


def main():
    for name, path in FILES.items():
        if not path.exists():
            raise SystemExit(f"Missing file: {path}")

    sft = read_jsonl(FILES["sft"])
    dpo = read_jsonl(FILES["dpo"])
    eval_rows = read_jsonl(FILES["eval"])

    validate_sft(sft)
    validate_dpo(dpo)

    combined = "\n".join(all_text(x) for x in sft + dpo + eval_rows).lower()

    for bad in BANNED_SUBSTRINGS:
        if bad.lower() in combined:
            raise SystemExit(f"Potential unsafe/sensitive text found: {bad}")

    placeholder_count = sum(combined.count(p.lower()) for p in REQUIRED_PLACEHOLDERS)
    if placeholder_count < 20:
        raise SystemExit("Expected more censored placeholder examples; dataset may be incomplete.")

    print(f"SFT rows: {len(sft)}")
    print(f"DPO rows: {len(dpo)}")
    print(f"Eval rows: {len(eval_rows)}")
    print(f"Placeholder references: {placeholder_count}")
    print("Validation passed.")


if __name__ == "__main__":
    main()
