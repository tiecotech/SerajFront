/**
 * Tiny synthesized sound kit (Web Audio, no files): switch clicks, filament ignition,
 * crystal chime, pull chain, dimmer ticks. Always on. Browsers only let audio start
 * after the visitor's first click / tap / key press, so the context unlocks then.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const GESTURES = ["pointerdown", "keydown", "touchend", "click"] as const;

/** Arms the audio: it starts on the visitor's first gesture (a browser rule). Returns a cleanup. */
export function initSound() {
  const unlock = () => {
    const c = ensure();
    if (c && c.state === "running") GESTURES.forEach((g) => window.removeEventListener(g, unlock));
  };
  GESTURES.forEach((g) => window.addEventListener(g, unlock, { passive: true }));
  return () => GESTURES.forEach((g) => window.removeEventListener(g, unlock));
}

function noiseBuffer(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  return b;
}

/** A short filtered noise burst: the "tick" of plastic and metal. */
function tick(c: AudioContext, t: number, freq: number, gain: number, dur = 0.018) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 3;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t);
}

function tone(c: AudioContext, t: number, freq: number, gain: number, dur: number, type: OscillatorType = "sine", attack = 0.004) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export type Sfx = "click" | "press" | "ignite" | "chime" | "chain" | "dimmer" | "hover" | "node" | "draw";

export function play(name: Sfx) {
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime + 0.01;
  switch (name) {
    case "click": // wall rocker: two-part mechanical snap
      tick(c, t, 3200, 0.5);
      tick(c, t + 0.028, 1800, 0.35, 0.03);
      tone(c, t, 140, 0.12, 0.06, "triangle");
      break;
    case "press": // push button: softer, lower
      tick(c, t, 1400, 0.35, 0.025);
      tone(c, t, 220, 0.1, 0.08, "triangle");
      tick(c, t + 0.09, 2200, 0.2);
      break;
    case "ignite": { // filament "tink" + a short electric hum that flickers
      tone(c, t, 2600, 0.08, 0.25);
      tone(c, t + 0.08, 3900, 0.04, 0.3);
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 100;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      [0.05, 0.01, 0.06, 0.02, 0.05].forEach((v, i) => g.gain.linearRampToValueAtTime(v, t + 0.06 + i * 0.07));
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(lp).connect(g).connect(master);
      o.start(t);
      o.stop(t + 1.2);
      // warm swell under it
      tone(c, t + 0.2, 196, 0.05, 1.4, "sine", 0.5);
      tone(c, t + 0.2, 294, 0.03, 1.4, "sine", 0.5);
      break;
    }
    case "chime": // crystal drops of a chandelier
      [2093, 2637, 3136, 2349, 2794, 3520].forEach((f, i) => {
        const at = t + i * 0.09 + Math.random() * 0.04;
        tone(c, at, f, 0.05, 1.6);
        tone(c, at, f * 2.01, 0.015, 0.9);
      });
      break;
    case "chain":
      [0, 0.05, 0.1, 0.17].forEach((d, i) => tick(c, t + d, 4200 - i * 300, 0.28, 0.012));
      tick(c, t + 0.32, 2600, 0.4, 0.03);
      break;
    case "dimmer":
      for (let i = 0; i < 8; i++) tick(c, t + i * 0.045, 2800, 0.22 - i * 0.02, 0.01);
      tick(c, t + 0.42, 1600, 0.4, 0.03);
      break;
    case "hover":
      tick(c, t, 5200, 0.06, 0.008);
      break;
    case "node":
      tone(c, t, 1760 + Math.random() * 400, 0.025, 0.4);
      break;
    case "draw": // a soft breath of light
      tone(c, t, 523, 0.02, 1.2, "sine", 0.4);
      tone(c, t, 784, 0.015, 1.2, "sine", 0.4);
      break;
  }
}
