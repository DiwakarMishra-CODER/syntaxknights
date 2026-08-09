"use client";

import {
  BANDS,
  segmentPath,
  segments,
  traceHeight,
  PAD_X,
  PAD_Y,
  penPosition,
  COL_WIDTH,
  traceWidth,
  traceX,
  traceY,
} from "./traceGeometry";

export interface TracePoint {
  depth: number;
  day: number | null;
  measured: boolean;
  /** The area this question was about. */
  title?: string | null;
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

  // One run per topic — a new topic opens a rung lower by design, so one
  // continuous line draws that reset as the candidate collapsing.
  const segs = segments(points);

  return (
    <div className="w-full overflow-hidden flex flex-col items-center">
      {/* Top Labels - 1D Representation */}
      {/* Positioned from the SAME geometry as the plot. As a flex row these
          drifted: five equal cells centre at 54/110/166/222/278 while the
          points sit at 26/96/166/236/306, so only the middle column lined up
          and every label pointed at the wrong column. */}
      <div className="relative mb-2 h-[26px] w-full" style={{ maxWidth: width }}>
        {BANDS.map((label, i) => {
          const depth = i + 1;
          const isCurrent = points.length > 0 && Math.round(points[last].depth) === depth;
          return (
            <div
              key={label}
              className={`absolute text-center font-sans text-[8.5px] font-semibold uppercase leading-[1.25] tracking-[0.06em] transition-colors duration-500 ${
                isCurrent ? "text-[var(--app-accent-text)]" : "text-[var(--app-muted)]"
              }`}
              style={{
                left: x(depth),
                width: COL_WIDTH,
                transform: "translateX(-50%)",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="relative w-full flex justify-center">
        {/* We fix the height so it doesn't jump too much, or let it scroll if long */}
        <div className="w-full overflow-hidden" style={{ height: Math.max(height, 80) }}>
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
                  stroke="var(--app-border)"
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
                stroke="var(--app-muted)"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}

            {segs.map((seg) => {
              const d = segmentPath(seg);
              if (!d) return null;
              const isHead = seg.end === last && points.length > 1;
              return (
                <path
                  key={`seg-${seg.start}`}
                  d={d}
                  className={isHead ? "trace-draw" : undefined}
                  style={
                    isHead
                      ? ({ ["--dash" as string]: "400" } as React.CSSProperties)
                      : undefined
                  }
                  fill="none"
                  stroke={isHead ? "var(--app-accent-text)" : "var(--app-muted)"}
                  strokeOpacity={isHead ? 1 : 0.45}
                  strokeWidth={isHead ? 2 : 1.75}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}

            {points.map((p, i) => {
              const isActive = activeIndex === i;
              const isLast = i === last;
              return (
                <circle
                  key={i}
                  cx={x(p.depth)}
                  cy={y(i)}
                  r={isLast ? 4 : isActive ? 3 : 2}
                  /* The opening line's depth is PLANNED by the blueprint,
                     not measured from an answer. */
                  fill={
                    (isLast || isActive) && p.measured
                      ? "var(--app-accent-text)"
                      : "var(--app-glass)"
                  }
                  stroke={isLast || isActive ? "var(--app-accent-text)" : "var(--app-muted)"}
                  strokeOpacity={p.measured ? (isLast || isActive ? 1 : 0.6) : 0.35}
                  strokeDasharray={p.measured ? undefined : "1.5 1.5"}
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
                  stroke="var(--app-accent-text)"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
              <circle
                r={thinking ? 4.5 : 0}
                fill="none"
                stroke="var(--app-accent-text)"
                strokeWidth={1.5}
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
