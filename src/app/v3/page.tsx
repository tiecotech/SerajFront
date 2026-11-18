import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getHome } from "@/lib/site";
import { buildV3Content } from "./_lib/content";
import { V3Page } from "./_components/V3Page";
import "./v3.css";
import "./v3-2027.css";
import "./v3-hero.css";
import "./v3-sections.css";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome();
  const seo = home?.page?.seo;
  return {
    title: seo?.meta_title || "السراج المضيء | أنظمة الإضاءة — Lighting Systems",
    description: seo?.meta_description || "السراج المضيء — حلول الإضاءة والإنارة المعمارية والديكورية للمشاريع السكنية والتجارية والفندقية.",
    // Comparison variant of the home page: keep it out of the index so it never competes with "/".
    robots: { index: false, follow: true },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function HomeV3() {
  const home = await getHome();
  if (!home?.page) notFound();
  return (
    <>
      <V3Page content={buildV3Content(home)} />
      {/* opens only at the end of the tour, so the hub stays the bottom of the page */}
      <div className="v3-foot"><SiteFooter company={home.company} menu={home.menu} footerText={home.site.footer_text} /></div>
    </>
  );
}
