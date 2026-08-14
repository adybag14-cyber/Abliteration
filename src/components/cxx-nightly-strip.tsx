import { ArrowRight, Download, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CXX_NIGHTLY_TAG, cxxDefaultArchives, cxxDownload, handbookUrl } from "@/lib/utils";

const firstHourLoop = ["guide", "doctor", "self-check", "demo"] as const;

export function CxxNightlyStrip() {
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge><Terminal aria-hidden="true" /> Unique nightlies</Badge>
            <a
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground underline decoration-border underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              href={CXX_NIGHTLY_TAG}
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              SHA256SUMS
            </a>
          </div>
          <ul className="space-y-3">
            {cxxDefaultArchives.map((archive) => (
              <li key={archive.file}>
                <a
                  className="block rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-ring"
                  href={cxxDownload(archive.file)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold">{archive.label}</span>
                    <Download className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  </span>
                  <span className="mt-1.5 block font-mono text-[11px] font-medium leading-5 text-muted-foreground">{archive.file}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden border-t border-border bg-foreground p-7 text-background lg:border-l lg:border-t-0 sm:p-9">
          <div className="path-orbit absolute -right-16 -top-16 size-52 rounded-full border border-background/10" aria-hidden="true" />
          <div className="relative">
            <Badge className="border-background/10 bg-background/10 text-background">Hour 0 loop</Badge>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">C++26 toy-matrix lab</h3>
            <p className="mt-4 font-mono text-sm font-bold leading-6 text-background">guide → doctor → self-check → demo</p>
            <ol className="mt-5 flex flex-wrap gap-2">
              {firstHourLoop.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-lg border border-background/15 bg-background/10 px-2.5 py-1 font-mono text-[11px] font-bold">{step}</span>
                  {index < firstHourLoop.length - 1 && <ArrowRight className="size-3.5 text-background/40" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
          <div className="relative mt-8">
            <Button variant="secondary" asChild>
              <a href={handbookUrl("docs/cxx26-researcher-guide.md")}>Open the C++26 guide <ArrowRight aria-hidden="true" /></a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
