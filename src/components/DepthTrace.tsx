"use client";

import {
  BANDS,
  headPath as buildHeadPath,
  HEIGHT,
  PAD_L,
  PAD_R,
  PAD_Y,
  penPosition,
  settledPath as buildSettledPath,
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
 * it; a judge watching this line respond does not. All the boldness on the
 * page is spent here, which is why everything else is grey.
 *
 * Geometry lives in traceGeometry.ts so it can be tested directly.
 */

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
  const width = traceWidth(points.length);
  const x = traceX;
  const y = traceY;
  const last = points.length - 1;
  const { x: penX, y: penY } = penPosition(points, thinking);

  // The completed line and the newest segment are drawn separately so the
  // head can read as live without adding a second colour.
  const settledPath = buildSettledPath(points);
  const headPath = buildHeadPath(points);

  return (
    <div className="overflow-x-auto" aria-label="Interview depth over time">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block"
        role="img"
      >
        <title>{`Depth trace: ${points.map((p) => p.depth).join(", ") || "no measurements yet"}`}</title>

        {BANDS.map((label, i) => {
          const depth = i + 1;
          return (
            <g key={label}>
              <line
                x1={PAD_L}
                x2={width - PAD_R}
                y1={y(depth)}
                y2={y(depth)}
                stroke="var(--color-rule)"
                strokeWidth={1}
                strokeDasharray={depth === 1 || depth === 5 ? undefined : "1 5"}
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

        {settledPath && (
          <path
            d={settledPath}
            fill="none"
            stroke="var(--color-trace)"
            strokeOpacity={0.45}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {headPath && (
          <path
            key={`head-${points.length}`}
            d={headPath}
            className="trace-draw"
            style={{ ["--dash" as string]: "200" }}
            fill="none"
            stroke="var(--color-trace)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}

        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.depth)}
            r={i === last ? 3 : 2}
            fill={i === last ? "var(--color-trace)" : "var(--color-paper)"}
            stroke="var(--color-trace)"
            strokeOpacity={i === last ? 1 : 0.45}
            strokeWidth={1.5}
            onMouseEnter={() => onHoverIndex?.(i)}
            onMouseLeave={() => onHoverIndex?.(null)}
            className="cursor-default"
          />
        ))}

        {/* The pen: hovering while a measurement settles, resting otherwise. */}
        <g
          transform={`translate(${penX}, ${penY})`}
          className={thinking ? "pen-drift" : undefined}
        >
          {thinking && (
            <line
              x1={0}
              x2={0}
              y1={-HEIGHT}
              y2={HEIGHT}
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
