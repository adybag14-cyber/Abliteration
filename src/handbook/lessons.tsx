import { lazy, Suspense, useState } from "react";
import {
  ArrowDown,
  ChevronRight,
  FlaskConical,
  Layers3,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProjectionDiagram, projectionPoint } from "./visuals";
import type { Chapter } from "./types";

const SelectiveLab = lazy(() =>
  import("@/components/selective-lab").then((module) => ({
    default: module.SelectiveLab,
  })),
);
const Results = lazy(() =>
  import("@/components/research-results").then((module) => ({
    default: module.ResearchResults,
  })),
);
const Evaluation = lazy(() =>
  import("@/components/evaluation-gates").then((module) => ({
    default: module.EvaluationGates,
  })),
);
const Papers = lazy(() =>
  import("@/components/research-explorer").then((module) => ({
    default: module.ResearchExplorer,
  })),
);

function ProjectionLesson() {
  const [angle, setAngle] = useState(55);
  const [strength, setStrength] = useState(0.65);
  const point = projectionPoint(angle, strength);
  return (
    <div className="lesson-split">
      <div>
        <p className="eyebrow">Geometry you can inspect</p>
        <h3>Move the direction. See what remains.</h3>
        <p>
          Change the direction and the amount subtracted from a two-dimensional
          vector. This illustrates the operator; it does not predict a language
          model's behavior.
        </p>
        <div className="lesson-control">
          <label id="projection-angle-label">
            Direction angle <output>{angle}°</output>
          </label>
          <Slider
            aria-labelledby="projection-angle-label"
            value={[angle]}
            min={0}
            max={180}
            step={5}
            onValueChange={([value]) => setAngle(value)}
          />
        </div>
        <div className="lesson-control">
          <label id="projection-strength-label">
            Projection strength <output>{strength.toFixed(2)}</output>
          </label>
          <Slider
            aria-labelledby="projection-strength-label"
            value={[strength]}
            min={0}
            max={2}
            step={0.05}
            onValueChange={([value]) => setStrength(value)}
          />
        </div>
        <div className="lesson-presets">
          <Button variant="secondary" size="sm" onClick={() => setStrength(0)}>
            Original
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setStrength(1)}>
            Remove component
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setStrength(2)}>
            Reflect
          </Button>
        </div>
        <code className="lesson-formula">h′ = h − α(h · r)r</code>
        <dl className="lesson-metrics" aria-live="polite">
          <div>
            <dt>Component before</dt>
            <dd>{point.before.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Component after</dt>
            <dd>{point.after.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Edited norm</dt>
            <dd>{point.norm.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
      <ProjectionDiagram angle={angle} strength={strength} />
    </div>
  );
}

function RoutingLesson() {
  const [active, setActive] = useState([1, 4]);
  const weights = [0.05, 0.42, 0.03, 0.06, 0.31, 0.04, 0.05, 0.04];
  const coverage = active.reduce((total, index) => total + weights[index], 0);
  return (
    <div>
      <p className="eyebrow">Routed models · illustrative example</p>
      <h3>Editing an expert and using an expert are different events.</h3>
      <p>
        Select experts in this eight-expert illustration. The total shows the
        share of this example's routing mass touched by that selection, not a
        predicted refusal rate.
      </p>
      <div
        className="expert-grid"
        role="group"
        aria-label="Illustrative experts"
      >
        {weights.map((weight, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={active.includes(index)}
            onClick={() =>
              setActive((current) =>
                current.includes(index)
                  ? current.filter((x) => x !== index)
                  : [...current, index],
              )
            }
            className={active.includes(index) ? "selected" : ""}
          >
            <Layers3 aria-hidden="true" />
            <strong>E{index}</strong>
            <span>{Math.round(weight * 100)}% routing</span>
          </button>
        ))}
      </div>
      <div className="routing-track">
        <span style={{ width: `${coverage * 100}%` }} />
      </div>
      <p className="routing-result" role="status">
        <strong>{Math.round(coverage * 100)}%</strong> of illustrative routing
        mass · {active.length}/8 experts selected
      </p>
      <p className="lesson-caption">
        Actual routed models require measured expert utilization, component
        names, and held-out tests. The source chapter defines the applicable
        architecture and method.
      </p>
    </div>
  );
}

function WorkflowLesson({ chapter }: { chapter: Chapter }) {
  const steps = chapter.headings
    .filter((heading) => heading.depth === 2)
    .slice(0, 8);
  const [selected, setSelected] = useState(0);
  if (!steps.length) return null;
  return (
    <div>
      <p className="eyebrow">Navigate the chapter</p>
      <h3>A map of the material ahead.</h3>
      <p>
        Select a stop to orient yourself, then jump to its complete explanation.
        The sequence follows this chapter's own sections.
      </p>
      <div className="chapter-map" role="group" aria-label="Chapter map">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={selected === index ? "selected" : ""}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <ChevronRight aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="map-destination">
        <div>
          <span className="eyebrow">Selected section</span>
          <h4>{steps[selected].title}</h4>
        </div>
        <Button asChild>
          <a href={`#${steps[selected].id}`}>
            Read this section <ArrowDown aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
}

const labels = {
  projection: "Explore the geometry",
  layers: "Plan a selective edit",
  routing: "Explore routing coverage",
  evidence: "Explore evaluation gates",
  workflow: "Explore the chapter map",
  research: "Explore the primary records",
  study: "Explore the measured results",
};

export function ChapterCompanion({ chapter }: { chapter: Chapter }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section
      className="chapter-companion"
      aria-label="Interactive chapter companion"
    >
      <div className="companion-heading">
        <div>
          <span className="eyebrow">
            <FlaskConical aria-hidden="true" /> Interactive companion
          </span>
          <h2>{labels[chapter.lesson]}</h2>
          <p>Use the visual controls alongside the complete source chapter.</p>
        </div>
        <Button
          variant={expanded ? "secondary" : "default"}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <RotateCcw aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          {expanded ? "Close companion" : "Open companion"}
        </Button>
      </div>
      {expanded && (
        <div
          className="companion-content"
          onClickCapture={(event) => {
            const anchor = (event.target as Element).closest?.("a");
            if (
              anchor &&
              anchor.pathname === window.location.pathname &&
              !anchor.hash
            ) {
              event.preventDefault();
              document
                .getElementById("chapter-content")
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <Suspense
            fallback={
              <p className="companion-loading" role="status">
                Loading interactive controls…
              </p>
            }
          >
            {chapter.lesson === "projection" ? (
              <ProjectionLesson />
            ) : chapter.lesson === "routing" ? (
              <RoutingLesson />
            ) : chapter.lesson === "workflow" ? (
              <WorkflowLesson chapter={chapter} />
            ) : chapter.lesson === "layers" ? (
              <SelectiveLab />
            ) : chapter.lesson === "study" ? (
              <Results />
            ) : chapter.lesson === "evidence" ? (
              <Evaluation />
            ) : (
              <Papers />
            )}
          </Suspense>
        </div>
      )}
    </section>
  );
}
