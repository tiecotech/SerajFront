import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageSections } from "@/components/site/Sections";
import { getHome } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome();
  const seo = home?.page?.seo;
  return {
    title: seo?.meta_title || "السراج المضيء | أنظمة الإضاءة والإنارة",
    description: seo?.meta_description || "السراج المضيء — حلول إضاءة وإنارة متكاملة للمشاريع السكنية والتجارية والفندقية.",
    robots: seo?.indexable === false ? { index: false } : undefined,
    openGraph: seo?.og_image ? { images: [seo.og_image.lg] } : undefined,
  };
}

export default async function HomePage() {
  const home = await getHome();
  if (!home?.page) notFound();
  return (
    <PageSections
      sections={home.page.sections}
      ctx={{ slides: home.slides, brands: home.brands, projects: home.projects, company: home.company, heroIntervalMs: home.site.hero_interval_ms }}
    />
  );
}
