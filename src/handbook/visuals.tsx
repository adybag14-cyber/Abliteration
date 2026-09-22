import { useId } from "react";
import type { LessonKind } from "./types";

export function ChapterIllustration({ kind }: { kind: LessonKind }) {
  const id = useId().replaceAll(":", "");
  const layers = kind === "layers" || kind === "study";
  return (
    <svg
      viewBox="0 0 360 210"
      className="chapter-illustration"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="currentColor" stopOpacity=".15" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
        <pattern
          id={`${id}-grid`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity=".13" />
        </pattern>
      </defs>
      <rect width="360" height="210" fill={`url(#${id}-grid)`} rx="24" />
      {layers ? (
        <g>
          {Array.from({ length: 24 }, (_, i) => (
            <g key={i}>
              <rect
                x={24 + (i % 8) * 40}
                y={32 + Math.floor(i / 8) * 48}
                width="28"
                height="34"
                rx="7"
                fill="currentColor"
                opacity={i === 10 || i === 11 ? 0.85 : 0.08}
                stroke="currentColor"
                strokeOpacity=".3"
              />
              <path
                d={`M${38 + (i % 8) * 40} ${66 + Math.floor(i / 8) * 48}v14`}
                stroke="currentColor"
                opacity=".2"
              />
            </g>
          ))}
          <text
            x="24"
            y="194"
            fill="currentColor"
            fontSize="11"
            fontFamily="monospace"
            letterSpacing="2"
          >
            LOCALIZE · MEASURE · COMPARE
          </text>
        </g>
      ) : kind === "routing" || kind === "workflow" ? (
        <g stroke="currentColor">
          <path
            d="M65 105C125 105 110 45 180 45M65 105H180M65 105C125 105 110 165 180 165M210 45C270 45 245 105 300 105M210 105H300M210 165C270 165 245 105 300 105"
            fill="none"
            strokeWidth="2"
            opacity=".32"
          />
          {[
            [45, 85, 40, 40],
            [165, 27, 55, 36],
            [165, 87, 55, 36],
            [165, 147, 55, 36],
            [282, 87, 36, 36],
          ].map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="10"
              fill="currentColor"
              fillOpacity={i === 2 ? 0.2 : 0.07}
              strokeOpacity=".55"
            />
          ))}
          <circle cx="191" cy="105" r="5" fill="currentColor" />
        </g>
      ) : kind === "research" || kind === "evidence" ? (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={38 + i * 94}
                y={35 + i * 12}
                width="74"
                height="105"
                rx="12"
                fill="currentColor"
                fillOpacity=".06"
                stroke="currentColor"
                strokeOpacity=".3"
              />
              {[0, 1, 2, 3].map((j) => (
                <path
                  key={j}
                  d={`M${51 + i * 94} ${59 + i * 12 + j * 15}h${j === 3 ? 25 : 45}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity={j === 0 ? 0.7 : 0.18}
                  strokeLinecap="round"
                />
              ))}
            </g>
          ))}
          <path d="M57 180H315" stroke="currentColor" opacity=".22" />
          <circle cx="116" cy="180" r="4" fill="currentColor" />
          <circle cx="231" cy="180" r="4" fill="currentColor" />
        </g>
      ) : (
        <g>
          <path d="M40 164H315M83 188V22" stroke="currentColor" opacity=".22" />
          <path
            d="M83 164L278 51"
            stroke={`url(#${id}-line)`}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M83 164L240 164"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M240 164V73"
            stroke="currentColor"
            strokeDasharray="5 5"
            opacity=".5"
          />
          <circle
            cx="241"
            cy="72"
            r="8"
            fill="currentColor"
            fillOpacity=".12"
            stroke="currentColor"
          />
          <text
            x="287"
            y="50"
            fill="currentColor"
            fontSize="17"
            fontFamily="serif"
          >
            h
          </text>
          <text
            x="249"
            y="184"
            fill="currentColor"
            fontSize="17"
            fontFamily="serif"
          >
            h′
          </text>
          <text
            x="61"
            y="26"
            fill="currentColor"
            fontSize="17"
            fontFamily="serif"
          >
            r
          </text>
        </g>
      )}
    </svg>
  );
}

export function projectionPoint(angle: number, strength: number) {
  const radians = (angle * Math.PI) / 180;
  const r = [Math.cos(radians), Math.sin(radians)];
  const original = [1.8, 1.2];
  const dot = original[0] * r[0] + original[1] * r[1];
  const output = [
    original[0] - strength * dot * r[0],
    original[1] - strength * dot * r[1],
  ];
  return {
    original,
    direction: r,
    output,
    before: dot,
    after: output[0] * r[0] + output[1] * r[1],
    norm: Math.hypot(...output),
  };
}

export function ProjectionDiagram({
  angle,
  strength,
}: {
  angle: number;
  strength: number;
}) {
  const data = projectionPoint(angle, strength);
  const x = (value: number) => 185 + value * 60;
  const y = (value: number) => 170 - value * 60;
  const id = useId().replaceAll(":", "");
  return (
    <svg
      viewBox="0 0 370 340"
      role="img"
      aria-label={`Illustrative vector projection: direction component changes from ${data.before.toFixed(2)} to ${data.after.toFixed(2)}`}
      className="projection-diagram"
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" fill="context-stroke" />
        </marker>
      </defs>
      {[-2, -1, 0, 1, 2].map((n) => (
        <g key={n}>
          <path
            d={`M${x(n)} 25V315M30 ${y(n)}H340`}
            stroke="currentColor"
            opacity={n === 0 ? 0.25 : 0.06}
          />
          {n !== 0 && (
            <text
              x={x(n)}
              y="189"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity=".5"
            >
              {n}
            </text>
          )}
        </g>
      ))}
      <circle
        cx="185"
        cy="170"
        r={Math.hypot(...data.original) * 60}
        fill="none"
        stroke="currentColor"
        strokeDasharray="3 7"
        opacity=".13"
      />
      <path
        d={`M${x(-data.direction[0] * 2.4)} ${y(-data.direction[1] * 2.4)}L${x(data.direction[0] * 2.4)} ${y(data.direction[1] * 2.4)}`}
        stroke="var(--chapter-accent)"
        strokeDasharray="5 5"
        opacity=".45"
      />
      <path
        d={`M185 170L${x(data.original[0])} ${y(data.original[1])}`}
        stroke="#3b82f6"
        strokeWidth="3"
        markerEnd={`url(#${id})`}
      />
      <path
        d={`M${x(data.original[0])} ${y(data.original[1])}L${x(data.output[0])} ${y(data.output[1])}`}
        stroke="currentColor"
        strokeDasharray="4 4"
        opacity=".3"
      />
      <path
        d={`M185 170L${x(data.output[0])} ${y(data.output[1])}`}
        stroke="#10b981"
        strokeWidth="4"
        markerEnd={`url(#${id})`}
      />
      <circle
        cx={x(data.output[0])}
        cy={y(data.output[1])}
        r="5"
        fill="#10b981"
      />
      <text
        x={x(data.original[0]) + 9}
        y={y(data.original[1]) - 8}
        fill="#3b82f6"
        fontSize="13"
        fontWeight="600"
      >
        original
      </text>
      <text
        x={x(data.output[0]) + 8}
        y={y(data.output[1]) + 18}
        fill="#059669"
        fontSize="13"
        fontWeight="600"
      >
        edited
      </text>
      <text x="22" y="327" fill="currentColor" opacity=".5" fontSize="11">
        2D illustration · unitless · not model measurements
      </text>
    </svg>
  );
}
