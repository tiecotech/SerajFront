import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/site";
import { PageIntro, PageSections } from "./Sections";

export async function cmsMetadata(slug: string): Promise<Metadata> {
  const data = await getPage(slug);
  if (!data) return {};
  const seo = data.page.seo;
  return {
    title: seo.meta_title || data.page.title,
    description: seo.meta_description || undefined,
    robots: seo.indexable === false ? { index: false } : undefined,
    openGraph: seo.og_image ? { images: [seo.og_image.lg] } : undefined,
  };
}

export async function CmsPage({ slug }: { slug: string }) {
  const data = await getPage(slug);
  if (!data) notFound();
  const hasHero = data.page.sections.some((s) => s.type === "hero");
  return (
    <>
      {!hasHero && <PageIntro title={data.page.title} subtitle={data.page.seo.meta_description} />}
      <PageSections sections={data.page.sections} ctx={{ slides: data.slides, brands: data.brands, projects: data.projects, company: data.company }} />
    </>
  );
}
