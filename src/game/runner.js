// Runs the story script in data/chapters.json one step at a time.
import { rand, save, clearSave, snapshot, chips, fmtDate, datedTitle } from './state.js';
import { applyFx, unmet, passTime } from './effects.js';
import { SPECIALS } from './specials.js';
import { battle } from './battle.js';
import { ask, tell, hideDlg } from '../screens/dialog.js';
import { renderHUD } from '../screens/hud.js';
import { chapterCard, showEnding } from '../screens/cards.js';
import { airlift } from '../minigames/ju52.js';
import { council, vote } from '../minigames/council.js';
import { tribunal } from '../minigames/tribunal.js';
import { siege } from '../minigames/siege.js';
import { noteLoyalty } from './politics.js';

export async function run(S, ctx) {
  const { D } = ctx;
  const steps = D.chapters.steps;
  ctx.showScene(S.scene);
  renderHUD(S, D);
  while (S.pc < steps.length && !S.end) {
    const st = steps[S.pc];
    const skip = (st.unless && S.flags[st.unless]) || (st.if && !S.flags[st.if]);
    if (!skip) await STEP[st.k](S, st, ctx);
    if (!ctx.alive()) return;
    hideDlg();
    S.pc++;
    save(S);
    renderHUD(S, D);
  }
  if (!ctx.alive()) return;
  clearSave();
  hideDlg();
  showEnding(S, ctx);
}

const STEP = {
  async card(S, st, ctx) {
    S.ch = st.ch;
    renderHUD(S, ctx.D);
    await chapterCard(ctx.D.chapters.chapters[st.ch]);
  },
  async route(S, st, ctx) {
    S.route = st.stops; S.pos = st.pos || 0;
    arrive(S, ctx);
  },
  async ev(S, st, ctx) {
    catchUp(S, st);
    const ev = st.special ? SPECIALS[st.id](S, ctx.D) : ctx.D.events.anchors[st.id];
    await playEvent(S, ev, ctx);
  },
  async rand(S, st, ctx) {
    const pool = ctx.D.events.deck.filter(e => e.pool === st.pool && !S.used.includes(e.id) && !unmet(S, e.req));
    if (!pool.length) return;
    const ev = pool[Math.floor(rand(S) * pool.length)];
    S.used.push(ev.id);
    await playEvent(S, ev, ctx);
  },
  async move(S, st, ctx) {
    const before = snapshot(S);
    const days = Math.max(0, st.day + S.delay - S.day);
    passTime(S, days);
    S.pos = st.to;
    arrive(S, ctx);
    renderHUD(S, ctx.D);
    const stop = S.route[S.pos];
    const text = [st.text, days ? `${days} day${days > 1 ? 's' : ''} pass.` : ''].filter(Boolean).join(' ');
    await tell({ title: `${stop} · ${fmtDate(S.day)}`, text, chips: chips(before, snapshot(S), S, ctx.D) });
  },
  async battle(S, st, ctx) { await battle(S, ctx.D.chapters.battles[st.id], ctx); },
  async air(S, st, ctx) { await airlift(S, ctx); },
  async council(S, st, ctx) { await council(S, ctx); },
  async tribunal(S, st, ctx) { await tribunal(S, ctx); },
  async siege(S, st, ctx) { await siege(S, ctx); },
  async end(S, st) { if (!S.end) S.end = st.id; },
  async vote(S, st, ctx) { await vote(S, ctx); }
};

// Anchored events happen on a historical date, pushed back by any days you have lost.
function catchUp(S, st) {
  if (st.day == null) return;
  const d = st.day + S.delay - S.day;
  if (d > 0) passTime(S, d);
}

function arrive(S, ctx) {
  const stop = S.route[S.pos];
  const sc = ctx.D.chapters.scenes[stop];
  if (sc) ctx.showScene(sc);
  const loc = ctx.D.chapters.locations[stop];
  const last = S.trail[S.trail.length - 1];
  if (loc && !(last && last[0] === loc[0] && last[1] === loc[1])) S.trail.push(loc);
}

export async function playEvent(S, ev, ctx) {
  if (ev.scene) ctx.showScene(ev.scene);
  const choices = ev.choices.map(c => ({ ...c, dis: unmet(S, c.req) }));
  const title = datedTitle(ev.title, S.day);
  const i = await ask({ title, text: ev.text, choices });
  if (!ctx.alive()) return;
  const c = choices[i];
  const before = snapshot(S);
  const extra = c.run ? c.run(S) : applyFx(S, c.fx);
  noteLoyalty(S, before.loy, title.split(' · ')[0]);
  const text = [c.r, extra].filter(Boolean).join(' ');
  if (ev.ledger) S.ledger.push({ k: ev.ledger.k, you: ev.ledger.you || c.you || c.t, hist: ev.ledger.hist });
  renderHUD(S, ctx.D);
  await tell({ title, text: text || 'So be it.', chips: chips(before, snapshot(S), S, ctx.D) });
}
