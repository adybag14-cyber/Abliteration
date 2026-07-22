import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, CircleDotDashed, GitFork, Info, Layers3, LockKeyhole, Microscope, Orbit, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EvaluationGates } from "@/components/evaluation-gates";
import { JourneyMap } from "@/components/journey-map";
import { MethodRadar } from "@/components/method-radar";
import { PathFinder } from "@/components/path-finder";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { StepGuide } from "@/components/step-guide";
import { TechniqueExplorer } from "@/components/technique-explorer";
import { glossary, troubleshooting } from "@/data/guide";
import { handbookUrl, REPOSITORY_URL } from "@/lib/utils";

const principles = [
  { icon: Microscope, number: "01", title: "Observe", text: "Measure how target and control prompts differ inside the model." },
  { icon: CircleDotDashed, number: "02", title: "Test", text: "Use a reversible hook to ask whether that direction actually causes the behavior." },
  { icon: Layers3, number: "03", title: "Edit", text: "If the evidence holds, remove the smallest useful component from selected weights." },
  { icon: ShieldCheck, number: "04", title: "Verify", text: "Compare every prompt, protect capability, and bind the result to exact file hashes." },
];

function HeroDiagram() {
  const dots = Array.from({ length: 36 }, (_, index) => index);
  return (
    <div className="hero-diagram relative mx-auto aspect-square w-full max-w-[520px]" aria-label="Illustration of a measured direction being isolated from model activations" role="img">
      <div className="absolute inset-[8%] rounded-full border border-primary/15" />
      <div className="absolute inset-[18%] rounded-full border border-dashed border-primary/20" />
      <div className="hero-orbit absolute inset-[28%] rounded-full border border-primary/30" />
      <div className="absolute inset-[39%] grid place-items-center rounded-[2rem] border border-white/20 bg-foreground text-background shadow-2xl shadow-primary/20">
        <Orbit className="size-12" aria-hidden="true" />
        <span className="absolute bottom-7 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-background/55">residual stream</span>
      </div>
      <div className="absolute inset-[4%] grid grid-cols-6 gap-2 opacity-55">
        {dots.map((dot) => <span key={dot} className="activation-dot m-auto size-1.5 rounded-full bg-primary" style={{ animationDelay: `${(dot % 9) * 120}ms`, opacity: 0.18 + ((dot * 7) % 8) / 10 }} />)}
      </div>
      <div className="direction-line absolute left-[18%] top-1/2 h-1 w-[64%] -translate-y-1/2 rotate-[-28deg] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_26px_var(--primary)]" />
      <div className="absolute right-[7%] top-[21%] rounded-2xl border border-primary/15 bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">candidate</span>
        <span className="mt-0.5 block text-xs font-bold">refusal direction r</span>
      </div>
      <div className="absolute bottom-[8%] left-[5%] rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <span className="flex items-center gap-2 text-xs font-bold"><LockKeyhole className="size-3.5 text-emerald-500" aria-hidden="true" /> Base preserved</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <div id="top" className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />

      <main id="main-content">
        <section className="hero-grid relative isolate overflow-hidden pb-20 pt-40 sm:pt-36 lg:pb-28 lg:pt-40">
          <div className="hero-glow absolute left-[45%] top-0 -z-10 size-[55rem] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8">
            <Reveal>
              <Badge className="mb-6"><Sparkles aria-hidden="true" /> Open-weight model field guide</Badge>
              <h1 className="font-display text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[5.2rem] lg:leading-[0.98]">
                Abliteration,<br /><span className="text-gradient">without the fog.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty sm:text-xl">
                Understand the idea, choose the right experiment, and follow every step with evidence—without losing the model you started with.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild><a href="#path">Find my path <ArrowRight aria-hidden="true" /></a></Button>
                <Button size="lg" variant="secondary" asChild><a href="#steps"><Workflow aria-hidden="true" /> See the six steps</a></Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> Reversible first</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> No hidden cloud service</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> Evidence before export</span>
              </div>
            </Reveal>
            <Reveal delay={0.12}><HeroDiagram /></Reveal>
          </div>

          <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <JourneyMap />
          </div>
        </section>

        <section className="border-y border-border bg-card/40 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Plain language" title="Model surgery, not magic" description="Abliteration is a measured linear intervention. The careful workflow matters more than the dramatic name." align="center" /></Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {principles.map((principle, index) => (
                <Reveal key={principle.title} delay={index * 0.06}>
                  <Card className="h-full p-6 transition-transform hover:-translate-y-1">
                    <div className="mb-8 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><principle.icon className="size-5" aria-hidden="true" /></span><span className="font-mono text-xs font-bold text-muted-foreground">{principle.number}</span></div>
                    <h3 className="font-display text-xl font-semibold">{principle.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{principle.text}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
            <Reveal className="mx-auto mt-8 max-w-3xl rounded-2xl border border-primary/15 bg-primary/[0.045] p-5">
              <p className="flex gap-3 text-sm leading-6 text-muted-foreground"><Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><strong className="text-foreground">Important:</strong> removing a measured refusal direction does not make a model more truthful, capable, or safe by itself. Every candidate still needs scope, evaluation, and runtime controls.</span></p>
            </Reveal>
          </div>
        </section>

        <section id="path" className="scroll-mt-28 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Interactive route finder" title="Start where you actually are" description="Three choices turn the whole handbook into one practical next step. You can change the answers at any time." /></Reveal>
            <Reveal className="mt-10"><PathFinder /></Reveal>
          </div>
        </section>

        <section id="steps" className="scroll-mt-28 border-y border-border bg-muted/35 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Beginner workflow" title="Six steps. One proof at every handoff." description="Open each step for the why, the actions, and the evidence you should have before moving forward." /></Reveal>
            <Reveal className="mt-10"><StepGuide /></Reveal>
          </div>
        </section>

        <section id="compare" className="scroll-mt-28 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Spider diagram" title="Compare the shape of each method" description="There is no best method in isolation. Select a profile to see where it is strong—and where it asks more of you." /></Reveal>
            <Reveal className="mt-10"><MethodRadar /></Reveal>
          </div>
        </section>

        <section id="techniques" className="scroll-mt-28 border-y border-border bg-card/45 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Technique atlas" title="Go deeper without getting lost" description="The full handbook has T01–T33. This curated atlas surfaces the techniques that change your next decision." /></Reveal>
            <Reveal className="mt-10"><TechniqueExplorer /></Reveal>
          </div>
        </section>

        <section id="gates" className="scroll-mt-28 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Evaluation lab" title="A checkpoint passes all gates—or it waits" description="Move the sliders to see how preservation, target improvement, and artifact integrity combine into one release decision." /></Reveal>
            <Reveal className="mt-10"><EvaluationGates /></Reveal>
          </div>
        </section>

        <section className="border-y border-border bg-muted/35 py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal>
              <SectionHeading eyebrow="Troubleshooting" title="When the result looks wrong" description="The safest fix is usually better evidence or a smaller edit—not more strength." />
              <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-border bg-card px-6">
                {troubleshooting.map((item, index) => (
                  <AccordionItem key={item.question} value={`trouble-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>

            <Reveal delay={0.08}>
              <SectionHeading eyebrow="Tiny glossary" title="The terms that unlock the map" description="Enough vocabulary to read the workflow with confidence." />
              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {glossary.map(([term, definition]) => (
                  <div key={term} className="rounded-2xl border border-border bg-card p-4">
                    <dt className="font-mono text-xs font-bold uppercase tracking-wider text-primary">{term}</dt>
                    <dd className="mt-2 text-sm leading-6 text-muted-foreground">{definition}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <section className="relative isolate overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-foreground" />
          <div className="cta-grid absolute inset-0 -z-10 opacity-20" />
          <Reveal className="mx-auto max-w-3xl px-4 text-center text-background sm:px-6">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-background/10"><BookOpen className="size-6" aria-hidden="true" /></span>
            <h2 className="mt-7 font-display text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">The guide gets you oriented.<br />The handbook takes you all the way.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-background/65">Open the repository for full methods, configs, source papers, evaluation corpora, and reproducibility tools.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild><a href={REPOSITORY_URL}><GitFork aria-hidden="true" /> Explore the handbook</a></Button>
              <Button size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 hover:text-background" asChild><a href={handbookUrl("instructions/beginner-local-model-guide.md")}>Open the full beginner guide <ChevronRight aria-hidden="true" /></a></Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-muted-foreground sm:px-6 md:flex-row md:text-left lg:px-8">
          <span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Orbit className="size-4" /></span> Abliteration Field Guide · CC0 documentation</span>
          <span className="flex flex-wrap justify-center gap-x-5 gap-y-2"><a className="hover:text-foreground" href={handbookUrl("docs/risks-and-ethics.md")}>Responsible use</a><a className="hover:text-foreground" href={handbookUrl("references.md")}>Primary sources</a><a className="hover:text-foreground" href={REPOSITORY_URL}>GitHub</a></span>
        </div>
      </footer>
    </div>
  );
}
