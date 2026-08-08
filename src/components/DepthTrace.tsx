"use client";

import {
  BANDS,
  headPath as buildHeadPath,
  traceHeight,
  PAD_X,
  PAD_Y,
  penPosition,
  settledPath as buildSettledPath,
  traceWidth,
  traceX,
  traceY,
} from "./traceGeometry";

export interface TracePoint {
  depth: number;
  day: number | null;
  measured: boolean;
}

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
  const width = traceWidth();
  const height = traceHeight(points.length);
  const x = traceX;
  const y = traceY;
  const last = points.length - 1;
  const { x: penX, y: penY } = penPosition(points, thinking);

  const settledPath = buildSettledPath(points);
  const headPath = buildHeadPath(points);

  return (
    <div className="w-full overflow-hidden flex flex-col items-center">
      {/* Top Labels - 1D Representation */}
      <div className="flex items-center justify-between w-full max-w-[500px] mb-2 px-[60px]">
        {BANDS.map((label, i) => {
          const depth = i + 1;
          const isCurrent = points.length > 0 && Math.round(points[last].depth) === depth;
          return (
            <div
              key={label}
              className={`font-apparatus text-[10.5px] uppercase tracking-widest transition-colors duration-500 ${
                isCurrent ? "text-accent-emerald font-bold" : "text-graphite-35"
              }`}
              style={{ flex: 1, textAlign: "center" }}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="relative w-full flex justify-center">
        {/* We fix the height so it doesn't jump too much, or let it scroll if long */}
        <div className="w-[500px] overflow-hidden" style={{ height: Math.max(height, 80) }}>
          <svg
            width={width}
            height={Math.max(height, 80)}
            viewBox={`0 0 ${width} ${Math.max(height, 80)}`}
            className="block"
            role="img"
          >
            <title>
              {`Depth trace: ${points.map((p) => p.depth).join(", ") || "no measurements yet"}`}
            </title>

            {/* Vertical grid lines for each depth band */}
            {BANDS.map((_, i) => {
              const depth = i + 1;
              return (
                <line
                  key={`grid-${depth}`}
                  x1={x(depth)}
                  x2={x(depth)}
                  y1={PAD_Y}
                  y2={Math.max(height, 80) - PAD_Y}
                  stroke="var(--color-rule)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              );
            })}

            {/* Horizontal timeline cursor */}
            {activeIndex !== null && points[activeIndex] && (
              <line
                x1={PAD_X - 20}
                x2={width - PAD_X + 20}
                y1={y(activeIndex)}
                y2={y(activeIndex)}
                stroke="var(--color-graphite-35)"
                strokeWidth={1}
                strokeDasharray="2 2"
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
                stroke="var(--color-accent-emerald)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            )}

            {points.map((p, i) => {
              const isActive = activeIndex === i;
              const isLast = i === last;
              return (
                <circle
                  key={i}
                  cx={x(p.depth)}
                  cy={y(i)}
                  r={isLast ? 4 : isActive ? 3 : 2}
                  fill={isLast || isActive ? "var(--color-accent-emerald)" : "var(--color-paper)"}
                  stroke={isLast || isActive ? "var(--color-accent-emerald)" : "var(--color-trace)"}
                  strokeOpacity={isLast || isActive ? 1 : 0.6}
                  strokeWidth={1.5}
                  onMouseEnter={() => onHoverIndex?.(i)}
                  onMouseLeave={() => onHoverIndex?.(null)}
                  className="cursor-pointer transition-all duration-300"
                />
              );
            })}

            {/* The pen: hovering while a measurement settles, resting otherwise. */}
            <g
              transform={`translate(${penX}, ${penY})`}
              className={thinking ? "pen-drift" : undefined}
            >
              {thinking && (
                <line
                  x1={-width}
                  x2={width}
                  y1={0}
                  y2={0}
                  stroke="var(--color-accent-emerald)"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
              <circle
                r={thinking ? 4.5 : 0}
                fill="none"
                stroke="var(--color-accent-emerald)"
                strokeWidth={1.5}
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
