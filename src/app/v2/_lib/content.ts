import type { HomeData } from "@/lib/site";
import type { Json, Media, SiteBrand, SiteCompany, SiteProject } from "@/lib/types";

type Cta = { label: string; url: string };
type Item = { title: string; text?: string };

export type V2Content = {
  company: SiteCompany;
  menu: { slug: string; title: string }[];
  footerText: string | null;
  hero: { eyebrow: string | null; title: string; text: string | null; primary: Cta | null; secondary: Cta | null; image: Media | null };
  about: { eyebrow: string | null; title: string | null; lead: string; rest: string[]; highlights: Item[]; cta: Cta | null; stats: { value: string; label: string }[] };
  collections: { eyebrow: string | null; title: string | null; subtitle: string | null; brands: (SiteBrand & { image: Media | null })[] };
  light: { title: string | null; text: string | null; image: Media | null };
  craft: { eyebrow: string | null; title: string | null; items: Item[]; images: Media[] };
  projects: { eyebrow: string | null; title: string | null; subtitle: string | null; cta: Cta | null; items: SiteProject[] };
  cta: { eyebrow: string | null; title: string; text: string | null; button: Cta };
};

const cta = (label?: string | null, url?: string | null): Cta | null => (label ? { label, url: url || "#" } : null);

/** Maps the CMS home payload (same data the current home page renders) to the v2 layout. */
export function buildContent(home: HomeData): V2Content {
  const sections = home.page?.sections ?? [];
  const find = (type: string): Record<string, Json> => sections.find((s) => s.type === type)?.content ?? {};

  const story = sections.find((s) => s.type === "scroll_story" || s.type === "light_show")?.content ?? {};
  const slide = home.slides[0];
  const about = find("about");
  const brands = find("brands");
  const stats = find("stats");
  const why = find("why_us");
  const projects = find("projects");
  const contact = find("contact");

  const scenes: { title?: string; text?: string; image?: Media | null }[] = Array.isArray(story.scenes) ? story.scenes : [];
  const sceneImages = scenes.map((s) => s.image).filter(Boolean) as Media[];
  const slideImages = home.slides.map((s) => s.desktop_image).filter(Boolean) as Media[];

  const uniq = (list: (Media | null | undefined)[]) => {
    const seen = new Set<string>();
    return list.filter((m): m is Media => !!m && !seen.has(m.md) && !!seen.add(m.md));
  };

  // Brand panels: the brand's own cover when it has one, otherwise an image already used on the site.
  const brandPool = uniq([about.image, ...slideImages, ...sceneImages]);
  const landscape = scenes.find((s) => s.image && (s.image.width ?? 0) > (s.image.height ?? 0)) ?? scenes[0];
  const portraits = uniq([...sceneImages.filter((m) => (m.height ?? 0) > (m.width ?? 0)), about.image, ...sceneImages]);

  const paragraphs = String(about.body ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const lead = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : paragraphs[0] ?? home.company.description;

  let projectItems = home.projects;
  if (projects.only_featured) projectItems = projectItems.filter((p) => p.is_featured);
  projectItems = projectItems.slice(0, Number(projects.limit) || 6);

  return {
    company: home.company,
    menu: home.menu,
    footerText: home.site.footer_text ?? null,
    hero: {
      eyebrow: slide?.eyebrow ?? story.eyebrow ?? null,
      title: story.final_title || slide?.title || home.company.name,
      text: story.final_text || slide?.subtitle || null,
      primary: cta(story.cta_label, story.cta_url) ?? slide?.primary_cta ?? null,
      secondary: cta(story.secondary_cta_label, story.secondary_cta_url) ?? slide?.secondary_cta ?? null,
      image: slide?.desktop_image ?? null,
    },
    about: {
      eyebrow: about.eyebrow ?? null,
      title: about.title ?? null,
      lead,
      rest: paragraphs.length > 1 ? paragraphs.slice(0, -1) : [],
      highlights: Array.isArray(about.highlights) ? about.highlights : [],
      cta: cta(about.cta_label, about.cta_url),
      stats: Array.isArray(stats.items) ? stats.items : [],
    },
    collections: {
      eyebrow: brands.eyebrow ?? null,
      title: brands.title ?? null,
      subtitle: brands.subtitle ?? null,
      brands: home.brands.map((b, i) => ({ ...b, image: b.cover ?? (brandPool.length ? brandPool[i % brandPool.length] : null) })),
    },
    light: { title: landscape?.title ?? null, text: landscape?.text ?? null, image: landscape?.image ?? slideImages[0] ?? null },
    craft: { eyebrow: why.eyebrow ?? null, title: why.title ?? null, items: Array.isArray(why.items) ? why.items : [], images: portraits.slice(0, 3) },
    projects: {
      eyebrow: projects.eyebrow ?? null,
      title: projects.title ?? null,
      subtitle: projects.subtitle ?? null,
      cta: cta(projects.cta_label, projects.cta_url),
      items: projectItems,
    },
    cta: {
      eyebrow: contact.eyebrow ?? null,
      title: contact.title || "تواصل معنا",
      text: contact.body ?? null,
      button: cta(story.cta_label, story.cta_url) ?? slide?.primary_cta ?? { label: "تواصل معنا", url: "/contact" },
    },
  };
}
