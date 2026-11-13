import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { PageIntro, PageSections } from "@/components/site/Sections";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPreview } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "معاينة المسودة", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string>> };

/**
 * Draft preview. Requires the short-lived signed query generated from the admin
 * dashboard (expires + signature). Without a valid signature the API refuses.
 */
export default async function PreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { page: slug = "home", ...signed } = sp;
  const qs = new URLSearchParams(signed).toString();
  const data = await getPreview(qs);

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center p-8 text-center text-gray-500">رابط المعاينة غير صالح أو انتهت صلاحيته. أنشئ رابطاً جديداً من لوحة التحكم.</main>;
  }
  const page = data.pages[slug] ?? data.pages.home;
  const base = `/preview?${qs}&page=`;

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-brand-green px-4 py-2.5 text-[13px] text-white">
        <Eye className="h-4 w-4 text-gold-300" /> وضع المعاينة — هذه نسخة المسودة ولم تُنشر للزوار بعد.
        <span className="hidden sm:inline text-white/60">|</span>
        {Object.values(data.pages).map((p) => (
          <a key={p.slug} href={base + p.slug} className={p.slug === page?.slug ? "text-gold-300 underline" : "text-white/80 hover:text-white"}>
            {p.title}{p.status !== "published" ? " (غير منشورة)" : ""}
          </a>
        ))}
      </div>
      <header className="border-b border-gray-100 bg-white">
        <div className="container-lux flex h-[72px] items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-horizontal.png" alt="" className="h-11" />
        </div>
      </header>
      <main>
        {page && !page.sections.some((s) => s.type === "hero") && <PageIntro title={page.title} subtitle={page.seo.meta_description} />}
        {page && (
          <PageSections
            sections={page.sections}
            ctx={{ slides: data.site.hero_enabled ? data.slides : [], brands: data.brands, projects: data.projects, company: data.company, heroIntervalMs: data.site.hero_interval_ms }}
          />
        )}
      </main>
      <SiteFooter company={data.company} menu={data.menu} footerText={data.site.footer_text} />
    </>
  );
}
