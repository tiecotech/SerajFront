"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Json, Media } from "@/lib/types";
import { FULL_BLEED_SIZES, mediaSrcSet } from "@/lib/media";
import { SerajMarkSvg } from "@/components/brand/SerajLogo";

/**
 * Cinematic scroll walkthrough (inspired by "camera glides through lit interiors" sites).
 *
 * Two modes, both managed from the CMS:
 *  - Video mode: a pre-rendered walkthrough video is scrubbed frame-by-frame by scroll position.
 *    (Encode with frequent keyframes for smooth seeking, e.g. `ffmpeg -i in.mp4 -g 1 -crf 23 -an out.mp4`.)
 *  - Photo mode: each scene is a photo; scrolling pushes the camera in (dolly zoom), the room's
 *    lights come on (dark → warm bloom), then it dissolves into the next room.
 * Animation writes styles directly through refs inside requestAnimationFrame — no React re-renders.
 */

type Scene = { image?: Media | null; title?: string; text?: string };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export function ScrollStory({ content }: { content: Record<string, Json> }) {
  const scenes: Scene[] = (Array.isArray(content.scenes) ? content.scenes : []).filter((s: Scene) => s.image || content.video);
  const video: Media | null = content.video ?? null;
  const n = Math.max(1, scenes.length);

  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const darks = useRef<(HTMLDivElement | null)[]>([]);
  const blooms = useRef<(HTMLDivElement | null)[]>([]);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  const finalRef = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastVideoT = -1;

    const render = () => {
      raf = 0;
      const el = root.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = reduced ? 1 : clamp(-el.getBoundingClientRect().top / Math.max(1, total));
      const storyP = clamp(p / 0.88); // last 12% = finale
      const pos = storyP * n; // 0..n
      const active = Math.min(n - 1, Math.floor(pos));

      // video scrubbing
      const v = videoRef.current;
      if (v && v.duration) {
        const t = storyP * (v.duration - 0.05);
        if (Math.abs(t - lastVideoT) > 1 / 40) {
          v.currentTime = t;
          lastVideoT = t;
        }
      }

      for (let i = 0; i < n; i++) {
        const t = pos - i; // local progress of scene i
        const layer = layers.current[i];
        if (layer) {
          const fadeIn = i === 0 ? 1 : smooth(-0.12, 0.08, t);
          const fadeOut = i === n - 1 ? 1 : 1 - smooth(0.88, 1.06, t);
          layer.style.opacity = String(fadeIn * fadeOut);
          layer.style.visibility = fadeIn * fadeOut > 0.001 ? "visible" : "hidden";
        }
        const lt = clamp(t, 0, 1.1);
        const img = imgs.current[i];
        if (img) img.style.transform = `scale(${1.04 + 0.26 * lt}) translate3d(0, ${-1.5 * lt}%, 0)`;
        const d = darks.current[i];
        if (d) d.style.opacity = String(0.72 * (1 - smooth(0.05, 0.5, lt)));
        const b = blooms.current[i];
        if (b) b.style.opacity = String(0.55 * smooth(0.25, 0.6, lt));
        const c = captions.current[i];
        if (c) {
          const on = smooth(0.12, 0.3, t) * (1 - smooth(0.78, 0.92, t));
          c.style.opacity = String(p >= 0.88 ? 0 : on);
          c.style.transform = `translate3d(0, ${(1 - on) * 18}px, 0)`;
        }
      }

      const fin = smooth(0.88, 0.97, p);
      if (finalRef.current) {
        finalRef.current.style.opacity = String(fin);
        finalRef.current.style.transform = `translate3d(0, ${(1 - fin) * 24}px, 0)`;
        finalRef.current.style.pointerEvents = fin > 0.5 ? "auto" : "none";
      }
      if (veil.current) veil.current.style.opacity = String(fin * 0.82);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (counter.current) counter.current.textContent = `${String(active + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(render); };
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    videoRef.current?.addEventListener("loadedmetadata", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  if (!video && scenes.length === 0) return null;

  return (
    <section ref={root} className="relative bg-[#0f1311]" style={{ height: `${Math.max(320, (n + 1) * 105)}vh` }} aria-label={content.final_title || "جولة في مشاريع الإضاءة"}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {video ? (
          <video ref={videoRef} src={video.url} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          scenes.map((s, i) => (
            <div key={i} ref={(el) => { layers.current[i] = el; }} className="absolute inset-0 overflow-hidden" style={{ opacity: i === 0 ? 1 : 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={(el) => { imgs.current[i] = el; }} src={s.image?.lg || s.image?.url} srcSet={mediaSrcSet(s.image)} sizes={FULL_BLEED_SIZES} alt={s.title || ""} className="absolute inset-0 h-full w-full object-cover will-change-transform" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "low"} decoding="async" />
              {/* lights off → on */}
              <div ref={(el) => { darks.current[i] = el; }} className="absolute inset-0 bg-[#07090a]" style={{ opacity: 0.72 }} />
              {/* warm light bloom */}
              <div ref={(el) => { blooms.current[i] = el; }} className="absolute inset-0 mix-blend-screen" style={{ opacity: 0, background: "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(255,214,150,0.55) 0%, rgba(255,214,150,0) 70%)" }} />
            </div>
          ))
        )}

        {/* cinematic grading */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/25" />

        {/* scene captions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[12vh] md:bottom-[14vh]">
          <div className="container-lux relative h-40">
            {scenes.map((s, i) => (s.title || s.text) && (
              <div key={i} ref={(el) => { captions.current[i] = el; }} className="absolute inset-x-4 md:inset-x-8 bottom-0 max-w-xl" style={{ opacity: 0 }}>
                <div className="mb-3 flex items-center gap-3 text-[12px] tracking-[0.2em] text-gold-300"><span className="h-px w-10 bg-gold-300" />{String(i + 1).padStart(2, "0")}</div>
                {s.title && <h2 className="text-[28px] md:text-[48px] font-semibold leading-tight text-white" style={{ textShadow: "0 2px 24px rgba(0,0,0,.45)" }}>{s.title}</h2>}
                {s.text && <p className="mt-3 text-[15px] md:text-[18px] leading-8 text-white/85">{s.text}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* finale */}
        <div ref={veil} className="pointer-events-none absolute inset-0 bg-[#fbf8f3]" style={{ opacity: 0 }} />
        <div ref={finalRef} className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ opacity: 0 }}>
          <div className="max-w-2xl">
            <SerajMarkSvg id="story" className="mx-auto h-16 w-auto" />
            <div className="mt-4 flex items-center justify-center gap-3 text-[12px] tracking-[0.22em] text-gold-600"><span className="h-px w-8 bg-gold-300" />السراج المضيء · أنظمة الإضاءة<span className="h-px w-8 bg-gold-300" /></div>
            {content.final_title && <h2 className="mt-6 text-[30px] md:text-[52px] font-semibold leading-tight text-brand-green">{content.final_title}</h2>}
            <span className="gold-rule mx-auto mt-5" />
            {content.final_text && <p className="mx-auto mt-5 max-w-xl text-[16px] md:text-[18px] leading-8 text-gray-700">{content.final_text}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {content.cta_label && <Link href={content.cta_url || "/contact"} className="inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-8 text-[15px] font-medium text-white shadow-gold">{content.cta_label}</Link>}
              {content.secondary_cta_label && <Link href={content.secondary_cta_url || "/brands"} className="inline-flex h-[50px] items-center rounded-[3px] border border-gold-300 bg-white px-8 text-[15px] font-medium text-brand-green">{content.secondary_cta_label}</Link>}
            </div>
          </div>
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute top-6 end-6 hidden md:block text-[12px] tracking-[0.2em] text-white/70"><span ref={counter}>01</span></div>
        <div className="absolute bottom-6 left-1/2 h-[2px] w-48 -translate-x-1/2 overflow-hidden rounded-full bg-white/20">
          <div ref={bar} className="h-full origin-right bg-gold-gradient" style={{ transform: "scaleX(0)" }} />
        </div>
        <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.25em] text-white/60">مرّر لتبدأ الجولة</div>
      </div>
    </section>
  );
}
