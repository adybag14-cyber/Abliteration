import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, Search } from "lucide-react";
import { latestResearchDate, researchPapers, researchSnapshots, type ResearchPaper } from "@/data/research";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { handbookUrl } from "@/lib/utils";

type Area = "All" | "Mechanism" | "Intervention" | "Defense" | "Evaluation" | "Attack";
type Paper = ResearchPaper;

const areas: Area[] = ["All", "Mechanism", "Intervention", "Defense", "Evaluation", "Attack"];
const areaStyles: Record<Exclude<Area, "All">, string> = {
  Mechanism: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Intervention: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Defense: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Evaluation: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Attack: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function matches(paper: Paper, query: string) {
  const haystack = [paper.id, paper.title, paper.area, paper.category, paper.summary, paper.scope, ...paper.authors].join(" ").toLocaleLowerCase();
  return haystack.includes(query.toLocaleLowerCase().trim());
}

export function ResearchExplorer() {
  const [area, setArea] = useState<Area>("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState("All snapshots");
  const [compared, setCompared] = useState<string[]>([]);
  const [citationStatus, setCitationStatus] = useState("");
  const snapshotPapers = useMemo(() => researchPapers.filter((paper) => snapshot === "All snapshots" || paper.snapshot === snapshot), [snapshot]);
  const comparison = researchPapers.filter((paper) => compared.includes(paper.id));

  const counts = useMemo(() => Object.fromEntries(areas.map((candidate) => [candidate, candidate === "All" ? snapshotPapers.length : snapshotPapers.filter((paper) => paper.area === candidate).length])), [snapshotPapers]);
  const filtered = useMemo(
    () => snapshotPapers.filter((paper) => (area === "All" || paper.area === area) && matches(paper, query)),
    [area, query, snapshotPapers],
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
          <Button variant="secondary" asChild><a href={handbookUrl("docs/research-september-2026.md")}><BookOpen aria-hidden="true" /> Open annotated paper map</a></Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><label htmlFor="research-snapshot" className="text-sm font-bold">Catalog snapshot</label><select id="research-snapshot" className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={snapshot} onChange={(event) => { setSnapshot(event.target.value); setArea("All"); setExpanded(false); }}>{researchSnapshots.map((date) => <option key={date}>{date}</option>)}</select><p className="text-xs text-muted-foreground">The original 50-paper snapshot is preserved. Fourteen additions include newer work and earlier gaps.</p></div>
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
        {filtered.length} {filtered.length === 1 ? "paper" : "papers"} match · arXiv primary records · refreshed {latestResearchDate}
      </p>
      {comparison.length > 0 && <Card className="mt-4 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Compare research scope ({comparison.length}/3)</h3><Button size="sm" variant="ghost" onClick={() => setCompared([])}>Clear comparison</Button></div><div className="mt-4 grid gap-4 md:grid-cols-3">{comparison.map((paper) => <div key={paper.id} className="rounded-xl border border-border p-4"><p className="font-mono text-xs text-primary">{paper.id}</p><h4 className="mt-2 text-sm font-bold">{paper.title}</h4><p className="mt-3 text-sm leading-6 text-muted-foreground">{paper.scope ?? `${paper.area} study; consult the primary paper for its evaluated model set.`}</p><p className="mt-3 text-xs font-semibold">{paper.implementation ?? "Primary reference"}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{paper.implication ?? "The bibliography establishes relevance, not an implementation or a replication."}</p></div>)}</div></Card>}
      <p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">{citationStatus}</p>

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
              {paper.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{paper.summary}</p>}
              {paper.implementation && <p className="mt-3 text-xs font-semibold text-primary">{paper.implementation === "reference-only" ? "Reference only · not reproduced here" : "Evaluation guidance"}</p>}
              <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant={compared.includes(paper.id) ? "default" : "outline"} aria-pressed={compared.includes(paper.id)} disabled={compared.length >= 3 && !compared.includes(paper.id)} onClick={() => setCompared((current) => current.includes(paper.id) ? current.filter((id) => id !== paper.id) : [...current, paper.id])} aria-label={`Compare ${paper.id}`}>Compare</Button><Button size="sm" variant="ghost" aria-label={`Copy citation for ${paper.id}`} onClick={async () => { try { await navigator.clipboard.writeText(`${paper.authors.join("; ")}. ${paper.title}. arXiv:${paper.id} (${paper.published}). ${paper.version_url ?? paper.url}`); setCitationStatus(`Citation for ${paper.id} copied.`); } catch { setCitationStatus("Clipboard unavailable. Open the primary record for its citation."); } }}>Copy citation</Button></div>
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
