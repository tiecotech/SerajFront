/**
 * Branded loader: the six triangles of the AlSeraj hexagon light up one after
 * another like fixtures being switched on, while a warm halo breathes behind
 * them and a beam of light sweeps across the mark. Pure CSS (works before JS
 * loads), so it can be server-rendered as the first-paint splash.
 */
const WEDGES = 6;

export function SerajMark({ size = 96 }: { size?: number }) {
  return (
    <span className="seraj-mark" style={{ width: size, height: Math.round(size * 0.931) }} aria-hidden>
      <span className="seraj-halo" />
      <span className="seraj-unlit" />
      {Array.from({ length: WEDGES }).map((_, i) => (
        <span key={i} className={`seraj-wedge seraj-wedge-${i}`} />
      ))}
      <span className="seraj-beam" />
    </span>
  );
}

/** Compact in-page loader (route transitions, panels). */
export function SerajLoader({ label = "جارِ التحميل…", size = 72, className = "" }: { label?: string; size?: number; className?: string }) {
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
 * page has loaded (min ~0.7s so the light-up reads, max 3s so it never blocks).
 * Hidden via an attribute on <html> — React never touches it, so no hydration issues.
 */
const SPLASH_SCRIPT = `(function(){var d=document.documentElement,k='seraj-splash';try{if(sessionStorage.getItem(k)){d.setAttribute('data-splash','off');return}sessionStorage.setItem(k,'1')}catch(e){}var t0=Date.now(),done=false;function end(){if(done)return;done=true;setTimeout(function(){d.setAttribute('data-splash','out');setTimeout(function(){d.setAttribute('data-splash','off')},650)},Math.max(0,700-(Date.now()-t0)))}if(document.readyState==='complete')end();else{window.addEventListener('load',end);setTimeout(end,3000)}})();`;

export function SerajSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      <div id="seraj-splash" aria-hidden>
        <div className="seraj-splash-inner">
          <SerajMark size={112} />
          <span className="seraj-wordmark" />
          <span className="seraj-track" />
        </div>
      </div>
    </>
  );
}
