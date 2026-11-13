import { ArrowLeft, Building2, Gem, Hotel, Lamp, MapPin, Ruler, ShieldCheck, Store, Sun, Target, Eye, Truck, UtensilsCrossed, Home, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";
import type { SiteBrand, SiteCompany, SiteProject, SiteSection, SiteSlide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mediaSrcSet } from "@/lib/media";
import { ContactForm } from "./ContactForm";
import { HeroSlider } from "./HeroSlider";
import { LightShow } from "./LightShow";
import { ScrollStory } from "./ScrollStory";
import { SocialLinks } from "./SocialLinks";
import type { Json } from "@/lib/types";

type Ctx = {
  slides: SiteSlide[];
  brands: SiteBrand[];
  projects: SiteProject[];
  company: SiteCompany;
  heroIntervalMs?: number;
  linkBase?: string;
};

const bg = (b?: string) => ({ soft: "bg-gray-25", sand: "bg-gold-50", white: "bg-white" })[b ?? "white"] ?? "bg-white";

function Heading({ c, center = false, className }: { c: Record<string, Json>; center?: boolean; className?: string }) {
  if (!c.title && !c.eyebrow) return null;
  return (
    <div className={cn("mb-12", center && "text-center", className)}>
      {c.eyebrow && <div className={cn("mb-3 flex items-center gap-3 text-[13px] font-medium tracking-[0.1em] text-gold-600", center && "justify-center")}><span className="h-px w-8 bg-gold-300" />{c.eyebrow}{center && <span className="h-px w-8 bg-gold-300" />}</div>}
      {c.title && <h2 className="text-[26px] md:text-[36px] font-semibold leading-tight text-brand-green">{c.title}</h2>}
      <span className={cn("gold-rule mt-4", center && "mx-auto")} />
      {c.subtitle && <p className={cn("mt-5 max-w-2xl text-[16px] leading-8 text-gray-500", center && "mx-auto")}>{c.subtitle}</p>}
    </div>
  );
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  gem: Gem, ruler: Ruler, shield: ShieldCheck, truck: Truck, eye: Eye, target: Target, sun: Sun, lamp: Lamp, sparkles: Sparkles,
};
const CATEGORY_ICONS = [Home, Hotel, UtensilsCrossed, Briefcase, Store, Building2];

function Paragraphs({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn("prose-lux", className)}>
      {text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

export function BrandCard({ b, showDescription = true, href }: { b: SiteBrand; showDescription?: boolean; href: string }) {
  const color = b.colors.primary || "#B8956F";
  return (
    <Link href={href} className="group relative flex flex-col overflow-hidden rounded-[4px] border border-gray-100 bg-white transition-all duration-300 ease-lux hover:shadow-md hover:border-gold-200">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <div className="flex h-44 items-center justify-center bg-white px-10">
        {/* Brand logos are shown exactly as supplied — no filters, no recolouring */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {b.logo ? <img src={b.logo.md} alt={b.name} className="max-h-24 max-w-[78%] object-contain" loading="lazy" /> : <span className="text-2xl font-semibold" style={{ color }}>{b.name}</span>}
      </div>
      <div className="flex flex-1 flex-col border-t border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[17px] font-semibold text-brand-green">{b.name}</h3>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
        </div>
        {b.tagline && <div className="mt-0.5 text-[13px] text-gray-500" dir="auto">{b.tagline}</div>}
        {showDescription && b.description && <p className="mt-3 text-[14px] leading-7 text-gray-500 line-clamp-3">{b.description}</p>}
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold-600">اكتشف البراند <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
      </div>
    </Link>
  );
}

export function ProjectCard({ p, href, large = false }: { p: SiteProject; href: string; large?: boolean }) {
  return (
    <Link href={href} className={cn("group relative block overflow-hidden rounded-[4px] bg-gray-50", large ? "aspect-[4/5] md:aspect-auto md:h-full" : "aspect-[4/3]")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.cover && <img src={p.cover.lg} srcSet={mediaSrcSet(p.cover)} sizes={large ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"} alt={p.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        {p.project_type && <span className="mb-2 inline-block rounded-[2px] bg-white/15 px-3 py-0.5 text-[12px] text-white backdrop-blur">{p.project_type}</span>}
        <h3 className="text-[18px] md:text-[20px] font-semibold text-white">{p.title}</h3>
        {p.location && <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/75"><MapPin className="h-3.5 w-3.5" />{p.location}{p.year ? ` — ${p.year}` : ""}</div>}
      </div>
    </Link>
  );
}

export function Section({ section, ctx }: { section: SiteSection; ctx: Ctx }) {
  const c = section.content || {};
  const base = ctx.linkBase ?? "";

  switch (section.type) {
    case "light_show":
      return <LightShow content={c} />;

    case "scroll_story":
      return <ScrollStory content={c} />;

    case "hero":
      return <HeroSlider slides={ctx.slides} intervalMs={c.interval_ms ?? ctx.heroIntervalMs} autoplay={c.autoplay ?? true} height={c.height ?? "full"} />;

    case "about":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 -z-0 rounded-[4px] watermark-bg opacity-60" aria-hidden />
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image.lg} srcSet={mediaSrcSet(c.image)} sizes="(min-width: 1024px) 50vw, 100vw" alt={c.title || ""} loading="lazy" decoding="async" className="relative aspect-[4/5] w-full rounded-[4px] object-cover shadow-md" />
              )}
            </div>
            <div className="order-1 lg:order-2">
              <Heading c={c} />
              <Paragraphs text={c.body} className="-mt-4" />
              {Array.isArray(c.highlights) && c.highlights.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {c.highlights.map((h: Json, i: number) => (
                    <div key={i} className="rounded-[4px] border border-gray-100 bg-white p-4">
                      <div className="text-[15px] font-semibold text-brand-green">{h.title}</div>
                      {h.text && <div className="mt-1 text-[13px] leading-6 text-gray-500">{h.text}</div>}
                    </div>
                  ))}
                </div>
              )}
              {c.cta_label && (
                <Link href={base + (c.cta_url || "#")} className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600 hover:text-gold-700">
                  {c.cta_label} <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      );

    case "brands":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux">
            <Heading c={c} center />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ctx.brands.map((b) => <BrandCard key={b.id} b={b} showDescription={c.show_description ?? true} href={`${base}/brands/${b.slug}`} />)}
            </div>
          </div>
        </section>
      );

    case "categories":
    case "featured_collections":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux">
            <Heading c={c} center />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(c.items || []).map((it: Json, i: number) => {
                const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
                return (
                  <div key={i} className="group relative overflow-hidden rounded-[4px] border border-gray-100 bg-white p-7 transition-all duration-300 hover:border-gold-200 hover:shadow-md">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image.md} srcSet={mediaSrcSet(it.image)} sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" alt={it.title} loading="lazy" decoding="async" className="mb-5 aspect-[16/10] w-full rounded-[3px] object-cover" />
                    ) : (
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[3px] bg-gold-50 text-gold-600 transition-colors group-hover:bg-gold-gradient group-hover:text-white"><Icon className="h-6 w-6" /></div>
                    )}
                    <h3 className="text-[18px] font-semibold text-brand-green">{it.title}</h3>
                    {it.text && <p className="mt-2 text-[14px] leading-7 text-gray-500">{it.text}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "projects": {
      const list = (c.only_featured ? ctx.projects.filter((p) => p.is_featured) : ctx.projects).slice(0, c.limit ?? 6);
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Heading c={c} />
              {c.cta_label && (
                <Link href={base + (c.cta_url || "/projects")} className="mb-12 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600 hover:text-gold-700">{c.cta_label} <ArrowLeft className="h-4 w-4" /></Link>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => <ProjectCard key={p.id} p={p} href={`${base}/projects/${p.slug}`} />)}
            </div>
          </div>
        </section>
      );
    }

    case "why_us":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux">
            <Heading c={c} center />
            <div className={cn("grid gap-6 sm:grid-cols-2", (c.items?.length ?? 0) >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
              {(c.items || []).map((it: Json, i: number) => {
                const Icon = ICONS[it.icon] ?? Gem;
                return (
                  <div key={i} className="text-center px-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-200 bg-white text-gold-600 shadow-xs"><Icon className="h-7 w-7" /></div>
                    <h3 className="mt-5 text-[17px] font-semibold text-brand-green">{it.title}</h3>
                    {it.text && <p className="mt-2 text-[14px] leading-7 text-gray-500">{it.text}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "stats":
      return (
        <section className={cn("py-14", bg(c.background ?? "sand"))}>
          <div className="container-lux">
            {c.title && <Heading c={c} center />}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {(c.items || []).map((it: Json, i: number) => (
                <div key={i} className="text-center">
                  <div className="font-display text-[34px] md:text-[44px] font-semibold text-gold-gradient tabular" dir="ltr">{it.value}</div>
                  <div className="mt-1 text-[14px] text-gray-700">{it.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "contact":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Heading c={c} />
              {c.body && <p className="-mt-4 text-[16px] leading-8 text-gray-500">{c.body}</p>}
              <dl className="mt-8 space-y-5 text-[15px]">
                {ctx.company.phone && <div><dt className="text-[13px] text-gray-500">الهاتف</dt><dd className="mt-1 font-medium text-brand-green" dir="ltr" style={{ textAlign: "right" }}>{ctx.company.phone}</dd></div>}
                {ctx.company.email && <div><dt className="text-[13px] text-gray-500">البريد الإلكتروني</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.email}</dd></div>}
                {ctx.company.address && <div><dt className="text-[13px] text-gray-500">العنوان</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.address}</dd></div>}
                {ctx.company.working_hours && <div><dt className="text-[13px] text-gray-500">ساعات العمل</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.working_hours}</dd></div>}
              </dl>
              <SocialLinks social={ctx.company.social} className="mt-8" />
            </div>
            <div className="lg:col-span-3">
              {c.show_form !== false && <ContactForm whatsapp={ctx.company.whatsapp} />}
              {c.show_map && ctx.company.map_url && (
                <iframe src={ctx.company.map_url} className="mt-6 h-72 w-full rounded-[4px] border border-gray-100" loading="lazy" title="الخريطة" />
              )}
            </div>
          </div>
        </section>
      );

    case "rich_text":
      return (
        <section className={cn("py-14 md:py-20", bg(c.background))}>
          <div className="container-lux max-w-3xl">
            <Heading c={c} />
            <Paragraphs text={c.body} className="-mt-4" />
          </div>
        </section>
      );

    case "image_text":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
            <div className={cn(c.image_side === "start" ? "lg:order-1" : "lg:order-2")}>
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image.lg} srcSet={mediaSrcSet(c.image)} sizes="(min-width: 1024px) 50vw, 100vw" alt={c.title || ""} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-[4px] object-cover shadow-md" />
              )}
            </div>
            <div className={cn(c.image_side === "start" ? "lg:order-2" : "lg:order-1")}>
              <Heading c={c} />
              <Paragraphs text={c.body} className="-mt-4" />
              {c.cta_label && <Link href={base + (c.cta_url || "#")} className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600">{c.cta_label} <ArrowLeft className="h-4 w-4" /></Link>}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section className={cn("py-16", bg(c.background ?? "sand"))}>
          <div className="container-lux">
            <div className="relative overflow-hidden rounded-[4px] border border-gold-200 bg-white px-8 py-12 text-center md:px-16">
              <div className="pattern-band absolute inset-x-0 top-0 h-8 opacity-60" aria-hidden />
              <h2 className="mt-2 text-[24px] md:text-[32px] font-semibold text-brand-green">{c.title}</h2>
              {c.subtitle && <p className="mx-auto mt-3 max-w-xl text-[16px] leading-8 text-gray-500">{c.subtitle}</p>}
              {c.cta_label && <Link href={base + (c.cta_url || "/contact")} className="mt-7 inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-8 text-[15px] font-medium text-white shadow-gold">{c.cta_label}</Link>}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

export function PageSections({ sections, ctx }: { sections: SiteSection[]; ctx: Ctx }) {
  return (
    <>
      {sections.map((s) => (
        <Section key={s.id} section={s} ctx={ctx} />
      ))}
    </>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-gray-25">
      <div className="pattern-band absolute inset-x-0 top-0 h-full opacity-[0.35]" aria-hidden />
      <div className="container-lux relative py-14 md:py-20 text-center">
        <h1 className="text-[32px] md:text-[44px] font-semibold text-brand-green">{title}</h1>
        <span className="gold-rule mx-auto mt-4" />
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-8 text-gray-500">{subtitle}</p>}
      </div>
    </section>
  );
}
