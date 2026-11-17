"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page (sections stay server components):
 *  - `[data-reveal]` elements get `.is-in` the first time they scroll into view; CSS does the motion.
 *  - `[data-count]` numbers count up from 0 when revealed. The server renders the final value,
 *    so without JS (or for crawlers) the real figure is always there.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));

    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el.dataset.count !== undefined) countUp(el);
          else el.classList.add("is-in");
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    counters.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}

function countUp(el: HTMLElement) {
  const raw = el.textContent ?? "";
  const m = raw.match(/^(\D*)([\d,.]+)(.*)$/);
  if (!m) return;
  const [, pre, num, post] = m;
  const target = parseFloat(num.replace(/,/g, ""));
  if (!isFinite(target) || target === 0) return;
  const decimals = (num.split(".")[1] || "").length;
  const dur = 1600;
  const t0 = performance.now();
  const fmt = (v: number) => pre + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post;
  const grouped = num.includes(",");
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 4);
    const v = target * eased;
    el.textContent = t < 1 ? (grouped ? fmt(v) : pre + v.toFixed(decimals) + post) : raw;
    if (t < 1) requestAnimationFrame(step);
  };
  el.textContent = pre + (0).toFixed(decimals) + post;
  requestAnimationFrame(step);
}
