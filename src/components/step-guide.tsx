import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock3, ExternalLink, Lightbulb, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { guideSteps } from "@/data/guide";
import { cn, handbookUrl } from "@/lib/utils";

const storageKey = "abliteration-guide-progress";

export function StepGuide() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) setCompleted(saved.filter((item): item is string => typeof item === "string"));
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  const percent = useMemo(() => Math.round((completed.length / guideSteps.length) * 100), [completed]);

  function toggle(id: string) {
    setCompleted((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-bold">Your learning progress</span>
            <span className="font-mono text-xs text-muted-foreground">{completed.length}/{guideSteps.length} complete</span>
          </div>
          <Progress value={percent} aria-label={`${percent}% of guide complete`} />
        </div>
        {completed.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setCompleted([]); localStorage.removeItem(storageKey); }}>Reset</Button>
        )}
      </div>

      <Accordion type="multiple" className="space-y-3">
        {guideSteps.map((step) => {
          const done = completed.includes(step.id);
          return (
            <AccordionItem key={step.id} value={step.id} className={cn("overflow-hidden rounded-3xl border bg-card px-5 transition-colors sm:px-7", done ? "border-emerald-500/30 bg-emerald-500/[0.035]" : "border-border") }>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-label={`${done ? "Mark" : "Mark"} ${step.title} ${done ? "incomplete" : "complete"}`}
                  aria-pressed={done}
                  className={cn("grid size-9 shrink-0 place-items-center rounded-xl border outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary")}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : <span className="font-mono text-[10px] font-bold">{step.number}</span>}
                </button>
                <AccordionTrigger className="min-w-0 py-5">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-semibold sm:text-xl">{step.title}</span>
                      <Badge variant="secondary"><Clock3 aria-hidden="true" /> {step.time}</Badge>
                    </span>
                    <span className="mt-1 block pr-3 text-sm font-normal leading-6 text-muted-foreground">{step.short}</span>
                  </span>
                </AccordionTrigger>
              </div>
              <AccordionContent className="pl-12">
                <div className="grid gap-5 pb-2 md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground"><Lightbulb className="size-4 text-primary" aria-hidden="true" /> Why it matters</div>
                    <p>{step.why}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Proof before moving on</div>
                    <p>{step.proof}</p>
                  </div>
                </div>
                <ol className="mt-4 grid gap-2">
                  {step.actions.map((action, index) => (
                    <li key={action} className="flex items-start gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">{index + 1}</span><span>{action}</span></li>
                  ))}
                </ol>
                <Button variant="outline" size="sm" className="mt-5" asChild>
                  <a href={handbookUrl(step.doc)}>Read the detailed chapter <ExternalLink aria-hidden="true" /></a>
                </Button>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {completed.length === guideSteps.length && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-sm text-emerald-800 dark:text-emerald-200" role="status">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <span><strong>Foundation complete.</strong> You are ready to use the evaluation gate simulator below.</span>
        </div>
      )}
    </div>
  );
}
