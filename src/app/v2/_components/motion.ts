"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { type RefObject, useEffect, useState } from "react";
import { sceneState as S, setSceneActive } from "../_lib/state";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const clamp01 = gsap.utils.clamp(0, 1);

/** Light-experience mapping: one temperature value drives every layer (opacity/transform only). */
function kelvinApplier(root: HTMLElement, dir: number) {
  const q = gsap.utils.selector(root);
  const num = q(".v2-kelvin-num")[0];
  const set = (sel: string) => gsap.quickSetter(q(sel), "opacity");
  const warm = set(".v2-light-warm"), shade = set(".v2-light-shade"), cool = set(".v2-light-cool"), bright = set(".v2-light-bright");
  const glowWarm = set(".v2-light-glow-warm"), glowCool = set(".v2-light-glow-cool");
  const marker = gsap.quickSetter(q(".v2-kelvin-marker"), "xPercent");
  const stops = q<HTMLButtonElement>(".v2-kelvin-stops button");

  return (k: number) => {
    const w = clamp01((4000 - k) / 1300); // 1 at 2700K → 0 at 4000K
    const c = clamp01((k - 4000) / 1000); // 0 at 4000K → 1 at 5000K
    warm(w * 0.5); shade(w * 0.6); cool(c * 0.55); bright(c * 0.4 + (1 - w) * 0.12);
    glowWarm(w); glowCool(c);
    // 2700 → 4000 → 5000 sit at 0%, 50%, 100% of the scale
    const p = k <= 4000 ? ((k - 2700) / 1300) * 0.5 : 0.5 + ((k - 4000) / 1000) * 0.5;
    marker(dir * p * 100);
    if (num) num.textContent = String(Math.round(k / 10) * 10);
    const nearest = k < 3350 ? 2700 : k < 4500 ? 4000 : 5000;
    stops.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.kelvin) === nearest)));
  };
}

export function useV2Motion(root: RefObject<HTMLDivElement | null>) {
  const [fontsReady, setFontsReady] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0);

  // Split text only once the brand fonts are in, and re-split when the width changes.
  useEffect(() => {
    let alive = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => alive && setFontsReady(true));
    let w = window.innerWidth;
    let t = 0;
    const onResize = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      window.clearTimeout(t);
      t = window.setTimeout(() => setLayoutKey((k) => k + 1), 250);
    };
    window.addEventListener("resize", onResize);
    return () => { alive = false; window.clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  // ---------- Loader: a hairline of light, a counter, then the lamp is switched on ----------
  useGSAP(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      S.intro = 1;
      return;
    }
    const count = q(".v2-loader-count")[0];
    const n = { v: 0 };
    gsap.timeline({ defaults: { ease: "power2.inOut" } })
      .to(n, { v: 100, duration: 1.05, onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(2, "0"); } }, 0)
      .to(q(".v2-loader-line i"), { scaleX: 1, duration: 1.05 }, 0)
      .to(q(".v2-loader-flash"), { opacity: 1, scale: 1, duration: 0.5, ease: "power3.in" }, 0.85)
      .to(q(".v2-loader"), { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, 1.3)
      .to(S, { intro: 1, duration: 1.6, ease: "expo.out" }, 1.25);
  }, { scope: root });

  // ---------- Scroll choreography ----------
  useGSAP(() => {
    if (!fontsReady) return;
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const dir = getComputedStyle(el).direction === "rtl" ? -1 : 1; // inline-forward on the x axis
    const applyKelvin = kelvinApplier(el, dir);
    const kelvin = { v: 2700 };
    const mm = gsap.matchMedia();

    mm.add(
      // "all" always matches: matchMedia only runs the setup when at least one condition is true
      { all: "all", desktop: "(min-width: 900px)", fine: "(hover: hover) and (pointer: fine)", reduce: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { desktop, fine, reduce } = ctx.conditions as { desktop: boolean; fine: boolean; reduce: boolean };
        const stops = q<HTMLButtonElement>(".v2-kelvin-stops button");
        const cleanups: (() => void)[] = [];
        const on = <K extends keyof HTMLElementEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
          t.addEventListener(type, fn as EventListener, opts);
          cleanups.push(() => t.removeEventListener(type, fn as EventListener, opts));
        };

        applyKelvin(kelvin.v);

        // ===== Reduced motion: no Lenis, no pin, no scrub. Content is simply there, with a soft fade. =====
        if (reduce) {
          gsap.set(q("[data-reveal], .v2-cta-title"), { autoAlpha: 0 });
          ScrollTrigger.batch(q("[data-reveal], .v2-cta-title"), {
            start: "top 92%",
            once: true,
            onEnter: (els) => gsap.to(els, { autoAlpha: 1, duration: 0.5, ease: "power1.out", stagger: 0.04 }),
          });
          stops.forEach((b) => on(b, "click", () => { kelvin.v = Number(b.dataset.kelvin); applyKelvin(kelvin.v); }));
          return () => cleanups.forEach((f) => f());
        }

        // ===== Lenis driven by the GSAP ticker =====
        const lenis = new Lenis({ autoRaf: false, lerp: 0.085, anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); });

        // ===== Chrome: progress hairline, hide-on-scroll navigation =====
        gsap.to(q(".v2-progress i"), { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

        const nav = q(".v2-nav")[0];
        let navShown = true;
        const showNav = (show: boolean) => {
          if (show === navShown) return;
          navShown = show;
          gsap.to(nav, { yPercent: show ? 0 : -100, duration: 0.7, ease: "power3.out", overwrite: true });
        };
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => showNav(self.scroll() < 120 || self.direction < 0) });
        on(nav, "focusin", () => showNav(true));

        on(window, "pointermove", (e: PointerEvent) => {
          S.px = (e.clientX / window.innerWidth) * 2 - 1;
          S.py = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });

        // ===== Generic entrances =====
        q<HTMLElement>("[data-reveal]").forEach((node) => {
          if (node.closest(".v2-coll") && desktop) return; // lives inside the horizontal track
          gsap.from(node, { autoAlpha: 0, y: 34, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 88%", once: true } });
          const lines = node.querySelectorAll("[data-line]");
          if (lines.length) gsap.from(lines, { scaleX: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: node, start: "top 88%", once: true } });
        });

        // ===== Hero: pinned, the light rises with the scroll and falls on the headline line by line =====
        const heroSplit = SplitText.create(q(".v2-hero-title"), { type: "lines", mask: "lines", linesClass: "v2-line" });
        gsap.set(heroSplit.lines, { yPercent: 118, opacity: 0 });
        gsap.set(q(".v2-hero-foot"), { autoAlpha: 0, y: 26 });
        gsap.set(q(".v2-hero-eyebrow"), { opacity: 0.4 });
        gsap.timeline({ scrollTrigger: { trigger: q(".v2-hero")[0], start: "top top", end: "+=230%", pin: true, scrub: 1, anticipatePin: 1 } })
          .to(S, { hero: 1, duration: 1, ease: "none" }, 0)
          .to(q(".v2-scrollhint"), { autoAlpha: 0, duration: 0.08 }, 0.02)
          .to(q(".v2-hero-eyebrow"), { opacity: 1, duration: 0.2 }, 0.08)
          .to(heroSplit.lines, { yPercent: 0, opacity: 1, duration: 0.36, stagger: 0.15, ease: "power3.out" }, 0.16)
          .to(q(".v2-hero-foot"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.72)
          .to({}, { duration: 0.08 });

        // ===== 01 Philosophy: words light up one after another, the camera drifts back =====
        const words = SplitText.create(q(".v2-phil-text"), { type: "words", wordsClass: "v2-word" });
        gsap.set(words.words, { opacity: 0.13 });
        gsap.to(words.words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: q(".v2-phil-text")[0], start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
        gsap.to(S, { away: 1, ease: "none", scrollTrigger: { trigger: q(".v2-phil")[0], start: "top bottom", end: "bottom top", scrub: 1 } });

        // ===== 02 Collections =====
        const coll = q(".v2-coll")[0];
        const track = q<HTMLElement>(".v2-coll-track")[0];
        const panels = q<HTMLElement>(".v2-panel");
        gsap.to(S, { mid: 1, ease: "none", scrollTrigger: { trigger: coll, start: "top bottom", end: "top top", scrub: 1 } });

        if (desktop) {
          // Horizontal journey; in RTL the track overflows to the left, so it travels to the right.
          const distance = () => Math.max(0, track.offsetWidth - window.innerWidth);
          const light = () => {
            const mid = window.innerWidth / 2;
            panels.forEach((p) => {
              const r = p.getBoundingClientRect();
              const d = Math.abs(r.left + r.width / 2 - mid) / (window.innerWidth * 0.5);
              const lit = clamp01(1.6 - d * 1.9);
              p.style.setProperty("--lit", (lit * lit * (3 - 2 * lit)).toFixed(3));
            });
          };
          gsap.to(track, {
            x: () => -dir * distance(),
            ease: "none",
            onUpdate: light,
            scrollTrigger: { trigger: coll, start: "top top", end: () => "+=" + distance(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true, onRefresh: light },
          });
          light();
          cleanups.push(() => panels.forEach((p) => p.style.removeProperty("--lit")));
        } else {
          // Touch / narrow screens: plain vertical flow, each piece lights up as it reaches the middle.
          panels.forEach((p) => {
            gsap.fromTo(p, { "--lit": 0 }, { "--lit": 1, ease: "none", scrollTrigger: { trigger: p, start: "top 88%", end: "top 40%", scrub: 0.5 } });
          });
        }

        // ===== 03 Light experience: 2700K → 4000K → 5000K =====
        const lightTl = gsap.timeline({
          onUpdate: () => applyKelvin(kelvin.v),
          scrollTrigger: { trigger: q(".v2-light")[0], start: "top top", end: desktop ? "+=220%" : "+=160%", pin: true, scrub: 1, anticipatePin: 1 },
        });
        lightTl
          .to({}, { duration: 0.12 })
          .to(kelvin, { v: 4000, duration: 1, ease: "none" })
          .to(kelvin, { v: 5000, duration: 1, ease: "none" })
          .to({}, { duration: 0.15 });
        stops.forEach((b) => on(b, "click", () => {
          const st = lightTl.scrollTrigger!;
          const k = Number(b.dataset.kelvin);
          const p = k === 2700 ? 0.02 : k === 4000 ? 1.12 / 2.27 : 0.98;
          lenis.scrollTo(st.start + (st.end - st.start) * p, { duration: 1.6 });
        }));

        // The stage is fully covered from here until the CTA: stop drawing the WebGL scene.
        ScrollTrigger.create({
          trigger: q(".v2-light")[0], start: "top top", endTrigger: q(".v2-cta")[0], end: "top bottom",
          onToggle: (self) => setSceneActive(!self.isActive),
        });
        cleanups.push(() => setSceneActive(true));

        // ===== 04 Craft: clip-path reveals + layered parallax =====
        q<HTMLElement>(".v2-craft-item").forEach((item) => {
          const fig = item.querySelector(".v2-craft-fig");
          const img = item.querySelector("img");
          const speed = Number(item.dataset.speed || 0.5);
          gsap.fromTo(fig, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", scrollTrigger: { trigger: item, start: "top 96%", end: "top 38%", scrub: 0.8 } });
          gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true } });
          gsap.fromTo(item, { y: speed * 90 }, { y: -speed * 90, ease: "none", scrollTrigger: { trigger: q(".v2-craft-grid")[0], start: "top bottom", end: "bottom top", scrub: true } });
        });

        // ===== 05 Projects: the image grows gently inside its frame =====
        q<HTMLElement>(".v2-proj").forEach((card) => {
          const frame = card.querySelector(".v2-proj-frame");
          gsap.fromTo(card.querySelector(".v2-fx-img"), { scale: 1.02 }, { scale: 1.2, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
          gsap.from(card, { autoAlpha: 0, y: 48, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 90%", once: true } });
        });

        // ===== CTA: the room dims to one point of light =====
        const ctaSection = q(".v2-cta")[0];
        gsap.to(S, { end: 1, ease: "none", scrollTrigger: { trigger: ctaSection, start: "top bottom", end: "center center", scrub: 1 } });
        const ctaSplit = SplitText.create(q(".v2-cta-title"), { type: "lines", mask: "lines", linesClass: "v2-line" });
        gsap.from(ctaSplit.lines, { yPercent: 118, opacity: 0, duration: 1.5, ease: "expo.out", stagger: 0.14, scrollTrigger: { trigger: ctaSection, start: "top 45%", once: true } });

        // ===== Pointer-only refinements =====
        if (fine) {
          el.classList.add("has-cursor");
          cleanups.push(() => el.classList.remove("has-cursor"));
          const cursor = q<HTMLElement>(".v2-cursor")[0];
          const halo = cursor.firstElementChild;
          const cx = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3.out" });
          const cy = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3.out" });
          on(window, "pointermove", (e: PointerEvent) => { cx(e.clientX); cy(e.clientY); gsap.to(cursor, { opacity: 1, duration: 0.6, overwrite: "auto" }); }, { passive: true });
          on(document.documentElement, "pointerleave", () => gsap.to(cursor, { opacity: 0, duration: 0.4, overwrite: "auto" }));
          const interactive = "a, button, [data-cursor]";
          on(el, "pointerover", (e: PointerEvent) => { if ((e.target as Element).closest?.(interactive)) gsap.to(halo, { scale: 2.5, duration: 0.8, ease: "expo.out", overwrite: true }); });
          on(el, "pointerout", (e: PointerEvent) => { if ((e.target as Element).closest?.(interactive)) gsap.to(halo, { scale: 1, duration: 0.8, ease: "expo.out", overwrite: true }); });

          // Image hover: a spotlight that follows the pointer + a single soft ripple through the picture.
          const displace = el.querySelector("#v2-ripple feDisplacementMap");
          q<HTMLElement>(".v2-fx").forEach((fx) => {
            const spot = fx.querySelector<HTMLElement>(".v2-fx-spot");
            const img = fx.querySelector<HTMLElement>(".v2-fx-img");
            if (!spot || !img) return;
            gsap.set(spot, { xPercent: -50, yPercent: -50 });
            const sx = gsap.quickTo(spot, "x", { duration: 0.6, ease: "power3.out" });
            const sy = gsap.quickTo(spot, "y", { duration: 0.6, ease: "power3.out" });
            on(fx, "pointermove", (e: PointerEvent) => { const r = fx.getBoundingClientRect(); sx(e.clientX - r.left); sy(e.clientY - r.top); }, { passive: true });
            on(fx, "pointerenter", (e: PointerEvent) => {
              const r = fx.getBoundingClientRect();
              gsap.set(spot, { x: e.clientX - r.left, y: e.clientY - r.top });
              gsap.to(spot, { opacity: 1, duration: 0.9, ease: "power3.out", overwrite: "auto" });
              if (!displace) return;
              img.style.filter = "url(#v2-ripple)";
              gsap.killTweensOf(displace);
              gsap.timeline({ onComplete: () => { img.style.filter = ""; } })
                .fromTo(displace, { attr: { scale: 0 } }, { attr: { scale: 26 }, duration: 0.45, ease: "power2.out" })
                .to(displace, { attr: { scale: 0 }, duration: 1.3, ease: "power3.out" });
            });
            on(fx, "pointerleave", () => gsap.to(spot, { opacity: 0, duration: 0.9, ease: "power3.out", overwrite: "auto" }));
            cleanups.push(() => { img.style.filter = ""; });
          });

          // Magnetic CTA button
          q<HTMLElement>(".v2-magnet").forEach((btn) => {
            const mx = gsap.quickTo(btn, "x", { duration: 0.9, ease: "power3.out" });
            const my = gsap.quickTo(btn, "y", { duration: 0.9, ease: "power3.out" });
            const zone = btn.parentElement!;
            on(zone, "pointermove", (e: PointerEvent) => {
              const r = btn.getBoundingClientRect();
              mx((e.clientX - (r.left + r.width / 2)) * 0.32);
              my((e.clientY - (r.top + r.height / 2)) * 0.32);
            }, { passive: true });
            on(zone, "pointerleave", () => { mx(0); my(0); });
          });
        }

        return () => {
          cleanups.forEach((f) => f());
          S.hero = S.away = S.mid = S.end = 0;
        };
      },
    );
  }, { scope: root, dependencies: [fontsReady, layoutKey], revertOnUpdate: true });
}
