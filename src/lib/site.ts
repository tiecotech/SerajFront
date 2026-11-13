import type { SiteBrand, SiteCompany, SiteData, SitePage, SiteProject, SiteSlide } from "./types";

const API = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";

async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}/api/v1/public/website${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30, tags: ["website"] },
    });
    if (!res.ok) return null;
    return (await res.json()).data as T;
  } catch {
    return null;
  }
}

export type HomeData = {
  company: SiteCompany;
  site: SiteData["site"];
  menu: SiteData["menu"];
  slides: SiteSlide[];
  brands: SiteBrand[];
  projects: SiteProject[];
  categories: SiteData["categories"];
  page: SitePage | null;
};

export type PageData = {
  page: SitePage;
  brands: SiteBrand[];
  projects: SiteProject[];
  categories: SiteData["categories"];
  company: SiteCompany;
  slides: SiteSlide[];
};

export const getHome = () => fetchPublic<HomeData>("/home");
export const getLayout = () => fetchPublic<{ company: SiteCompany; site: SiteData["site"]; menu: SiteData["menu"] }>("/layout");
export const getPage = (slug: string) => fetchPublic<PageData>(`/pages/${encodeURIComponent(slug)}`);
export const getBrand = (slug: string) => fetchPublic<SiteBrand>(`/brands/${encodeURIComponent(slug)}`);
export const getProject = (slug: string) => fetchPublic<SiteProject>(`/projects/${encodeURIComponent(slug)}`);

/** Draft preview through the admin-generated signed URL (never cached). */
export async function getPreview(query: string): Promise<SiteData | null> {
  try {
    const res = await fetch(`${API}/api/v1/public/website/preview?${query}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).data as SiteData;
  } catch {
    return null;
  }
}
