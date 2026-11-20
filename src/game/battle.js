// Battles on the march: pick a tactic, see the odds, live with the losses.
import { rand, clamp, snapshot, chips } from './state.js';
import { applyFx } from './effects.js';
import { ask, tell } from '../screens/dialog.js';
import { renderHUD } from '../screens/hud.js';

const TACTICS = [
  { t: 'Frontal assault', m: 1, win: 140, lose: 260, ld: 1, h: 'Fast · heavy losses' },
  { t: 'Flank with the Regulares', m: 0.85, win: 80, lose: 150, wd: 1, ld: 2, h: 'Slower · fewer losses' },
  { t: 'Artillery barrage first', m: 1.3, win: 90, lose: 180, ld: 1, ammo: 15, h: 'Uses 15 ammo' },
  { t: 'Call in the bombers', m: 1.45, win: 60, lose: 120, ld: 1, terror: 3, air: true, h: 'Low losses' }
];

const word = v => (v >= 70 ? 'high' : v >= 40 ? 'fair' : v >= 20 ? 'low' : 'critical');

export async function battle(S, B, ctx) {
  let tries = 0;
  for (;;) {
    if (S.tS < 1500) {
      if (S.tS + S.tA < 1500) { S.end = 'army'; return; }
      // Too few men to attack: wait for reinforcements from Africa, at the cost of time.
      const before = snapshot(S);
      applyFx(S, { ship: 2500, delay: 5, inf: { mola: 4 }, morale: -4 });
      renderHUD(S, ctx.D);
      await tell({ title: `Before ${B.name}`, text: 'Your column is too weak to attack. You halt and wait for more men to come across from Africa while the other generals ask what is taking so long.', chips: chips(before, snapshot(S), S, ctx.D) });
      if (!ctx.alive()) return;
      continue;
    }
    const power = S.tS / 1000 * (0.6 + S.morale / 250) * (S.ammo < 20 ? 0.65 : 1);
    const res = B.res * (S.terror > 40 ? 1.15 : 1);
    const opts = TACTICS.map(T => {
      let dis = '';
      if (T.ammo && S.ammo < T.ammo) dis = `Needs ${T.ammo} ammo`;
      if (T.air && S.ger < 50 && S.ita < 50) dis = 'Needs Germany or Italy 50+';
      const p = clamp(power * T.m / (power * T.m + res), 0.08, 0.95);
      return { t: T.t, h: `${Math.round(p * 100)}% · ${T.h}`, dis, p, T };
    });
    const text = `${B.text} Your column: ${Math.round(S.tS).toLocaleString('en-US')} men, ammunition ${word(S.ammo)}, morale ${word(S.morale)}.` +
      (S.terror > 40 ? ' Word of reprisals has spread, and the defenders expect no mercy.' : '') +
      (tries ? ` This is attempt ${tries + 1}.` : '');
    const i = await ask({ title: `Battle of ${B.name}`, text, choices: opts });
    if (!ctx.alive()) return;
    const { T, p } = opts[i];
    const before = snapshot(S);
    S.ammo = clamp(S.ammo - 5 - (T.ammo || 0), 0, 100);
    const forced = tries >= 2;
    if (forced || rand(S) < p) {
      S.tS = Math.max(0, S.tS - B.res * (forced ? 200 : T.win));
      S.delay += T.wd || 0;
      applyFx(S, { inf: { franco: 4 }, morale: 5, legit: 2, terror: T.terror || 0 });
      S.ledger.push({ k: `Battle of ${B.name}`, you: `Won by ${T.t.toLowerCase()}${tries ? ` after ${tries + 1} attempts` : ''}.`, hist: B.hist });
      renderHUD(S, ctx.D);
      await tell({
        title: `${B.name} has fallen`,
        text: forced ? 'Exhausted and short of everything, your men finally carry the position. The cost is high.' : B.win,
        chips: chips(before, snapshot(S), S, ctx.D)
      });
      return;
    }
    S.tS = Math.max(0, S.tS - B.res * T.lose);
    S.delay += T.ld || 0;
    S.morale = clamp(S.morale - 8, 0, 100);
    tries++;
    renderHUD(S, ctx.D);
    await tell({ title: 'The attack fails', text: 'The defenders hold. Your officers regroup the column for another attempt.', chips: chips(before, snapshot(S), S, ctx.D) });
    if (!ctx.alive()) return;
  }
}
