import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

const root = process.cwd();
const data = JSON.parse(
  await readFile("artifacts/handbook-build/content.json", "utf8"),
);
const manifest = JSON.parse(
  await readFile("dist/handbook/manifest.json", "utf8"),
);
assert.equal(
  manifest.chapters,
  data.documents.length,
  "chapter count does not match source collection",
);
assert.equal(
  manifest.pages.length,
  data.documents.length + 1,
  "library or chapter page missing",
);
assert.equal(
  manifest.buildId,
  data.buildId,
  "handbook manifest belongs to a different build",
);
const pages = new Map();
const failures = [];
let examples = 0;
let links = 0;
for (const page of manifest.pages) {
  const html = await readFile(
    path.join("dist", page.route, "index.html"),
    "utf8",
  );
  const dom = new JSDOM(html);
  const document = dom.window.document;
  assert.equal(
    document.querySelectorAll("h1").length,
    1,
    `${page.route}: expected one main heading`,
  );
  assert(
    document.querySelector("main#main-content"),
    `${page.route}: missing semantic main content`,
  );
  assert.equal(
    document.querySelector('meta[name="abliteration-build"]')?.content,
    data.buildId,
    `${page.route}: build identity`,
  );
  assert.equal(
    document.querySelector('link[rel="canonical"]')?.href,
    `https://adybag14-cyber.github.io/Abliteration/${page.route}`,
    `${page.route}: canonical URL`,
  );
  const csp =
    document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.content || "";
  for (const script of document.querySelectorAll("script:not([src])")) {
    assert(
      ["application/json", "application/ld+json"].includes(script.type),
      `${page.route}: unexpected inline executable script`,
    );
    assert(
      csp.includes(
        `'sha256-${createHash("sha256").update(script.textContent).digest("base64")}'`,
      ),
      `${page.route}: inline data missing CSP hash`,
    );
    JSON.parse(script.textContent);
  }
  const ids = Array.from(
    document.querySelectorAll("[id]"),
    (element) => element.id,
  );
  assert.equal(
    new Set(ids).size,
    ids.length,
    `${page.route}: duplicate element IDs`,
  );
  if (page.source) {
    const source = await readFile(page.source, "utf8");
    assert.equal(
      createHash("sha256").update(source).digest("hex"),
      page.sourceHash,
      `${page.source}: stale rendered content`,
    );
    const chapter = data.documents.find((item) => item.source === page.source);
    assert.equal(
      document.querySelector("h1").textContent,
      chapter.title,
      `${page.source}: missing source title`,
    );
    for (const heading of chapter.headings)
      assert(
        document.getElementById(heading.id),
        `${page.source}: missing section ${heading.id}`,
      );
    assert(
      document.querySelector(`a[data-source-link][href$="/${page.source}"]`),
      `${page.source}: missing original Markdown link`,
    );
    const actualExamples = Array.from(
      document.querySelectorAll("#chapter-content pre code"),
      (node) => node.textContent.trimEnd(),
    );
    const expectedExamples = [];
    visit(unified().use(remarkParse).parse(source), "code", (node) => {
      expectedExamples.push(node.value.replace(/\r\n?/g, "\n").trimEnd());
    });
    assert.deepEqual(
      actualExamples,
      expectedExamples,
      `${page.source}: code examples changed during rendering`,
    );
    examples += expectedExamples.length;
    for (const element of document.querySelectorAll("#chapter-content *")) {
      assert(
        !["SCRIPT", "IFRAME", "OBJECT", "EMBED", "FORM"].includes(
          element.tagName,
        ),
        `${page.source}: unsafe element`,
      );
      assert(
        !element.getAttributeNames().some((name) => /^on/i.test(name)),
        `${page.source}: executable event attribute`,
      );
    }
  }
  const pageLinks = Array.from(document.querySelectorAll("a[href]"), (node) =>
    node.getAttribute("href"),
  );
  pages.set(page.route, { ids: new Set(ids), links: pageLinks });
  dom.window.close();
}
for (const [route, page] of pages) {
  for (const href of page.links) {
    const url = new URL(href, `https://local.invalid${data.base}${route}`);
    if (url.origin !== "https://local.invalid") continue;
    if (!url.pathname.startsWith(`${data.base}handbook/`)) continue;
    links++;
    const target = pages.get(url.pathname.slice(data.base.length));
    if (!target) failures.push(`${route} -> missing page ${href}`);
    else if (url.hash && !target.ids.has(decodeURIComponent(url.hash.slice(1))))
      failures.push(`${route} -> missing section ${href}`);
  }
}
assert.equal(failures.length, 0, failures.slice(0, 35).join("\n"));
const search = JSON.parse(
  await readFile("dist/handbook/search-index.json", "utf8"),
);
assert.equal(
  search.entries.length,
  data.documents.length,
  "full-text index omitted chapters",
);
assert.equal(
  search.buildId,
  data.buildId,
  "search index belongs to a different build",
);
const sitemap = await readFile("dist/sitemap.xml", "utf8");
for (const page of manifest.pages)
  assert(
    sitemap.includes(`/Abliteration/${page.route}</loc>`),
    `sitemap missing ${page.route}`,
  );
await mkdir("artifacts/handbook-audit", { recursive: true });
await writeFile(
  "artifacts/handbook-audit/static.json",
  JSON.stringify(
    {
      buildId: data.buildId,
      sourceCommit: data.sourceCommit,
      chapters: data.documents.length,
      pages: pages.size,
      codeExamples: examples,
      internalLinks: links,
      brokenLinks: failures.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Handbook audit passed: ${pages.size} static pages, ${examples} source-exact code examples, ${links} valid internal links.`,
);
