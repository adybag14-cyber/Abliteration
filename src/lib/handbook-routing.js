/** Shared by the static compiler and the browser; Markdown remains the authority. */
export const readerRoots = [
  "docs",
  "instructions",
  "methods",
  "techniques",
  "cxx",
  "sources",
];
export const readerRootFiles = [
  "README.md",
  "RESEARCH-TOOLS.md",
  "references.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
];

export function isReaderSource(source) {
  const normalized = String(source).replaceAll("\\", "/");
  const parts = normalized.split("/");
  return (
    normalized.endsWith(".md") &&
    !parts.some(
      (part) =>
        part.startsWith(".") ||
        part.startsWith("build-") ||
        part.startsWith("ci-build-") ||
        ["build", "ci-build", "dist", "node_modules", "zig-canonical"].includes(
          part,
        ),
    ) &&
    (readerRootFiles.includes(normalized) || readerRoots.includes(parts[0]))
  );
}

export function sourceRoute(source) {
  const normalized = String(source).replaceAll("\\", "/");
  if (!isReaderSource(normalized))
    throw new Error(`Not a reader document: ${normalized}`);
  const slug =
    normalized === "README.md"
      ? "overview"
      : normalized.replace(/\.md$/, "").toLowerCase();
  return `handbook/${slug.split("/").map(encodeURIComponent).join("/")}/`;
}

export function readerUrl(source, base = "/") {
  const [file, fragment] = source.split("#", 2);
  return `${base.endsWith("/") ? base : `${base}/`}${sourceRoute(file)}${fragment ? `#${fragment}` : ""}`;
}
