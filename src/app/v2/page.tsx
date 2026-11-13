import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getHome } from "@/lib/site";
import { buildContent } from "./_lib/content";
import { V2Page } from "./_components/V2Page";
import "./v2.css";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome();
  const seo = home?.page?.seo;
  return {
    title: seo?.meta_title || "السراج المضيء",
    description: seo?.meta_description || undefined,
    // Comparison variant of the home page: keep it out of the index so it never competes with "/".
    robots: { index: false, follow: true },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#14110f", width: "device-width", initialScale: 1 };

export default async function HomeV2() {
  const home = await getHome();
  if (!home?.page) notFound();
  return <V2Page content={buildContent(home)} />;
}
