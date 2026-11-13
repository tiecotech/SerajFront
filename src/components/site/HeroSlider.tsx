"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SiteSlide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mediaSrcSet } from "@/lib/media";

export function HeroSlider({ slides, intervalMs = 6000, autoplay = true, height = "full" }: { slides: SiteSlide[]; intervalMs?: number; autoplay?: boolean; height?: "full" | "large" | "medium" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    const t = setTimeout(() => go(index + 1), intervalMs);
    return () => clearTimeout(t);
  }, [index, paused, autoplay, intervalMs, count, go]);

  if (!count) return null;
  const h = { full: "h-[calc(100svh-64px)] md:h-[calc(100svh-76px)] min-h-[520px] max-h-[860px]", large: "h-[620px]", medium: "h-[460px]" }[height];

  return (
    <section className={cn("relative overflow-hidden bg-gray-50", h)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {slides.map((s, i) => {
        const active = i === index;
        const light = s.text_theme !== "dark";
        const justify = { start: "items-start text-start", center: "items-center text-center", end: "items-end text-end" }[s.text_align];
        const vpos = { top: "justify-start pt-24", center: "justify-center", bottom: "justify-end pb-24" }[s.text_position];
        return (
          <div key={s.id} className={cn("absolute inset-0 transition-opacity duration-1000 ease-lux", active ? "opacity-100 z-10" : "opacity-0 z-0")} aria-hidden={!active}>
            <picture>
              {s.mobile_image && <source media="(max-width: 767px)" srcSet={mediaSrcSet(s.mobile_image) ?? s.mobile_image.lg} sizes="220vw" />}
              <img src={s.desktop_image?.lg || s.desktop_image?.url} srcSet={mediaSrcSet(s.desktop_image)} sizes="100vw" alt={s.title} className={cn("absolute inset-0 h-full w-full object-cover", active && "kenburns")} fetchPriority={i === 0 ? "high" : "low"} loading={i === 0 ? "eager" : "lazy"} />
            </picture>
            <div className="absolute inset-0" style={{ background: light ? `linear-gradient(to left, rgba(20,22,20,${(s.overlay_opacity / 100) * 1.2}) 0%, rgba(20,22,20,${(s.overlay_opacity / 100) * 0.5}) 55%, rgba(20,22,20,${(s.overlay_opacity / 100) * 0.25}) 100%)` : `rgba(255,255,255,${s.overlay_opacity / 100})` }} />
            <div className={cn("container-lux relative flex h-full flex-col", justify, vpos)}>
              <div className={cn("max-w-2xl", active && "reveal")}>
                {s.eyebrow && (
                  <div className={cn("mb-4 inline-flex items-center gap-3 text-[13px] tracking-[0.12em]", light ? "text-gold-300" : "text-gold-600")}>
                    <span className="h-px w-10 bg-current" /> {s.eyebrow}
                  </div>
                )}
                <h1 className={cn("text-[34px] leading-[1.2] md:text-[56px] md:leading-[1.15] font-semibold", light ? "text-white" : "text-brand-green")}>{s.title}</h1>
                {s.subtitle && <p className={cn("mt-5 text-[16px] md:text-[18px] leading-8", light ? "text-white/85" : "text-gray-700")}>{s.subtitle}</p>}
                {(s.primary_cta || s.secondary_cta) && (
                  <div className={cn("mt-8 flex flex-wrap gap-3", s.text_align === "center" && "justify-center")}>
                    {s.primary_cta && (
                      <Link href={s.primary_cta.url || "#"} className="inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-7 text-[15px] font-medium text-white shadow-gold transition hover:brightness-105">
                        {s.primary_cta.label}
                      </Link>
                    )}
                    {s.secondary_cta && (
                      <Link href={s.secondary_cta.url || "#"} className={cn("inline-flex h-[50px] items-center rounded-[3px] border px-7 text-[15px] font-medium backdrop-blur transition", light ? "border-white/50 text-white hover:bg-white/10" : "border-gray-200 text-brand-green hover:bg-white")}>
                        {s.secondary_cta.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => go(i)} aria-label={`الشريحة ${i + 1}`} className={cn("h-1.5 rounded-full transition-all duration-500 cursor-pointer", i === index ? "w-10 bg-gold-300" : "w-4 bg-white/50 hover:bg-white/80")} />
            ))}
          </div>
          <div className="absolute bottom-5 end-6 z-20 hidden md:flex gap-2">
            <button onClick={() => go(index - 1)} aria-label="السابق" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white backdrop-blur transition hover:bg-white/15 cursor-pointer"><ChevronRight className="h-5 w-5" /></button>
            <button onClick={() => go(index + 1)} aria-label="التالي" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white backdrop-blur transition hover:bg-white/15 cursor-pointer"><ChevronLeft className="h-5 w-5" /></button>
          </div>
        </>
      )}
    </section>
  );
}
