import { test } from "node:test";
import assert from "node:assert/strict";
import { createHighlighter } from "shiki";
import { JSDOM } from "jsdom";
import {
  isReaderSource,
  readerUrl,
  sourceRoute,
} from "../src/lib/handbook-routing.js";
import {
  parseChapter,
  renderChapter,
  resolveReaderLink,
} from "./lib/handbook-content.mjs";

test("reader routes retain GitHub Pages base and section fragments", () => {
  assert.equal(
    readerUrl("docs/theory.md#refusal", "/Abliteration/"),
    "/Abliteration/handbook/docs/theory/#refusal",
  );
  assert.equal(sourceRoute("README.md"), "handbook/overview/");
  assert.equal(sourceRoute("cxx/README.md"), "handbook/cxx/readme/");
  for (const file of [
    "../secrets.md",
    "docs/../../secret.md",
    "scripts/run.py",
    "cxx/build/output.md",
  ])
    assert.equal(isReaderSource(file), false);
});
test("chapter links resolve relative to the source document and preserve source downloads", () => {
  const known = new Set(["docs/theory.md", "instructions/quickstart.md"]);
  const resolve = (href) =>
    resolveReaderLink(
      href,
      "instructions/quickstart.md",
      known,
      "/Abliteration/",
      "abcdef",
    );
  assert.equal(
    resolve("../docs/theory.md#direction"),
    "/Abliteration/handbook/docs/theory/#direction",
  );
  assert.equal(
    resolve(
      "https://github.com/adybag14-cyber/Abliteration/blob/main/docs/theory.md",
    ),
    "/Abliteration/handbook/docs/theory/",
  );
  assert.equal(
    resolve("../data/example.json"),
    "https://github.com/adybag14-cyber/Abliteration/blob/abcdef/data/example.json",
  );
  assert.equal(
    resolve("https://arxiv.org/abs/2406.11717"),
    "https://arxiv.org/abs/2406.11717",
  );
});
test("sanitized Markdown keeps code and unique headings without executing embedded HTML", async () => {
  const highlighter = await createHighlighter({
    themes: ["github-light", "github-dark-high-contrast"],
    langs: ["javascript"],
  });
  try {
    const source =
      '# Test chapter\n\nA complete introduction.\n\n## Repeated\n\n<script>alert(1)</script>\n<img src="x" onerror="alert(2)">\n\n[unsafe](javascript:alert(3))\n\n## Repeated\n\n```javascript\nconst value = "<script>";\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n';
    const chapter = parseChapter("docs/theory.md", source);
    assert.equal(chapter.codeCount, 1);
    const rendered = await renderChapter(chapter, {
      knownSources: new Set([chapter.source]),
      base: "/Abliteration/",
      sourceCommit: "test",
      highlighter,
      diagrams: {},
    });
    assert.deepEqual(
      rendered.headings.map((heading) => heading.id),
      ["repeated", "repeated-1"],
    );
    const document = new JSDOM(rendered.html).window.document;
    assert.equal(
      document.querySelectorAll("script,[onerror],a[href^='javascript:']")
        .length,
      0,
    );
    assert.equal(
      document.querySelector("pre code").textContent,
      'const value = "<script>";',
    );
    assert.equal(document.querySelectorAll("[data-copy-code]").length, 1);
    assert.equal(
      document.querySelector(".chapter-table-scroll").getAttribute("tabindex"),
      "0",
    );
  } finally {
    highlighter.dispose();
  }
});
