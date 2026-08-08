"use client";

import { RUNG_LABEL } from "@/lib/depth";

import {
  HEIGHT,
  PAD_L,
  PAD_R,
  PAD_Y,
  penPosition,
  ROW,
  segmentPath,
  segments,
  traceStep,
  traceWidth,
  traceX,
  traceY,
  type TracePoint,
} from "./traceGeometry";

export type { TracePoint };

/**
 * The signature element: a chart-recorder strip plotting interview depth.
 *
 * This is the only thing on screen that SHOWS adaptation rather than
 * asserting it. A judge watching a chat window has to take our word for
 * it; a judge watching this line respond does not.
 *
 * The line is drawn in SEGMENTS, one per topic, with a gap between them.
 * `reanchorDepth` opens every new topic a rung back on purpose, so a single
 * continuous line rendered that reset as a fall — the chart's most dramatic
 * feature was a collapse that never happened.
 *
 * Geometry lives in traceGeometry.ts so it can be tested directly.
 */

/** Room under the axis for question numbers and topic labels. */
const AXIS_H = 34;
const CHART_H = HEIGHT + AXIS_H;

export function DepthTrace({
  points,
  thinking,
  activeIndex,
  onHoverIndex,
}: {
  points: TracePoint[];
  thinking: boolean;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
}) {
  // One step for the whole chart: stretched for a short interview, tight for
  // a long one. Everything positional derives from it.
  const step = traceStep(points.length);
  const width = traceWidth(points.length);
  const x = (i: number) => traceX(i, step);
  const y = traceY;
  const last = points.length - 1;
  const { x: penX, y: penY } = penPosition(points, thinking, step);
  const segs = segments(points);

  return (
    <div className="overflow-x-auto" aria-label="Interview depth over time">
      <svg
        width={width}
        height={CHART_H}
        viewBox={`0 0 ${width} ${CHART_H}`}
        className="block"
        role="img"
      >
        <title>{`Depth trace: ${points.map((p) => p.depth).join(", ") || "no measurements yet"}`}</title>

        {/* Gridlines are muted hard — the trace is the subject, not the paper. */}
        {RUNG_LABEL.map((label, i) => {
          const depth = i + 1;
          return (
            <g key={label}>
              <line
                x1={PAD_L}
                x2={width - PAD_R}
                y1={y(depth)}
                y2={y(depth)}
                stroke="var(--color-rule)"
                strokeOpacity={depth === 1 || depth === 5 ? 0.7 : 0.35}
                strokeWidth={1}
                strokeDasharray={depth === 1 || depth === 5 ? undefined : "1 7"}
              />
              <text
                x={PAD_L - 10}
                y={y(depth) + 3.5}
                textAnchor="end"
                className="font-apparatus"
                fontSize={9.5}
                letterSpacing="0.04em"
                fill="var(--color-graphite-35)"
              >
                {depth} {label}
              </text>
            </g>
          );
        })}

        {/* The turn under the cursor, marked on the paper. */}
        {activeIndex !== null && points[activeIndex] && (
          <line
            x1={x(activeIndex)}
            x2={x(activeIndex)}
            y1={PAD_Y - 6}
            y2={HEIGHT - PAD_Y + 6}
            stroke="var(--color-graphite-35)"
            strokeWidth={1}
          />
        )}

        {segs.map((seg) => {
          const d = segmentPath(seg, step);
          if (!d) return null;
          // The newest segment keeps the drawing animation; earlier ones are
          // settled and drawn at full weight so they stay legible on a
          // shared screen.
          const isHead = seg.end === last && points.length > 1;
          return (
            <path
              key={`seg-${seg.start}`}
              d={d}
              className={isHead ? "trace-draw" : undefined}
              style={
                isHead ? ({ ["--dash" as string]: "400" } as React.CSSProperties) : undefined
              }
              fill="none"
              stroke="var(--color-trace)"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.depth)}
            r={i === last ? 4.5 : 3}
            fill={i === last && p.measured ? "var(--color-trace)" : "var(--color-paper)"}
            stroke="var(--color-trace)"
            strokeOpacity={p.measured ? 1 : 0.4}
            strokeWidth={2}
            strokeDasharray={p.measured ? undefined : "1.5 1.5"}
            onMouseEnter={() => onHoverIndex?.(i)}
            onMouseLeave={() => onHoverIndex?.(null)}
            className="cursor-default"
          >
            <title>
              {p.measured
                ? `Question ${i + 1}: depth ${p.depth} of 5`
                : `Question ${i + 1}: depth ${p.depth} of 5 — planned, not yet measured`}
            </title>
          </circle>
        ))}

        {/* Question numbers, so a dot can be matched to what was said. */}
        {points.map((_, i) => (
          <text
            key={`n-${i}`}
            x={x(i)}
            y={HEIGHT + 12}
            textAnchor="middle"
            className="font-apparatus"
            fontSize={9}
            fill={activeIndex === i ? "var(--color-graphite)" : "var(--color-graphite-35)"}
          >
            {i + 1}
          </text>
        ))}

        {/* One label per topic, centred under its own segment. */}
        {segs.map((seg) => {
          if (!seg.title) return null;
          const mid = (x(seg.start) + x(seg.end)) / 2;
          const room = Math.max(x(seg.end) - x(seg.start) + 30, 46);
          return (
            <text
              key={`t-${seg.start}`}
              x={mid}
              y={HEIGHT + 26}
              textAnchor="middle"
              className="font-apparatus"
              fontSize={9}
              letterSpacing="0.03em"
              fill="var(--color-graphite-60)"
            >
              {truncate(topicLabel(seg.title), Math.floor(room / 5.2))}
            </text>
          );
        })}

        {/* The pen: hovering while a measurement settles, resting otherwise. */}
        <g
          transform={`translate(${penX}, ${penY})`}
          className={thinking ? "pen-drift" : undefined}
        >
          {thinking && (
            <line
              x1={0}
              x2={0}
              y1={-ROW * 5}
              y2={ROW * 5}
              stroke="var(--color-trace)"
              strokeOpacity={0.14}
              strokeWidth={1}
            />
          )}
          <circle
            r={thinking ? 3.5 : 0}
            fill="none"
            stroke="var(--color-trace)"
            strokeWidth={1.5}
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * "The Retrieval & Matching Engine" truncated to "The Retrieval & M…" — the
 * leading article ate the room the distinguishing words needed.
 */
function topicLabel(title: string): string {
  return title.replace(/^The\s+/i, "");
}

/** SVG has no text-overflow, so the ellipsis has to be computed. */
function truncate(text: string, max: number): string {
  if (max < 4) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
