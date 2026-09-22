import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { createHighlighter, bundledLanguages } from "shiki";
import { chromium } from "playwright";
import {
  isReaderSource,
  readerRoots,
  readerRootFiles,
} from "../src/lib/handbook-routing.js";
import {
  collections,
  parseChapter,
  renderChapter,
} from "./lib/handbook-content.mjs";

const root = process.cwd();
const output = path.join(root, "artifacts/handbook-build");
const mediaDirectory = path.join(root, "public/handbook-media");
const base = process.env.GITHUB_ACTIONS ? "/Abliteration/" : "/";
const buildId = process.env.VITE_BUILD_SHA || "local";
const git = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
});
if (git.status !== 0) throw new Error("Cannot resolve handbook source commit");
const sourceCommit = git.stdout.trim();
const files = [];
async function collect(directory) {
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const relative = path.posix.join(directory, entry.name);
    if (
      entry.name.startsWith(".") ||
      entry.name.startsWith("build-") ||
      entry.name.startsWith("ci-build-") ||
      ["node_modules", "build", "ci-build", "dist", "zig-canonical"].includes(
        entry.name,
      )
    )
      continue;
    if (entry.isDirectory()) await collect(relative);
    else if (entry.isFile() && isReaderSource(relative)) files.push(relative);
  }
}
for (const directory of readerRoots) await collect(directory);
files.push(
  ...readerRootFiles.filter((file) => existsSync(path.join(root, file))),
);
if (files.length > 512)
  throw new Error("Handbook exceeds the 512-document build bound");
const documents = [];
for (const source of [...new Set(files)].sort()) {
  if ((await stat(source)).size > 512 * 1024)
    throw new Error(`Oversized source document: ${source}`);
  documents.push(parseChapter(source, await readFile(source, "utf8")));
}
const knownSources = new Set(documents.map((document) => document.source));
if (
  new Set(documents.map((document) => document.route)).size !== documents.length
)
  throw new Error("Handbook route collision");
await mkdir(output, { recursive: true });
await mkdir(mediaDirectory, { recursive: true });

// Diagrams are generated assets, cached by notation + renderer version. A clean
// checkout builds without launching a browser when the source has not changed.
const mermaidVersion = JSON.parse(
  await readFile("node_modules/mermaid/package.json", "utf8"),
).version;
const diagramManifestPath = path.join(mediaDirectory, "manifest.json");
let diagramCache = existsSync(diagramManifestPath)
  ? JSON.parse(await readFile(diagramManifestPath, "utf8"))
  : {};
const diagrams = {};
let browser;
try {
  for (const document of documents) {
    for (const block of document.code.filter(
      (node) => node.lang === "mermaid",
    )) {
      const notation = block.value.trim();
      const id = createHash("sha256")
        .update(notation)
        .digest("hex")
        .slice(0, 20);
      const renderer = `mermaid-${mermaidVersion}-handbook-v1`;
      const filenames = {
        light: `handbook-media/${id}-light.svg`,
        dark: `handbook-media/${id}-dark.svg`,
      };
      const cached = diagramCache[id];
      if (
        cached?.renderer !== renderer ||
        !Object.values(filenames).every((file) =>
          existsSync(path.join(root, "public", file)),
        )
      ) {
        browser ||= await chromium.launch({ headless: true });
        const page = await browser.newPage();
        try {
          await page.addScriptTag({
            path: path.join(root, "node_modules/mermaid/dist/mermaid.min.js"),
          });
          for (const theme of ["light", "dark"]) {
            const svg = await page.evaluate(
              async ({ notation, theme, id }) => {
                const mermaid = window.mermaid;
                mermaid.initialize({
                  startOnLoad: false,
                  securityLevel: "strict",
                  htmlLabels: false,
                  theme: "base",
                  flowchart: { curve: "basis" },
                  themeVariables:
                    theme === "light"
                      ? {
                          background: "#faf9f7",
                          primaryColor: "#ede9fe",
                          primaryTextColor: "#252333",
                          primaryBorderColor: "#8b7ae8",
                          lineColor: "#6d5ce8",
                          secondaryColor: "#e0f2fe",
                          tertiaryColor: "#e8f6ef",
                        }
                      : {
                          background: "#191921",
                          primaryColor: "#302a4a",
                          primaryTextColor: "#f3f2f8",
                          primaryBorderColor: "#9c8ef0",
                          lineColor: "#aaa0f1",
                          secondaryColor: "#203545",
                          tertiaryColor: "#20382f",
                        },
                });
                return (
                  await mermaid.render(`diagram-${id}-${theme}`, notation)
                ).svg;
              },
              { notation, theme, id },
            );
            if (
              /<script\b|<foreignObject\b|\son(?:click|load|error)=/i.test(svg)
            )
              throw new Error("Unsafe Mermaid SVG output");
            await writeFile(
              path.join(root, "public", filenames[theme]),
              svg,
              "utf8",
            );
          }
        } finally {
          await page.close();
        }
        diagramCache[id] = { renderer, source: document.source, ...filenames };
      }
      diagrams[id] = filenames;
    }
  }
} finally {
  await browser?.close();
}
await writeFile(
  diagramManifestPath,
  JSON.stringify(diagramCache, null, 2) + "\n",
);

const languages = [
  ...new Set(documents.flatMap((document) => document.languages)),
].filter((language) => bundledLanguages[language]);
const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark-high-contrast"],
  langs: languages,
});
const compiled = [];
try {
  for (const document of documents)
    compiled.push(
      await renderChapter(document, {
        knownSources,
        base,
        sourceCommit,
        highlighter,
        diagrams,
      }),
    );
} finally {
  highlighter.dispose();
}
const groupOrder = new Map(
  collections.map((collection, index) => [collection.id, index]),
);
compiled.sort(
  (a, b) =>
    groupOrder.get(a.collection) - groupOrder.get(b.collection) ||
    a.order - b.order ||
    a.title.localeCompare(b.title),
);
const catalog = compiled.map(
  ({
    source,
    route,
    title,
    description,
    collection,
    lesson,
    minutes,
    words,
    codeCount,
    order,
    archived,
  }) => ({
    source,
    route,
    title,
    description,
    collection,
    lesson,
    minutes,
    words,
    codeCount,
    order,
    archived,
  }),
);
const search = {
  buildId,
  entries: documents.map((document) => ({
    source: document.source,
    title: document.title,
    collection: document.collection,
    text: document.text,
    headings: compiled.find((entry) => entry.source === document.source)
      .headings,
  })),
};
const payload = {
  schemaVersion: 1,
  base,
  buildId,
  sourceCommit,
  collections,
  catalog,
  documents: compiled,
};
await writeFile(path.join(output, "content.json"), JSON.stringify(payload));
await writeFile(path.join(output, "search-index.json"), JSON.stringify(search));
await writeFile(
  path.join(output, "routes.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      routes: catalog.map(({ source, route, title }) => ({
        source,
        route,
        title,
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${compiled.length} complete handbook documents, ${compiled.reduce((n, doc) => n + doc.codeCount, 0)} code examples, and ${Object.keys(diagrams).length} source diagrams.`,
);
