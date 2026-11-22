// Who votes at Salamanca, who your main rival is, and how each general leans.

export const voters = S => ['mola', 'queipo', 'cabanellas', 'kindelan', 'orgaz'].filter(g => S.alive[g] !== false).concat(S.alive.sanjurjo ? ['sanjurjo'] : []);

// Every living general except you, for the influence race after Salamanca.
export const rivalsOf = S => Object.keys(S.inf).filter(g => g !== 'franco' && S.alive[g] !== false);
export const topRival = S => rivalsOf(S).reduce((a, b) => (S.inf[b] > S.inf[a] ? b : a));

export function rivalOf(S) {
  return voters(S).reduce((a, b) => (S.inf[b] > S.inf[a] ? b : a));
}

// How strongly a general leans toward voting for you (positive) or the rival (negative), before chance.
export function lean(S, g, rival = rivalOf(S)) {
  if (g === rival) return -100;
  let s = S.loy[g] + (S.inf.franco - S.inf[rival]) * 0.6 + (S.legit - 50) * 0.3 + (S.ger - 50) * 0.15;
  if (S.flags.alcazar) s += 5;
  if (S.flags.madrid) s += 40;
  if (g === 'cabanellas') s -= S.terror * 0.2;
  return s;
}

export function leanText(S, g) {
  if (g === 'franco') return '';
  if (!voters(S).includes(g)) return '';
  if (!S.rev[g]) return 'Vote: unknown. Find out where they stand first.';
  if (g === rivalOf(S)) return 'Vote: for himself. He is your main rival.';
  const s = lean(S, g);
  return s > 10 ? 'Vote today: likely for you.' : s < -10 ? 'Vote today: likely against you.' : 'Vote today: could go either way.';
}

export const moodOf = (S, g) => {
  if (g === 'franco' || !S.rev[g]) return 'neutral';
  const l = S.loy[g];
  return l >= 25 ? 'happy' : l <= -15 ? 'angry' : 'neutral';
};

// Remember what changed each general's mind, for the generals board.
export function noteLoyalty(S, before, title) {
  S.notes = S.notes || {};
  for (const g of Object.keys(S.loy)) {
    const d = Math.round(S.loy[g] - before[g]);
    if (!d || g === 'franco') continue;
    (S.notes[g] = S.notes[g] || []).push({ t: title, d });
    if (S.notes[g].length > 6) S.notes[g].shift();
  }
}
