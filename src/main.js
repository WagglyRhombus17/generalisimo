// Boot: load the data files, wire up the controls, and switch between title screen and game.
import { newState, load, clearSave, randomSeed } from './game/state.js';
import { run } from './game/runner.js';
import { setScene } from './scenes/index.js';
import { showTitle, hideTitle } from './screens/cards.js';
import { openMap, closeMap } from './screens/map.js';
import { openGenerals, closeGenerals } from './screens/generals.js';
import { renderHUD } from './screens/hud.js';
import { hideDlg, finishTyping } from './screens/dialog.js';
import { unlock, sceneMusic, overrideMusic, themeForScene } from './audio/audio.js';
import { settings, setSetting, onSettings, motionOn } from './settings.js';

const $ = s => document.querySelector(s);
const D = {};
const canvas = $('#scene');
const OVERLAYS = ['#ov-map', '#ov-gen', '#ov-air', '#ov-trib', '#ov-council', '#ov-vote', '#ov-card', '#ov-end'];
// Topmost first: keyboard shortcuts go to the first visible layer.
const LAYERS = ['#ov-map', '#ov-gen', '#ov-title', '#ov-end', '#ov-card', '#ov-vote', '#ov-council', '#ov-trib', '#ov-air', '#dlg'];
let S = null, token = 0, lastScene = null;

function showScene(desc) {
  if (S) S.scene = desc;
  lastScene = desc;
  setScene(canvas, desc);
  sceneMusic(themeForScene(desc));
}

function hideAll() { OVERLAYS.forEach(s => { $(s).hidden = true; }); hideTitle(); hideDlg(); }

function start(state) {
  const my = ++token;
  S = state;
  hideAll();
  overrideMusic(null);
  const ctx = {
    D, showScene,
    alive: () => my === token,
    onNew: () => { clearSave(); start(newState(randomSeed(), D)); },
    onSeed: seed => { clearSave(); start(newState(seed, D)); },
    onMenu: title
  };
  run(S, ctx).catch(showError);
}

function title() {
  token++;
  S = null;
  hideAll();
  renderHUD(null, D);
  overrideMusic(null);
  showScene({ t: 'road', town: 'toledo', sky: 'sunset' });
  sceneMusic('title');
  const saved = load();
  showTitle({
    hasSave: !!saved,
    onContinue: () => start(saved),
    onNew: () => { clearSave(); start(newState(randomSeed(), D)); },
    onSeed: n => { clearSave(); start(newState(n, D)); }
  });
}

// Motion and sound settings take effect immediately.
function applySettings() {
  document.documentElement.classList.toggle('still', !motionOn());
  const on = settings().music || settings().sfx;
  $('#b-sound').textContent = on ? 'SOUND ON' : 'SOUND OFF';
  if (lastScene) setScene(canvas, lastScene);
}
onSettings(applySettings);

// Browsers only allow audio after the player interacts with the page.
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true }));

const canPanel = () => S && $('#ov-title').hidden && $('#ov-card').hidden && $('#ov-end').hidden;

function toggleMap() { if (!canPanel()) return; closeGenerals(); if ($('#ov-map').hidden) openMap(S, D); else closeMap(); }
function toggleGenerals() { if (!canPanel()) return; closeMap(); if ($('#ov-gen').hidden) openGenerals(S, D); else closeGenerals(); }

document.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { closeMap(); closeGenerals(); return; }
  if (k === 'm' && S) { e.preventDefault(); toggleMap(); return; }
  if (k === 'g' && S) { e.preventDefault(); toggleGenerals(); return; }
  const layer = LAYERS.map(s => $(s)).find(el => el && !el.hidden);
  if (!layer) return;
  const key = k === ' ' ? 'enter' : k;
  if (key === 'enter' && layer.id === 'dlg' && finishTyping()) { e.preventDefault(); return; }
  const btn = layer.querySelector(`[data-key="${CSS.escape(key)}"]:not([disabled])`);
  if (btn) { e.preventDefault(); btn.click(); }
});

function showError(err) {
  console.error(err);
  const l = $('#loading');
  l.hidden = false;
  l.textContent = `Something went wrong: ${err && err.message ? err.message : err}. If you opened index.html straight from disk, run it from a local web server instead.`;
}

async function boot() {
  try {
    const files = ['events', 'generals', 'chapters', 'tribunal'];
    const data = await Promise.all(files.map(n => fetch(`data/${n}.json`).then(r => {
      if (!r.ok) throw new Error(`could not load data/${n}.json`);
      return r.json();
    })));
    files.forEach((n, i) => { D[n] = data[i]; });
  } catch (err) { showError(err); return; }
  $('#loading').hidden = true;
  $('#b-map').addEventListener('click', toggleMap);
  $('#b-gen').addEventListener('click', toggleGenerals);
  $('#b-menu').addEventListener('click', title);
  $('#b-sound').addEventListener('click', () => { const on = !(settings().music || settings().sfx); setSetting('music', on); setSetting('sfx', on); });
  applySettings();
  title();
}

boot();
