/**
 * Hand-built line drawings for /v3. Every stroke that should "draw itself" carries
 * class "d" + pathLength={1}; --dl sets its delay. Colours come from v3.css.
 */
import type { CSSProperties } from "react";

const dl = (s: number) => ({ "--dl": `${s}s` }) as CSSProperties;

/** The hanging Edison bulb of the scroll scene. viewBox 120 x 190, socket at the top. */
export function Bulb() {
  return (
    <svg viewBox="0 0 120 190" className="v3-bulb-svg" aria-hidden focusable="false">
      <defs>
        <radialGradient id="v3-glass" cx="50%" cy="58%" r="55%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor="#ffd98f" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f2b765" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      {/* socket */}
      <path className="ln" d="M46 2 H74 V12 H46 Z" />
      <path className="ln" d="M44 12 H76 V40 H44 Z" />
      <path className="ln thin" d="M44 19 H76 M44 26 H76 M44 33 H76" />
      <path className="ln" d="M48 40 H72 V46 H48 Z" />
      {/* glass */}
      <path className="v3-glass-fill" d="M50 46 C50 62 24 76 24 114 C24 150 44 172 60 172 C76 172 96 150 96 114 C96 76 70 62 70 46 Z" fill="url(#v3-glass)" />
      <path className="ln" d="M50 46 C50 62 24 76 24 114 C24 150 44 172 60 172 C76 172 96 150 96 114 C96 76 70 62 70 46 Z" />
      <path className="ln thin hl" d="M36 98 C34 110 36 124 42 134" />
      {/* filament: supports + coil (two copies: line + hot glow) */}
      <path className="ln thin" d="M55 47 L52 104 M65 47 L68 104 M60 47 L60 82" />
      <path className="v3-fil" d="M52 104 C54 92 57 92 58 104 C59 92 61 92 62 104 C63 92 66 92 68 104" />
      <path className="v3-fil-hot" d="M52 104 C54 92 57 92 58 104 C59 92 61 92 62 104 C63 92 66 92 68 104" />
    </svg>
  );
}

/** Products panel: a wall-mounted spotlight leaning out of the left quarter, its beam crossing the page. viewBox 400 x 900. */
export function WallSpot() {
  return (
    <svg viewBox="0 170 400 620" className="v3-art-svg" aria-hidden focusable="false" overflow="visible">
      <defs>
        <linearGradient id="v3-beam-a" gradientUnits="userSpaceOnUse" x1="350" y1="0" x2="1900" y2="0">
          <stop offset="0%" stopColor="#ffd690" stopOpacity="0.5" />
          <stop offset="30%" stopColor="#ffe2ae" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#fff3dd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="rotate(28 222 300)">
        <path className="v3-beam" d="M352 262 L2000 -420 L2000 1020 L352 338 Z" fill="url(#v3-beam-a)" />
      </g>
      {/* wall plate + screws */}
      <rect className="ln d" pathLength={1} style={dl(0)} x="18" y="210" width="40" height="130" rx="8" />
      <circle className="ln thin d" pathLength={1} style={dl(0.3)} cx="38" cy="228" r="3.5" />
      <circle className="ln thin d" pathLength={1} style={dl(0.3)} cx="38" cy="322" r="3.5" />
      {/* arm */}
      <path className="ln d" pathLength={1} style={dl(0.4)} d="M58 262 L176 262 Q200 262 210 284" />
      <path className="ln d" pathLength={1} style={dl(0.45)} d="M58 280 L168 280 Q186 280 196 296" />
      <circle className="ln d" pathLength={1} style={dl(0.8)} cx="222" cy="300" r="16" />
      <circle className="ln thin d" pathLength={1} style={dl(0.9)} cx="222" cy="300" r="6" />
      {/* head */}
      <g transform="rotate(28 222 300)">
        <rect className="ln d" pathLength={1} style={dl(1)} x="238" y="262" width="114" height="76" rx="12" />
        <path className="ln thin d" pathLength={1} style={dl(1.2)} d="M258 262 V338 M272 262 V338 M286 262 V338" />
        <ellipse className="ln d" pathLength={1} style={dl(1.3)} cx="352" cy="300" rx="12" ry="38" />
        <ellipse className="v3-lens" cx="352" cy="300" rx="8" ry="32" />
      </g>
      {/* cable down to the switch */}
      <path className="ln thin d" pathLength={1} style={dl(0.6)} d="M38 340 C38 480 30 560 38 690 L38 742" />
    </svg>
  );
}

/** Brands panel: a chandelier whose candle arms carry the brands. viewBox 1000 x 640. */
export function chandelierTips(n: number) {
  const count = Math.max(1, n);
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 500 : 120 + (i * 760) / (count - 1);
    const off = Math.abs(x - 500) / 380; // 0 centre .. 1 outer
    return { x, y: 300 - off * 18 };
  });
}

export function Chandelier({ n, lit }: { n: number; lit: number | null }) {
  const tips = chandelierTips(n);
  return (
    <svg viewBox="0 0 1000 640" className="v3-chand-svg" aria-hidden focusable="false" overflow="visible">
      <defs>
        <radialGradient id="v3-flame-glow">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ffc56a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffc56a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="v3-flame">
          <stop offset="0%" stopColor="#fffbe8" />
          <stop offset="60%" stopColor="#ffcf6e" />
          <stop offset="100%" stopColor="#f19a3e" />
        </radialGradient>
      </defs>
      {/* rod + links up to the ceiling */}
      <path className="ln d" pathLength={1} style={dl(0)} d="M500 -800 L500 150" />
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} className="ln thin" cx="500" cy={30 + i * 22} rx="4" ry="9" />
      ))}
      {/* hub */}
      <circle className="ln d" pathLength={1} style={dl(0.2)} cx="500" cy="166" r="16" />
      <path className="ln d" pathLength={1} style={dl(0.3)} d="M468 196 C466 236 480 262 500 278 C520 262 534 236 532 196 Z" />
      <ellipse className="ln d" pathLength={1} style={dl(0.4)} cx="500" cy="246" rx="120" ry="14" />
      <path className="ln d" pathLength={1} style={dl(0.5)} d="M500 278 L500 330" />
      <path className="ln crystal d" pathLength={1} style={dl(0.7)} d="M500 330 L488 352 L500 384 L512 352 Z" />
      {/* arms */}
      {tips.map((t, i) => {
        const sx = 500 + Math.sign(t.x - 500) * 40;
        const low = 380;
        const d = `M${sx} 250 C${sx + (t.x - sx) * 0.1} ${low}, ${t.x - (t.x - 500) * 0.25} ${low + 10}, ${t.x} ${t.y + 14}`;
        const lowX = sx + (t.x - sx) * 0.5;
        return (
          <g key={i} className={lit === i ? "v3-arm is-lit" : "v3-arm"} style={{ "--i": i } as CSSProperties}>
            <path className="ln d" pathLength={1} style={dl(0.7 + i * 0.12)} d={d} />
            {/* crystal under the arm's belly */}
            <path className="ln thin d" pathLength={1} style={dl(1.1 + i * 0.1)} d={`M${lowX} ${low - 4} L${lowX} ${low + 22}`} />
            <path className="ln crystal d" pathLength={1} style={dl(1.2 + i * 0.1)} d={`M${lowX} ${low + 22} l-7 12 l7 18 l7 -18 Z`} />
            {/* cup + candle */}
            <path className="ln d" pathLength={1} style={dl(1.1 + i * 0.1)} d={`M${t.x - 26} ${t.y} Q${t.x} ${t.y + 22} ${t.x + 26} ${t.y} Z`} />
            <rect className="ln d" pathLength={1} style={dl(1.2 + i * 0.1)} x={t.x - 7} y={t.y - 50} width="14" height="50" rx="2" />
            {/* flame */}
            <circle className="v3-flame-glow" cx={t.x} cy={t.y - 66} r="46" fill="url(#v3-flame-glow)" />
            <path className="v3-flame" d={`M${t.x} ${t.y - 52} C${t.x - 9} ${t.y - 60}, ${t.x - 5} ${t.y - 74}, ${t.x} ${t.y - 86} C${t.x + 5} ${t.y - 74}, ${t.x + 9} ${t.y - 60}, ${t.x} ${t.y - 52} Z`} fill="url(#v3-flame)" />
            {/* hanger for the brand plate */}
            <path className="ln thin d" pathLength={1} style={dl(1.5 + i * 0.1)} d={`M${t.x} ${t.y + 11} L${t.x} ${t.y + 74}`} />
          </g>
        );
      })}
      {/* pull chain */}
      <path className="ln thin d" pathLength={1} style={dl(0.9)} d="M500 386 L500 536" />
    </svg>
  );
}

/** Projects panel: one track spot. viewBox 80 x 110, rod at the top, lens at the bottom. */
export function TrackSpot() {
  return (
    <svg viewBox="0 0 80 110" className="v3-tspot" aria-hidden focusable="false">
      <path className="ln d" pathLength={1} d="M40 0 V26" />
      <circle className="ln d" pathLength={1} cx="40" cy="32" r="6" />
      <rect className="ln d" pathLength={1} x="20" y="40" width="40" height="56" rx="7" />
      <path className="ln thin d" pathLength={1} d="M20 54 H60 M20 64 H60" />
      <ellipse className="ln d" pathLength={1} cx="40" cy="96" rx="20" ry="5" />
      <ellipse className="v3-lens" cx="40" cy="96" rx="15" ry="3.5" />
    </svg>
  );
}

/** About panel: an architect's desk lamp (أباجورة) leaning over the text. viewBox 500 x 800. */
export function DeskLamp() {
  return (
    <svg viewBox="0 0 500 800" className="v3-art-svg" aria-hidden focusable="false" overflow="visible">
      <defs>
        <radialGradient id="v3-lamp-beam" gradientUnits="userSpaceOnUse" cx="110" cy="310" r="1700">
          <stop offset="0%" stopColor="#ffd690" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffe3b0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff3dd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="v3-beam" d="M152 342 L64 272 L-1700 -380 L-1700 1500 L-200 1500 Z" fill="url(#v3-lamp-beam)" />
      {/* base */}
      <path className="ln d" pathLength={1} style={dl(0)} d="M300 772 L462 772 L448 744 L314 744 Z" />
      <circle className="ln d" pathLength={1} style={dl(0.2)} cx="380" cy="736" r="10" />
      {/* lower arm (double) + spring */}
      <path className="ln d" pathLength={1} style={dl(0.3)} d="M374 728 L292 444" />
      <path className="ln d" pathLength={1} style={dl(0.35)} d="M388 726 L306 440" />
      <path className="ln thin d" pathLength={1} style={dl(0.6)} d="M352 660 l10 -6 l-6 -10 l10 -6 l-6 -10 l10 -6 l-6 -10 l10 -6 l-6 -10 l10 -6" />
      <circle className="ln d" pathLength={1} style={dl(0.6)} cx="298" cy="432" r="13" />
      {/* upper arm (double) */}
      <path className="ln d" pathLength={1} style={dl(0.7)} d="M290 422 L186 236" />
      <path className="ln d" pathLength={1} style={dl(0.75)} d="M304 418 L200 232" />
      <circle className="ln d" pathLength={1} style={dl(1)} cx="190" cy="226" r="11" />
      {/* shade (opening faces down-left) */}
      <path className="ln d" pathLength={1} style={dl(1.1)} d="M176 210 L212 240 L152 342 Q100 322 64 272 Z" />
      <path className="ln thin d" pathLength={1} style={dl(1.3)} d="M150 236 L120 300" />
      <path className="v3-lens" d="M150 334 Q104 316 74 276 Q110 300 150 334 Z" />
      {/* cord, with the inline switch near the bottom */}
    </svg>
  );
}

/* ----------------------------- return controls ----------------------------- */

/** Rocker wall switch (products). */
export function WallSwitchArt() {
  return (
    <span className="v3-rocker" aria-hidden>
      <span className="v3-rocker-plate" />
      <span className="v3-rocker-key"><span className="v3-rocker-dot" /></span>
    </span>
  );
}
