import type { Media } from "./types";

/**
 * Width-described sources for a media item: md (fits 900px), lg (fits 1800px) and the
 * stored original (fits 2400px). The variants are capped by their LONGEST side, so a
 * portrait photo's "lg" is only ~1200px wide; letting the browser pick by real width
 * keeps full-bleed and large images sharp instead of upscaling a small variant.
 */
export function mediaSrcSet(m?: Pick<Media, "url" | "md" | "lg" | "width" | "height"> | null): string | undefined {
  const w = m?.width ?? 0;
  const h = m?.height ?? 0;
  if (!m || !w || !h) return undefined;
  const fit = (box: number) => Math.round(w * Math.min(1, box / Math.max(w, h)));
  const sources: [string, number][] = [];
  const add = (src: string | undefined, width: number) => {
    if (src && !sources.some(([, sw]) => sw === width)) sources.push([src, width]);
  };
  add(m.md, fit(900));
  add(m.lg, fit(1800));
  add(m.url, w);
  return sources.length > 1 ? sources.map(([src, sw]) => `${src} ${sw}w`).join(", ") : undefined;
}

/** `sizes` for an image that covers the whole viewport (object-cover): phones crop a landscape photo, so they need more than 100vw. */
export const FULL_BLEED_SIZES = "(max-width: 767px) 220vw, 100vw";
