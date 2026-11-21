// Chiptune music and sound effects, synthesised with the Web Audio API (no sound files).
// Browsers only allow sound after the player interacts, so main.js calls unlock() on the first click or key.
import { settings, onSettings } from '../settings.js';

let ctx = null, master, musicBus, sfxBus, noiseBuf;
let base = 'title', override = null, playing = null, timer = 0, nextT = 0, step = 0;

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = n => { const m = /^([A-G]#?)(\d)$/.exec(n); return 440 * Math.pow(2, ((+m[2] + 1) * 12 + NOTE[m[1]] - 69) / 12); };

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    volumes();
  }
  if (ctx.state === 'suspended') ctx.resume();
  refresh();
}

function volumes() {
  if (!ctx) return;
  musicBus.gain.value = settings().music ? 0.55 : 0;
  sfxBus.gain.value = settings().sfx ? 0.8 : 0;
}
onSettings(volumes);

function tone(f, t, d, o = {}) {
  const osc = ctx.createOscillator(), g = ctx.createGain(), v = o.gain ?? 0.1;
  osc.type = o.type || 'square';
  osc.frequency.setValueAtTime(f, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g); g.connect(o.bus || sfxBus);
  osc.start(t); osc.stop(t + d + 0.03);
}

function noise(t, d, o = {}) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = o.filter || 'highpass'; f.frequency.value = o.freq || 1000;
  g.gain.setValueAtTime(o.gain ?? 0.1, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
  src.start(t, Math.random() * 0.5); src.stop(t + d + 0.03);
}

const SFX = {
  select: t => tone(660, t, 0.06, { gain: 0.05 }),
  type: t => noise(t, 0.012, { gain: 0.02, freq: 3500 }),
  paper: t => noise(t, 0.14, { gain: 0.05, filter: 'bandpass', freq: 2500 }),
  stamp: t => { tone(120, t, 0.2, { type: 'sine', gain: 0.35, slide: 45 }); noise(t, 0.09, { gain: 0.14, filter: 'lowpass', freq: 900 }); },
  boom: t => { noise(t, 0.9, { gain: 0.35, filter: 'lowpass', freq: 420 }); tone(70, t, 0.6, { type: 'sine', gain: 0.3, slide: 32 }); },
  good: t => [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.08, 0.16, { gain: 0.045 })),
  bad: t => [392, 349, 294].forEach((f, i) => tone(f, t + i * 0.1, 0.22, { gain: 0.05, type: 'triangle' })),
  place: t => { tone(190, t, 0.09, { type: 'triangle', gain: 0.16, slide: 110 }); noise(t, 0.04, { gain: 0.05, filter: 'lowpass', freq: 1500 }); },
  takeoff: t => { noise(t, 1.5, { gain: 0.1, filter: 'bandpass', freq: 320 }); tone(85, t, 1.5, { type: 'sawtooth', gain: 0.04, slide: 190 }); },
  vote: t => tone(880, t, 0.28, { type: 'triangle', gain: 0.08 }),
  fanfare: t => [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.13, i === 3 ? 0.6 : 0.15, { gain: 0.06 }))
};

export function sfx(name) {
  if (!ctx || ctx.state !== 'running' || !settings().sfx || !SFX[name]) return;
  SFX[name](ctx.currentTime + 0.005);
}

// ---------- music ----------
// Each theme: tempo in beats per minute and tracks of eighth-note tokens.
// A note name plays, "-" holds the previous note, "." is a rest. Drums: k kick, s snare, h hi-hat.
// The melodies use the Phrygian dominant scale on E (E F G# A B C D), the sound of Andalusian music.
const THEMES = {
  title: {
    bpm: 84, lead: 'triangle',
    lead_: 'E4 - - - F4 - G#4 - A4 - - - G#4 - F4 - E4 - F4 - G#4 - B4 - A4 - G#4 - F4 - E4 -',
    bass: 'E2 - - - - - - - D2 - - - - - - - C2 - - - - - - - B1 - - - - - - -',
    drum: 'k . . . . . . . k . . . . . . . k . . . . . . . k . . . k . . .'
  },
  march: {
    bpm: 118, lead: 'square',
    lead_: 'E4 - G#4 A4 B4 - A4 G#4 A4 - F4 G#4 E4 - - . B4 - B4 C5 B4 A4 G#4 A4 G#4 - F4 - E4 - - . ' +
           'E5 - D5 C5 B4 - C5 B4 A4 - G#4 A4 B4 - - . C5 B4 A4 G#4 A4 G#4 F4 G#4 E4 - - - . . . .',
    bass: 'E2 - B1 - E2 - B1 - F2 - C2 - E2 - B1 - E2 - B1 - A1 - E2 - F2 - C2 - E2 - B1 - ' +
          'A1 - E2 - A1 - E2 - F2 - C2 - E2 - B1 - A1 - E2 - F2 - C2 - E2 - B1 - E2 - - -',
    drum: 'k . s . k . s . k . s . k . s . k . s . k . s . k . s . k . s . ' +
          'k . s . k . s . k . s . k . s . k . s . k . s . k . s s s s s s'
  },
  night: {
    bpm: 70, lead: 'triangle',
    lead_: 'E3 G#3 B3 E4 B3 G#3 E3 . F3 A3 C4 F4 C4 A3 F3 . E3 G#3 B3 E4 B3 G#3 E3 . D3 F3 A3 D4 A3 F3 D3 .',
    bass: 'E2 - - - - - - - F2 - - - - - - - E2 - - - - - - - D2 - - - - - - -',
    drum: 'h . . . h . . . h . . . h . . . h . . . h . . . h . . . h . . .'
  },
  council: {
    bpm: 100, lead: 'square',
    lead_: '. . . . E4 . F4 . . . . . E4 . . . . . . . G#4 . F4 . E4 - - - . . . .',
    bass: 'E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 E2 E2 E2 F2 E2 D2 D2 F2 E2',
    drum: 'k . h . k . h . k . h . k . h . k . h . k . h . k . h . k h h h'
  }
};
for (const th of Object.values(THEMES)) {
  th.L = th.lead_.trim().split(/\s+/); th.B = th.bass.trim().split(/\s+/); th.D = th.drum.trim().split(/\s+/);
  th.len = Math.max(th.L.length, th.B.length, th.D.length);
}

const held = (arr, i) => { let n = 1; while (arr[(i + n) % arr.length] === '-' && n < arr.length) n++; return n; };

function playStep(th, i, t, dt) {
  const l = th.L[i % th.L.length], b = th.B[i % th.B.length], d = th.D[i % th.D.length];
  if (l && l !== '-' && l !== '.') tone(freq(l), t, dt * held(th.L, i % th.L.length) * 0.95, { type: th.lead, gain: th.lead === 'square' ? 0.035 : 0.06, bus: musicBus });
  if (b && b !== '-' && b !== '.') tone(freq(b), t, dt * held(th.B, i % th.B.length) * 0.9, { type: 'triangle', gain: 0.09, bus: musicBus });
  if (d === 'k') tone(65, t, 0.15, { type: 'sine', gain: 0.18, slide: 40, bus: musicBus });
  if (d === 's') noise(t, 0.08, { gain: 0.05, freq: 1800, bus: musicBus });
  if (d === 'h') noise(t, 0.03, { gain: 0.015, freq: 6500, bus: musicBus });
}

function schedule() {
  const th = THEMES[playing];
  if (!ctx || !th) return;
  const dt = 60 / th.bpm / 2;
  if (nextT < ctx.currentTime - 0.2) nextT = ctx.currentTime + 0.05; // tab was in the background
  while (nextT < ctx.currentTime + 0.12) { playStep(th, step, nextT, dt); step = (step + 1) % th.len; nextT += dt; }
}

function refresh() {
  const want = override || base;
  if (!ctx || want === playing) return;
  playing = want; step = 0; nextT = ctx.currentTime + 0.15;
  if (!timer) timer = setInterval(schedule, 25);
}

// The scene's theme, used whenever no mini-game has taken over the music.
export function sceneMusic(name) { base = name; refresh(); }
// A mini-game or screen's own theme; pass null to go back to the scene's theme.
export function overrideMusic(name) { override = name; refresh(); }

export const themeForScene = desc => {
  if (!desc) return 'title';
  if (desc.t === 'road') return 'march';
  if (desc.t === 'night') return 'night';
  if (desc.t === 'strait') return 'council';
  return 'title';
};
