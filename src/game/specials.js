// Landmark events whose text or odds depend on the current state. Everything else is in data/events.json.
import { rand } from './state.js';
import { applyFx, bump } from './effects.js';

const pct = p => Math.round(p * 100) + '%';

export const SPECIALS = {
  sanjurjo(S) {
    const alive = rand(S) < 0.2;
    S.alive.sanjurjo = alive;
    const hist = 'Sanjurjo died on 20 July 1936 when his overloaded plane crashed on take-off at Estoril.';
    if (!alive) {
      S.inf.sanjurjo = 0;
      return {
        title: 'Estoril · 20 July 1936',
        text: 'General Sanjurjo, the man the conspirators chose to lead the new Spain, is dead. His small plane crashed on take-off from a Portuguese field, overloaded with his luggage. The rising has no leader.',
        ledger: { k: 'Sanjurjo', hist, you: 'Sanjurjo died, as in history.' },
        choices: [
          { t: 'Send a public message of mourning', h: 'Influence for you and Mola', fx: { inf: { franco: 6, mola: 5 } }, r: 'Your message is read on every rebel radio station. Mola sends one too.' },
          { t: 'Let it be known the army needs a new leader', h: 'More influence · rivals uneasy', fx: { inf: { franco: 10 }, loy: { mola: -10, cabanellas: -6 } }, r: 'Officers in Morocco start calling you "the general". In Burgos, Mola and Cabanellas notice.' }
        ]
      };
    }
    return {
      title: 'Burgos · 20 July 1936',
      text: "General Sanjurjo's plane makes it out of Portugal. He lands at Burgos to take command of the rising, and every general now looks to him. In this run, history has changed.",
      ledger: { k: 'Sanjurjo', hist, you: 'Sanjurjo survived and took command.' },
      choices: [
        { t: 'Pledge your loyalty to Sanjurjo', h: 'He trusts you · you stand in his shadow', fx: { loy: { sanjurjo: 30 }, rev: ['sanjurjo'], inf: { franco: 2 } }, r: 'Sanjurjo thanks you warmly and calls you his best field commander.' },
        { t: 'Keep your distance', h: 'Influence · he notices', fx: { loy: { sanjurjo: -15 }, rev: ['sanjurjo'], inf: { franco: 4 } }, r: 'Your telegram is correct and cold. Sanjurjo reads it twice.' }
      ]
    };
  },

  hitler(S) {
    const g = S.ger, i = S.ita;
    let text, base, you;
    if (g >= 50) {
      text = 'Bayreuth, 25 July. After a performance of Wagner, Hitler receives your envoys and agrees on the spot. Operation Magic Fire will send twenty Ju 52 transports with German crews. Everything is addressed to you.';
      base = { inf: { franco: 8 } }; you = 'Hitler sent full aid, addressed to you alone.';
    } else if (g >= 30) {
      text = 'Hitler agrees to send ten Ju 52 transports. But Berlin is also talking to Mola, and some of the aid will go north.';
      base = { inf: { franco: 3, mola: 3 } }; you = 'Hitler sent partial aid and dealt with Mola too.';
    } else {
      text = "Hitler hears your envoys out, then sends nothing for now. Mola's own envoys are still in Berlin.";
      base = { inf: { mola: 6 } }; you = 'Hitler sent nothing at first.';
    }
    text += i >= 30 ? ' From Rome, Mussolini agrees to send twelve Savoia-Marchetti bombers.' : ' Rome stays silent.';
    return {
      title: 'Berlin and Rome · 26 July 1936', scene: { t: 'night' }, text,
      ledger: { k: "Hitler's answer", you, hist: 'Hitler agreed at Bayreuth on 25 July. Germany was repaid later through the HISMA company and mining concessions.' },
      choices: [
        { t: 'Write to thank Hitler personally', h: 'Germany warms to you', fx: { ...base, ger: 5 }, r: g >= 30 ? 'The first Junkers land at Tetuán within days.' : 'Berlin files your letter.' },
        { t: "Keep Berlin at arm's length", h: 'Legitimacy · Germany cools', fx: { ...base, ger: -5, legit: 3 }, r: 'Your reply is polite and brief. Foreign diplomats note that you are nobody\'s puppet.' }
      ]
    };
  },

  convoy(S) {
    let risk = 0.45;
    if (S.ita >= 30) risk -= 0.15;
    if (S.ger >= 50) risk -= 0.1;
    if (S.flags.fleetHit) risk -= 0.1;
    if (S.flags.italLost) risk += 0.05;
    risk = Math.max(0.08, risk);
    const sail = r => S2 => {
      const x = rand(S2);
      applyFx(S2, { ship: 3000 });
      if (x < r / 3) {
        bump(S2, 'tS', -2500); applyFx(S2, { legit: -10, morale: -15, inf: { franco: -6 } });
        return 'The Alcalá Galiano catches the convoy in open water. One transport goes down and the other turns back. Barely 500 men reach Algeciras.';
      }
      if (x < r) {
        bump(S2, 'tS', -1200); applyFx(S2, { morale: -8, flag: { sea: 1 } });
        return 'Shells straddle the convoy. One transport is hit and burns, but most of the men get ashore at Algeciras.';
      }
      applyFx(S2, { legit: 8, inf: { franco: 6 }, morale: 6, flag: { sea: 1 } });
      return 'Bombers drive off the destroyer and the whole convoy lands at Algeciras. Your propaganda calls it the Victory Convoy.';
    };
    return {
      title: 'Ceuta · 5 August 1936', scene: { t: 'strait' },
      text: 'The destroyer Alcalá Galiano patrols off Ceuta. In the harbour, two transports and a gunboat wait with about 3,000 men. ' +
        (S.ita >= 30 ? 'Italian bombers are ready to cover the crossing.' : 'You have almost no air cover.'),
      ledger: { k: 'The convoy', hist: 'Franco sent the convoy across in daylight on 5 August under air cover. About 2,500 men landed safely.' },
      choices: [
        { t: 'Sail now, in daylight', h: `Risk of losses ${pct(risk)}`, you: 'You sailed in daylight.', run: sail(risk) },
        { t: 'Wait for dark', h: `Risk ${pct(risk * 0.7)} · 2 days lost · Mola gains`, you: 'You waited for dark.', run: S2 => { applyFx(S2, { delay: 2, inf: { mola: 3 } }); return sail(risk * 0.7)(S2); } },
        { t: 'Cancel it. Keep flying them over', h: 'No risk · 6 days lost · Mola gains', req: { min: { ger: 30 } }, you: 'You cancelled the convoy.', run: S2 => { applyFx(S2, { delay: 6, inf: { mola: 6 }, ship: 1500 }); return 'The Junkers keep shuttling men across, a planeload at a time. In Burgos, people ask why the Army of Africa is still in Africa.'; } }
      ]
    };
  },

  maqueda(S) {
    const c = Math.max(0.05, Math.min(0.4, 0.1 + (S.tS - 8000) / 40000 + (S.ammo - 40) / 200 + (S.ger >= 60 ? 0.08 : 0) - S.delay * 0.01));
    return {
      title: 'Maqueda · 21 September 1936',
      text: 'Your columns hold the crossroads at Maqueda. Madrid is 70 kilometres to the north-east and its defences are thin. To the south-east, the Alcázar of Toledo has been under siege for nine weeks. The generals meet at Salamanca within days.',
      ledger: { k: 'Maqueda', hist: 'Franco turned south and relieved the Alcázar on 27 September. Madrid used the time to prepare, and held out until 1939.' },
      choices: [
        { t: 'Turn south and relieve the Alcázar', h: 'Legitimacy · influence · Madrid gets time', you: 'You relieved the Alcázar.', fx: { legit: 15, inf: { franco: 10 }, flag: { alcazar: 1 }, morale: 6 }, r: 'On 27 September your troops reach the ruined fortress. Newsreels around the world show its defenders cheering you. Madrid uses the week to dig in.' },
        {
          t: 'Push straight on to Madrid', h: `A gamble · about ${pct(c)} chance`, you: 'You pushed on to Madrid.',
          run: S2 => {
            if (rand(S2) < c) {
              applyFx(S2, { inf: { franco: 30 }, flag: { madrid: 1 }, legit: 10 });
              return 'Your columns break into the southern suburbs before the defences are ready. Madrid falls in early October. The war may end in months, not years.';
            }
            applyFx(S2, { inf: { franco: -6 }, morale: -12, tS: -1500, legit: -8, flag: { alcazarFell: 1 } });
            return "Militias and the first foreign volunteers hold the line south of the city. Days later the Alcázar's defenders surrender. In Burgos they say you lost both prizes.";
          }
        }
      ]
    };
  }
};
