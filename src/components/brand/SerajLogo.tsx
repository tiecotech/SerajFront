import { LOGO_PATHS, LOGO_VIEWBOX } from "./logoPaths";

/**
 * The AlSeraj hexagon as a hollow (outlined) mark: six triangles traced from the brand icon.
 * Each triangle has an outline (`.mk-line`, pathLength = 1 so it can be drawn on with
 * stroke-dashoffset) and a warm "light" fill (`.mk-fill`) that switches on like a fixture.
 *
 * `tone`: "light" = for white backgrounds (bronze lines), "dark" = for black backgrounds (champagne lines).
 * `play`: "draw" draws the outline once on mount (pure CSS, no JS needed).
 * Colours come from CSS variables, so one gradient id per instance is enough.
 */
export function SerajMarkSvg({ id, tone = "light", play, className }: { id: string; tone?: "light" | "dark"; play?: "draw"; className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={["mk", `mk-${tone}`, play === "draw" && "mk-draw", className].filter(Boolean).join(" ")} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--mk-s1)" }} />
          <stop offset="50%" style={{ stopColor: "var(--mk-s2)" }} />
          <stop offset="100%" style={{ stopColor: "var(--mk-s3)" }} />
        </linearGradient>
        <radialGradient id={`${id}-f`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff1d6" />
          <stop offset="55%" stopColor="#f0c98a" />
          <stop offset="100%" stopColor="#b8956f" />
        </radialGradient>
      </defs>
      {LOGO_PATHS.map((d, i) => (
        <g key={i} className="mk-tri" style={{ "--n": i } as React.CSSProperties}>
          <path d={d} className="mk-fill" fill={`url(#${id}-f)`} />
          <path d={d} className="mk-line" pathLength={1} fill="none" stroke={`url(#${id}-s)`} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

/** Full logo: hollow mark + wordmark (Arabic / English / "Lighting Systems"). Hovering the parent link lights the mark. */
export function SerajLogo({ id, tone = "light", className, markClassName, wordClassName, draw = false, priority = false }: {
  id: string;
  tone?: "light" | "dark";
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  draw?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={["seraj-logo", className].filter(Boolean).join(" ")}>
      <SerajMarkSvg id={id} tone={tone} play={draw ? "draw" : undefined} className={markClassName} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tone === "dark" ? "/brand/seraj-wordmark-white.webp" : "/brand/seraj-wordmark.webp"}
        alt="السراج المضيء — أنظمة الإضاءة | AlSeraj Almuodea Lighting Systems"
        width={500}
        height={194}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={["seraj-logo-word", wordClassName].filter(Boolean).join(" ")}
      />
    </span>
  );
}
