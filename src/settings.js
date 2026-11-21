// Player settings (music, sound effects, motion), remembered in this browser.

const KEY = 'generalisimo.settings.v1';
const DEFAULTS = { music: true, sfx: true, motion: 'auto' };
const listeners = new Set();

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEFAULTS }; }
}

let current = read();

export const settings = () => current;

export function setSetting(k, v) {
  current = { ...current, [k]: v };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (e) { /* storage unavailable */ }
  listeners.forEach(f => f(current));
}

export const onSettings = f => listeners.add(f);

// 'auto' follows the device's reduce-motion setting; 'on' and 'off' override it.
export function motionOn() {
  if (current.motion === 'on') return true;
  if (current.motion === 'off') return false;
  return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
