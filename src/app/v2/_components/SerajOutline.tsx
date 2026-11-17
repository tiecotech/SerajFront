import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/brand/logoPaths";

/**
 * The AlSeraj hexagon as a hollow (outlined) mark: six triangles traced from the brand icon.
 * Each triangle has an outline (drawn on by animating stroke-dashoffset, pathLength = 1)
 * and a "light" fill that can be switched on independently like a fixture.
 */
export function SerajOutline({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={`v2-mark ${className ?? ""}`} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3e2bf" />
          <stop offset="50%" stopColor="#d3bf9a" />
          <stop offset="100%" stopColor="#a27a5b" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff1d6" />
          <stop offset="55%" stopColor="#f0c98a" />
          <stop offset="100%" stopColor="#b8956f" />
        </radialGradient>
      </defs>
      {LOGO_PATHS.map((d, i) => (
        <g key={i} className="v2-mark-tri" style={{ "--n": i } as React.CSSProperties}>
          <path d={d} className="v2-mark-fill" fill={`url(#${id}-light)`} />
          <path d={d} className="v2-mark-line" pathLength={1} fill="none" stroke={`url(#${id}-stroke)`} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}
