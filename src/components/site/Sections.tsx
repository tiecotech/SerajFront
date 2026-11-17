import { ArrowLeft, Building2, Gem, Hotel, Lamp, MapPin, Ruler, ShieldCheck, Store, Sun, Target, Eye, Truck, UtensilsCrossed, Home, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";
import type { SiteBrand, SiteCompany, SiteProject, SiteSection, SiteSlide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mediaSrcSet } from "@/lib/media";
import { ContactForm } from "./ContactForm";
import { HeroSlider } from "./HeroSlider";
import { LightDivider } from "./LightDivider";
import { LightShow } from "./LightShow";
import { RevealObserver } from "./RevealObserver";
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

/**
 * Motion: elements marked `data-reveal` animate in once when scrolled into view (see RevealObserver +
 * globals.css). `st(i)` staggers siblings. The attribute always sits on a wrapper, never on an element
 * with its own hover transition, so the two transitions never fight.
 */
const st = (i: number) => ({ "--i": i }) as React.CSSProperties;

const bg = (b?: string) => ({ soft: "bg-gray-25", sand: "bg-gold-50", white: "bg-white" })[b ?? "white"] ?? "bg-white";

function Heading({ c, center = false, className }: { c: Record<string, Json>; center?: boolean; className?: string }) {
  if (!c.title && !c.eyebrow) return null;
  return (
    <div className={cn("mb-12", center && "text-center", className)}>
      {c.eyebrow && <div data-reveal="fade" className={cn("mb-3 flex items-center gap-3 text-[13px] font-medium tracking-[0.1em] text-gold-600", center && "justify-center")}><span className="h-px w-8 bg-gold-300" />{c.eyebrow}{center && <span className="h-px w-8 bg-gold-300" />}</div>}
      {c.title && <h2 data-reveal style={st(1)} className="text-[26px] md:text-[38px] font-semibold leading-tight text-brand-green">{c.title}</h2>}
      <span data-reveal="line" style={{ ...st(3), backgroundPosition: center ? "center" : undefined }} className={cn("gold-rule mt-4 !w-14", center && "mx-auto")} />
      {c.subtitle && <p data-reveal style={st(2)} className={cn("mt-5 max-w-2xl text-[16px] leading-8 text-gray-500", center && "mx-auto")}>{c.subtitle}</p>}
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
    <Link href={href} className="group relative flex w-full flex-col overflow-hidden rounded-[4px] border border-gray-100 bg-white transition-all duration-300 ease-lux hover:shadow-md hover:border-gold-200">
      <span className="absolute inset-x-0 top-0 h-[3px] origin-right scale-x-[0.35] transition-transform duration-500 ease-lux group-hover:scale-x-100" style={{ background: color }} />
      <div className="flex h-44 items-center justify-center bg-white px-10">
        {/* Brand logos are shown exactly as supplied — no filters, no recolouring */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {b.logo ? <img src={b.logo.md} alt={b.name} className="max-h-24 max-w-[78%] object-contain transition-transform duration-700 ease-lux group-hover:scale-[1.06]" loading="lazy" decoding="async" /> : <span className="text-2xl font-semibold" style={{ color }}>{b.name}</span>}
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

export function ProjectCard({ p, href, large = false, fill = false }: { p: SiteProject; href: string; large?: boolean; fill?: boolean }) {
  return (
    <Link href={href} className={cn("group relative block overflow-hidden rounded-[4px] bg-gray-50", large ? "aspect-[4/5] md:aspect-auto md:h-full" : fill ? "aspect-[4/3] md:aspect-auto md:h-full" : "aspect-[4/3]")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.cover && <img src={p.cover.lg} srcSet={mediaSrcSet(p.cover)} sizes={large ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw"} alt={p.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-lux group-hover:scale-[1.06]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 ease-lux md:translate-y-8 md:group-hover:translate-y-0 md:group-focus-visible:translate-y-0">
        {p.project_type && <span className="mb-2 inline-block rounded-[2px] bg-white/15 px-3 py-0.5 text-[12px] text-white backdrop-blur">{p.project_type}</span>}
        <h3 className={cn("font-semibold text-white", large ? "text-[22px] md:text-[28px]" : "text-[18px] md:text-[20px]")}>{p.title}</h3>
        {p.location && <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/75"><MapPin className="h-3.5 w-3.5" />{p.location}{p.year ? ` — ${p.year}` : ""}</div>}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold-300 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">عرض المشروع <ArrowLeft className="h-4 w-4" /></span>
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
        <section className={cn("relative overflow-hidden py-16 md:py-28", bg(c.background))}>
          <div className="container-lux grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 -z-0 rounded-[4px] watermark-bg opacity-60" aria-hidden />
              {c.image && <div data-reveal="fade" style={st(4)} className="absolute -bottom-5 -start-5 end-10 top-10 rounded-[4px] border border-gold-300" aria-hidden />}
              {c.image && (
                <div data-reveal="wipe" className="relative overflow-hidden rounded-[4px] shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image.lg} srcSet={mediaSrcSet(c.image)} sizes="(min-width: 1024px) 50vw, 100vw" alt={c.title || ""} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover" />
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <Heading c={c} />
              <div data-reveal style={st(2)}><Paragraphs text={c.body} className="-mt-4" /></div>
              {Array.isArray(c.highlights) && c.highlights.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {c.highlights.map((h: Json, i: number) => (
                    <div key={i} data-reveal style={st(i + 3)}>
                      <div className="h-full rounded-[4px] border border-gray-100 border-t-2 border-t-gold-300 bg-white p-4 transition-colors duration-300 hover:border-gold-200 hover:border-t-gold-600">
                        <div className="text-[15px] font-semibold text-brand-green">{h.title}</div>
                        {h.text && <div className="mt-1 text-[13px] leading-6 text-gray-500">{h.text}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {c.cta_label && (
                <div data-reveal style={st(5)}>
                  <Link href={base + (c.cta_url || "#")} className="group mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600 hover:text-gold-700">
                    {c.cta_label} <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>
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
              {ctx.brands.map((b, i) => (
                <div key={b.id} data-reveal style={st(i)} className="flex">
                  <BrandCard b={b} showDescription={c.show_description ?? true} href={`${base}/brands/${b.slug}`} />
                </div>
              ))}
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
                  <div key={i} data-reveal style={st(i % 3)}>
                    <div className="group relative h-full overflow-hidden rounded-[4px] border border-gray-100 bg-white p-7 transition-all duration-300 hover:border-gold-200 hover:shadow-md">
                      <span className="absolute inset-x-0 bottom-0 h-[2px] origin-right scale-x-0 bg-gold-500 transition-transform duration-500 ease-lux group-hover:scale-x-100" aria-hidden />
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image.md} srcSet={mediaSrcSet(it.image)} sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" alt={it.title} loading="lazy" decoding="async" className="relative mb-5 aspect-[16/10] w-full rounded-[3px] object-cover" />
                      ) : (
                        <div className="relative mb-6 flex items-center justify-between gap-4">
                          {/* hollow icon that fills with warm light on hover, like a fixture switching on */}
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 text-gold-600 transition-all duration-500 ease-lux group-hover:border-gold-500 group-hover:text-gold-700 group-hover:shadow-[0_0_0_6px_rgba(233,220,198,0.5),0_0_24px_rgba(233,196,128,0.45)]">
                            <Icon className="h-6 w-6 stroke-[1.4]" />
                          </span>
                          <span className="flex items-center gap-2 font-display text-[13px] font-medium tracking-[0.2em] text-gold-500 tabular" aria-hidden>
                            <span className="h-px w-6 bg-gold-300 transition-all duration-500 ease-lux group-hover:w-10 group-hover:bg-gold-500" />
                            <span dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                          </span>
                        </div>
                      )}
                      <h3 className="relative text-[18px] font-semibold text-brand-green">{it.title}</h3>
                      {it.text && <p className="relative mt-2 text-[14px] leading-7 text-gray-500">{it.text}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "projects": {
      const list = (c.only_featured ? ctx.projects.filter((p) => p.is_featured) : ctx.projects).slice(0, c.limit ?? 6);
      // Editorial layout when the count tiles cleanly: one tall feature card with the rest beside it.
      const bento = [3, 4, 5].includes(list.length) ? list.length : 0;
      const cell = (i: number) =>
        cn(
          bento > 0 && "md:h-full",
          bento > 0 && i === 0 && "md:row-span-2",
          bento === 4 && i === 0 && "lg:col-span-2",
          bento === 4 && i === 3 && "md:col-span-2",
        );
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Heading c={c} />
              {c.cta_label && (
                <div data-reveal="fade" style={st(2)}>
                  <Link href={base + (c.cta_url || "/projects")} className="group mb-12 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600 hover:text-gold-700">{c.cta_label} <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></Link>
                </div>
              )}
            </div>
            <div className={cn("grid gap-5 md:grid-cols-2", bento === 4 ? "lg:grid-cols-4" : bento !== 3 && "lg:grid-cols-3", bento > 0 && "md:auto-rows-[minmax(250px,1fr)]")}>
              {list.map((p, i) => {
                const large = bento > 0 && i === 0;
                return (
                  <div key={p.id} data-reveal={large ? "wipe" : ""} style={st(i)} className={cell(i)}>
                    <ProjectCard p={p} large={large} fill={bento > 0} href={`${base}/projects/${p.slug}`} />
                  </div>
                );
              })}
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
            <div className={cn("grid gap-10 sm:grid-cols-2", (c.items?.length ?? 0) >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
              {(c.items || []).map((it: Json, i: number) => {
                const Icon = ICONS[it.icon] ?? Gem;
                return (
                  <div key={i} data-reveal style={st(i)} className="group px-4 text-center">
                    <div className="relative mx-auto h-[76px] w-[76px]">
                      <svg viewBox="0 0 76 76" className="ring-spin absolute inset-0 h-full w-full text-gold-300" aria-hidden><circle cx="38" cy="38" r="37" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" /></svg>
                      <div className="absolute inset-[6px] flex items-center justify-center rounded-full border border-gold-200 bg-white text-gold-600 shadow-xs transition-colors duration-500 group-hover:border-gold-700 group-hover:bg-gold-700 group-hover:text-white"><Icon className="h-7 w-7" /></div>
                    </div>
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
        <section className={cn("relative overflow-hidden py-16 md:py-20", bg(c.background ?? "sand"))}>
          <div className="glow-orb -top-24 start-[10%] h-[340px] w-[340px]" aria-hidden />
          <div className="glow-orb -bottom-32 end-[8%] h-[420px] w-[420px] [animation-delay:-7s]" aria-hidden />
          <div className="container-lux relative">
            {c.title && <Heading c={c} center />}
            <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
              {(c.items || []).map((it: Json, i: number) => (
                <div key={i} data-reveal style={st(i)} className={cn("px-3 text-center", i % 2 === 1 && "border-s border-gold-200", i % 4 === 2 && "md:border-s md:border-gold-200")}>
                  <div className="font-display text-[38px] md:text-[52px] font-semibold leading-none text-sheen tabular" dir="ltr" data-count="">{it.value}</div>
                  <div className="mt-3 text-[14px] text-gray-700">{it.label}</div>
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
              {c.body && <p data-reveal style={st(2)} className="-mt-4 text-[16px] leading-8 text-gray-500">{c.body}</p>}
              <div data-reveal style={st(3)}>
                <dl className="mt-8 space-y-5 text-[15px]">
                  {ctx.company.phone && <div><dt className="text-[13px] text-gray-500">الهاتف</dt><dd className="mt-1 font-medium text-brand-green" dir="ltr" style={{ textAlign: "right" }}>{ctx.company.phone}</dd></div>}
                  {ctx.company.email && <div><dt className="text-[13px] text-gray-500">البريد الإلكتروني</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.email}</dd></div>}
                  {ctx.company.address && <div><dt className="text-[13px] text-gray-500">العنوان</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.address}</dd></div>}
                  {ctx.company.working_hours && <div><dt className="text-[13px] text-gray-500">ساعات العمل</dt><dd className="mt-1 font-medium text-brand-green">{ctx.company.working_hours}</dd></div>}
                </dl>
                <SocialLinks social={ctx.company.social} className="mt-8" />
              </div>
            </div>
            <div data-reveal="end" style={st(2)} className="lg:col-span-3">
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
            <div data-reveal style={st(2)}><Paragraphs text={c.body} className="-mt-4" /></div>
          </div>
        </section>
      );

    case "image_text":
      return (
        <section className={cn("py-16 md:py-24", bg(c.background))}>
          <div className="container-lux grid items-center gap-12 lg:grid-cols-2">
            <div className={cn(c.image_side === "start" ? "lg:order-1" : "lg:order-2")}>
              {c.image && (
                <div data-reveal="wipe" className="overflow-hidden rounded-[4px] shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image.lg} srcSet={mediaSrcSet(c.image)} sizes="(min-width: 1024px) 50vw, 100vw" alt={c.title || ""} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                </div>
              )}
            </div>
            <div className={cn(c.image_side === "start" ? "lg:order-2" : "lg:order-1")}>
              <Heading c={c} />
              <div data-reveal style={st(2)}><Paragraphs text={c.body} className="-mt-4" /></div>
              {c.cta_label && <Link href={base + (c.cta_url || "#")} className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-gold-600">{c.cta_label} <ArrowLeft className="h-4 w-4" /></Link>}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section className={cn("py-16", bg(c.background ?? "sand"))}>
          <div className="container-lux">
            <div data-reveal="zoom">
              <div className="relative overflow-hidden rounded-[4px] border border-gold-200 bg-white px-8 py-12 text-center md:px-16">
                <div className="glow-orb left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2" aria-hidden />
                <LightDivider className="relative mx-auto mb-6 max-w-xs" />
                <h2 className="relative mt-2 text-[24px] md:text-[32px] font-semibold text-brand-green">{c.title}</h2>
                {c.subtitle && <p className="relative mx-auto mt-3 max-w-xl text-[16px] leading-8 text-gray-500">{c.subtitle}</p>}
                {c.cta_label && <Link href={base + (c.cta_url || "/contact")} className="relative mt-7 inline-flex h-[50px] items-center rounded-[3px] bg-gold-gradient px-8 text-[15px] font-medium text-white shadow-gold">{c.cta_label}</Link>}
              </div>
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
      <RevealObserver />
    </>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-gray-25">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,226,170,0.35),transparent_70%)]" aria-hidden />
      <div className="glow-orb -top-40 left-1/2 h-[380px] w-[380px] -translate-x-1/2" aria-hidden />
      <div className="container-lux relative py-14 md:py-20 text-center">
        <h1 className="reveal text-[32px] md:text-[44px] font-semibold text-brand-green">{title}</h1>
        <LightDivider className="mx-auto mt-5 max-w-[220px]" />
        {subtitle && <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-gray-500">{subtitle}</p>}
      </div>
    </section>
  );
}
