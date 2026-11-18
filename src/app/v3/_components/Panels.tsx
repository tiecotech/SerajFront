"use client";

import {
  ArrowLeft, Award, Building2, CalendarClock, Clock, Gem, Lamp, LampCeiling, LampWallDown, Lightbulb, Mail, MapPin,
  MessageCircle, Package, Phone, PlugZap, Ruler, ShieldCheck, Sparkles, Spotlight, TreePine, Truck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SerajLogo } from "@/components/brand/SerajLogo";
import { ContactForm } from "@/components/site/ContactForm";
import { mediaSrcSet } from "@/lib/media";
import { play } from "../_lib/sound";
import { keyboardFocus, useShowcase, useTouch } from "../_lib/touch";
import { Chandelier, chandelierTips, DeskLamp, TrackSpot, WallSwitchArt } from "./art";
import { CLOSE_SFX, LABELS, ORDER, stepHandler, type PanelProps, type SectionKey } from "../_lib/sections";

const vi = (i: number) => ({ "--i": i }) as CSSProperties;
type Icon = typeof Lamp;

function Shell({ k, label, closing, children }: { k: SectionKey; label: string; closing: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  const i = ORDER.indexOf(k);
  const next = i < ORDER.length - 1 ? LABELS[ORDER[i + 1]] : null;
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-lenis-prevent className={`v3-panel v3-p-${k}${closing ? " is-closing" : ""}`}>
      <div className="v3-panel-logo"><SerajLogo id={`v3-${k}-logo`} className="h-9 md:h-11" /></div>
      {children}
      {/* one scroll moves on: say where to */}
      <div className="v3-nexthint" aria-hidden>
        <span>{next ? "التالي" : "النهاية"}</span>
        <b>{next ?? "شكراً لزيارتك"}</b>
        <i className="v3-nexthint-drip" />
      </div>
    </div>
  );
}

/** Every return control: plays its own sound, then closes (the visuals follow `.is-closing`). */
function useCloser(k: SectionKey, onClose: () => void, closing: boolean) {
  return () => {
    if (closing) return;
    play(CLOSE_SFX[k]);
    onClose();
  };
}

function Eyebrow({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <p className="v3-eyebrow">
      {n != null && <b dir="ltr">{String(n).padStart(2, "0")}</b>}
      <span />
      {children}
    </p>
  );
}

/** Headline that rises word by word out of a mask (screen readers get the plain text). */
function Words({ text, delay = 1.15 }: { text: string; delay?: number }) {
  return (
    <span className="v3-words" aria-label={text}>
      {text.split(/\s+/).filter(Boolean).map((w, i) => (
        <span key={i} className="v3-word" aria-hidden>
          <span style={{ animationDelay: `${delay + i * 0.07}s` }}>{w}</span>
        </span>
      ))}
    </span>
  );
}

/* ================================ المنتجات ================================ */

/** An icon that says what kind of product a category holds, without naming it. */
function categoryIcon(name: string): Icon {
  if (/تري|ثري|نجف/.test(name)) return LampCeiling;
  if (/سبوت|spot/i.test(name)) return Spotlight;
  if (/خارج|حديق/.test(name)) return TreePine;
  if (/بريز|مفتاح|مفاتيح|كهرب/.test(name)) return PlugZap;
  if (/لمب|إكسسوار|اكسسوار/.test(name)) return Lightbulb;
  if (/إنارة|انارة|إضاءة|اضاءة/.test(name)) return LampWallDown;
  return Sparkles;
}

export function ProductsPanel({ content, closing, onClose, onSwitch }: PanelProps) {
  const back = useCloser("products", onClose, closing);
  const c = content.products;
  const [active, setActive] = useState<number | null>(null);
  const [aim, setAim] = useState({ a: 32, d: 520 });
  const pivot = useRef<HTMLSpanElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);

  // turn the spotlight toward the chosen circle (or the middle of the field while nothing is chosen)
  const aimAt = useCallback(() => {
    const p = pivot.current?.getBoundingClientRect();
    const el = active !== null ? dots.current[active] : field.current;
    const r = el?.getBoundingClientRect();
    if (!p || !r) return;
    const px = p.left + p.width / 2, py = p.top + p.height / 2;
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    setAim({ a: (Math.atan2(ty - py, tx - px) * 180) / Math.PI, d: Math.hypot(tx - px, ty - py) });
  }, [active]);
  useEffect(() => {
    aimAt();
    const t = window.setTimeout(aimAt, 1700); // after the circles have landed
    window.addEventListener("resize", aimAt);
    return () => { window.clearTimeout(t); window.removeEventListener("resize", aimAt); };
  }, [aimAt]);

  const pick = (i: number) => { if (i !== active) { setActive(i); play("hover"); } };
  // phones: the spotlight tours the circles by itself until the visitor taps one
  const touch = useTouch();
  const stopTour = useShowcase(touch, c.items.length, setActive, 2000, 3200);
  const it = active !== null ? c.items[active] : null;

  return (
    <Shell k="products" label="المنتجات" closing={closing}>
      {/* ceiling spotlight, top-left: its head (and beam) swings to whatever the cursor points at */}
      <div className={`v3-cspot${active !== null ? " is-aimed" : ""}`} style={{ "--a": `${aim.a}deg`, "--d": `${aim.d}px` } as CSSProperties} aria-hidden>
        <svg className="v3-cspot-mount" viewBox="0 0 60 96">
          <rect className="ln d" pathLength={1} x="4" y="0" width="52" height="10" rx="2" />
          <path className="ln d" pathLength={1} d="M30 10 V78" />
          <path className="ln thin d" pathLength={1} d="M22 70 H38 L36 80 H24 Z" />
        </svg>
        <span ref={pivot} className="v3-cspot-pivot">
          <span className="v3-cspot-arm">
            <span className="v3-cspot-beam" />
            <svg className="v3-cspot-head" viewBox="0 0 110 60">
              <circle className="ln d" pathLength={1} cx="14" cy="30" r="9" />
              <rect className="ln d" pathLength={1} x="26" y="12" width="70" height="36" rx="8" />
              <path className="ln thin d" pathLength={1} d="M40 12 V48 M52 12 V48 M64 12 V48" />
              <ellipse className="ln d" pathLength={1} cx="96" cy="30" rx="7" ry="18" />
              <ellipse className="v3-lens" cx="96" cy="30" rx="4.5" ry="15" />
            </svg>
          </span>
        </span>
      </div>

      <header className="v3-pr-head v3-rise" style={vi(0)}>
        <Eyebrow n={1}>المنتجات</Eyebrow>
        <h2 className="v3-h2"><Words text={c.title} /></h2>
      </header>

      <div ref={field} className="v3-pr-field" onMouseLeave={() => undefined}>
        {c.items.map((p, i) => {
          const Ico = categoryIcon(p.name);
          return (
            <button
              key={p.slug}
              ref={(el) => { dots.current[i] = el; }}
              type="button"
              className={`v3-pr-dot${active === i ? " is-lit" : ""}`}
              style={vi(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && pick(i)}
              onFocus={(e) => keyboardFocus(e) && pick(i)}
              onClick={() => { stopTour(); pick(i); }}
              aria-label={p.name}
              aria-pressed={active === i}
            >
              <span className="v3-pr-disc">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image.md} srcSet={mediaSrcSet(p.image)} sizes="180px" alt="" loading="lazy" decoding="async" />
                )}
                <Ico className="v3-pr-ico" strokeWidth={1.1} />
              </span>
              <span className="v3-pr-name">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* the lit area under the lamp: details of whatever is in the light */}
      <div className="v3-pr-detail" aria-live="polite">
        {it ? (
          <div key={active} className="v3-pr-card">
            <span className="v3-num" dir="ltr">{String((active ?? 0) + 1).padStart(2, "0")} / {String(c.items.length).padStart(2, "0")}</span>
            <h3>{it.name}</h3>
            {it.description && <p>{it.description}</p>}
            <div className="v3-actions">
              <button type="button" className="v3-btn" onClick={() => onSwitch("contact")}>اطلب عرض سعر</button>
              <Link href="/login" className="v3-btn-ghost">الكتالوج الكامل <ArrowLeft className="h-4 w-4" /></Link>
            </div>
          </div>
        ) : (
          <div className="v3-pr-card is-hint">
            <p>{touch ? "المس أي دائرة ليتّجه إليها الضوء ويكشف تفاصيلها" : "مرّر المؤشر على أي دائرة ليتّجه إليها الضوء ويكشف تفاصيلها"}</p>
          </div>
        )}
      </div>

      <button type="button" className="v3-ctrl v3-rocker-btn v3-pr-switch" onClick={back} aria-label="إطفاء والعودة للرئيسية">
        <WallSwitchArt />
        <span className="v3-ctrl-label">إطفاء</span>
      </button>
    </Shell>
  );
}

/* ================================ البراندات ================================ */

/** A cut crystal drop: facets in ink hairlines over a cool white body. viewBox 100 x 140. */
const GEM = "M50 2 L94 36 L94 98 L50 138 L6 98 L6 36 Z";
function CrystalFront({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 100 140" className="v3-gem-svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#eef2f6" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e3e9ef" />
          <stop offset="100%" stopColor="#fbfcfd" />
        </linearGradient>
      </defs>
      <path d={GEM} fill={`url(#${id}-g)`} />
      <path className="v3-gem-facets" d="M6 36 H94 M50 2 L30 36 L50 70 L70 36 Z M6 98 L50 70 L94 98 M30 36 L6 98 M70 36 L94 98 M50 70 L50 138" />
      <path className="v3-gem-edge" d={GEM} />
      <path className="v3-gem-shine" d="M22 44 L34 44 L24 80 Z" />
    </svg>
  );
}

export function BrandsPanel({ content, closing, onClose }: PanelProps) {
  const back = useCloser("brands", onClose, closing);
  const c = content.brands;
  const tips = chandelierTips(c.items.length);
  const [lit, setLit] = useState<number | null>(null);
  useEffect(() => { const t = window.setTimeout(() => play("chime"), 1500); return () => window.clearTimeout(t); }, []);
  const on = (i: number) => { setLit(i); play("chime"); };
  // phones: the crystals turn one after another to show their brands; a tap lights one, a second tap opens it
  const touch = useTouch();
  const stopTour = useShowcase(touch, c.items.length, setLit, 2600, 2200);
  return (
    <Shell k="brands" label="البراندات" closing={closing}>
      <div className="v3-chand">
        <div className="v3-chand-swing">
          <Chandelier n={c.items.length} lit={lit} />
          {c.items.map((b, i) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className={`v3-crystal${lit === i ? " is-lit" : ""}`}
              style={{ left: `${tips[i].x / 10}%`, top: `${((tips[i].y + 74) / 640) * 100}%`, ...vi(i) }}
              onPointerEnter={(e) => e.pointerType === "mouse" && on(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setLit(null)}
              onFocus={(e) => keyboardFocus(e) && setLit(i)}
              onBlur={() => !touch && setLit(null)}
              onClick={(e) => { if (touch && lit !== i) { e.preventDefault(); stopTour(); on(i); } }}
              aria-label={b.name}
            >
              <span className="v3-crystal-sway">
                <span className="v3-crystal-glow" aria-hidden />
                <span className="v3-crystal-gem">
                  <span className="v3-crystal-face is-front"><CrystalFront id={`gem-${b.id}`} /></span>
                  <span className="v3-crystal-face is-back">
                    <svg viewBox="0 0 100 140" className="v3-gem-svg" aria-hidden focusable="false"><path className="v3-gem-edge is-lit" d={GEM} /></svg>
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo.md} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <b>{b.name}</b>
                    )}
                  </span>
                </span>
              </span>
              <span className="v3-crystal-name">{b.name}</span>
            </Link>
          ))}
          <button type="button" className="v3-ctrl v3-chain" style={{ left: "50%", top: `${(536 / 640) * 100}%` }} onClick={back} aria-label="اسحب السلسلة للعودة للرئيسية">
            <span className="v3-chain-bead" />
            <span className="v3-ctrl-label">اسحب للرجوع</span>
          </button>
        </div>
      </div>
      <div className="v3-brands-copy v3-rise" style={vi(8)}>
        <Eyebrow n={2}>البراندات</Eyebrow>
        <h2 className="v3-h2"><Words text={c.title} delay={1.9} /></h2>
        <p className="v3-note">{touch ? "المس أي كريستالة لتدور وتكشف البراند، والمسها مجدداً لفتحه" : "مرّر المؤشر على أي كريستالة لتدور وتكشف البراند"}</p>
      </div>
    </Shell>
  );
}

/* ================================ المشاريع ================================ */
export function ProjectsPanel({ content, closing, onClose }: PanelProps) {
  const back = useCloser("projects", onClose, closing);
  const c = content.projects;
  const n = c.items.length;
  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  const light = useCallback((i: number | null) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActive(i);
    if (i !== null) play("node");
  }, []);
  // phones: the arches switch on one by one (silently) until the visitor taps or swipes
  const touch = useTouch();
  const quiet = useCallback((i: number) => { activeRef.current = i; setActive(i); }, []);
  const stopTour = useShowcase(touch, n, quiet, 2200, 2800);

  // scrolling switches the projects on one by one before the tour moves on
  useEffect(() => {
    stepHandler.current = (dir) => {
      stopTour();
      const a = activeRef.current;
      if (dir > 0) {
        if (a === null) { light(0); return true; }
        if (a < n - 1) { light(a + 1); return true; }
        return false;
      }
      if (a !== null && a > 0) { light(a - 1); return true; }
      return false;
    };
    return () => { stepHandler.current = null; };
  }, [n, light, stopTour]);

  return (
    <Shell k="projects" label="المشاريع" closing={closing}>
      <header className="v3-pj-head v3-rise" style={vi(0)}>
        <Eyebrow n={3}>المشاريع</Eyebrow>
        <h2 className="v3-h2"><Words text={c.title} /></h2>
      </header>
      <div className="v3-arches" style={{ "--n": n } as CSSProperties}>
        <span className="v3-rail" aria-hidden />
        {c.items.map((p, i) => (
          <Link
            key={p.id}
            href={`/projects/${p.slug}`}
            className={`v3-arch${active === i ? " is-lit" : ""}`}
            style={vi(i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && light(i)}
            onFocus={(e) => keyboardFocus(e) && light(i)}
            onClick={(e) => { if (touch && active !== i) { e.preventDefault(); stopTour(); light(i); } }}
          >
            <span className="v3-arch-spot" aria-hidden><TrackSpot /></span>
            <span className="v3-arch-cone" aria-hidden />
            <span className="v3-arch-frame">
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover.md} srcSet={mediaSrcSet(p.cover)} sizes="(min-width: 1024px) 34vw, 70vw" alt={p.title} loading="lazy" decoding="async" />
              )}
              <span className="v3-arch-num" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
              <span className="v3-arch-info">
                <small>{[p.project_type, p.year].filter(Boolean).join(" · ")}</small>
                <b>{p.title}</b>
                {p.location && <span><MapPin className="h-3.5 w-3.5" /> {p.location}</span>}
                <em>عرض المشروع <ArrowLeft className="h-3.5 w-3.5" /></em>
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p className="v3-pj-hint v3-rise" style={vi(6)}>
        {active === null ? (touch ? "المس أي مشروع ليُضاء، والمسه مجدداً لفتحه" : "مرّر المؤشر على أي مشروع — أو انزل لتُضاء المشاريع واحداً تلو الآخر") : <Link href="/projects" className="v3-btn-ghost">كل المشاريع <ArrowLeft className="h-4 w-4" /></Link>}
      </p>
      <button type="button" className="v3-ctrl v3-dimmer" onClick={back} aria-label="أدر المفتاح لإطفاء الإضاءة والعودة">
        <span className="v3-dimmer-ring" aria-hidden>
          {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ transform: `rotate(${-135 + i * 27}deg) translateY(-38px)` }} />)}
        </span>
        <span className="v3-dimmer-knob" aria-hidden><span /></span>
        <span className="v3-ctrl-label">أدر للإطفاء</span>
      </button>
    </Shell>
  );
}

/* ================================ من نحن ================================ */

function statIcon(label: string): Icon {
  if (/عام|سن|خبر/.test(label)) return CalendarClock;
  if (/مشروع|مشاريع/.test(label)) return Building2;
  if (/براند|علام/.test(label)) return Gem;
  if (/منتج/.test(label)) return Package;
  return Award;
}
const WHY_ICONS: Record<string, Icon> = { gem: Gem, ruler: Ruler, shield: ShieldCheck, truck: Truck };

/** "+1200" counts up from 0 once it is on screen (prefix/suffix kept). */
function CountUp({ value, delay }: { value: string; delay: number }) {
  const m = value.match(/^(\D*)([\d.,]+)(.*)$/);
  const target = m ? Number(m[2].replace(/,/g, "")) : NaN;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) return;
    let raf = 0;
    const t0 = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / 1500));
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  if (!m || !Number.isFinite(target)) return <>{value}</>;
  return <>{m[1]}{n.toLocaleString("en-US")}{m[3]}</>;
}

export function AboutPanel({ content, closing, onClose }: PanelProps) {
  const back = useCloser("about", onClose, closing);
  const c = content.about;
  const why = (c.why.length ? c.why : c.highlights).slice(0, 4) as { title: string; text?: string; icon?: string }[];
  return (
    <Shell k="about" label="من نحن" closing={closing}>
      <div className="v3-about-art"><DeskLamp /></div>
      <span className="v3-ab-pool" aria-hidden />
      <div className="v3-ab">
        <div className="v3-ab-intro">
          <div className="v3-type" style={vi(0)}><Eyebrow n={4}>من نحن</Eyebrow></div>
          <h2 className="v3-h2"><Words text={c.title} delay={1.7} /></h2>
          {c.paragraphs.slice(0, 2).map((p, i) => <p key={i} className={`v3-ab-p v3-type${i ? " is-small" : ""}`} style={vi(i + 2)}>{p}</p>)}
        </div>

        {/* the numbers hang from one wire like a row of pendant lights that switch on in turn */}
        {c.stats.length > 0 && (
          <div className="v3-ab-wire">
            <span className="v3-ab-cable" aria-hidden />
            {c.stats.slice(0, 4).map((s, i) => {
              const Ico = statIcon(s.label);
              return (
                <div key={i} className="v3-ab-stat" style={vi(i)}>
                  <span className="v3-ab-drop" aria-hidden />
                  <span className="v3-ab-bulb"><Ico strokeWidth={1.2} /></span>
                  <b dir="ltr"><CountUp value={s.value} delay={2.1 + i * 0.25} /></b>
                  <small>{s.label}</small>
                </div>
              );
            })}
          </div>
        )}

        {why.length > 0 && (
          <ul className="v3-ab-why">
            {why.map((h, i) => {
              const Ico = (h.icon && WHY_ICONS[h.icon]) || Sparkles;
              return (
                <li key={i} className="v3-type" style={vi(i + 5)}>
                  <Ico strokeWidth={1.3} />
                  <div><b>{h.title}</b>{h.text && <span>{h.text}</span>}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button type="button" className="v3-ctrl v3-cordsw" onClick={back} aria-label="أطفئ الأباجورة وعُد للرئيسية">
        <span className="v3-cordsw-cord" aria-hidden />
        <span className="v3-cordsw-body"><span className="v3-cordsw-slide" /></span>
        <span className="v3-ctrl-label">إطفاء</span>
      </button>
    </Shell>
  );
}

/* ================================ تواصل معنا ================================ */
export function ContactPanel({ content, closing, onClose }: PanelProps) {
  const back = useCloser("contact", onClose, closing);
  const co = content.company;
  return (
    <Shell k="contact" label="تواصل معنا" closing={closing}>
      <button type="button" className="v3-ctrl v3-push" onClick={back} aria-label="اضغط الزر للعودة">
        <span className="v3-push-cap" aria-hidden />
        <span className="v3-ctrl-label">رجوع</span>
      </button>
      <div className="v3-contact">
        <div className="v3-contact-info v3-rise" style={vi(2)}>
          <Eyebrow n={5}>تواصل معنا</Eyebrow>
          <h2 className="v3-h2"><Words text={content.contact.title} delay={1.2} /></h2>
          {content.contact.text && <p className="v3-lead">{content.contact.text}</p>}
          <ul className="v3-info">
            {co.phone && <li><Phone /><a href={`tel:${co.phone.replace(/\s/g, "")}`} dir="ltr">{co.phone}</a></li>}
            {co.email && <li><Mail /><a href={`mailto:${co.email}`}>{co.email}</a></li>}
            {co.whatsapp && <li><MessageCircle /><a href={`https://wa.me/${co.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer">واتساب</a></li>}
            {co.address && <li><MapPin /><span>{co.address}</span></li>}
            {co.working_hours && <li><Clock /><span>{co.working_hours}</span></li>}
          </ul>
        </div>
        <div className="v3-form-frame v3-rise" style={vi(4)}>
          <ContactForm whatsapp={co.whatsapp} />
        </div>
      </div>
    </Shell>
  );
}
