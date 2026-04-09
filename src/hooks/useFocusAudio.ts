import { useEffect, useRef } from "react";

export type SoundMode = "off" | "brown" | "rain" | "binaural";

function buildBrownNoise(ctx: AudioContext, vol: number): () => void {
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last   = 0;
  for (let i = 0; i < data.length; i++) {
    const w  = Math.random() * 2 - 1;
    data[i]  = (last + 0.02 * w) / 1.02;
    last     = data[i];
    data[i] *= 3.5;
  }
  const src  = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;
  const gain  = ctx.createGain();
  gain.gain.value = vol;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  return () => { try { src.stop(); } catch (_) {} };
}

function buildRain(ctx: AudioContext, vol: number): () => void {
  const buf  = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src    = ctx.createBufferSource();
  src.buffer   = buf;
  src.loop     = true;
  const filter = ctx.createBiquadFilter();
  filter.type            = "lowpass";
  filter.frequency.value = 750;
  const gain             = ctx.createGain();
  gain.gain.value        = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  return () => { try { src.stop(); } catch (_) {} };
}

// 40 Hz binaural beat (gamma band) — L: 200 Hz, R: 240 Hz
function buildBinaural(ctx: AudioContext, vol: number): () => void {
  const merger = ctx.createChannelMerger(2);
  const gain   = ctx.createGain();
  gain.gain.value = vol;

  const L = ctx.createOscillator();
  L.frequency.value = 200;
  L.type = "sine";

  const R = ctx.createOscillator();
  R.frequency.value = 240;
  R.type = "sine";

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value     = 6;

  L.connect(merger, 0, 0);
  R.connect(merger, 0, 1);
  merger.connect(comp);
  comp.connect(gain);
  gain.connect(ctx.destination);

  L.start();
  R.start();

  return () => { try { L.stop(); R.stop(); } catch (_) {} };
}

export function useFocusAudio(mode: SoundMode): void {
  const stopRef = useRef<(() => void) | null>(null);
  const ctxRef  = useRef<AudioContext | null>(null);

  useEffect(() => {
    stopRef.current?.();
    stopRef.current = null;

    if (mode === "off") {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      return;
    }

    let ctx: AudioContext;
    try {
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    } catch {
      return;
    }
    ctxRef.current = ctx;

    ctx.resume().then(() => {
      if (!ctxRef.current) return;
      if (mode === "brown")    stopRef.current = buildBrownNoise(ctx, 0.14);
      if (mode === "rain")     stopRef.current = buildRain(ctx,       0.20);
      if (mode === "binaural") stopRef.current = buildBinaural(ctx,   0.07);
    }).catch(() => {});

    return () => {
      stopRef.current?.();
      stopRef.current = null;
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [mode]);
}
