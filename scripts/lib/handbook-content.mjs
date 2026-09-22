import path from "node:path";
import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { sourceRoute } from "../../src/lib/handbook-routing.js";

export const repository = "https://github.com/adybag14-cyber/Abliteration";
export const publicSite = "https://adybag14-cyber.github.io/Abliteration/";
export const collections = [
  {
    id: "foundations",
    title: "Start here",
    description: "The concepts, vocabulary, and first experiments.",
    accent: "violet",
  },
  {
    id: "guides",
    title: "Practical guides",
    description: "Step-by-step workflows from setup to a measured candidate.",
    accent: "blue",
  },
  {
    id: "methods",
    title: "Methods",
    description: "Estimators, interventions, and the assumptions behind them.",
    accent: "cyan",
  },
  {
    id: "techniques",
    title: "Technique atlas",
    description:
      "Explore individual operators and architecture-specific routes.",
    accent: "violet",
  },
  {
    id: "experiments",
    title: "Experiments & evidence",
    description:
      "Evaluation, reproducibility, and the measured MiniCPM5 example.",
    accent: "emerald",
  },
  {
    id: "tools",
    title: "Tools & environments",
    description:
      "Native helpers, platform setup, and supporting tool references.",
    accent: "amber",
  },
  {
    id: "references",
    title: "Research & reference",
    description:
      "Primary papers, preserved source snapshots, and project policies.",
    accent: "rose",
  },
];
const priority = [
  "docs/overview.md",
  "docs/theory.md",
  "docs/complete-curriculum.md",
  "docs/cxx26-researcher-guide.md",
  "instructions/quickstart.md",
  "instructions/beginner-local-model-guide.md",
  "docs/selective-methods-2026.md",
  "docs/minicpm5-selective-study.md",
  "docs/evaluation.md",
  "docs/experiment-provenance.md",
  "docs/research-september-2026.md",
  "references.md",
];
const descriptions = {
  "docs/cxx26-researcher-guide.md":
    "Build confidence with the native C++26 lab, verified downloads, numerical operators, and reproducible first steps.",
  "docs/selective-methods-2026.md":
    "Understand the difference between shards, tensors, layers, and adapters. Plan a small edit and verify what stayed identical.",
  "docs/minicpm5-selective-study.md":
    "Inspect the executed MiniCPM5-1B comparison, its four-tensor edit budget, uncertainty, and reproducible evidence.",
  "docs/evaluation.md":
    "Design paired comparisons that keep refusal, capability, degeneration, and uncertainty separate.",
  "docs/experiment-provenance.md":
    "Connect each result to the exact model, data, configuration, and artifact hashes that produced it.",
  "references.md":
    "Follow the primary papers and tools behind the handbook, with the existing bibliography preserved.",
  "README.md":
    "A connected overview of the research handbook, native lab, selective workflows, and supporting material.",
};

export function collectionFor(source) {
  if (
    [
      "README.md",
      "docs/overview.md",
      "docs/theory.md",
      "docs/complete-curriculum.md",
      "docs/refusal-research-beginners-guide.md",
      "docs/risks-and-ethics.md",
    ].includes(source)
  )
    return "foundations";
  if (
    source.startsWith("instructions/") ||
    source === "docs/cxx26-researcher-guide.md"
  )
    return "guides";
  if (source.startsWith("methods/")) return "methods";
  if (source.startsWith("techniques/")) return "techniques";
  if (
    /minicpm|evaluation|experiment-provenance|comparative|selective-methods|use-cases/.test(
      source,
    )
  )
    return "experiments";
  if (
    source.startsWith("sources/") ||
    /research|paper-term|references|CONTRIBUTING|SECURITY/.test(source)
  )
    return "references";
  return "tools";
}

export function lessonFor(source) {
  if (source === "docs/cxx26-researcher-guide.md") return "workflow";
  if (/minicpm/.test(source)) return "study";
  if (/moe|router|vision-multimodal/.test(source)) return "routing";
  if (
    /evaluation|benchmark|provenance|risks|false-refusal|eval-driven/.test(
      source,
    )
  )
    return "evidence";
  if (/layer-selective|selective-methods/.test(source)) return "layers";
  if (/research|references|sources\//.test(source)) return "research";
  if (
    /theory|mean-difference|projected|subspace|orba|cosmic|directional|svd|multi-direction|harm-vs-refusal|gradient-rdo/.test(
      source,
    )
  )
    return "projection";
  return "workflow";
}

export function parseChapter(source, raw) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(raw);
  const titleNode = tree.children.find(
    (node) => node.type === "heading" && node.depth === 1,
  );
  const title = titleNode
    ? toString(titleNode).trim()
    : path.posix.basename(source, ".md");
  const firstParagraph = tree.children.find(
    (node) => node.type === "paragraph" && toString(node).trim().length > 30,
  );
  const text = toString(tree).replace(/\s+/g, " ").trim();
  const words = text.split(/\s+/).length;
  const code = [];
  visit(tree, "code", (node) => {
    code.push(node);
  });
  let description =
    descriptions[source] || (firstParagraph ? toString(firstParagraph) : title);
  description = description
    .replace(/\s+/g, " ")
    .replace(/^Goal:\s*/i, "")
    .trim();
  if (description.length > 190)
    description = description.slice(0, 187).replace(/\s+\S*$/, "") + "…";
  return {
    source,
    route: sourceRoute(source),
    title,
    description,
    collection: collectionFor(source),
    lesson: lessonFor(source),
    minutes: Math.max(1, Math.ceil(words / 220)),
    words,
    codeCount: code.length,
    order: priority.includes(source) ? priority.indexOf(source) : 100,
    archived: source.startsWith("sources/"),
    sourceHash: createHash("sha256").update(raw).digest("hex"),
    languages: [...new Set(code.map((node) => normalizeLanguage(node.lang)))],
    tree,
    text,
    code,
  };
}

export function normalizeLanguage(language) {
  const value = String(language || "text").toLowerCase();
  return (
    {
      sh: "bash",
      shell: "bash",
      shellscript: "bash",
      zsh: "bash",
      ps1: "powershell",
      pwsh: "powershell",
      "c++": "cpp",
      cxx: "cpp",
      jsonl: "json",
      txt: "text",
      plaintext: "text",
      console: "text",
      mermaid: "text",
    }[value] || value
  );
}

export function resolveReaderLink(
  href,
  source,
  knownSources,
  base,
  sourceCommit = "main",
) {
  if (!href || href.startsWith("#")) return href;
  let target = href;
  const own = target.match(
    /^https:\/\/github\.com\/adybag14-cyber\/Abliteration\/blob\/[^/]+\/(.+)$/,
  );
  if (own) target = "/" + own[1];
  else if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith("//"))
    return href;
  const [fileAndQuery, fragment] = target.split("#", 2);
  const file = decodeURIComponent(fileAndQuery.split("?", 1)[0]);
  const resolved = path.posix.normalize(
    file.startsWith("/")
      ? file.slice(1)
      : path.posix.join(path.posix.dirname(source), file),
  );
  if (resolved === ".." || resolved.startsWith("../"))
    return `${repository}/tree/${sourceCommit}`;
  if (knownSources.has(resolved))
    return base + sourceRoute(resolved) + (fragment ? `#${fragment}` : "");
  return `${repository}/blob/${sourceCommit}/${resolved.split("/").map(encodeURIComponent).join("/")}${fragment ? `#${fragment}` : ""}`;
}

function element(tagName, properties = {}, children = []) {
  return { type: "element", tagName, properties, children };
}
function text(value) {
  return { type: "text", value };
}
function plain(node) {
  return node.type === "text"
    ? node.value
    : (node.children || []).map(plain).join("");
}
const copyIcon =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4"/></svg>';
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

export async function renderChapter(
  chapter,
  { knownSources, base, sourceCommit, highlighter, diagrams },
) {
  const headings = [],
    related = new Set(),
    slugger = new GithubSlugger();
  let firstTitle = false,
    blockNumber = 0;
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize);
  const tree = await processor.run(chapter.tree);
  function transform(parent) {
    if (!parent.children) return;
    parent.children = parent.children.map((node) => {
      if (node.type !== "element") return node;
      const properties = node.properties || (node.properties = {});
      if (/^h[1-6]$/.test(node.tagName)) {
        const title = plain(node).trim(),
          id = slugger.slug(title);
        properties.id = id;
        if (node.tagName === "h1" && !firstTitle) {
          firstTitle = true;
          return element("span", { id, className: ["chapter-title-anchor"] });
        }
        if (node.tagName === "h1") node.tagName = "h2";
        const depth = Number(node.tagName.slice(1));
        if (depth <= 3) headings.push({ title, id, depth });
        node.children.push(
          element(
            "a",
            {
              href: `#${id}`,
              className: ["heading-permalink"],
              ariaLabel: `Link to ${title}`,
            },
            [text("#")],
          ),
        );
      }
      if (node.tagName === "a" && properties.href) {
        properties.href = resolveReaderLink(
          String(properties.href),
          chapter.source,
          knownSources,
          base,
          sourceCommit,
        );
        for (const source of knownSources)
          if (
            properties.href.split("#")[0] === base + sourceRoute(source) &&
            source !== chapter.source
          )
            related.add(source);
        if (/^https?:/.test(properties.href)) {
          properties.rel = ["noopener", "noreferrer"];
          properties.className = [
            ...(properties.className || []),
            "source-reference",
          ];
        }
      }
      if (node.tagName === "img") {
        const alt = String(properties.alt || "Linked source figure");
        return element("span", { className: ["linked-image-label"] }, [
          text(alt),
        ]);
      }
      if (node.tagName === "pre") {
        const code = node.children.find(
          (child) => child.type === "element" && child.tagName === "code",
        );
        if (code) {
          blockNumber += 1;
          const raw = plain(code).replace(/\n$/, ""),
            rawLang =
              (code.properties?.className || [])
                .find((value) => value.startsWith("language-"))
                ?.slice(9) || "text";
          if (rawLang === "mermaid") {
            const hash = createHash("sha256")
              .update(raw.trim())
              .digest("hex")
              .slice(0, 20);
            const diagram = diagrams[hash];
            if (!diagram)
              throw new Error(
                `Missing rendered diagram ${hash} in ${chapter.source}`,
              );
            return element("figure", { className: ["chapter-diagram"] }, [
              element("img", {
                src: base + diagram.light,
                alt: `Workflow diagram from ${chapter.title}`,
                className: ["diagram-light"],
                loading: "lazy",
              }),
              element("img", {
                src: base + diagram.dark,
                alt: `Workflow diagram from ${chapter.title}`,
                className: ["diagram-dark"],
                loading: "lazy",
              }),
              element("figcaption", {}, [
                text("Diagram rendered from the chapter's source. "),
                element(
                  "button",
                  { type: "button", "data-expand-diagram": "" },
                  [text("Expand diagram")],
                ),
                element("a", { href: base + diagram.light }, [
                  text("Open SVG"),
                ]),
              ]),
              element("details", { className: ["diagram-source"] }, [
                element("summary", {}, [text("Inspect diagram notation")]),
                element("pre", {}, [element("code", {}, [text(raw)])]),
              ]),
            ]);
          }
          const requested = normalizeLanguage(rawLang);
          const language = highlighter.getLoadedLanguages().includes(requested)
            ? requested
            : "text";
          const html = highlighter.codeToHtml(raw, {
            lang: language,
            themes: { light: "github-light", dark: "github-dark-high-contrast" },
          });
          return {
            type: "raw",
            value: `<figure class="chapter-code" data-code-language="${escapeHtml(requested)}"><figcaption><span>${escapeHtml(requested === "text" ? "Example" : requested)}</span><button type="button" data-copy-code aria-label="Copy ${escapeHtml(requested)} example ${blockNumber}">${copyIcon}<span>Copy</span></button></figcaption>${html}</figure>`,
          };
        }
      }
      transform(node);
      if (node.tagName === "table")
        return element(
          "div",
          {
            className: ["chapter-table-scroll"],
            role: "region",
            ariaLabel: "Scrollable reference table",
            tabIndex: 0,
          },
          [node],
        );
      if (node.tagName === "blockquote")
        properties.className = [
          ...(properties.className || []),
          "chapter-callout",
        ];
      return node;
    });
  }
  transform(tree);
  const html = unified()
    .use(rehypeStringify, { allowDangerousHtml: true })
    .stringify(tree);
  if (/<script\b|\son(?:click|load|error)\s*=/i.test(html))
    throw new Error(`Unsafe rendered content in ${chapter.source}`);
  return {
    ...chapter,
    tree: undefined,
    code: undefined,
    text: undefined,
    html,
    headings,
    related: [...related],
  };
}
