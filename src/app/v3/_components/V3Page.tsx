"use client";

import { Building2, LampCeiling, LampDesk, Lightbulb, LogIn, MessageSquareText } from "lucide-react";
import Lenis from "lenis";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SerajMarkSvg } from "@/components/brand/SerajLogo";
import type { V3Content } from "../_lib/content";
import { CLOSE_SFX, LABELS, ORDER, stepHandler, type SectionKey } from "../_lib/sections";
import { initSound, play } from "../_lib/sound";
import { Bulb } from "./art";
import { AboutPanel, BrandsPanel, ContactPanel, ProductsPanel, ProjectsPanel } from "./Panels";

const SECTIONS: { key: SectionKey; label: string; hint: string; Icon: typeof Lightbulb }[] = [
  { key: "products", label: "المنتجات", hint: "عالم الإنارة", Icon: Lightbulb },
  { key: "brands", label: "البراندات", hint: "ثريا البراندات", Icon: LampCeiling },
  { key: "projects", label: "المشاريع", hint: "أعمال أضأناها", Icon: Building2 },
  { key: "about", label: "من نحن", hint: "قصة السراج", Icon: LampDesk },
  { key: "contact", label: "تواصل معنا", hint: "لنبدأ مشروعك", Icon: MessageSquareText },
];
const KEYS = SECTIONS.map((s) => s.key);
const CLOSE_MS = 900;
/** Section → section: the old one switches off, then the next one draws in. */
const SWAP_MS = 620;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Where the next panel's circle of light opens from (viewport px). */
const setOrigin = (x: number, y: number) => {
  const s = document.documentElement.style;
  s.setProperty("--v3-ox", `${Math.round(x)}px`);
  s.setProperty("--v3-oy", `${Math.round(y)}px`);
};
/** Magnetic hover: the node's ring leans toward the cursor. */
const magnet = (e: React.MouseEvent<HTMLElement>) => {
  const el = e.currentTarget;
  const dot = el.querySelector<HTMLElement>(".v3-node-dot");
  if (!dot) return;
  const r = dot.getBoundingClientRect();
  el.style.setProperty("--mx", `${((e.clientX - (r.left + r.width / 2)) * 0.3).toFixed(1)}px`);
  el.style.setProperty("--my", `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
};
const unmagnet = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.setProperty("--mx", "0px");
  e.currentTarget.style.setProperty("--my", "0px");
};

/**
 * The mouse pointer is a small hanging bulb (glass down, its tip is the hotspot). It switches on —
 * glows and throws a pool of light — over anything you can click. Desktop pointers only; over text
 * fields the normal caret comes back.
 */
function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current!;
    const html = document.documentElement;
    html.classList.add("v3-bulb-cursor");
    let x = -100, y = -100, hot = false, text = false, raf = 0, dirty = false;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as Element | null;
      const inSite = !!t?.closest?.(".v3");
      el.classList.toggle("is-on", inSite);
      const tx = !!t?.closest?.("input, textarea, select, [contenteditable='true']");
      const h = !tx && !!t?.closest?.("a, button, [role='button'], label");
      if (h !== hot) { hot = h; el.classList.toggle("is-hot", h); if (h) play("hover"); }
      if (tx !== text) { text = tx; el.classList.toggle("is-text", tx); }
      if (!dirty) { dirty = true; raf = requestAnimationFrame(paint); }
    };
    const paint = () => {
      dirty = false;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const down = () => el.classList.add("is-down");
    const up = () => el.classList.remove("is-down");
    const leave = () => el.classList.remove("is-on");
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    html.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("v3-bulb-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      html.removeEventListener("mouseleave", leave);
    };
  }, []);
  return (
    <div ref={ref} className="v3-cursor" aria-hidden>
      <span className="v3-cursor-pool" />
      <svg className="v3-cursor-bulb" viewBox="0 0 24 38">
        <path className="v3-cb-cap" d="M8.5 1 H15.5 V9 H8.5 Z M8.5 4 H15.5 M8.5 6.5 H15.5" />
        <path className="v3-cb-glass" d="M9.5 9 C9.5 13 3 15.5 3 23 C3 30.5 8 37 12 37 C16 37 21 30.5 21 23 C21 15.5 14.5 13 14.5 9 Z" />
        <path className="v3-cb-fil" d="M10 24 C10.8 21.5 11.4 21.5 12 24 C12.6 21.5 13.2 21.5 14 24" />
      </svg>
    </div>
  );
}

export function V3Page({ content }: { content: V3Content }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const glowRefs = useRef<(SVGPathElement | null)[]>([]);
  const pulseRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [open, setOpen] = useState<SectionKey | null>(null);
  const [closing, setClosing] = useState(false);
  /** Section → section: a white veil keeps the hub (logo + lamp) hidden between the two panels. */
  const [swapping, setSwapping] = useState(false);
  const swapTimer = useRef<number | undefined>(undefined);
  const openRef = useRef<SectionKey | null>(null);
  openRef.current = open;
  const pushed = useRef(false);
  const lastNode = useRef<SectionKey | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const lenisRef = useRef<Lenis | null>(null);

  /* ------------------------------- sound toggle ------------------------------ */
  useEffect(() => initSound(), []);

  /* ------------------------------ scroll scene ------------------------------ */
  useEffect(() => {
    const wrap = wrapRef.current!;
    const stage = stageRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) wrap.classList.add("is-reduced");
    const flags = { on: false, hung: false, nodes: SECTIONS.map(() => false) };

    // Lenis drives the page; the visitor never free-scrolls the hub: one gesture plays it
    // through (see the tour effect), so Lenis stays stopped and moves only on our scrollTo calls.
    const lenis = reduce ? null : new Lenis({ lerp: 0.085 });
    lenis?.stop();
    lenisRef.current = lenis;
    let lenisRaf = 0;
    const loop = (t: number) => { lenis?.raf(t); lenisRaf = requestAnimationFrame(loop); };
    if (lenis) lenisRaf = requestAnimationFrame(loop);

    const layout = () => {
      const s = stage.getBoundingClientRect();
      const a = anchorRef.current!.getBoundingClientRect();
      const ax = a.left + a.width / 2 - s.left;
      const ay = a.top + a.height / 2 - s.top;
      svgRef.current!.setAttribute("viewBox", `0 0 ${s.width} ${s.height}`);
      nodeRefs.current.forEach((n, i) => {
        if (!n) return;
        const dot = n.querySelector(".v3-node-dot")!.getBoundingClientRect();
        const nx = dot.left + dot.width / 2 - s.left;
        const ny = dot.top + dot.height / 2 - s.top;
        // a wire that drops out of the bulb, swings sideways and lands on the node
        const d = `M${ax} ${ay} C${ax + (nx - ax) * 0.08} ${ay + 70}, ${ax + (nx - ax) * 0.55} ${ny + (ay - ny) * 0.15}, ${nx} ${ny}`;
        pathRefs.current[i]?.setAttribute("d", d);
        glowRefs.current[i]?.setAttribute("d", d);
        const pulse = pulseRefs.current[i];
        if (pulse) pulse.style.offsetPath = `path("${d}")`;
      });
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      const p = reduce || total <= 0 ? 1 : clamp(-wrap.getBoundingClientRect().top / total);
      const logo = easeInOut(seg(p, 0, 0.16));
      const drop = easeOut(seg(p, 0.1, 0.4));
      const heat = seg(p, 0.42, 0.55);
      const branch = seg(p, 0.58, 0.86);
      stage.style.setProperty("--logo", logo.toFixed(4));
      stage.style.setProperty("--drop", drop.toFixed(4));
      stage.style.setProperty("--heat", heat.toFixed(4));
      stage.style.setProperty("--p", p.toFixed(4));

      const hung = drop >= 0.999;
      if (hung !== flags.hung) { flags.hung = hung; stage.classList.toggle("is-hung", hung); }
      const on = heat >= 0.999;
      if (on !== flags.on) {
        flags.on = on;
        stage.classList.toggle("is-on", on);
        if (on) play("ignite");
      }
      stage.classList.toggle("is-done", p >= 0.88);
      // footer in view: hide the tour pill
      stage.classList.toggle("is-past", wrap.getBoundingClientRect().bottom < window.innerHeight * 0.6);

      // Back from the footer into the hub: close the footer and return to "one gesture = one step".
      const html = document.documentElement;
      if (html.classList.contains("v3-show-foot") && wrap.getBoundingClientRect().bottom > window.innerHeight + 160) {
        html.classList.remove("v3-show-foot");
        lenis?.stop();
        lenis?.scrollTo(wrap.offsetTop + wrap.offsetHeight - window.innerHeight, { duration: 0.8, force: true });
      }

      SECTIONS.forEach((_, i) => {
        const bp = clamp((branch - i * 0.12) / 0.52);
        const path = pathRefs.current[i];
        if (path) path.style.strokeDashoffset = String(1 - bp);
        const glow = glowRefs.current[i];
        if (glow) glow.style.strokeDashoffset = String(1 - bp);
        const lit = bp >= 0.98;
        if (lit !== flags.nodes[i]) {
          flags.nodes[i] = lit;
          nodeRefs.current[i]?.classList.toggle("is-on", lit);
          if (lit) play("node");
        }
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { layout(); req(); };

    layout();
    update();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", onResize);
    // fonts/images can shift the nodes after first paint
    const ro = new ResizeObserver(onResize);
    ro.observe(stage);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      cancelAnimationFrame(lenisRaf);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* ------------------------------ panels + history ------------------------------ */
  const finishClose = useCallback(() => {
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(null);
      setClosing(false);
      const k = lastNode.current;
      if (k) nodeRefs.current[KEYS.indexOf(k)]?.focus({ preventScroll: true });
    }, CLOSE_MS);
  }, []);

  const openPanel = useCallback((k: SectionKey) => {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    lastNode.current = k;
    if (window.location.hash.slice(1) !== k) {
      if (window.location.hash) window.history.replaceState(null, "", `#${k}`);
      else { window.history.pushState(null, "", `#${k}`); pushed.current = true; }
    }
    setOpen(k);
    play("draw");
  }, []);

  /** Called by each panel's return control (after it has played its own sound). */
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back(); // popstate runs the close animation
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      finishClose();
    }
  }, [finishClose]);

  useEffect(() => {
    const fromHash = () => {
      const k = window.location.hash.slice(1) as SectionKey;
      if (KEYS.includes(k)) { lastNode.current = k; setClosing(false); setOpen(k); }
      else if (openRef.current) finishClose();
    };
    fromHash(); // deep link: /v3#brands
    window.addEventListener("popstate", fromHash);
    return () => window.removeEventListener("popstate", fromHash);
  }, [finishClose]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("v3-locked");
    const lenis = lenisRef.current;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closing) { play(CLOSE_SFX[open]); close(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("v3-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closing, close]);

  /* ------------------------ tour: scroll / swipe / keys ------------------------ */
  const closingRef = useRef(false);
  closingRef.current = closing;

  /** Move to a section (with the current one switching off first), back to the hub, or past the tour to the footer. */
  const go = useCallback((target: SectionKey | "hub" | "end") => {
    const cur = openRef.current;
    window.clearTimeout(swapTimer.current);
    if (target === "hub") {
      setSwapping(false);
      if (cur) { play(CLOSE_SFX[cur]); close(); }
      return;
    }
    if (target === "end") {
      setSwapping(false);
      if (cur) { play(CLOSE_SFX[cur]); close(); }
      window.setTimeout(() => {
        // the tour is over: open the footer below the hub and glide down to it
        document.documentElement.classList.add("v3-show-foot");
        requestAnimationFrame(() => {
          const foot = document.querySelector<HTMLElement>(".v3-foot");
          if (!foot) return;
          const lenis = lenisRef.current;
          if (lenis) { lenis.start(); lenis.resize(); lenis.scrollTo(foot, { duration: 1.6 }); }
          else foot.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }, cur ? CLOSE_MS + 80 : 0);
      return;
    }
    if (!cur) { openPanel(target); return; }
    if (cur === target) return;
    play(CLOSE_SFX[cur]);
    setSwapping(true);
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => openPanel(target), SWAP_MS);
    // the next panel's circle of light has fully opened by then
    swapTimer.current = window.setTimeout(() => setSwapping(false), SWAP_MS + 1200);
  }, [close, openPanel]);

  useEffect(() => {
    /*
     * One gesture = one step. A wheel/trackpad gesture (events closer than GAP apart, so trackpad
     * inertia stays part of it), a swipe, or an arrow key moves exactly one step:
     *   hub top  -> plays the whole lighting scene; hub end -> first section
     *   section  -> next / previous section (a section with its own stops, like projects, steps inside first)
     *   last     -> footer (free scrolling there; scrolling back up re-enters the hub)
     */
    const GAP = 240;
    let lastWheel = 0;
    let gesture = { consumed: false, dir: 0 };
    let busyUntil = 0;
    let touch: { y: number; up: boolean; down: boolean } | null = null;
    const html = document.documentElement;
    const footOpen = () => html.classList.contains("v3-show-foot");
    const panelEl = () => document.querySelector<HTMLElement>(".v3-panel");
    const panelEdges = () => {
      const p = panelEl();
      if (!p) return { up: true, down: true };
      return { up: p.scrollTop <= 1, down: p.scrollTop + p.clientHeight >= p.scrollHeight - 2 };
    };
    const wrapEnd = () => { const w = wrapRef.current!; return w.offsetTop + w.offsetHeight - window.innerHeight; };
    const hubPos = () => {
      const end = wrapEnd();
      const y = window.scrollY;
      if (end <= 4 || y >= end - 4) return "end";
      return y <= 4 ? "top" : "mid";
    };
    const blocked = () => closingRef.current || performance.now() < busyUntil;
    const lock = (ms: number) => { busyUntil = performance.now() + ms; };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const playHub = (dir: number) => {
      const to = dir > 0 ? wrapEnd() : 0;
      const lenis = lenisRef.current;
      lock(dir > 0 ? 3300 : 2200);
      if (lenis) lenis.scrollTo(to, { duration: dir > 0 ? 3.1 : 2, easing: ease, force: true, lock: true });
      else window.scrollTo({ top: to, behavior: "smooth" });
    };

    const step = (dir: 1 | -1) => {
      if (blocked()) return;
      const cur = openRef.current;
      if (cur) {
        if (stepHandler.current?.(dir)) { lock(420); return; }
        lock(1300);
        setOrigin(window.innerWidth / 2, dir > 0 ? window.innerHeight : 0);
        const next = ORDER.indexOf(cur) + dir;
        if (next < 0) go("hub");
        else if (next >= ORDER.length) go("end");
        else go(ORDER[next]);
        return;
      }
      const pos = hubPos();
      if (dir > 0) {
        if (pos === "end") { lock(1300); setOrigin(window.innerWidth / 2, window.innerHeight); go(ORDER[0]); }
        else playHub(1);
      } else if (pos !== "top") playHub(-1);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(dy) < 1) return;
      const dir = dy > 0 ? 1 : -1;
      const now = performance.now();
      if (now - lastWheel > GAP || dir !== gesture.dir) gesture = { consumed: false, dir };
      lastWheel = now;
      const cur = openRef.current;
      if (!cur && footOpen()) return; // the footer scrolls freely
      if (cur) {
        const ed = panelEdges();
        // a long section (phones) scrolls naturally, and that same gesture does not also switch sections
        if (!(dir > 0 ? ed.down : ed.up)) { gesture.consumed = true; return; }
      }
      e.preventDefault();
      if (gesture.consumed) return;
      gesture.consumed = true;
      step(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { touch = null; return; }
      touch = { y: e.touches[0].clientY, ...(openRef.current ? panelEdges() : { up: true, down: true }) };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!openRef.current && !footOpen() && e.cancelable) e.preventDefault(); // the hub never free-scrolls
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch) return;
      const dy = touch.y - (e.changedTouches[0]?.clientY ?? touch.y); // > 0: finger up = go down
      const start = touch;
      touch = null;
      if (Math.abs(dy) < 45) return;
      const dir = dy > 0 ? 1 : -1;
      if (!openRef.current && footOpen()) return;
      if (openRef.current) {
        const ed = panelEdges();
        if (!(dir > 0 ? start.down && ed.down : start.up && ed.up)) return;
      }
      step(dir);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const down = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      const up = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      if (!openRef.current && footOpen()) return;
      if (openRef.current) {
        const ed = panelEdges();
        if (!(down ? ed.down : ed.up)) return;
      }
      e.preventDefault();
      step(down ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  const panelProps = { content, closing, onClose: close, onSwitch: go };

  return (
    <div className="v3">
      <CursorLight />
      {/* corner tools */}
      <div className="v3-tools">
        <Link href="/login" className="v3-tool"><LogIn className="h-4 w-4" /><span>دخول</span></Link>
      </div>

      <div ref={wrapRef} className="v3-scroll">
        <div ref={stageRef} className="v3-stage">
          <div className="v3-warm" aria-hidden />

          {/* the hexagon assembles, lights up, then rises to become the lamp's ceiling rose */}
          <div className="v3-mark">
            <span className="v3-mark-bloom" aria-hidden />
            <SerajMarkSvg id="v3-hero" tone="light" />
          </div>
          {/* docked brand, top corner, once the mark has risen */}
          <div className="v3-brandbar" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/seraj-wordmark.webp" alt="" width={500} height={194} />
          </div>
          <div className="v3-intro">
            <h1 className="v3-wordmark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/seraj-wordmark.webp" alt="السراج المضيء — أنظمة الإضاءة | AlSeraj Almuodea Lighting Systems" width={500} height={194} fetchPriority="high" />
            </h1>
            <p className="v3-tagline" aria-label={content.tagline}>
              {content.tagline.split(/\s+/).filter(Boolean).map((w, i) => (
                <span key={i} className="v3-word" aria-hidden><span style={{ animationDelay: `${1.35 + i * 0.06}s` }}>{w}</span></span>
              ))}
            </p>
            <div className="v3-hint" aria-hidden>
              <span className="v3-hint-cord" />
              <span className="v3-hint-bead" />
            </div>
            <p className="v3-hint-text">انزل لتُضيء المكان</p>
          </div>

          {/* the bulb drops out from under the logo */}
          <div className="v3-drop" aria-hidden>
            <div className="v3-pend">
              <div className="v3-pend-swing">
                <span className="v3-cord" />
                <div className="v3-bulb">
                  <Bulb />
                </div>
              </div>
            </div>
          </div>
          <span ref={anchorRef} className="v3-anchor" aria-hidden />
          <div className="v3-halo" aria-hidden />
          {/* slow orbit rings around the lit bulb */}
          <div className="v3-rings" aria-hidden><span /><span /><span /></div>

          <svg ref={svgRef} className="v3-wires" aria-hidden focusable="false">
            <defs>
              <filter id="v3-wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            {SECTIONS.map((s, i) => (
              <g key={s.key}>
                <path ref={(el) => { glowRefs.current[i] = el; }} className="v3-wire-glow" pathLength={1} filter="url(#v3-wire-glow)" />
                <path ref={(el) => { pathRefs.current[i] = el; }} className="v3-wire" pathLength={1} />
              </g>
            ))}
          </svg>
          {SECTIONS.map((s, i) => (
            <span key={s.key} ref={(el) => { pulseRefs.current[i] = el; }} className="v3-pulse" style={{ animationDelay: `${i * 0.37}s` }} aria-hidden />
          ))}

          <nav className="v3-nodes" aria-label="أقسام الموقع">
            {SECTIONS.map((s, i) => (
              <button
                key={s.key}
                ref={(el) => { nodeRefs.current[i] = el; }}
                type="button"
                className="v3-node"
                data-k={s.key}
                onClick={(e) => { setOrigin(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2); openPanel(s.key); }}
                onMouseEnter={() => play("hover")}
                onMouseMove={magnet}
                onMouseLeave={unmagnet}
              >
                <span className="v3-node-dot">
                  <span className="v3-node-glow" aria-hidden />
                  <s.Icon className="v3-node-icon" strokeWidth={1.2} />
                </span>
                <span className="v3-node-num" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                <span className="v3-node-label">{s.label}</span>
                <span className="v3-node-hint">{s.hint}</span>
              </button>
            ))}
          </nav>
          <div className="v3-tour" aria-hidden>
            <span className="v3-tour-text">اختر قسماً، أو انزل لتبدأ الجولة</span>
            <span className="v3-filament"><i /></span>
          </div>
        </div>
      </div>

      {/* where am I in the tour — also a shortcut to any section */}
      <nav className={`v3-pill${open ? " is-panel" : ""}`} aria-label="التنقل بين الأقسام">
        <button type="button" className={`v3-pill-dot is-hub${!open ? " is-active" : ""}`} onClick={() => go("hub")} aria-label="الرئيسية" title="الرئيسية" />
        {ORDER.map((k) => (
          <button key={k} type="button" className={`v3-pill-dot${open === k ? " is-active" : ""}`} onClick={(e) => { setOrigin(e.clientX, e.clientY); go(k); }} aria-label={LABELS[k]} title={LABELS[k]} aria-current={open === k ? "page" : undefined} />
        ))}
        <span className="v3-pill-label">{open ? LABELS[open] : "الرئيسية"}</span>
      </nav>

      <div className={`v3-veil${swapping ? " is-on" : ""}`} aria-hidden />
      {open === "products" && <ProductsPanel {...panelProps} />}
      {open === "brands" && <BrandsPanel {...panelProps} />}
      {open === "projects" && <ProjectsPanel {...panelProps} />}
      {open === "about" && <AboutPanel {...panelProps} />}
      {open === "contact" && <ContactPanel {...panelProps} />}
    </div>
  );
}

