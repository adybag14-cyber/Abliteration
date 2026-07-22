export type GuideStep = {
  id: string;
  number: string;
  title: string;
  short: string;
  why: string;
  actions: string[];
  proof: string;
  time: string;
  doc: string;
};

export const guideSteps: GuideStep[] = [
  {
    id: "scope",
    number: "01",
    title: "Set the boundary",
    short: "Choose an open-weight model and a legitimate local use case.",
    why: "A clear scope keeps the experiment measurable and the deployment responsible.",
    actions: ["Write down the exact model and immutable revision", "Name the behavior you want to measure", "Keep the work local and authorized"],
    proof: "A one-paragraph experiment brief with model, revision, owner, and goal.",
    time: "5 min",
    doc: "docs/risks-and-ethics.md",
  },
  {
    id: "preserve",
    number: "02",
    title: "Preserve the base",
    short: "Treat the original checkpoint as read-only.",
    why: "Abliteration is model surgery. A pristine base makes every comparison and rollback honest.",
    actions: ["Verify free disk space", "Copy or pin the untouched checkpoint", "Hash the tokenizer and chat template too"],
    proof: "The base loads, its revision is recorded, and its bytes are still available.",
    time: "5–20 min",
    doc: "instructions/beginner-reproduction-methodology.md",
  },
  {
    id: "contrast",
    number: "03",
    title: "Build the contrast",
    short: "Prepare target and control prompts without leaking templates across splits.",
    why: "The direction can only be as meaningful as the examples used to estimate it.",
    actions: ["Create train, selection, and untouched test groups", "Audit duplicate and cross-label prompts", "Compare general and controlled baselines"],
    proof: "A contrast manifest with counts, split rules, and SHA-256 hashes.",
    time: "15–30 min",
    doc: "methods/contrast-set-design.md",
  },
  {
    id: "prototype",
    number: "04",
    title: "Prototype reversibly",
    short: "Test the direction with temporary activation hooks before changing weights.",
    why: "A vector may separate training examples without causally controlling behavior.",
    actions: ["Sweep one layer at a time", "Test both direction removal and addition", "Run shuffled-label and wrong-layer controls"],
    proof: "Held-out behavior changes while capability and degeneration gates remain stable.",
    time: "20–60 min",
    doc: "methods/direction-diagnostics-and-localization.md",
  },
  {
    id: "edit",
    number: "05",
    title: "Make the smallest edit",
    short: "Use the narrowest layer band, lowest rank, and lightest strength that works.",
    why: "More removal is not automatically better; excess strength can damage unrelated capability.",
    actions: ["Start with projected, norm-preserving edits", "Assert tensor orientation on a synthetic matrix", "Save to a new candidate directory"],
    proof: "Projection invariants pass and the base checkpoint is untouched.",
    time: "30–90 min",
    doc: "instructions/advanced-abliteration-workflow.md",
  },
  {
    id: "evaluate",
    number: "06",
    title: "Compare and certify",
    short: "Run identical before/after prompts and freeze the result in a manifest.",
    why: "A successful edit improves the target without hiding benign refusals or capability loss.",
    actions: ["Apply frozen deployment thresholds", "Inspect paired regressions, not only averages", "Hash the config, inputs, report, and checkpoint"],
    proof: "All gates pass and the experiment manifest verifies against the final bytes.",
    time: "20–45 min",
    doc: "docs/experiment-provenance.md",
  },
];

export type Technique = {
  id: string;
  title: string;
  tier: "Start here" | "Production" | "Frontier";
  summary: string;
  when: string;
  tags: string[];
  doc: string;
};

export const techniques: Technique[] = [
  { id: "T02", title: "Reversible hook ablation", tier: "Start here", summary: "Subtract the direction during inference while leaving weights untouched.", when: "Your first causal test", tags: ["reversible", "low risk"], doc: "techniques/inference-directional-ablation.md" },
  { id: "T01", title: "Mean-difference direction", tier: "Start here", summary: "Estimate a candidate direction from target and control activations.", when: "A simple, interpretable baseline", tags: ["foundation", "fast"], doc: "techniques/mean-difference-direction.md" },
  { id: "T03", title: "Projected + norm-preserving", tier: "Production", summary: "Protect useful activation structure while removing the measured component.", when: "The default permanent edit", tags: ["recommended", "weights"], doc: "techniques/projected-norm-preserving-abliteration.md" },
  { id: "T09", title: "Layer-selective editing", tier: "Production", summary: "Edit only the depth band with a held-out causal effect.", when: "You want lower capability drift", tags: ["precise", "efficient"], doc: "techniques/layer-selective-abliteration.md" },
  { id: "T17", title: "Eval-driven prompts", tier: "Production", summary: "Align measurement prompts with the real deployment domain and gates.", when: "Moving from research to a use case", tags: ["evaluation", "domain"], doc: "techniques/eval-driven-abliteration.md" },
  { id: "T22", title: "Contrast confound audit", tier: "Production", summary: "Detect duplicates, split leakage, baseline cancellation, and unstable labels.", when: "Before collecting activations", tags: ["data", "integrity"], doc: "methods/contrast-set-design.md" },
  { id: "T23", title: "Paired statistical gates", tier: "Production", summary: "Compare each prompt before and after with bootstrap intervals and McNemar counts.", when: "Selecting a checkpoint", tags: ["statistics", "gate"], doc: "docs/evaluation.md" },
  { id: "T24", title: "Artifact provenance", tier: "Production", summary: "Bind the exact model, config, inputs, environment, and outputs with hashes.", when: "Every publishable result", tags: ["reproducible", "release"], doc: "docs/experiment-provenance.md" },
  { id: "T28", title: "Protected capability subspace", tier: "Frontier", summary: "Remove a refusal basis only after projecting away measured capability directions.", when: "A standard edit harms a named capability", tags: ["experimental", "subspace"], doc: "methods/protected-subspace-abliteration.md" },
  { id: "T30", title: "Quantization-aware surgery", tier: "Frontier", summary: "Separate surgery damage from quantization damage with a floating reference candidate.", when: "Shipping 4-bit or GGUF outputs", tags: ["quantization", "advanced"], doc: "techniques/advanced-experimental-methods.md" },
  { id: "T31", title: "Router-weighted MoE", tier: "Frontier", summary: "Measure expert utilization and routing shift around per-expert edits.", when: "Working with routed expert models", tags: ["MoE", "routing"], doc: "techniques/advanced-experimental-methods.md" },
  { id: "T32", title: "Pareto checkpoint selection", tier: "Frontier", summary: "Keep refusal, capability, KL, degeneration, latency, and size as separate objectives.", when: "A single score hides trade-offs", tags: ["multi-objective", "selection"], doc: "techniques/advanced-experimental-methods.md" },
];

export type MethodProfile = {
  key: string;
  name: string;
  subtitle: string;
  color: string;
  values: [number, number, number, number, number];
};

export const methodProfiles: MethodProfile[] = [
  { key: "hook", name: "Hook prototype", subtitle: "Safest first experiment", color: "#6366f1", values: [5, 4, 5, 3, 2] },
  { key: "heretic", name: "Heretic projected", subtitle: "Balanced production path", color: "#06b6d4", values: [2, 5, 4, 4, 5] },
  { key: "protected", name: "Protected subspace", subtitle: "High-control research", color: "#f59e0b", values: [2, 2, 2, 5, 3] },
  { key: "moe", name: "MoE expert edit", subtitle: "Architecture-specialized", color: "#ec4899", values: [2, 2, 1, 4, 3] },
];

export const radarAxes = ["Reversible", "Beginner ease", "VRAM friendly", "Precision", "Production ready"];

export const troubleshooting = [
  { question: "The model still refuses after the edit", answer: "Pause before increasing strength. Check that the prompt category appears in your contrast set, verify the chat template and token position, then run a held-out layer sweep. A defense-trained model may need a different method rather than a stronger edit." },
  { question: "The candidate becomes incoherent or loses capability", answer: "Restore the pristine base and reduce scope: lower alpha, narrow the layer band, use projected plus norm-preserving edits, or protect a measured capability subspace. Do not tune around degeneration." },
  { question: "I only have an 8 GB GPU", answer: "Choose a small dense model and the low-VRAM Heretic profile with 4-bit measurement and CPU offload. Keep permanent weight editing separate from quantization, and expect longer runs." },
  { question: "I have no GPU", answer: "Use the learning path and evaluate an existing community checkpoint, or rent a GPU for one reproducible run. CPU-only local inference is possible; practical model surgery usually is not." },
  { question: "The floating candidate passes but GGUF fails", answer: "Treat this as quantization damage. Recheck the conversion, compare the floating candidate to the quantized one, inspect clipping and row norms, and try a less aggressive quantization level." },
];

export const glossary = [
  ["Activation", "The numeric state carried through a transformer while it processes a prompt."],
  ["Direction", "A vector in activation space associated with a measured behavior."],
  ["Ablation", "Removing or suppressing a measured component to test whether it matters."],
  ["Projection", "The linear operation used to remove one direction or subspace from another."],
  ["Layer band", "A contiguous set of transformer layers selected for intervention."],
  ["KL divergence", "A measure of how much the candidate's output distribution moved from the base."],
  ["Contrast set", "Target and control prompts used to estimate and validate a direction."],
  ["Manifest", "A machine-readable record binding experiment parameters to exact file hashes."],
] as const;
