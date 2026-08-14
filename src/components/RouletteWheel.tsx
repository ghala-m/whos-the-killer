import { useMemo } from "react";

const SLICE_COLORS = ["var(--brass)", "var(--evidence)", "var(--primary)", "var(--cork)"];

export function RouletteWheel({
  teams,
  rotation,
  spinning,
  size = 320,
}: {
  teams: string[];
  rotation: number;
  spinning: boolean;
  size?: number;
}) {
  const slices = useMemo(() => {
    const step = 360 / Math.max(teams.length, 1);
    return teams.map((name, i) => {
      const start = i * step;
      const end = start + step;
      const toXY = (deg: number) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return [50 + 48 * Math.cos(rad), 50 + 48 * Math.sin(rad)];
      };
      const [x1, y1] = toXY(start);
      const [x2, y2] = toXY(end);
      const large = step > 180 ? 1 : 0;
      const mid = toXY(start + step / 2);
      return {
        name,
        path: `M50,50 L${x1},${y1} A48,48 0 ${large} 1 ${x2},${y2} Z`,
        color: SLICE_COLORS[i % SLICE_COLORS.length]!,
        labelX: 50 + (mid[0]! - 50) * 0.62,
        labelY: 50 + (mid[1]! - 50) * 0.62,
        angle: start + step / 2,
      };
    });
  }, [teams]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-3xl leading-none text-evidence drop-shadow"
      >
        ▼
      </span>
      <svg
        viewBox="0 0 100 100"
        className="size-full rounded-full shadow-noir"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.8, 0.08, 1)" : "none",
        }}
      >
        <circle cx="50" cy="50" r="49" fill="var(--card)" />
        {slices.map((s, i) => (
          <g key={`${s.name}-${i}`}>
            <path d={s.path} fill={s.color} stroke="var(--background)" strokeWidth="0.6" />
            <text
              x={s.labelX}
              y={s.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="4.6"
              fill="oklch(0.15 0.02 260)"
              transform={`rotate(${s.angle} ${s.labelX} ${s.labelY})`}
            >
              {s.name.slice(0, 16)}
            </text>
          </g>
        ))}
        <circle cx="50" cy="50" r="7" fill="var(--background)" stroke="var(--brass)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}
