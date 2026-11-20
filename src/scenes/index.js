// Scene registry: builds a scene once, caches it, and animates it if it has moving parts.
import { road } from './road.js';
import { island } from './island.js';
import { airfield } from './airfield.js';
import { sky } from './sky.js';
import { night } from './night.js';
import { strait } from './strait.js';

const BUILD = { road, island, airfield, sky, night, strait };
const cache = new Map();
let raf = 0;

const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function setScene(cv, desc) {
  cancelAnimationFrame(raf); raf = 0;
  if (!desc || !BUILD[desc.t]) return;
  const key = JSON.stringify(desc);
  let sc = cache.get(key);
  if (!sc) { sc = BUILD[desc.t](desc); cache.set(key, sc); }
  if (!sc.frame || reduceMotion()) {
    const f = sc.base.copy();
    if (sc.frame) sc.frame(f, 0);
    f.to(cv);
    return;
  }
  const t0 = performance.now();
  let last = -1e9;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (now - last < 83) return; // ~12 fps is plenty for pixel art
    last = now;
    const f = sc.base.copy();
    sc.frame(f, (now - t0) / 1000);
    f.to(cv);
  };
  raf = requestAnimationFrame(loop);
}
