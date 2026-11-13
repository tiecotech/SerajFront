/**
 * Mutable bridge between scroll (GSAP writes) and the WebGL scene (useFrame reads).
 * Plain object on purpose: no React re-renders on scroll.
 */
export const sceneState = {
  /** loader finished: the lamp gets its first ember */
  intro: 0,
  /** hero scrub progress: light intensity, cone, glow */
  hero: 0,
  /** philosophy: camera pulls back */
  away: 0,
  /** collections: the lamp lifts out and dims to an ambient presence */
  mid: 0,
  /** CTA: everything fades to a single point of light */
  end: 0,
  /** pointer, -1..1 */
  px: 0,
  py: 0,
};

export const SCENE_ACTIVE_EVENT = "v2:scene-active";

export function setSceneActive(active: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SCENE_ACTIVE_EVENT, { detail: active }));
}
