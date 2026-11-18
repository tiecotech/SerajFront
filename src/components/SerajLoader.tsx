import { SerajMarkSvg } from "@/components/brand/SerajLogo";

/**
 * Branded loader — a lamp switching on: a thread of light traces the hollow AlSeraj hexagon,
 * each of its six triangles switches on like a bulb (with a short flicker), a warm glow
 * swells and light rays open behind it. Pure CSS (works before JS loads), so it can be
 * server-rendered as the first-paint splash. With `once` it plays once and stays lit.
 */
export function SerajMark({ size = 96, once = false, tone = "light", id }: { size?: number; once?: boolean; tone?: "light" | "dark"; id?: string }) {
  // Every instance needs its own gradient id: a url(#id) that resolves to a copy inside a hidden
  // element (e.g. the dismissed splash) paints nothing.
  const gid = id ?? `sm-${once ? "o" : "l"}-${tone}-${size}`;
  return (
    <span className={once ? "seraj-mark is-once" : "seraj-mark"} style={{ width: size, height: Math.round(size * 0.931) }} aria-hidden>
      <span className="seraj-rays" />
      <span className="seraj-halo" />
      <SerajMarkSvg id={gid} tone={tone} />
    </span>
  );
}

/** Compact in-page loader (route transitions, panels). */
export function SerajLoader({ label = "جارِ تحميل السراج المضيء لأنظمة الإضاءة…", size = 72, className = "" }: { label?: string; size?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex min-h-[50vh] flex-col items-center justify-center gap-6 ${className}`}>
      <SerajMark size={size} />
      <span className="seraj-track" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * First-visit splash. Shown once per browser session and removed as soon as the
 * page has loaded (min ~1.75s so the trace and switch-on read, max 2.3s so it never blocks).
 * Hidden via an attribute on <html> — React never touches it, so no hydration issues.
 */
const SPLASH_SCRIPT = `(function(){var d=document.documentElement,k='seraj-splash';try{if(sessionStorage.getItem(k)){d.setAttribute('data-splash','off');return}sessionStorage.setItem(k,'1')}catch(e){}var t0=Date.now(),done=false;function end(){if(done)return;done=true;setTimeout(function(){d.setAttribute('data-splash','out');setTimeout(function(){d.setAttribute('data-splash','off')},750)},Math.max(0,2000-(Date.now()-t0)))}if(document.readyState==='complete')end();else{window.addEventListener('load',end);setTimeout(end,2600)}})();`;

export function SerajSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      <div id="seraj-splash" aria-hidden>
        <div className="seraj-splash-inner">
          <SerajMark size={112} once id="sm-splash" />
          <span className="seraj-wordmark" />
          <span className="seraj-tagline">أنظمة الإضاءة · LIGHTING SYSTEMS</span>
        </div>
      </div>
    </>
  );
}
