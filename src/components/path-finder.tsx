import { useMemo, useState } from "react";
import { ArrowRight, Cpu, Eye, Gauge, Layers3, Sparkles, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { handbookUrl, cn } from "@/lib/utils";

type Hardware = "none" | "8" | "16" | "24";
type Architecture = "dense" | "thinking" | "moe" | "vision";
type Commitment = "reversible" | "checkpoint";

const choices = {
  hardware: [
    ["none", "No GPU", "Learn + evaluate"], ["8", "8 GB", "Small + offload"], ["16", "12–16 GB", "Comfortable dense"], ["24", "24 GB+", "Larger / MoE"],
  ],
  architecture: [
    ["dense", "Dense", "Llama · Qwen · Gemma"], ["thinking", "Thinking", "CoT / R1-style"], ["moe", "MoE", "Routed experts"], ["vision", "Vision", "Multimodal trunk"],
  ],
} as const;

function ChoiceGroup({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: readonly (readonly [string, string, string])[] }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(([key, title, subtitle]) => (
          <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)} className={cn("rounded-2xl border p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring", value === key ? "border-primary bg-primary/[0.07] shadow-sm" : "border-border bg-background hover:border-primary/30")}>
            <span className="block text-sm font-bold">{title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{subtitle}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PathFinder() {
  const [hardware, setHardware] = useState<Hardware>("16");
  const [architecture, setArchitecture] = useState<Architecture>("dense");
  const [commitment, setCommitment] = useState<Commitment>("reversible");

  const recommendation = useMemo(() => {
    if (hardware === "none") return { title: "Evaluation-first path", reason: "Learn the workflow, inspect an existing checkpoint, and keep surgery on a rented or remote GPU.", profile: "Track C · no local surgery", doc: "instructions/beginner-local-model-guide.md", icon: Eye };
    if (commitment === "reversible") return { title: "Residual-hook prototype", reason: "Validate the direction and layer causally before you let any tool modify a checkpoint.", profile: "T02 · reversible", doc: "instructions/inference-only-prototype.md", icon: Undo2 };
    if (architecture === "thinking") return { title: "Thinking-model profile", reason: "Score the final answer separately from chain-of-thought and increase the response window.", profile: "Track H · CoT aware", doc: "instructions/thinking-models-guide.md", icon: Sparkles };
    if (architecture === "moe") return { title: "Router-aware MoE path", reason: "Measure per-expert effects and routing shift; use 4-bit loading and CPU offload on consumer GPUs.", profile: "T08 + T31 · advanced", doc: "techniques/moe-hybrid-abliteration.md", icon: Layers3 };
    if (architecture === "vision") return { title: "Text-trunk VLM path", reason: "Start in the language trunk, preserve the multimodal projector, and evaluate both text and visual tasks.", profile: "T20 · multimodal", doc: "techniques/vision-multimodal-abliteration.md", icon: Eye };
    if (hardware === "8") return { title: "Low-VRAM Heretic path", reason: "Use a small dense model, 4-bit measurement, CPU offload, and a sharded permanent edit.", profile: "Track A · 8 GB", doc: "instructions/low-vram-abliteration.md", icon: Cpu };
    return { title: "Projected production path", reason: "Use projected, norm-preserving editing with frozen paired evaluation gates and a verified manifest.", profile: "T03 + T17 + T24", doc: "instructions/advanced-abliteration-workflow.md", icon: Gauge };
  }, [architecture, commitment, hardware]);

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-7 p-6 sm:p-8">
          <ChoiceGroup label="1. What hardware do you have?" value={hardware} onChange={(value) => setHardware(value as Hardware)} items={choices.hardware} />
          <ChoiceGroup label="2. What kind of model is it?" value={architecture} onChange={(value) => setArchitecture(value as Architecture)} items={choices.architecture} />
          <fieldset>
            <legend className="mb-3 text-sm font-bold">3. How far are you going today?</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['reversible', 'Prototype only'], ['checkpoint', 'Create a candidate']] as const).map(([key, label]) => (
                <button key={key} type="button" aria-pressed={commitment === key} onClick={() => setCommitment(key)} className={cn("rounded-2xl border p-4 text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring", commitment === key ? "border-primary bg-primary/[0.07]" : "border-border hover:border-primary/30")}>{label}</button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="relative flex min-h-[330px] flex-col justify-between overflow-hidden border-t border-border bg-foreground p-7 text-background lg:border-l lg:border-t-0 sm:p-9">
          <div className="path-orbit absolute -right-20 -top-20 size-64 rounded-full border border-background/10" aria-hidden="true" />
          <div className="relative">
            <Badge className="border-background/10 bg-background/10 text-background">Your route</Badge>
            <recommendation.icon className="mt-8 size-9" aria-hidden="true" />
            <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight">{recommendation.title}</h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-background/70">{recommendation.reason}</p>
          </div>
          <div className="relative mt-10 flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-background/55">{recommendation.profile}</span>
            <Button variant="secondary" asChild>
              <a href={handbookUrl(recommendation.doc)}>Open this route <ArrowRight aria-hidden="true" /></a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
