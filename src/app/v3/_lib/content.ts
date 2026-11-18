import type { HomeData } from "@/lib/site";
import type { Json, Media, SiteBrand, SiteCompany, SiteProject } from "@/lib/types";

type Item = { title: string; text?: string };

export type V3Content = {
  company: SiteCompany;
  menu: { slug: string; title: string }[];
  footerText: string | null;
  tagline: string;
  products: { title: string; subtitle: string | null; items: { name: string; slug: string; description: string | null; image: Media | null }[] };
  brands: { title: string; subtitle: string | null; items: SiteBrand[] };
  projects: { title: string; subtitle: string | null; items: SiteProject[] };
  about: { title: string; paragraphs: string[]; highlights: Item[]; stats: { value: string; label: string }[]; why: Item[] };
  contact: { title: string; text: string | null };
};

/** Maps the CMS home payload (the same data "/" renders) to the five v3 sections. */
export function buildV3Content(home: HomeData): V3Content {
  const sections = home.page?.sections ?? [];
  const find = (type: string): Record<string, Json> => sections.find((s) => s.type === type)?.content ?? {};
  const about = find("about");
  const brands = find("brands");
  const cats = find("categories");
  const stats = find("stats");
  const why = find("why_us");
  const projects = find("projects");
  const contact = find("contact");

  let projectItems = home.projects;
  if (projects.only_featured) projectItems = projectItems.filter((p) => p.is_featured);
  projectItems = projectItems.slice(0, Math.min(Number(projects.limit) || 5, 5));

  const paragraphs = String(about.body ?? home.company.description ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return {
    company: home.company,
    menu: home.menu,
    footerText: home.site.footer_text ?? null,
    tagline: home.slides[0]?.title || home.company.tagline,
    products: {
      title: cats.title || "عالمٌ من الضوء لكل مساحة",
      subtitle: cats.subtitle ?? null,
      items: home.categories.map((c) => ({ name: c.name, slug: c.slug, description: c.description, image: c.image })),
    },
    brands: { title: brands.title || "براندات السراج", subtitle: brands.subtitle ?? null, items: home.brands.slice(0, 6) },
    projects: { title: projects.title || "مشاريع أضأناها", subtitle: projects.subtitle ?? null, items: projectItems },
    about: {
      title: about.title || "خبرة في صناعة الضوء",
      paragraphs,
      highlights: Array.isArray(about.highlights) ? about.highlights : [],
      stats: Array.isArray(stats.items) ? stats.items : [],
      why: Array.isArray(why.items) ? why.items : [],
    },
    contact: { title: contact.title || "لنبدأ مشروعك القادم", text: contact.body ?? null },
  };
}
