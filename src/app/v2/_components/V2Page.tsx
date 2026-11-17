"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SocialLinks } from "@/components/site/SocialLinks";
import type { Media } from "@/lib/types";
import type { V2Content } from "../_lib/content";
import { useV2Motion } from "./motion";
import { SerajOutline } from "./SerajOutline";

// WebGL is client-only and split out of the main bundle; the CSS stage stands in until it is ready.
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

const pad = (n: number) => String(n).padStart(2, "0");

/** Responsive variants the media library already generates: md fits 900px, lg fits 1800px. */
function variants(m: Media) {
  const w = m.width ?? 0, h = m.height ?? 0;
  if (!w || !h || !m.lg) return undefined;
  const fit = (box: number) => Math.round(w * Math.min(1, box / Math.max(w, h)));
  return `${m.md} ${fit(900)}w, ${m.lg} ${fit(1800)}w`;
}

function Img({ m, alt = "", className, eager = false, sizes = "(min-width: 900px) 50vw, 100vw" }: { m: Media; alt?: string; className?: string; eager?: boolean; sizes?: string }) {
  // the eager stage image keeps a single source so the browser preload matches what is used
  const srcSet = eager ? undefined : variants(m);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={m.md}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      className={className}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      draggable={false}
    />
  );
}

function Head({ num, eyebrow }: { num: number; eyebrow?: string | null }) {
  return (
    <div className="v2-head" data-reveal>
      <span className="v2-num">{pad(num)}</span>
      <span className="v2-rule" data-line aria-hidden />
      {eyebrow && <span className="v2-eyebrow-t">{eyebrow}</span>}
    </div>
  );
}

const KELVIN_STOPS = [
  { k: 2700, label: "دافئ" },
  { k: 4000, label: "محايد" },
  { k: 5000, label: "بارد" },
];

export function V2Page({ content: c }: { content: V2Content }) {
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useV2Motion(root);

  // Mount the 3D scene after first paint, and never for reduced-motion visitors.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setWebgl(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links = [{ slug: "", title: "الرئيسية" }, ...c.menu];

  return (
    <div className="v2" ref={root}>
      <a href="#v2-main" className="v2-skip">تخطَّ إلى المحتوى</a>

      <svg className="v2-defs" aria-hidden focusable="false">
        <filter id="v2-ripple" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* ---------- Loader ---------- */}
      <div className="v2-loader" aria-hidden>
        <span className="v2-loader-glow" />
        <span className="v2-loader-rays" />
        <span className="v2-loader-mark">
          <SerajOutline id="v2-lm" />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/seraj-wordmark-white.webp" alt="" className="v2-loader-word" width={180} height={70} />
        <span className="v2-loader-tag">أنظمة الإضاءة · Lighting Systems</span>
        <span className="v2-loader-line"><i /></span>
        <span className="v2-loader-count" dir="ltr">00</span>
        <span className="v2-loader-flash" />
      </div>

      {/* ---------- Fixed stage: static fallback + single WebGL canvas ---------- */}
      <div className="v2-stage" aria-hidden>
        {c.hero.image && <Img m={c.hero.image} className="v2-stage-img" eager sizes="100vw" />}
        <div className="v2-stage-glow" />
        <div className={`v2-canvas${sceneReady ? " is-ready" : ""}`}>{webgl && <Scene onReady={() => setSceneReady(true)} />}</div>
      </div>
      <div className="v2-grain" aria-hidden />
      <div className="v2-vignette" aria-hidden />
      <div className="v2-progress" aria-hidden><i /></div>
      <div className="v2-cursor" aria-hidden><i /></div>
      <ol className="v2-chapters" aria-hidden>
        {[c.about.eyebrow || "من نحن", c.collections.eyebrow || "البراندات", "تجربة الضوء", c.craft.eyebrow || "لماذا نحن", c.projects.eyebrow || "المشاريع"].map((t, i) => (
          <li key={i} data-chapter={i}><span className="v2-num">{pad(i + 1)}</span><em>{t}</em></li>
        ))}
      </ol>

      {/* ---------- Navigation ---------- */}
      <header className="v2-nav">
        <Link href="/v2" className="v2-nav-logo" aria-label={c.company.name}>
          <SerajOutline id="v2-nm" className="v2-nav-mark" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seraj-wordmark-white.webp" alt={`${c.company.name} — ${c.company.name_en}`} width={113} height={44} className="v2-nav-word" />
          <span className="v2-nav-tag">إضاءة · Lighting</span>
        </Link>
        <nav className="v2-nav-links" aria-label="القائمة الرئيسية">
          {links.map((l) => (
            <Link key={l.slug} href={`/${l.slug}`}>{l.title}</Link>
          ))}
        </nav>
        <Link href="/login" className="v2-nav-login">بوابة الموظفين</Link>
        <button type="button" className="v2-nav-toggle" aria-expanded={menuOpen} aria-controls="v2-menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? "إغلاق" : "القائمة"}
        </button>
      </header>
      <div id="v2-menu" className={`v2-menu${menuOpen ? " is-open" : ""}`} hidden={!menuOpen}>
        <nav aria-label="القائمة">
          {links.map((l, i) => (
            <Link key={l.slug} href={`/${l.slug}`} onClick={() => setMenuOpen(false)}>
              <span className="v2-num">{pad(i + 1)}</span>
              {l.title}
            </Link>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)}><span className="v2-num">{pad(links.length + 1)}</span>بوابة الموظفين</Link>
        </nav>
      </div>

      <main id="v2-main">
        {/* ---------- Hero ---------- */}
        <section className="v2-hero" aria-labelledby="v2-hero-title">
          <div className="v2-hero-inner">
            <p className="v2-eyebrow v2-hero-eyebrow"><span className="v2-num">00</span><span className="v2-rule" aria-hidden />{c.hero.eyebrow || "أنظمة الإضاءة"}<span className="v2-hero-tag" dir="ltr">Lighting Systems</span></p>
            <h1 id="v2-hero-title" className="v2-hero-title">{c.hero.title}</h1>
            <div className="v2-hero-foot">
              {c.hero.text && <p>{c.hero.text}</p>}
              <div className="v2-actions">
                {c.hero.primary && <Link href={c.hero.primary.url} className="v2-btn">{c.hero.primary.label}</Link>}
                {c.hero.secondary && <Link href={c.hero.secondary.url} className="v2-link">{c.hero.secondary.label}<span aria-hidden className="v2-arrow">←</span></Link>}
              </div>
            </div>
          </div>
          <div className="v2-scrollhint" aria-hidden><span>مرّر</span><i /></div>
        </section>

        {/* ---------- 01 Philosophy ---------- */}
        <section className="v2-phil" aria-labelledby="v2-phil-title">
          <div className="v2-wrap">
            <Head num={1} eyebrow={c.about.eyebrow} />
            {c.about.title && <h2 id="v2-phil-title" className="v2-h2-sm" data-reveal>{c.about.title}</h2>}
            <p className="v2-phil-text">{c.about.lead}</p>
            <div className="v2-phil-side">
              <div className="v2-phil-rest" data-reveal>
                {c.about.rest.map((p, i) => <p key={i}>{p}</p>)}
                {c.about.cta && <Link href={c.about.cta.url} className="v2-link">{c.about.cta.label}<span aria-hidden className="v2-arrow">←</span></Link>}
              </div>
              {c.about.highlights.length > 0 && (
                <ul className="v2-phil-points">
                  {c.about.highlights.map((h, i) => (
                    <li key={i} data-reveal>
                      <span className="v2-rule" data-line aria-hidden />
                      <strong>{h.title}</strong>
                      {h.text && <span>{h.text}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {c.about.stats.length > 0 && (
              <dl className="v2-stats">
                {c.about.stats.map((s, i) => (
                  <div key={i} data-reveal>
                    <span className="v2-rule" data-line aria-hidden />
                    <dd dir="ltr">{s.value}</dd>
                    <dt>{s.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* ---------- Cinematic interlude: the frame opens to full bleed ---------- */}
        {c.hero.image && (
          <section className="v2-interlude" aria-label={c.company.tagline ?? c.company.name}>
            <div className="v2-interlude-frame">
              <Img m={c.hero.image} alt="" sizes="100vw" />
              <span className="v2-interlude-shade" aria-hidden />
            </div>
            <div className="v2-interlude-caption">
              <span className="v2-num">{c.company.name_en}</span>
              {c.company.tagline && <p dir="auto">{c.company.tagline}</p>}
            </div>
          </section>
        )}

        {/* ---------- 02 Collections (horizontal) ---------- */}
        <section className="v2-coll" aria-labelledby="v2-coll-title">
          <div className="v2-coll-track">
            <div className="v2-coll-intro">
              <Head num={2} eyebrow={c.collections.eyebrow} />
              {c.collections.title && <h2 id="v2-coll-title" className="v2-h2">{c.collections.title}</h2>}
              {c.collections.subtitle && <p className="v2-lede">{c.collections.subtitle}</p>}
            </div>
            {c.collections.brands.map((b, i) => (
              <article key={b.id} className="v2-panel" style={{ "--tilt": `${i % 2 ? 0.5 : -0.5}deg` } as React.CSSProperties}>
                <div className="v2-panel-visual">
                  <span className="v2-panel-glow" aria-hidden />
                  <Link href={`/brands/${b.slug}`} className="v2-panel-frame v2-fx" tabIndex={-1} aria-hidden>
                    {b.image && <Img m={b.image} className="v2-fx-img" sizes="(min-width: 900px) 36vw, 100vw" />}
                    <span className="v2-fx-spot" />
                    <span className="v2-panel-veil" />
                  </Link>
                  {b.logo && (
                    <span className="v2-panel-plaque">
                      {/* Brand logos are shown exactly as supplied: no filters, no recolouring */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo.md} alt="" loading="lazy" decoding="async" />
                    </span>
                  )}
                </div>
                <div className="v2-panel-body">
                  <span className="v2-num">{pad(i + 1)} / {pad(c.collections.brands.length)}</span>
                  <h3 dir="auto">{b.name}</h3>
                  {b.tagline && <p className="v2-panel-tag" dir="auto">{b.tagline}</p>}
                  <span className="v2-rule" aria-hidden />
                  {b.description && <p className="v2-panel-desc">{b.description}</p>}
                  <Link href={`/brands/${b.slug}`} className="v2-link" aria-label={`اكتشف البراند ${b.name}`}>اكتشف البراند<span aria-hidden className="v2-arrow">←</span></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- 03 Light experience ---------- */}
        <section className="v2-light" aria-labelledby="v2-light-title">
          <div className="v2-light-inner">
            <div className="v2-light-text">
              <Head num={3} eyebrow="تجربة الضوء" />
              {c.light.title && <h2 id="v2-light-title" className="v2-h2">{c.light.title}</h2>}
              {c.light.text && <p className="v2-lede">{c.light.text}</p>}
              <div className="v2-kelvin">
                <span className="v2-kelvin-value" dir="ltr" aria-hidden><b className="v2-kelvin-num">2700</b>K</span>
                <div className="v2-kelvin-scale" aria-hidden>
                  <span className="v2-kelvin-marker"><i /></span>
                </div>
                <div className="v2-kelvin-stops" role="group" aria-label="درجة حرارة اللون">
                  {KELVIN_STOPS.map((s, i) => (
                    <button key={s.k} type="button" data-kelvin={s.k} aria-pressed={i === 0}>
                      <span dir="ltr">{s.k}K</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {c.light.image && (
              <figure className="v2-light-figure">
                <span className="v2-light-glow v2-light-glow-warm" aria-hidden />
                <span className="v2-light-glow v2-light-glow-cool" aria-hidden />
                <div className="v2-light-frame">
                  <Img m={c.light.image} alt={c.light.title ?? ""} sizes="(min-width: 900px) 62vw, 100vw" />
                  <span className="v2-light-layer v2-light-warm" aria-hidden />
                  <span className="v2-light-layer v2-light-shade" aria-hidden />
                  <span className="v2-light-layer v2-light-cool" aria-hidden />
                  <span className="v2-light-layer v2-light-bright" aria-hidden />
                </div>
              </figure>
            )}
          </div>
        </section>

        {/* ---------- 04 Craft ---------- */}
        <section className="v2-craft" aria-labelledby="v2-craft-title">
          <div className="v2-wrap">
            <Head num={4} eyebrow={c.craft.eyebrow} />
            {c.craft.title && <h2 id="v2-craft-title" className="v2-h2" data-reveal>{c.craft.title}</h2>}
            <div className="v2-craft-grid">
              {c.craft.images.map((m, i) => (
                <div key={m.md} className={`v2-craft-item v2-craft-item-${i + 1}`} data-speed={[0.35, 1.1, 0.7][i]}>
                  <div className="v2-craft-fig">
                    <Img m={m} />
                  </div>
                </div>
              ))}
            </div>
            <ol className="v2-craft-list">
              {c.craft.items.map((it, i) => (
                <li key={i} data-reveal>
                  <span className="v2-rule" data-line aria-hidden />
                  <span className="v2-num">{pad(i + 1)}</span>
                  <h3>{it.title}</h3>
                  {it.text && <p>{it.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- 05 Projects ---------- */}
        <section className="v2-projects" aria-labelledby="v2-projects-title">
          <div className="v2-wrap">
            <div className="v2-projects-head">
              <div>
                <Head num={5} eyebrow={c.projects.eyebrow} />
                {c.projects.title && <h2 id="v2-projects-title" className="v2-h2" data-reveal>{c.projects.title}</h2>}
              </div>
              <div data-reveal>
                {c.projects.subtitle && <p className="v2-lede">{c.projects.subtitle}</p>}
                {c.projects.cta && <Link href={c.projects.cta.url} className="v2-link">{c.projects.cta.label}<span aria-hidden className="v2-arrow">←</span></Link>}
              </div>
            </div>
            <div className="v2-projects-grid">
              {c.projects.items.map((p, i) => (
                <Link key={p.id} href={`/projects/${p.slug}`} className={`v2-proj v2-proj-${(i % 6) + 1}`}>
                  <span className="v2-proj-frame v2-fx">
                    {p.cover && <Img m={p.cover} alt={p.title} className="v2-fx-img" />}
                    <span className="v2-fx-spot" aria-hidden />
                  </span>
                  <span className="v2-proj-meta">
                    <span className="v2-num">{pad(i + 1)}</span>
                    {p.project_type && <span>{p.project_type}</span>}
                    {p.location && <span>{p.location}{p.year ? ` — ${p.year}` : ""}</span>}
                  </span>
                  <span className="v2-proj-title"><span>{p.title}</span><span aria-hidden className="v2-arrow">←</span></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="v2-cta" aria-labelledby="v2-cta-title">
          <div className="v2-cta-inner">
            {c.cta.eyebrow && <p className="v2-eyebrow" data-reveal>{c.cta.eyebrow}</p>}
            <h2 id="v2-cta-title" className="v2-cta-title">{c.cta.title}</h2>
            {c.cta.text && <p className="v2-lede" data-reveal>{c.cta.text}</p>}
            <div data-reveal>
              <Link href={c.cta.button.url} className="v2-btn v2-btn-lg v2-magnet">{c.cta.button.label}</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="v2-footer">
        <div className="v2-wrap">
          <div className="v2-footer-grid">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/seraj-horizontal-white.webp" alt={c.company.name} className="v2-footer-logo" width={191} height={52} loading="lazy" />
              <p>{c.company.description || c.footerText}</p>
              <SocialLinks social={c.company.social} className="v2-social" />
            </div>
            <nav aria-label="روابط">
              <h2>روابط</h2>
              <ul>
                <li><Link href="/">الرئيسية</Link></li>
                {c.menu.map((m) => <li key={m.slug}><Link href={`/${m.slug}`}>{m.title}</Link></li>)}
                <li><Link href="/login">بوابة الموظفين</Link></li>
              </ul>
            </nav>
            <div>
              <h2>تواصل معنا</h2>
              <ul>
                {c.company.address && <li>{c.company.address}</li>}
                {c.company.phone && <li><a dir="ltr" href={`tel:${c.company.phone.replace(/\s/g, "")}`}>{c.company.phone}</a></li>}
                {c.company.email && <li><a href={`mailto:${c.company.email}`}>{c.company.email}</a></li>}
                {c.company.working_hours && <li>{c.company.working_hours}</li>}
              </ul>
            </div>
          </div>
          <div className="v2-footer-mark" aria-hidden dir="ltr">{c.company.name_en}</div>
          <div className="v2-footer-base">
            <span>© {new Date().getFullYear()} {c.company.name} — {c.company.name_en}. جميع الحقوق محفوظة.</span>
            <span className="v2-credit">
              تصميم وبرمجة{" "}
              <a href="https://tieco-tech.com" target="_blank" rel="noopener">تايكو تيك</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
