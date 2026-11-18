import type { V3Content } from "./content";
import type { Sfx } from "./sound";

export type SectionKey = "products" | "brands" | "projects" | "about" | "contact";

/** Tour order: scrolling down at the end of a section moves to the next one. */
export const ORDER: SectionKey[] = ["products", "brands", "projects", "about", "contact"];

export const LABELS: Record<SectionKey, string> = {
  products: "المنتجات",
  brands: "البراندات",
  projects: "المشاريع",
  about: "من نحن",
  contact: "تواصل معنا",
};

/** The sound each panel's "return" control makes. */
export const CLOSE_SFX: Record<SectionKey, Sfx> = { products: "click", brands: "chain", projects: "dimmer", about: "click", contact: "press" };

/**
 * A section with its own stops (projects lights them one by one) registers this while open.
 * It gets the scroll direction and returns true if it used the step, false to let the tour move on.
 */
export const stepHandler: { current: ((dir: 1 | -1) => boolean) | null } = { current: null };

export type PanelProps = {
  content: V3Content;
  closing: boolean;
  onClose: () => void;
  onSwitch: (k: SectionKey) => void;
};
