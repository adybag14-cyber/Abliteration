import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { methodProfiles, radarAxes } from "@/data/guide";
import { cn } from "@/lib/utils";

const center = 210;
const radius = 132;
const labelRadius = 174;

function point(axis: number, value: number, maxRadius = radius) {
  const angle = -Math.PI / 2 + (axis * Math.PI * 2) / radarAxes.length;
  const distance = (value / 5) * maxRadius;
  return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
}

function polygon(values: readonly number[], maxRadius = radius) {
  return values.map((value, index) => point(index, value, maxRadius).join(",")).join(" ");
}

export function MethodRadar() {
  const [selected, setSelected] = useState(methodProfiles[1].key);
  const profile = methodProfiles.find((item) => item.key === selected) ?? methodProfiles[0];
  const shape = useMemo(() => polygon(profile.values), [profile]);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div>
        <div className="space-y-2" role="radiogroup" aria-label="Method to compare">
          {methodProfiles.map((method) => (
            <button
              type="button"
              role="radio"
              aria-checked={profile.key === method.key}
              key={method.key}
              onClick={() => setSelected(method.key)}
              className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring", profile.key === method.key ? "border-primary/35 bg-primary/[0.06] shadow-sm" : "border-transparent hover:border-border hover:bg-card")}
            >
              <span className="size-3 shrink-0 rounded-full" style={{ background: method.color, boxShadow: `0 0 0 5px ${method.color}18` }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{method.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{method.subtitle}</span>
              </span>
              {profile.key === method.key && <Badge>Selected</Badge>}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">Scores are an orientation aid, not benchmark results. Always test the exact model and deployment.</p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[480px] rounded-[2rem] border border-border bg-card p-2 sm:p-5">
        <svg viewBox="0 0 420 420" className="size-full overflow-visible" role="img" aria-labelledby="radar-title radar-desc">
          <title id="radar-title">Method profile for {profile.name}</title>
          <desc id="radar-desc">{radarAxes.map((axis, index) => `${axis}: ${profile.values[index]} out of 5`).join(". ")}</desc>
          {[1, 2, 3, 4, 5].map((level) => (
            <polygon key={level} points={polygon(new Array(5).fill(level))} fill={level === 5 ? "var(--muted)" : "none"} fillOpacity={level === 5 ? 0.35 : 0} stroke="var(--border)" strokeWidth="1" />
          ))}
          {radarAxes.map((_, index) => {
            const [x, y] = point(index, 5);
            return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
          })}
          <motion.polygon points={shape} animate={{ points: shape }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} fill={profile.color} fillOpacity="0.18" stroke={profile.color} strokeWidth="3" strokeLinejoin="round" />
          {profile.values.map((value, index) => {
            const [x, y] = point(index, value);
            return <motion.circle key={`${profile.key}-${index}`} initial={{ r: 0 }} animate={{ r: 5 }} cx={x} cy={y} fill={profile.color} stroke="var(--card)" strokeWidth="3" />;
          })}
          {radarAxes.map((axis, index) => {
            const [x, y] = point(index, 5, labelRadius);
            const anchor = x < center - 15 ? "end" : x > center + 15 ? "start" : "middle";
            return <text key={axis} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-foreground text-[12px] font-semibold">{axis}</text>;
          })}
        </svg>
      </div>
    </div>
  );
}
