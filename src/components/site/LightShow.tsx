"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Json } from "@/lib/types";

/**
 * Scroll-driven "the building lights up" intro.
 * The section is tall (≈380vh); its inner stage is sticky. Scroll progress p ∈ [0,1] drives:
 * sky (dusk → luminous champagne), window lights (bottom-up, staggered), facade uplights,
 * roof line, ground reflection and the staged texts (all editable from the CMS).
 */

type Win = { x: number; y: number; w: number; h: number; t: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (c1: string, c2: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
};

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function building(x0: number, y0: number, cols: number, rows: number, w: number, h: number, gapX: number, gapY: number, start: number, span: number, seed: number): Win[] {
  const r = rng(seed);
  const out: Win[] = [];
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const fromBottom = (rows - 1 - row) / Math.max(1, rows - 1);
      out.push({ x: x0 + c * (w + gapX), y: y0 + row * (h + gapY), w, h, t: start + fromBottom * span * 0.75 + r() * span * 0.35 });
    }
  }
  return out;
}

export function LightShow({ content }: { content: Record<string, Json> }) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const stages: { title: string; text?: string }[] = Array.isArray(content.stages) ? content.stages : [];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setP(clamp(-rect.top / Math.max(1, total)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const windows = useMemo(() => [
    ...building(468, 150, 6, 13, 34, 26, 15, 16, 0.08, 0.55, 7),   // main tower
    ...building(196, 372, 4, 8, 30, 22, 17, 14, 0.18, 0.5, 11),    // left block
    ...building(832, 300, 4, 10, 30, 22, 17, 14, 0.14, 0.52, 23),  // right block
  ], []);

  const dusk = 1 - smooth(0.45, 0.95, p);
  const skyTop = mix("#121a16", "#fbf8f3", 1 - dusk);
  const skyBottom = mix("#2c3930", "#efe2cc", 1 - dusk);
  const body = mix("#1b2420", "#d9ccb6", smooth(0.55, 1, p));
  const bodyEdge = mix("#2a3630", "#c8b590", smooth(0.55, 1, p));
  const far = mix("#18211d", "#e7dccb", smooth(0.5, 1, p));
  const uplight = smooth(0.42, 0.7, p);
  const roof = smooth(0.7, 0.86, p);
  const lightText = dusk > 0.35;
  const stageCount = stages.length;
  const finalOn = smooth(0.8, 0.9, p);

  return (
    <section ref={ref} className="relative" style={{ height: "380vh" }} aria-label={content.title || "مشهد الإضاءة"}>
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 100%)` }}>
        {/* stars fade as the scene brightens */}
        <div className="pointer-events-none absolute inset-0" style={{ opacity: clamp(dusk * 1.2 - 0.2), backgroundImage: "radial-gradient(1px 1px at 12% 18%, #fff8, transparent), radial-gradient(1px 1px at 34% 9%, #fff6, transparent), radial-gradient(1.5px 1.5px at 72% 14%, #fff7, transparent), radial-gradient(1px 1px at 88% 26%, #fff5, transparent), radial-gradient(1px 1px at 56% 22%, #fff5, transparent), radial-gradient(1px 1px at 22% 30%, #fff4, transparent)" }} />
        {/* warm halo behind the tower */}
        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(232,196,128,0.55) 0%, rgba(232,196,128,0) 65%)", opacity: smooth(0.25, 0.85, p) }} />

        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="ls-win" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF4D6" />
              <stop offset="100%" stopColor="#E9BE73" />
            </linearGradient>
            <linearGradient id="ls-beam" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FFE2A8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFE2A8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ls-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E9BE73" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E9BE73" stopOpacity="0" />
            </linearGradient>
            <filter id="ls-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>

          {/* far skyline */}
          <path d="M0 620 L60 620 L60 560 L120 560 L120 600 L170 600 L170 520 L230 520 L230 610 L300 610 L300 575 L1000 575 L1000 540 L1060 540 L1060 600 L1120 600 L1120 530 L1200 530 L1200 800 L0 800Z" fill={far} opacity="0.9" />

          {/* buildings */}
          <rect x="180" y="352" width="240" height="348" fill={body} stroke={bodyEdge} strokeWidth="2" />
          <rect x="816" y="280" width="240" height="420" fill={body} stroke={bodyEdge} strokeWidth="2" />
          <rect x="448" y="120" width="304" height="580" fill={body} stroke={bodyEdge} strokeWidth="2" />
          <rect x="440" y="104" width="320" height="18" fill={bodyEdge} />
          <rect x="584" y="70" width="32" height="36" fill={bodyEdge} />

          {/* windows: glow layer + crisp layer */}
          <g filter="url(#ls-glow)">
            {windows.map((w, i) => {
              const on = smooth(w.t, w.t + 0.05, p);
              return on > 0.02 ? <rect key={i} x={w.x - 2} y={w.y - 2} width={w.w + 4} height={w.h + 4} fill="#F5C978" opacity={on * 0.75} /> : null;
            })}
          </g>
          {windows.map((w, i) => {
            const on = smooth(w.t, w.t + 0.05, p);
            return (
              <g key={i}>
                <rect x={w.x} y={w.y} width={w.w} height={w.h} rx="2" fill={mix("#25302b", "#c9bba2", smooth(0.6, 1, p))} />
                <rect x={w.x} y={w.y} width={w.w} height={w.h} rx="2" fill="url(#ls-win)" opacity={on} />
              </g>
            );
          })}

          {/* facade uplight beams */}
          {[470, 560, 640, 730, 205, 395, 840, 1030].map((x, i) => (
            <path key={i} d={`M${x - 6} 700 L${x + 6} 700 L${x + 28} ${i < 4 ? 160 : 380} L${x - 28} ${i < 4 ? 160 : 380} Z`} fill="url(#ls-beam)" opacity={uplight * (i < 4 ? 0.55 : 0.4)} />
          ))}

          {/* roof line lights */}
          <rect x="440" y="102" width="320" height="4" fill="#FFE2A8" opacity={roof} filter="url(#ls-glow)" />
          <rect x="440" y="102" width="320" height="3" fill="#FFF4D6" opacity={roof} />
          <rect x="180" y="350" width="240" height="3" fill="#FFF4D6" opacity={roof * 0.8} />
          <rect x="816" y="278" width="240" height="3" fill="#FFF4D6" opacity={roof * 0.8} />

          {/* entrance */}
          <rect x="560" y="630" width="80" height="70" fill="url(#ls-win)" opacity={smooth(0.05, 0.2, p)} />
          <rect x="545" y="622" width="110" height="8" fill={bodyEdge} />

          {/* ground + reflection */}
          <rect x="0" y="700" width="1200" height="100" fill={mix("#141c18", "#efe6d6", smooth(0.5, 1, p))} />
          <rect x="420" y="700" width="360" height="100" fill="url(#ls-ground)" opacity={uplight} />
        </svg>

        {/* readability vignette behind texts while the scene is dark */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[55%]" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 25%, rgba(10,14,12,0.55) 0%, rgba(10,14,12,0) 70%)", opacity: dusk }} />

        {/* texts */}
        <div className="pointer-events-none absolute inset-x-0 top-[9vh] md:top-[11vh] text-center px-6">
          {content.eyebrow && (
            <div className="mb-3 text-[12px] md:text-[13px] tracking-[0.2em] transition-colors duration-500" style={{ color: lightText ? "#D3BF9A" : "#A27A5B", opacity: 1 - finalOn * 0.3 }}>
              {content.eyebrow}
            </div>
          )}
          <div className="relative mx-auto min-h-[150px] max-w-3xl">
            {/* intro title */}
            <Stage visible={p < 0.12} light={lightText}>
              <h2 className="text-[30px] md:text-[52px] font-semibold leading-tight">{content.title}</h2>
              <p className="mt-4 text-[14px] opacity-70">مرّر للأسفل ↓</p>
            </Stage>
            {stages.map((s, i) => {
              const start = 0.12 + (i * 0.66) / Math.max(1, stageCount);
              const end = 0.12 + ((i + 1) * 0.66) / Math.max(1, stageCount);
              return (
                <Stage key={i} visible={p >= start && p < Math.min(end, 0.8)} light={lightText}>
                  <h2 className="text-[26px] md:text-[44px] font-semibold leading-tight">{s.title}</h2>
                  {s.text && <p className="mx-auto mt-4 max-w-xl text-[15px] md:text-[18px] leading-8 opacity-85">{s.text}</p>}
                </Stage>
              );
            })}
            <Stage visible={p >= 0.8} light={lightText}>
              <div className="mx-auto max-w-2xl rounded-[4px] border border-white/70 bg-white/70 px-6 py-8 shadow-lg backdrop-blur-md md:px-12">
              <h2 className="text-[30px] md:text-[54px] font-semibold leading-tight text-brand-green">{content.final_title}</h2>
              <span className="gold-rule mx-auto mt-5" />
              {content.final_text && <p className="mx-auto mt-5 max-w-xl text-[15px] md:text-[18px] leading-8 text-gray-700">{content.final_text}</p>}
              {(content.cta_label || content.secondary_cta_label) && (
                <div className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-3">
                  {content.cta_label && <Link href={content.cta_url || "/contact"} className="inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-7 text-[15px] font-medium text-white shadow-gold">{content.cta_label}</Link>}
                  {content.secondary_cta_label && <Link href={content.secondary_cta_url || "/brands"} className="inline-flex h-[50px] items-center rounded-[3px] border border-gold-300 bg-white/70 px-7 text-[15px] font-medium text-brand-green backdrop-blur">{content.secondary_cta_label}</Link>}
                </div>
              )}
              </div>
            </Stage>
          </div>
        </div>

        {/* progress */}
        <div className="absolute bottom-6 left-1/2 h-[3px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${Math.round(p * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

function Stage({ visible, light, children }: { visible: boolean; light: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-x-0 top-0 transition-all duration-700 ease-lux"
      style={{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 14}px)`, color: light ? "#FFFFFF" : "#2C3930", textShadow: light ? "0 2px 18px rgba(0,0,0,.35)" : "none" }}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}
