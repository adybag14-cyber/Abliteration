import { memo, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Compass,
  FileText,
  FlaskConical,
  GitFork,
  Layers3,
  Link as LinkIcon,
  Menu,
  Moon,
  Orbit,
  Search,
  ShieldCheck,
  Sun,
  Terminal,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { readerBase, readerUrl } from "@/lib/handbook-routing.js";
import { ChapterCompanion } from "./lessons";
import { ChapterIllustration } from "./visuals";
import type {
  Chapter,
  ChapterSummary,
  HandbookBootstrap,
  SearchEntry,
} from "./types";

const repository = "https://github.com/adybag14-cyber/Abliteration";
const icons = {
  foundations: Compass,
  guides: BookOpen,
  methods: Layers3,
  techniques: FlaskConical,
  experiments: ShieldCheck,
  tools: Terminal,
  references: FileText,
};

function ThemeButton() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("abliteration-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark, ready]);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((value) => !value)}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}

export function rankSearch(
  catalog: ChapterSummary[],
  query: string,
  fulltext: SearchEntry[] | null = null,
) {
  const terms = query
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12);
  const texts = new Map(
    fulltext?.map((entry) => [entry.source, entry.text.toLocaleLowerCase()]) ||
      [],
  );
  return catalog
    .map((chapter) => {
      const title = chapter.title.toLocaleLowerCase();
      const description =
        `${chapter.description} ${chapter.source}`.toLocaleLowerCase();
      const body = texts.get(chapter.source) || "";
      const matches = terms.every(
        (term) =>
          title.includes(term) ||
          description.includes(term) ||
          body.includes(term),
      );
      const score = terms.reduce(
        (sum, term) =>
          sum +
          (title.includes(term)
            ? 10
            : description.includes(term)
              ? 4
              : body.includes(term)
                ? 1
                : 0),
        0,
      );
      return { chapter, matches, score };
    })
    .filter((result) => result.matches)
    .sort((a, b) => b.score - a.score || a.chapter.order - b.chapter.order);
}

function SearchDialog({
  boot,
  open,
  onOpenChange,
}: {
  boot: HandbookBootstrap;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (!open || index) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(boot.searchUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Search index unavailable");
        return response.json();
      })
      .then((data) => {
        setIndex(data.entries);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFallback(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [open, index, boot.searchUrl]);
  const results = useMemo(
    () => rankSearch(boot.catalog, query, index).slice(0, 18),
    [boot.catalog, query, index],
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="handbook-search-dialog p-0">
        <DialogTitle className="sr-only">Search the handbook</DialogTitle>
        <DialogDescription className="sr-only">
          Search chapter titles, topics, and full chapter content. Use the arrow
          keys and Enter to open a result.
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search chapters, concepts, or commands…"
            aria-label="Search all handbook content"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>
              No matching chapters. Try a method, platform, or shorter phrase.
            </CommandEmpty>
            {results.map(({ chapter }) => (
              <CommandItem
                key={chapter.source}
                value={chapter.source}
                className="handbook-search-result"
                onSelect={() => {
                  window.location.assign(
                    readerUrl(chapter.source, readerBase(boot.base)),
                  );
                }}
              >
                <FileText aria-hidden="true" />
                <div>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.description}</span>
                  <small>
                    {
                      boot.collections.find(
                        (group) => group.id === chapter.collection,
                      )?.title
                    }{" "}
                    · {chapter.minutes} min read
                  </small>
                </div>
                <ArrowUpRight aria-hidden="true" />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <div className="search-footer">
          <span>
            {loading
              ? "Loading full-text index…"
              : fallback
                ? "Title and topic search available"
                : index
                  ? "Full-text search · stays in your browser"
                  : "Search the complete handbook"}
          </span>
          <kbd>Esc</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Sidebar({ boot }: { boot: HandbookBootstrap }) {
  return (
    <nav className="handbook-sidebar-content" aria-label="Handbook chapters">
      <a
        className="sidebar-library-link"
        href={`${readerBase(boot.base)}handbook/`}
      >
        <BookOpen aria-hidden="true" /> Browse the library{" "}
        <ArrowUpRight aria-hidden="true" />
      </a>
      {boot.collections.map((collection) => {
        const Icon = icons[collection.id];
        const chapters = boot.catalog.filter(
          (chapter) => chapter.collection === collection.id,
        );
        return (
          <details
            key={collection.id}
            open={
              boot.chapter?.collection === collection.id ||
              (!boot.chapter && collection.id === "foundations")
            }
            className="sidebar-group"
          >
            <summary>
              <Icon aria-hidden="true" />
              <span>{collection.title}</span>
              <small>{chapters.length}</small>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div>
              {chapters.map((chapter) => (
                <a
                  key={chapter.source}
                  href={readerUrl(chapter.source, readerBase(boot.base))}
                  aria-current={
                    chapter.source === boot.chapter?.source ? "page" : undefined
                  }
                >
                  {chapter.title}
                </a>
              ))}
            </div>
          </details>
        );
      })}
      <div className="sidebar-bottom">
        <a href={readerBase(boot.base)}>
          <ArrowLeft aria-hidden="true" /> Interactive field guide
        </a>
        <a href={repository}>
          <GitFork aria-hidden="true" /> Repository
        </a>
      </div>
    </nav>
  );
}

function Header({
  boot,
  progress,
  onSearch,
}: {
  boot: HandbookBootstrap;
  progress: number;
  onSearch: () => void;
}) {
  return (
    <header className="handbook-header">
      <div className="handbook-header-inner">
        <a
          href={`${readerBase(boot.base)}handbook/`}
          className="handbook-brand"
        >
          <span className="handbook-logo">
            <Orbit aria-hidden="true" />
          </span>
          <span>
            Abliteration <strong>Handbook</strong>
          </span>
        </a>
        <a href={readerBase(boot.base)} className="header-field-link">
          Field guide <ArrowUpRight aria-hidden="true" />
        </a>
        <div className="handbook-header-actions">
          <Button
            variant="secondary"
            className="handbook-search-trigger"
            onClick={onSearch}
            aria-label="Search the handbook"
          >
            <Search aria-hidden="true" />
            <span>Search the handbook</span>
            <kbd>⌘ K</kbd>
          </Button>
          <ThemeButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="handbook-menu-trigger"
                variant="ghost"
                size="icon"
                aria-label="Open handbook navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="handbook-mobile-sheet">
              <SheetTitle>Research handbook</SheetTitle>
              <SheetDescription>
                Choose a chapter or explore a collection.
              </SheetDescription>
              <Sidebar boot={boot} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {boot.chapter && (
        <Progress
          value={progress}
          className="handbook-reading-progress"
          aria-label="Chapter reading progress"
        />
      )}
    </header>
  );
}

function Library({ boot }: { boot: HandbookBootstrap }) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("all");
  const [limit, setLimit] = useState(24);
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("abliteration-bookmarks") || "[]",
      );
      if (Array.isArray(saved))
        setBookmarks(saved.filter((source) => typeof source === "string"));
    } catch {}
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const group = params.get("collection");
    if (group && boot.collections.some((item) => item.id === group))
      setCollection(group);
    setQuery(params.get("q") || "");
  }, [boot.collections]);
  const filtered = rankSearch(
    boot.catalog.filter(
      (chapter) =>
        (collection === "all" || chapter.collection === collection) &&
        (!savedOnly || bookmarks.includes(chapter.source)),
    ),
    query,
  ).map((result) => result.chapter);
  const featured = [
    "docs/cxx26-researcher-guide.md",
    "docs/selective-methods-2026.md",
    "docs/minicpm5-selective-study.md",
  ].map((source) => boot.catalog.find((chapter) => chapter.source === source)!);
  return (
    <main id="main-content" className="handbook-library">
      <section className="library-hero">
        <div>
          <Badge>
            <BookOpen aria-hidden="true" /> Research, made navigable
          </Badge>
          <h1>
            The complete handbook.
            <br />
            <span>One connected place to learn.</span>
          </h1>
          <p>
            Move from the core ideas to a reproducible experiment. Every chapter
            has its own reading space, visual companion, and a link back to the
            source.
          </p>
          <div className="library-stats">
            <span>
              <strong>{boot.catalog.length}</strong> chapters
            </span>
            <span>
              <strong>
                {boot.catalog.reduce(
                  (sum, chapter) => sum + chapter.codeCount,
                  0,
                )}
              </strong>{" "}
              code examples
            </span>
            <span>
              <strong>7</strong> collections
            </span>
          </div>
        </div>
        <ChapterIllustration kind="research" />
      </section>
      <section
        className="library-featured"
        aria-label="Suggested starting points"
      >
        {featured.map((chapter, index) => (
          <a
            key={chapter.source}
            href={readerUrl(chapter.source, readerBase(boot.base))}
            className="featured-chapter"
          >
            <span className="eyebrow">
              {
                [
                  "Start with the native lab",
                  "Understand selective edits",
                  "Inspect a real experiment",
                ][index]
              }
            </span>
            <div>
              <h2>{chapter.title}</h2>
              <ArrowUpRight aria-hidden="true" />
            </div>
            <p>{chapter.description}</p>
            <span className="featured-meta">
              {chapter.minutes} min read · {chapter.codeCount} examples
            </span>
          </a>
        ))}
      </section>
      <section id="library-index" className="library-index">
        <div className="library-index-heading">
          <div>
            <span className="eyebrow">Choose your next chapter</span>
            <h2>Explore the collections.</h2>
          </div>
          <label className="library-search">
            <Search aria-hidden="true" />
            <Input
              aria-label="Filter the chapter library"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(24);
              }}
              placeholder="Find a chapter or topic…"
            />
          </label>
        </div>
        <div
          className="collection-filters"
          role="group"
          aria-label="Filter handbook collection"
        >
          <Button
            size="sm"
            variant={collection === "all" ? "default" : "secondary"}
            aria-pressed={collection === "all"}
            onClick={() => {
              setCollection("all");
              setLimit(24);
            }}
          >
            All chapters
          </Button>
          {boot.collections.map((group) => (
            <Button
              key={group.id}
              size="sm"
              variant={collection === group.id ? "default" : "secondary"}
              aria-pressed={collection === group.id}
              onClick={() => {
                setCollection(group.id);
                setLimit(24);
              }}
            >
              {group.title}
            </Button>
          ))}
        </div>
        <Button
          className="library-saved-filter"
          variant="ghost"
          size="sm"
          aria-pressed={savedOnly}
          onClick={() => {
            setSavedOnly((value) => !value);
            setLimit(24);
          }}
        >
          <Bookmark aria-hidden="true" /> Saved chapters ({bookmarks.length})
        </Button>
        <p className="library-result-count" role="status">
          {filtered.length} chapters match
        </p>
        <div className="chapter-card-grid">
          {filtered.slice(0, limit).map((chapter) => {
            const Icon = icons[chapter.collection];
            return (
              <a
                key={chapter.source}
                href={readerUrl(chapter.source, readerBase(boot.base))}
                className={`chapter-card accent-${chapter.collection}`}
              >
                <span className="chapter-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="chapter-card-collection">
                  {
                    boot.collections.find(
                      (group) => group.id === chapter.collection,
                    )?.title
                  }
                </span>
                <h3>{chapter.title}</h3>
                <p>{chapter.description}</p>
                <div>
                  <span>
                    {chapter.minutes} min · {chapter.codeCount} examples
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </div>
              </a>
            );
          })}
        </div>
        {!filtered.length && (
          <div className="library-empty">
            <Search aria-hidden="true" />
            <h3>No chapters match this filter.</h3>
            <p>Try a broader term, or choose another collection.</p>
          </div>
        )}
        {filtered.length > limit && (
          <Button
            className="library-show-more"
            variant="secondary"
            onClick={() => setLimit((value) => value + 24)}
          >
            Show more chapters <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </section>
      <details className="library-text-index">
        <summary>
          Browse the complete text index{" "}
          <span>{boot.catalog.length} chapters</span>
        </summary>
        {boot.collections.map((group) => (
          <section key={group.id}>
            <h3>{group.title}</h3>
            <ul>
              {boot.catalog
                .filter((chapter) => chapter.collection === group.id)
                .map((chapter) => (
                  <li key={chapter.source}>
                    <a href={readerUrl(chapter.source, readerBase(boot.base))}>
                      {chapter.title}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </details>
    </main>
  );
}

// Keep the source DOM intact when progress, selection, or toolbar state changes.
// Replacing innerHTML would reset text selection, details, and lazy image loads.
const ChapterBody = memo(function ChapterBody({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  return (
    <article
      id="chapter-content"
      className="chapter-prose"
      aria-label={`${title} — full chapter`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

function ChapterReader({
  boot,
  onProgress,
}: {
  boot: HandbookBootstrap;
  onProgress: (value: number) => void;
}) {
  const chapter = boot.chapter!;
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [status, setStatus] = useState("");
  const [activeHeading, setActiveHeading] = useState(
    chapter.headings[0]?.id || "",
  );
  const [textSize, setTextSize] = useState("comfortable");
  const [allCheckpoints, setAllCheckpoints] = useState(false);
  const [diagram, setDiagram] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const checkpoints = chapter.headings.filter((heading) => heading.depth === 2);
  const progressKey = `abliteration-reading:${chapter.source}:${chapter.sourceHash.slice(0, 12)}`;
  const group = boot.collections.find(
    (collection) => collection.id === chapter.collection,
  )!;
  const sameCollection = boot.catalog.filter(
    (item) => item.collection === chapter.collection,
  );
  const position = sameCollection.findIndex(
    (item) => item.source === chapter.source,
  );
  const adjacent = [sameCollection[position - 1], sameCollection[position + 1]];
  const related = chapter.related
    .map((source) => boot.catalog.find((item) => item.source === source))
    .filter(Boolean)
    .slice(0, 4) as ChapterSummary[];
  const sourceUrl = `${repository}/blob/${encodeURIComponent(boot.sourceCommit)}/${chapter.source.split("/").map(encodeURIComponent).join("/")}`;
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(progressKey) || "[]");
      if (Array.isArray(stored))
        setReviewed(
          stored.filter((id) => checkpoints.some((item) => item.id === id)),
        );
      const bookmarks = JSON.parse(
        localStorage.getItem("abliteration-bookmarks") || "[]",
      );
      if (Array.isArray(bookmarks))
        setSaved(bookmarks.includes(chapter.source));
      setWrap(localStorage.getItem("abliteration-wrap-code") === "true");
      const density = localStorage.getItem("abliteration-reading-density");
      if (density && ["compact", "comfortable", "large"].includes(density))
        setTextSize(density);
    } catch {}
  }, [chapter.source, progressKey]);
  useEffect(() => {
    const article = document.getElementById("chapter-content");
    if (!article) return;
    let frame = 0;
    const update = () => {
      const rect = article.getBoundingClientRect();
      const distance = Math.max(
        1,
        article.scrollHeight - window.innerHeight + 100,
      );
      onProgress(
        Math.max(0, Math.min(100, ((100 - rect.top) / distance) * 100)),
      );
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                  (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
                );
              if (visible.length) setActiveHeading(visible[0].target.id);
            },
            { rootMargin: "-90px 0px -65% 0px" },
          );
    article
      .querySelectorAll("h2,h3")
      .forEach((heading) => observer?.observe(heading));
    const copy = async (event: Event) => {
      const target = event.target as Element;
      const expand = target.closest("button[data-expand-diagram]");
      if (expand) {
        const image = expand
          .closest("figure")
          ?.querySelector<HTMLImageElement>(
            document.documentElement.classList.contains("dark")
              ? ".diagram-dark"
              : ".diagram-light",
          );
        if (image) {
          setZoom(1);
          setDiagram({ src: image.src, alt: image.alt });
        }
        return;
      }
      const button = target.closest<HTMLButtonElement>(
        "button[data-copy-code]",
      );
      if (!button) return;
      const code =
        button.closest(".chapter-code")?.querySelector("code")?.textContent ||
        "";
      try {
        await navigator.clipboard.writeText(code);
        setStatus("Code example copied.");
      } catch {
        setStatus("Clipboard unavailable. Select the code example to copy it.");
      }
    };
    article.addEventListener("click", copy);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      article.removeEventListener("click", copy);
    };
  }, [chapter.source, onProgress]);
  function mark(id: string) {
    const next = reviewed.includes(id)
      ? reviewed.filter((value) => value !== id)
      : [...reviewed, id];
    setReviewed(next);
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
    } catch {}
  }
  function bookmark() {
    const next = !saved;
    setSaved(next);
    try {
      const current = JSON.parse(
        localStorage.getItem("abliteration-bookmarks") || "[]",
      );
      const values = Array.isArray(current)
        ? current.filter(
            (value) => typeof value === "string" && value !== chapter.source,
          )
        : [];
      localStorage.setItem(
        "abliteration-bookmarks",
        JSON.stringify(next ? [...values, chapter.source] : values),
      );
    } catch {}
    setStatus(
      next
        ? "Chapter saved in this browser."
        : "Chapter removed from saved items.",
    );
  }
  const toc = (
    <div className="chapter-toc-content">
      <span className="eyebrow">On this page</span>
      <a href="#chapter-companion-anchor" className="toc-companion-link">
        <FlaskConical aria-hidden="true" /> Interactive companion
      </a>
      <nav aria-label="On this page">
        {chapter.headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`${heading.depth === 3 ? "toc-child" : ""} ${activeHeading === heading.id ? "active" : ""}`}
            aria-current={activeHeading === heading.id ? "location" : undefined}
          >
            {heading.title}
          </a>
        ))}
      </nav>
      <div className="reading-checkpoints">
        <span className="eyebrow">Personal reading progress</span>
        <p>
          {reviewed.length}/{checkpoints.length} sections reviewed
        </p>
        {checkpoints
          .slice(0, allCheckpoints ? undefined : 12)
          .map((heading) => (
            <button
              key={heading.id}
              type="button"
              aria-pressed={reviewed.includes(heading.id)}
              aria-label={`Mark ${heading.title} reviewed`}
              onClick={() => mark(heading.id)}
            >
              <span className={reviewed.includes(heading.id) ? "checked" : ""}>
                {reviewed.includes(heading.id) && <Check aria-hidden="true" />}
              </span>
              {heading.title}
            </button>
          ))}
        {checkpoints.length > 12 && (
          <button
            className="show-checkpoints"
            onClick={() => setAllCheckpoints((value) => !value)}
          >
            {allCheckpoints
              ? "Show fewer checkpoints"
              : `Show all ${checkpoints.length} checkpoints`}
          </button>
        )}
      </div>
      <a className="toc-source-link" href={sourceUrl} data-source-link>
        <GitFork aria-hidden="true" /> View original Markdown
      </a>
    </div>
  );
  return (
    <div className={`handbook-document-layout accent-${chapter.collection}`}>
      <aside className="handbook-sidebar">
        <Sidebar boot={boot} />
      </aside>
      <main
        id="main-content"
        className="handbook-document"
        data-text-size={textSize}
        data-wrap-code={wrap}
      >
        <Breadcrumb className="chapter-breadcrumbs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`${readerBase(boot.base)}handbook/`}>
                Handbook
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`${readerBase(boot.base)}handbook/?collection=${encodeURIComponent(chapter.collection)}`}
              >
                {group.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{chapter.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <section className="chapter-hero">
          <div>
            <span className="chapter-kicker">
              <span /> {group.title}
              {chapter.archived && " · source archive"}
            </span>
            <h1>{chapter.title}</h1>
            <p>{chapter.description}</p>
            <div className="chapter-facts">
              <span>
                <BookOpen aria-hidden="true" /> {chapter.minutes} min read
              </span>
              <span>
                <Code2 aria-hidden="true" /> {chapter.codeCount} examples
              </span>
              <span>
                <FileText aria-hidden="true" /> Source-linked
              </span>
            </div>
          </div>
          <ChapterIllustration kind={chapter.lesson} />
        </section>
        <div className="chapter-toolbar">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={bookmark}
              aria-pressed={saved}
            >
              <Bookmark
                aria-hidden="true"
                fill={saved ? "currentColor" : "none"}
              />
              {saved ? "Saved" : "Save chapter"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(boot.canonical);
                  setStatus("Permanent chapter link copied.");
                } catch {
                  setStatus(
                    "Clipboard unavailable. Copy the page address from your browser.",
                  );
                }
              }}
            >
              <LinkIcon aria-hidden="true" /> Copy link
            </Button>
          </div>
          <div>
            <label className="reader-size-label">
              <span className="sr-only">Reading density</span>
              <select
                aria-label="Reading density"
                value={textSize}
                onChange={(event) => {
                  setTextSize(event.target.value);
                  try {
                    localStorage.setItem(
                      "abliteration-reading-density",
                      event.target.value,
                    );
                  } catch {}
                }}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
                <option value="large">Large type</option>
              </select>
            </label>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={wrap}
              onClick={() => {
                setWrap((value) => !value);
                try {
                  localStorage.setItem("abliteration-wrap-code", String(!wrap));
                } catch {}
              }}
            >
              <WrapText aria-hidden="true" /> Wrap code
            </Button>
          </div>
        </div>
        <p className="reader-status" role="status" aria-live="polite">
          {status}
        </p>
        <details className="mobile-toc">
          <summary>
            In this chapter <ChevronDown aria-hidden="true" />
          </summary>
          {toc}
        </details>
        <div id="chapter-companion-anchor">
          <ChapterCompanion chapter={chapter} />
        </div>
        <ChapterBody html={chapter.html} title={chapter.title} />
        <Dialog
          open={Boolean(diagram)}
          onOpenChange={(open) => {
            if (!open) setDiagram(null);
          }}
        >
          <DialogContent className="diagram-dialog">
            <DialogTitle>Source workflow diagram</DialogTitle>
            <DialogDescription>
              Zoom into the original vector figure. Scroll the figure to inspect
              branches at a readable size.
            </DialogDescription>
            <div className="diagram-controls">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Zoom diagram out"
                disabled={zoom <= 0.6}
                onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}
              >
                −
              </Button>
              <output aria-label="Diagram zoom">
                {Math.round(zoom * 100)}%
              </output>
              <Button
                variant="secondary"
                size="sm"
                aria-label="Zoom diagram in"
                disabled={zoom >= 2}
                onClick={() => setZoom((value) => Math.min(2, value + 0.2))}
              >
                +
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(1)}>
                Reset zoom
              </Button>
            </div>
            <div
              className="diagram-viewport"
              tabIndex={0}
              role="region"
              aria-label="Zoomable source diagram"
            >
              {diagram && (
                <img
                  src={diagram.src}
                  alt={diagram.alt}
                  style={{ width: `${1100 * zoom}px` }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        <section className="chapter-source-note">
          <div>
            <FileText aria-hidden="true" />
            <h2>Trace this chapter to its source.</h2>
          </div>
          <p>
            The complete Markdown remains the editable source. This page adds
            navigation, typography, and a visual companion.
          </p>
          <a href={sourceUrl} data-source-link>
            {chapter.source} <ArrowUpRight aria-hidden="true" />
          </a>
          <details>
            <summary>Inspect the source fingerprint</summary>
            <code>SHA-256 {chapter.sourceHash}</code>
            <code>Source commit {boot.sourceCommit}</code>
          </details>
        </section>
        {related.length > 0 && (
          <section className="chapter-related">
            <span className="eyebrow">Connected reading</span>
            <h2>Follow the ideas into the next chapter.</h2>
            <div>
              {related.map((item) => (
                <a
                  key={item.source}
                  href={readerUrl(item.source, readerBase(boot.base))}
                >
                  <span>{item.title}</span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        )}
        <nav className="chapter-pagination" aria-label="Adjacent chapters">
          {adjacent.map((item, index) =>
            item ? (
              <a
                key={item.source}
                href={readerUrl(item.source, readerBase(boot.base))}
              >
                <small>
                  {index === 0 ? "Previous" : "Next"} in {group.title}
                </small>
                <span>
                  {index === 0 && <ArrowLeft aria-hidden="true" />}
                  {item.title}
                  {index === 1 && <ArrowRight aria-hidden="true" />}
                </span>
              </a>
            ) : (
              <span key={index} />
            ),
          )}
        </nav>
      </main>
      <aside className="chapter-toc">{toc}</aside>
    </div>
  );
}

const MemoizedReader = memo(ChapterReader);

export function HandbookApp({ boot }: { boot: HandbookBootstrap }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  return (
    <div
      className={`handbook-root accent-${boot.chapter?.collection || "foundations"}`}
    >
      <Header
        boot={boot}
        progress={progress}
        onSearch={() => setSearchOpen(true)}
      />
      <SearchDialog
        boot={boot}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      {boot.chapter ? (
        <MemoizedReader boot={boot} onProgress={setProgress} />
      ) : (
        <Library boot={boot} />
      )}
      <footer className="handbook-footer">
        <a href={readerBase(boot.base)}>
          <Orbit aria-hidden="true" /> Abliteration Field Guide
        </a>
        <p>Source-preserving research documentation.</p>
        <div>
          <a href={readerUrl("references.md", readerBase(boot.base))}>
            Primary references
          </a>
          <a href={repository}>GitHub</a>
          <a
            href={`${repository}/commit/${encodeURIComponent(boot.sourceCommit)}`}
          >
            Build {boot.buildId.slice(0, 7)}
          </a>
        </div>
      </footer>
    </div>
  );
}
