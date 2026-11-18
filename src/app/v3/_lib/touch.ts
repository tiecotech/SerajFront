"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** True on phones/tablets: no hover, a finger instead of a pointer. */
export function useTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(hover: none), (pointer: coarse)");
    const f = () => setTouch(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return touch;
}

/**
 * Touch screens have no hover, so whatever a cursor would reveal is shown as a slow showcase:
 * the items light one after another, in a loop, until the visitor taps one (call the returned `stop`).
 * `light` must be stable (a state setter or a useCallback).
 */
export function useShowcase(enabled: boolean, n: number, light: (i: number) => void, start = 2200, every = 2600) {
  const stopped = useRef(false);
  useEffect(() => {
    if (!enabled || n < 1 || stopped.current) return;
    let i = -1;
    let t = 0;
    const tick = () => {
      if (stopped.current) return;
      i = (i + 1) % n;
      light(i);
      t = window.setTimeout(tick, every);
    };
    t = window.setTimeout(tick, start);
    return () => window.clearTimeout(t);
  }, [enabled, n, light, start, every]);
  return useCallback(() => { stopped.current = true; }, []);
}

/** Focus that came from the keyboard (a tap also focuses links on Android; that must not count as "hover"). */
export const keyboardFocus = (e: React.FocusEvent<HTMLElement>) => e.currentTarget.matches(":focus-visible");
