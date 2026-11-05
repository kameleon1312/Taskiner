/**
 * Notification tones. Synthesised with Web Audio (no network, works offline,
 * tiny), plus the bundled wav files. The AudioContext is unlocked on the first
 * user gesture so tones can also play later while the app is in the background.
 */
import type { SoundId } from "../stores/useUIStore";

export const SOUND_OPTIONS: { id: SoundId; label: string; emoji: string }[] = [
  { id: "chime",   label: "Dzwoneczek", emoji: "🎐" },
  { id: "crystal", label: "Kryształ",   emoji: "💎" },
  { id: "bell",    label: "Gong",       emoji: "🔔" },
  { id: "pulse",   label: "Puls",       emoji: "📳" },
  { id: "soft",    label: "Szept",      emoji: "🌙" },
  { id: "classic", label: "Klasyczny",  emoji: "⏰" },
];

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx || ctx.state === "closed") {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Call once; resumes audio on the first interaction (autoplay policy). */
export function installAudioUnlock(): void {
  const unlock = () => {
    const c = getCtx();
    c?.resume().catch(() => {});
    // Play an inaudible blip so iOS considers the context "used"
    if (c) {
      const g = c.createGain();
      g.gain.value = 0;
      const o = c.createOscillator();
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.01);
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });
}

interface Note { f: number; t: number; d: number; type?: OscillatorType; g?: number }

const PATTERNS: Record<Exclude<SoundId, "classic">, Note[]> = {
  // Rising major triad with a soft tail
  chime:   [{ f: 784, t: 0, d: 0.9 }, { f: 988, t: 0.12, d: 0.9 }, { f: 1319, t: 0.24, d: 1.3 }],
  // Glassy high partials
  crystal: [
    { f: 1568, t: 0, d: 1.4, g: 0.5 }, { f: 2349, t: 0, d: 0.9, g: 0.25 },
    { f: 2093, t: 0.18, d: 1.4, g: 0.45 }, { f: 3136, t: 0.18, d: 0.7, g: 0.2 },
  ],
  // Deep bell with inharmonic overtone
  bell:    [{ f: 440, t: 0, d: 2.2 }, { f: 1108, t: 0, d: 1.2, g: 0.35 }, { f: 660, t: 0.02, d: 1.6, g: 0.4 }],
  // Three urgent taps
  pulse:   [
    { f: 880, t: 0, d: 0.14, type: "square", g: 0.25 },
    { f: 880, t: 0.2, d: 0.14, type: "square", g: 0.25 },
    { f: 1175, t: 0.4, d: 0.3, type: "square", g: 0.25 },
  ],
  soft:    [{ f: 523, t: 0, d: 1.2, g: 0.6 }, { f: 659, t: 0.25, d: 1.4, g: 0.5 }],
};

let classicEl: HTMLAudioElement | null = null;

export async function playTone(id: SoundId, volume = 0.6): Promise<void> {
  const vol = Math.max(0, Math.min(1, volume));
  if (vol === 0) return;

  if (id === "classic") {
    try {
      classicEl ??= new Audio("/sounds/deadline.wav");
      classicEl.volume = vol;
      classicEl.currentTime = 0;
      await classicEl.play();
    } catch { /* autoplay blocked */ }
    return;
  }

  const c = getCtx();
  if (!c) return;
  try { if (c.state === "suspended") await c.resume(); } catch { /* ignore */ }

  const master = c.createGain();
  master.gain.value = vol * 0.5;
  // Gentle low-pass keeps the tones warm rather than piercing
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5200;
  master.connect(lp);
  lp.connect(c.destination);

  const now = c.currentTime + 0.02;
  for (const n of PATTERNS[id]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = n.type ?? "sine";
    o.frequency.value = n.f;
    const peak = n.g ?? 0.7;
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(peak, now + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    o.connect(g);
    g.connect(master);
    o.start(now + n.t);
    o.stop(now + n.t + n.d + 0.05);
  }
}

let completeEl: HTMLAudioElement | null = null;
export function playCompleteSound(volume = 0.4) {
  try {
    completeEl ??= new Audio("/sounds/complete.wav");
    completeEl.volume = volume;
    completeEl.currentTime = 0;
    completeEl.play().catch(() => {});
  } catch { /* ignore */ }
}
