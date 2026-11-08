import { mkdirSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const name = "abliteration-research-tools-1.2.0";
const parent = path.join(root, "artifacts/research-package");
const stage = path.join(parent, name);
if (existsSync(stage)) throw new Error("Research package staging directory already exists; use a clean build workspace");
mkdirSync(stage, { recursive: true });
const files = ["requirements-research.txt", "LICENSE", "RESEARCH-TOOLS.md",
  ...["checkpoint_tools.py", "selective-checkpoint.py", "verify-research-run.py", "research_experiment.py", "run-research-experiment.py", "download-research-model.py", "export-research-report.py", "abliteration_math.py", "test-selective-tools.py"].map((f) => `scripts/${f}`),
  "data/models/minicpm5-1b.json", "data/models/minicpm5-1b-layout.json", "data/experiments/minicpm5-protocol.jsonl", "data/experiments/minicpm5-pilot-96.json", "data/experiments/minicpm5-study-256.json",
  "docs/selective-methods-2026.md", "docs/minicpm5-selective-study.md", "docs/research-september-2026.md",
  "sources/research/catalog-2026.json", "sources/research/catalog-2026-09.json"];
const manifest = { version: "1.2.0", source_commit: process.env.GITHUB_SHA || spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).stdout.trim(), files: [] };
manifest.source_worktree_dirty = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8", windowsHide: true }).stdout.trim().length > 0;
for (const file of files) {
  let bytes = readFileSync(path.join(root, file));
  const sourceHash = createHash("sha256").update(bytes).digest("hex");
  if (file.endsWith(".md")) {
    const text = bytes.toString("utf8").replace(/\]\(([^)]+)\)/g, (match, target) => {
      if (/^(https?:|mailto:|#)/.test(target)) return match;
      const [relative, fragment] = target.split("#", 2);
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), relative));
      if (files.includes(resolved)) return match;
      return `](https://github.com/adybag14-cyber/Abliteration/blob/${manifest.source_commit}/${resolved}${fragment ? `#${fragment}` : ""})`;
    });
    bytes = Buffer.from(text);
  }
  const dest = path.join(stage, file); mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
  manifest.files.push({ path: file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), original_source_sha256: sourceHash });
}
writeFileSync(path.join(stage, "PACKAGE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
const archive = path.join(parent, `${name}.tar.gz`);
const result = spawnSync("tar", ["-czf", archive, "-C", parent, name], { stdio: "inherit", windowsHide: true });
if (result.status !== 0) throw new Error("Research toolkit packaging failed");
console.log(archive);
