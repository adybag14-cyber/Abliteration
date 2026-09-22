import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, FlaskConical, Layers3, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { handbookUrl } from "@/lib/utils";

import layout from "../../data/models/minicpm5-1b-layout.json";

const MODEL_PARAMETERS = layout.total_parameters;
const FAMILY_PARAMETERS = { o_proj: layout.families.o_proj.parameters, down_proj: layout.families.down_proj.parameters };
type Family = keyof typeof FAMILY_PARAMETERS;
const methods = [
  { name: "Selected projection", kind: "Implemented", unit: "Named output matrices", objective: "Remove a measured residual-stream component", changes: "No gradients. Strength and selected tensors are explicit.", scope: "Dense Llama layout; checked on MiniCPM5-1B." },
  { name: "Norm-preserving projection", kind: "Implemented", unit: "Columns of selected matrices", objective: "Restore each column's norm after projection", changes: "Preserves column norms, not singular values or model quality.", scope: "Same tensor boundary; quality still needs measurement." },
  { name: "Selected-tensor SFT", kind: "Implemented", unit: "A frozen-model parameter whitelist", objective: "Learn from supervised examples on a separate training split", changes: "Gradients update selected original tensors. This is not LoRA.", scope: "Benign adaptation control; no claim to reproduce NeST." },
  { name: "LoMC", kind: "Primary reference", unit: "Localized routed-model support", objective: "Choose edit support, then aggregate correction directions", changes: "Architecture-specific localization precedes the weight update.", scope: "MoE / hybrid-MoE paper; not a dense MiniCPM reproduction.", paper: "https://arxiv.org/abs/2606.13709" },
  { name: "NeST", kind: "Primary reference", unit: "Clusters of safety-relevant neurons", objective: "Strengthen safety with localized learned updates", changes: "Uses neuron probing and shared cluster-level training.", scope: "Safety strengthening, not the unverified 98% removal claim.", paper: "https://arxiv.org/abs/2602.16835" },
];

export function SelectiveLab() {
  const [layers, setLayers] = useState<number[]>([10, 11]);
  const [families, setFamilies] = useState<Family[]>(["o_proj", "down_proj"]);
  const [alpha, setAlpha] = useState(0.8);
  const [mode, setMode] = useState("projected");
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const selectedParameters = layers.length * families.reduce((sum, f) => sum + FAMILY_PARAMETERS[f], 0);
  const percentage = 100 * selectedParameters / MODEL_PARAMETERS;
  const ready = layers.length > 0 && families.length > 0;
  const command = useMemo(() => {
    if (!ready) return "Select at least one layer and one projection family to create a plan.";
    const common = `--model models/minicpm5-1b --layers ${layers.join(",")} --modules ${families.join(",")}`;
    return `# 1. Inspect the exact tensor names and parameter budget\npython scripts/selective-checkpoint.py plan ${common}\n\n# 2. Apply your separately calibrated directions to a NEW directory\npython scripts/selective-checkpoint.py apply ${common} \\\n  --direction runs/my-study/directions.pt --mode ${mode} --alpha ${alpha.toFixed(2)} \\\n  --output outputs/my-selected-candidate\n\n# 3. Independently check every tensor and shard digest\npython scripts/selective-checkpoint.py verify \\\n  --base models/minicpm5-1b --candidate outputs/my-selected-candidate`;
  }, [alpha, families, layers, mode, ready]);
  function toggleLayer(layer: number) {
    setLayers((current) => current.includes(layer) ? current.filter((x) => x !== layer) : [...current, layer].sort((a, b) => a - b));
    setCopied(false);
  }
  return (
    <TooltipProvider>
      <Tabs defaultValue="plan" className="w-full" data-slot="selective-lab">
        <TabsList className="grid h-auto w-full grid-cols-2 p-1.5 sm:w-fit">
          <TabsTrigger value="plan" className="whitespace-normal px-3 py-2.5 text-xs sm:px-5 sm:text-sm">Plan an edit</TabsTrigger>
          <TabsTrigger value="methods" className="whitespace-normal px-3 py-2.5 text-xs sm:px-5 sm:text-sm">Understand the methods</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="mt-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <Card className="min-w-0 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3"><Badge><Layers3 aria-hidden="true" /> MiniCPM5 · 24 layers</Badge><span className="text-xs font-semibold text-muted-foreground">Zero-based layer indices</span></div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">Choose the footprint before the edit.</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Each button is a transformer layer. The selected projection families determine the actual tensors changed. A single safetensors file can contain all 24 layers.</p>
              <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-8" role="group" aria-label="Select MiniCPM5 layers">
                {Array.from({ length: 24 }, (_, layer) => (
                  <Tooltip key={layer}><TooltipTrigger asChild>
                    <button type="button" aria-label={`Layer ${layer}`} aria-pressed={layers.includes(layer)} onClick={() => toggleLayer(layer)} className={`aspect-square rounded-xl border text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${layers.includes(layer) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"}`}>{layer}</button>
                  </TooltipTrigger><TooltipContent>Layer {layer}: {layers.includes(layer) ? "selected" : "frozen"}</TooltipContent></Tooltip>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setLayers([10, 11])}>Two-layer example</Button><Button variant="ghost" size="sm" onClick={() => setLayers(Array.from({ length: 24 }, (_, i) => i))}>All layers</Button><Button variant="ghost" size="sm" onClick={() => setLayers([])}>Clear layers</Button></div>
              <fieldset className="mt-5"><legend className="text-sm font-bold">Projection families</legend><div className="mt-3 flex flex-wrap gap-4">
                {(["o_proj", "down_proj"] as const).map((family) => <label key={family} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={families.includes(family)} onChange={(event) => setFamilies((current) => event.target.checked ? [...current, family].sort() : current.filter((f) => f !== family))} /><span className="font-mono">{family}</span></label>)}
              </div></fieldset>
              <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><label htmlFor="edit-mode" className="text-sm font-bold">Operator</label><select id="edit-mode" className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}><option value="projected">Rank-one projection</option><option value="norm-preserving">Column-norm preserving</option></select></div><div><div className="flex justify-between text-sm font-bold"><label id="strength-label">Strength α</label><output>{alpha.toFixed(2)}</output></div><Slider aria-label="Edit strength" aria-labelledby="strength-label" min={0} max={1} step={0.05} value={[alpha]} onValueChange={([value]) => setAlpha(value)} className="mt-5" /></div></div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">The initial layers are a planning example, not an empirically recommended choice. The experiment runner chooses its support from calibration data only.</p>
            </Card>
            <div className="min-w-0 space-y-5">
              <Card className="overflow-hidden border-primary/20 bg-primary/[0.035] p-5 sm:p-7">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><FlaskConical className="size-4" aria-hidden="true" /> Edit budget</div>
                <dl className="mt-4 grid grid-cols-3 gap-3" aria-live="polite"><div><dt className="text-xs text-muted-foreground">Tensors selected</dt><dd className="mt-2 font-mono text-3xl font-bold" data-testid="selected-tensor-count">{layers.length * families.length}<span className="text-sm font-medium text-muted-foreground"> / 219</span></dd></div><div><dt className="text-xs text-muted-foreground">Stored parameters</dt><dd className="mt-2 font-mono text-3xl font-bold">{percentage.toFixed(2)}<span className="text-sm">%</span></dd></div><div><dt className="text-xs text-muted-foreground">Storage shards</dt><dd className="mt-2 font-mono text-3xl font-bold">{ready ? 1 : 0}<span className="text-sm font-medium text-muted-foreground"> / 1</span></dd></div></dl>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} /></div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{selectedParameters.toLocaleString()} of {MODEL_PARAMETERS.toLocaleString()} stored parameters. Editing one file can still change only a small fraction of its tensors.</p>
                <p className="mt-4 flex items-start gap-2 text-sm"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> Embeddings, norms, and unselected projections retain their exact tensor bytes.</p>
              </Card>
              <Card className="min-w-0 overflow-hidden p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Your reproducible commands</h3><Button size="sm" variant="secondary" disabled={!ready} onClick={async () => { try { await navigator.clipboard.writeText(command); setCopied(true); setCopyStatus("Selective edit commands copied."); } catch { setCopyStatus("Clipboard unavailable. Select and copy the commands below."); } }}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} Copy edit commands</Button></div><pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-muted/60 p-4 font-mono text-xs leading-6" aria-label="Selective edit commands"><code>{command}</code></pre><p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">{copyStatus}</p><a href={handbookUrl("docs/selective-methods-2026.md")} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Read the selection guide <ArrowUpRight className="size-4" aria-hidden="true" /></a></Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="methods" className="mt-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{methods.map((method) => <Card key={method.name} className="p-6"><Badge>{method.kind}</Badge><h3 className="mt-4 text-xl font-semibold">{method.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{method.objective}</p><dl className="mt-5 space-y-3 text-sm"><div><dt className="font-bold">Unit of intervention</dt><dd className="mt-1 text-muted-foreground">{method.unit}</dd></div><div><dt className="font-bold">What changes</dt><dd className="mt-1 text-muted-foreground">{method.changes}</dd></div><div><dt className="font-bold">Evidence boundary</dt><dd className="mt-1 text-muted-foreground">{method.scope}</dd></div></dl>{method.paper && <a href={method.paper} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">Read primary paper <ArrowUpRight className="size-4" aria-hidden="true" /></a>}</Card>)}</div></TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
