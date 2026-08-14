import { useMemo, useState } from "react";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { techniques, type Technique } from "@/data/guide";
import { cn, handbookUrl } from "@/lib/utils";

const tiers: Array<Technique["tier"] | "All"> = ["All", "Start here", "Production", "Frontier"];
const METHOD_TOKEN = /^(dim|orba|cosmic|t\d{2})$/i;

function techniqueMatches(item: Technique, normalized: string) {
  const identity = `${item.id} ${item.title} ${item.tags.join(" ")}`.toLowerCase();
  if (METHOD_TOKEN.test(normalized)) return identity.includes(normalized);
  return `${identity} ${item.summary}`.toLowerCase().includes(normalized);
}

export function TechniqueExplorer() {
  const [tier, setTier] = useState<(typeof tiers)[number]>("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return techniques.filter((item) => (tier === "All" || item.tier === tier) && (!normalized || techniqueMatches(item, normalized)));
  }, [query, tier]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1" aria-label="Filter by technique tier">
          {tiers.map((item) => (
            <Button key={item} type="button" variant={tier === item ? "default" : "outline"} size="sm" onClick={() => setTier(item)} aria-pressed={tier === item}>
              {item === "All" && <SlidersHorizontal aria-hidden="true" />}{item}
            </Button>
          ))}
        </div>
        <label className="relative block min-w-0 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Search techniques</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search T-ID, method, or tag…" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((technique) => (
          <Card key={technique.id} className="group flex min-h-64 flex-col transition-all hover:-translate-y-1 hover:border-primary/30">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge variant={technique.tier === "Frontier" ? "warning" : technique.tier === "Production" ? "success" : "default"}>{technique.id}</Badge>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{technique.tier}</span>
              </div>
              <CardTitle>{technique.title}</CardTitle>
              <CardDescription>{technique.summary}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <p className="mb-4 text-xs"><span className="font-bold text-foreground">Use when:</span> <span className="text-muted-foreground">{technique.when}</span></p>
              <div className="flex flex-wrap gap-1.5">
                {technique.tags.map((tag) => <Badge key={tag} variant="secondary" className="normal-case tracking-normal">{tag}</Badge>)}
              </div>
              <a href={handbookUrl(technique.doc)} className={cn("mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary outline-none transition-all hover:gap-2 focus-visible:ring-2 focus-visible:ring-ring")}>Open chapter <ArrowUpRight className="size-4" aria-hidden="true" /></a>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No card matches that search. Try “DIM”, “ORBA”, “COSMIC”, or a T-ID shown on a card.</div>}
    </div>
  );
}
