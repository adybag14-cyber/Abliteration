import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, Search } from "lucide-react";
import catalog from "../../sources/research/catalog-2026.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { handbookUrl } from "@/lib/utils";

type Area = "All" | "Mechanism" | "Intervention" | "Defense" | "Evaluation" | "Attack";
type Paper = (typeof catalog.papers)[number];

const areas: Area[] = ["All", "Mechanism", "Intervention", "Defense", "Evaluation", "Attack"];
const areaStyles: Record<Exclude<Area, "All">, string> = {
  Mechanism: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Intervention: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Defense: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Evaluation: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Attack: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function matches(paper: Paper, query: string) {
  const haystack = [paper.id, paper.title, paper.area, paper.category, ...paper.authors].join(" ").toLocaleLowerCase();
  return haystack.includes(query.toLocaleLowerCase().trim());
}

export function ResearchExplorer() {
  const [area, setArea] = useState<Area>("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const counts = useMemo(() => Object.fromEntries(areas.map((candidate) => [candidate, candidate === "All" ? catalog.papers.length : catalog.papers.filter((paper) => paper.area === candidate).length])), []);
  const filtered = useMemo(
    () => catalog.papers.filter((paper) => (area === "All" || paper.area === area) && matches(paper, query)),
    [area, query],
  );
  const visible = expanded || query.trim() || area !== "All" ? filtered : filtered.slice(0, 9);

  return (
    <div data-slot="research-explorer">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label htmlFor="paper-search" className="text-sm font-bold">Search titles, authors, IDs, or topics</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="paper-search" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Try refusal geometry, evaluation, or 2604.18901" />
            </div>
          </div>
          <Button variant="secondary" asChild><a href={handbookUrl("docs/research-2026-update.md")}><BookOpen aria-hidden="true" /> Open annotated paper map</a></Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter papers by research area">
          {areas.map((candidate) => (
            <Button
              key={candidate}
              type="button"
              size="sm"
              variant={area === candidate ? "default" : "secondary"}
              aria-pressed={area === candidate}
              onClick={() => {
                setArea(candidate);
                setExpanded(true);
              }}
            >
              {candidate} <span className="opacity-65">{counts[candidate]}</span>
            </Button>
          ))}
        </div>
      </Card>

      <p className="mt-5 text-sm font-semibold text-muted-foreground" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "paper" : "papers"} match · arXiv primary records · snapshot {catalog.snapshot_date}
      </p>

      {visible.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((paper) => (
            <Card key={paper.id} className="group flex h-full flex-col p-5 transition-transform hover:-translate-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className={areaStyles[paper.area as Exclude<Area, "All">]}>{paper.area}</Badge>
                <span className="font-mono text-[11px] font-bold text-muted-foreground">arXiv:{paper.id}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-6 tracking-tight">{paper.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{paper.authors.join(", ")}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" /> {paper.published}</span>
                <a className="inline-flex items-center gap-1 rounded-lg text-xs font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={paper.url} target="_blank" rel="noreferrer">
                  Primary record <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-4 p-8 text-center">
          <h3 className="font-display text-xl font-semibold">No papers match that filter</h3>
          <p className="mt-2 text-sm text-muted-foreground">Clear the search or choose another research area.</p>
        </Card>
      )}

      {!expanded && !query.trim() && area === "All" && filtered.length > visible.length && (
        <div className="mt-6 text-center"><Button type="button" variant="secondary" onClick={() => setExpanded(true)}>Show all {filtered.length} papers</Button></div>
      )}
    </div>
  );
}
