/** Fully synthesized sound effects via Web Audio API — no asset files. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function initAudio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.5, ctx.now?.() ?? ctx.currentTime, 0.05);
}

export function isMuted() {
  return muted;
}

function env(node: AudioNode, attack: number, decay: number, peak = 1) {
  const c = ctx!;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  node.connect(g);
  g.connect(master!);
  return { gain: g, stopAt: t + attack + decay };
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", peak = 0.4, slideTo?: number) {
  const c = initAudio();
  if (!c || muted) return;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  const { stopAt } = env(osc, 0.01, dur, peak);
  osc.start();
  osc.stop(stopAt + 0.05);
}

function noise(dur: number, filterFreq: number, peak = 0.3) {
  const c = initAudio();
  if (!c || muted) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = filterFreq;
  src.connect(filt);
  const { stopAt } = env(filt, 0.005, dur, peak);
  src.start();
  src.stop(stopAt + 0.05);
}

export const sfx = {
  sting() {
    tone(220, 0.6, "sawtooth", 0.25, 90);
    noise(0.25, 1200, 0.18);
  },
  pop(i = 0) {
    tone(420 + i * 60, 0.18, "triangle", 0.28);
  },
  slam() {
    noise(0.18, 700, 0.4);
    tone(120, 0.3, "square", 0.22, 60);
  },
  eliminate() {
    tone(300, 0.25, "sawtooth", 0.2, 110);
  },
  tick(accent = false) {
    tone(accent ? 1200 : 800, accent ? 0.12 : 0.06, "square", accent ? 0.3 : 0.15);
  },
  whoosh() {
    noise(0.4, 2400, 0.2);
  },
  drumroll(seconds = 1.6) {
    const c = initAudio();
    if (!c || muted) return;
    const steps = Math.floor(seconds / 0.045);
    for (let i = 0; i < steps; i++) {
      window.setTimeout(() => noise(0.05, 400, 0.16), i * 45);
    }
  },
  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => window.setTimeout(() => tone(f, 0.5, "triangle", 0.3), i * 130));
  },
};

let sirenNodes: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;

export function startSiren() {
  const c = initAudio();
  if (!c || sirenNodes || muted) return;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 420;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.35;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 130;
  lfo.connect(lfoGain).connect(osc.frequency);
  const gain = c.createGain();
  gain.gain.value = 0.06;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 900;
  osc.connect(filt).connect(gain).connect(master!);
  osc.start();
  lfo.start();
  sirenNodes = { osc, lfo, gain };
}

export function stopSiren() {
  if (!sirenNodes || !ctx) return;
  const { osc, lfo, gain } = sirenNodes;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  window.setTimeout(() => {
    try {
      osc.stop();
      lfo.stop();
    } catch {
      /* already stopped */
    }
  }, 300);
  sirenNodes = null;
}
