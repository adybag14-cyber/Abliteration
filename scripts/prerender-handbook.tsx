import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { HandbookApp } from "../src/handbook/HandbookApp";
import type { Chapter, HandbookBootstrap } from "../src/handbook/types";

const root = process.cwd();
const dist = path.join(root, "dist");
const prepared = path.join(root, "artifacts/handbook-build");
const data = JSON.parse(
  await readFile(path.join(prepared, "content.json"), "utf8"),
);
const template = await readFile(path.join(dist, "handbook.html"), "utf8");
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const safeJson = (value: unknown) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
const hash = (text: string) =>
  createHash("sha256").update(text).digest("base64");
const site = "https://adybag14-cyber.github.io/Abliteration/";
const pages = [];
for (const chapter of [null, ...data.documents] as (Chapter | null)[]) {
  const route = chapter?.route || "handbook/";
  const canonical = site + route;
  const title = `${chapter?.title || "Research library"} | Abliteration Handbook`;
  const description =
    chapter?.description ||
    `Explore ${data.catalog.length} complete research chapters, interactive explanations, reproducible guides, and primary references.`;
  const boot: HandbookBootstrap = {
    chapter,
    catalog: data.catalog,
    collections: data.collections,
    base: data.base,
    buildId: data.buildId,
    sourceCommit: data.sourceCommit,
    canonical,
    searchUrl: `${data.base}handbook/search-index.json`,
  };
  const content = renderToString(createElement(HandbookApp, { boot }), {
    identifierPrefix: "handbook-",
  });
  const payload = safeJson({
    ...boot,
    chapter: chapter ? { ...chapter, html: undefined } : null,
  });
  const linked = safeJson({
    "@context": "https://schema.org",
    "@type": chapter ? "TechArticle" : "CollectionPage",
    headline: chapter?.title || "Abliteration research library",
    description,
    url: canonical,
    mainEntityOfPage: canonical,
    isAccessibleForFree: true,
    isPartOf: { "@type": "WebSite", name: "Abliteration Handbook", url: site },
    author: {
      "@type": "Person",
      name: "adybag14-cyber",
      url: "https://github.com/adybag14-cyber",
    },
    ...(chapter
      ? {
          wordCount: chapter.words,
          citation: `https://github.com/adybag14-cyber/Abliteration/blob/${data.sourceCommit}/${chapter.source}`,
        }
      : {}),
  });
  const head = `<title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:type" content="${chapter ? "article" : "website"}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Abliteration Handbook" />
    <meta property="og:image" content="${site}og-card.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-${hash(linked)}' 'sha256-${hash(payload)}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'" />
    <script type="application/ld+json">${linked}</script>`;
  const html = template
    .replace("<!--HANDBOOK_HEAD-->", () => head)
    .replace("<!--HANDBOOK_CONTENT-->", () => content)
    .replace(
      "<!--HANDBOOK_DATA-->",
      () =>
        `<script id="handbook-data" type="application/json">${payload}</script>`,
    );
  if (/<!--HANDBOOK_|__ABLITERATION_BUILD_SHA__/.test(html))
    throw new Error(`Unresolved template token in ${route}`);
  await mkdir(path.join(dist, route), { recursive: true });
  await writeFile(path.join(dist, route, "index.html"), html);
  pages.push({
    source: chapter?.source || null,
    route,
    title: chapter?.title || "Research library",
    sourceHash: chapter?.sourceHash || null,
    bytes: Buffer.byteLength(html),
  });
}
await writeFile(
  path.join(dist, "handbook/search-index.json"),
  await readFile(path.join(prepared, "search-index.json")),
);
await writeFile(
  path.join(dist, "handbook/manifest.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      buildId: data.buildId,
      sourceCommit: data.sourceCommit,
      chapters: data.catalog.length,
      pages,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[site, ...pages.map((page) => site + page.route)].map((url) => `  <url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await rm(path.join(dist, "handbook.html"));
console.log(
  `Prerendered ${pages.length} directly addressable handbook pages with complete source content.`,
);
