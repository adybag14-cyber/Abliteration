import { ArrowDown, ArrowRight, CheckCircle2, FileSearch, FlaskConical, Layers3, Save, ShieldCheck, Terminal } from "lucide-react";
import { Reveal } from "@/components/reveal";

const stages = [
  { label: "Hour 0", detail: "C++26 toy lab · unique nightlies", icon: Terminal },
  { label: "Scope", detail: "one model · one goal", icon: ShieldCheck },
  { label: "Preserve", detail: "immutable base", icon: Save },
  { label: "Contrast", detail: "clean prompt splits", icon: FileSearch },
  { label: "Probe", detail: "reversible hooks", icon: FlaskConical },
  { label: "Edit", detail: "smallest intervention", icon: Layers3 },
  { label: "Compare and certify", detail: "paired gates · verified manifest", icon: CheckCircle2 },
];

export function JourneyMap() {
  return (
    <Reveal className="relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-4 shadow-[0_30px_90px_-60px_rgba(79,70,229,.7)] sm:p-6">
      <div className="absolute left-12 right-12 top-[4.2rem] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" aria-hidden="true" />
      <ol className="relative grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
        {stages.map((stage, index) => (
          <li key={stage.label} className="contents">
            <div className="group relative flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-primary/20 hover:bg-primary/[0.04] lg:flex-col lg:text-center">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-background text-primary shadow-sm transition-transform group-hover:-translate-y-1">
                <stage.icon className="size-5" aria-hidden="true" />
                <span className="journey-pulse absolute -right-1 -top-1 size-2.5 rounded-full bg-primary" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold">{stage.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{stage.detail}</span>
              </span>
            </div>
            {index < stages.length - 1 && (
              <span className="grid place-items-center text-primary/40" aria-hidden="true">
                <ArrowDown className="size-4 lg:hidden" />
                <ArrowRight className="hidden size-4 lg:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
