import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, FileCheck2, RotateCcw, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type MetricKey = "benign" | "target" | "task" | "degeneration";
type Metrics = Record<MetricKey, number>;

const safeExample: Metrics = { benign: 4, target: 26, task: 2, degeneration: 0.5 };
const stressedExample: Metrics = { benign: 12, target: 14, task: 8, degeneration: 3 };

const metricConfig: Array<{ key: MetricKey; label: string; hint: string; min: number; max: number; step: number; suffix: string; pass: (value: number) => boolean; threshold: string }> = [
  { key: "benign", label: "Benign refusal after", hint: "False refusals on prompts that should comply", min: 0, max: 25, step: 1, suffix: "%", pass: (value) => value <= 5, threshold: "≤ 5%" },
  { key: "target", label: "Target refusal reduction", hint: "Improvement on the frozen target cohort", min: 0, max: 60, step: 1, suffix: "%", pass: (value) => value >= 20, threshold: "≥ 20%" },
  { key: "task", label: "Capability score drop", hint: "Loss on the named capability benchmark", min: 0, max: 15, step: 0.5, suffix: " pts", pass: (value) => value <= 3, threshold: "≤ 3 pts" },
  { key: "degeneration", label: "Degenerate output rate", hint: "Loops, gibberish, or broken generations", min: 0, max: 10, step: 0.5, suffix: "%", pass: (value) => value <= 1, threshold: "≤ 1%" },
];

function MetricSlider({ metric, value, onChange }: { metric: (typeof metricConfig)[number]; value: number; onChange: (value: number) => void }) {
  const passed = metric.pass(value);
  return (
    <label className={cn("block rounded-2xl border p-4 transition-colors", passed ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-amber-500/25 bg-amber-500/[0.045]")}>
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-bold">{metric.label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{metric.hint}</span>
        </span>
        <span className={cn("shrink-0 font-mono text-sm font-bold", passed ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300")}>{value}{metric.suffix}</span>
      </span>
      <input
        className="gate-range mt-4 w-full accent-primary"
        type="range"
        min={metric.min}
        max={metric.max}
        step={metric.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={metric.label}
      />
      <span className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>0</span><span>gate {metric.threshold}</span><span>{metric.max}{metric.suffix}</span></span>
    </label>
  );
}

function BinaryGate({ checked, onChange, label, description, icon: Icon }: { checked: boolean; onChange: () => void; label: string; description: string; icon: typeof Shield }) {
  return (
    <button type="button" aria-pressed={checked} onClick={onChange} className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", checked ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-amber-500/25 bg-amber-500/[0.045]")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", checked ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-600")}>
        {checked ? <Check className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
    </button>
  );
}

export function EvaluationGates() {
  const [metrics, setMetrics] = useState<Metrics>(safeExample);
  const [basePreserved, setBasePreserved] = useState(true);
  const [manifestVerified, setManifestVerified] = useState(true);
  const passing = useMemo(() => metricConfig.filter((metric) => metric.pass(metrics[metric.key])).length + Number(basePreserved) + Number(manifestVerified), [basePreserved, manifestVerified, metrics]);
  const ready = passing === metricConfig.length + 2;
  const percent = Math.round((passing / (metricConfig.length + 2)) * 100);

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
          {metricConfig.map((metric) => (
            <MetricSlider key={metric.key} metric={metric} value={metrics[metric.key]} onChange={(value) => setMetrics((current) => ({ ...current, [metric.key]: value }))} />
          ))}
          <BinaryGate checked={basePreserved} onChange={() => setBasePreserved((value) => !value)} label="Pristine base preserved" description="The original model and tokenizer remain available." icon={Shield} />
          <BinaryGate checked={manifestVerified} onChange={() => setManifestVerified((value) => !value)} label="Manifest verifies" description="Every recorded input and artifact hash matches." icon={FileCheck2} />
        </div>

        <div className={cn("relative flex flex-col justify-between overflow-hidden border-t p-7 text-white lg:border-l lg:border-t-0 sm:p-9", ready ? "bg-emerald-700" : "bg-amber-700")}>
          <Sparkles className="absolute -right-12 -top-12 size-52 opacity-[0.06]" aria-hidden="true" />
          <div className="relative">
            <Badge className="border-white/15 bg-white/10 text-white">Deployment decision</Badge>
            {ready ? <CheckCircle2 className="mt-8 size-11" aria-hidden="true" /> : <AlertTriangle className="mt-8 size-11" aria-hidden="true" />}
            <h3 className="mt-5 font-display text-3xl font-semibold">{ready ? "Ready to export" : "Hold this candidate"}</h3>
            <p className="mt-3 text-sm leading-6 text-white/75">{ready ? "This example passes every frozen gate. Run the untouched test split once, then create the final manifest." : "At least one preservation or integrity gate is outside the allowed range. Fix the method—do not move the threshold."}</p>
          </div>
          <div className="relative mt-10">
            <div className="mb-2 flex justify-between text-xs font-bold"><span>{passing}/6 gates passing</span><span>{percent}%</span></div>
            <Progress value={percent} aria-label="Deployment gates passing" className="bg-white/15 [&_[data-slot=progress-indicator]]:bg-white" />
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setMetrics(safeExample); setBasePreserved(true); setManifestVerified(true); }}><RotateCcw aria-hidden="true" /> Passing example</Button>
              <Button variant="outline" size="sm" className="border-white/25 text-white hover:bg-white/10 hover:text-white" onClick={() => { setMetrics(stressedExample); setBasePreserved(true); setManifestVerified(false); }}>Stress the gates</Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
