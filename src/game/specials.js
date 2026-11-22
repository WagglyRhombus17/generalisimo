// Landmark events whose text or odds depend on the current state. Everything else is in data/events.json.
import { rand } from './state.js';
import { applyFx, bump } from './effects.js';

const pct = p => Math.round(p * 100) + '%';

export const SPECIALS = {
  sovietAid(S) {
    const g = S.ger >= 30;
    return {
      title: 'Toledo · 13 October 1936',
      text: 'Soviet ships are unloading tanks, fighters and advisers at Cartagena for the Republic. Within weeks, the balance in the air and on the roads to Madrid will change.',
      ledger: { k: 'Soviet aid', hist: 'The first Soviet tanks and aircraft reached the Republic in October 1936. Germany answered by sending the Condor Legion.' },
      choices: [
        { t: 'Ask Berlin for modern aircraft', h: g ? 'Germany · stronger air support at Madrid' : 'Berlin is lukewarm', you: 'You asked Germany for more aircraft.', fx: g ? { ger: 6, flag: { moreAir: 1 } } : { ger: 3 }, r: g ? 'Berlin promises a full air unit with its own pilots.' : 'Berlin promises to consider it.' },
        { t: 'Ask Rome for tanks', h: 'Italy · your attacks hit harder', you: 'You asked Italy for tanks.', fx: { ita: 6, flag: { italTanks: 1 }, legit: -2 }, r: 'Italian light tanks arrive at Sevilla within a fortnight.' },
        { t: 'Rely on speed: reach Madrid before they deploy', h: 'Morale · thinner defences on the first day', you: 'You raced for Madrid.', fx: { morale: 4, flag: { rush: 1 } }, r: 'Your columns are ordered forward without pause.' }
      ]
    };
  },

  sesena(S) {
    return {
      title: 'Seseña · 29 October 1936',
      text: 'Soviet T-26 tanks crash into your lines at Seseña. Their armour shrugs off your machine guns, and your light tanks are no match for them.',
      ledger: { k: 'Seseña', hist: 'On 29 October Soviet tanks attacked at Seseña. Nationalist troops stopped some with bottles of petrol, and German anti-tank guns soon followed.' },
      choices: [
        { t: 'Bring up the German anti-tank guns', h: 'Few losses', req: { min: { ger: 40 } }, you: 'You used German anti-tank guns.', fx: { tS: -200, ger: 2 }, r: 'The 37 mm guns knock out the leading tanks. The rest turn back.' },
        { t: 'Fight them with bottles of petrol', h: 'Heavy losses · morale', you: 'Your men fought the tanks with petrol bombs.', fx: { tS: -600, morale: 5 }, r: 'Legionnaires climb onto the tanks and throw burning bottles into the hatches. Several tanks burn, and so do many of your men.' },
        { t: 'Fall back and regroup', h: 'Lose three days · morale falls', you: 'You fell back.', fx: { tS: -200, delay: 3, morale: -6 }, r: 'The tanks run short of fuel and withdraw. You have lost three days.' }
      ]
    };
  },

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
  },

  // ---------- 1937-1939 ----------

  guadalajara(S) {
    const p = Math.min(0.6, 0.25 + (S.ita >= 60 ? 0.1 : 0) + (S.ger >= 60 ? 0.05 : 0) + (S.flags.italTanks ? 0.05 : 0));
    const win = { r: 'The Republic cannot reinforce both fronts at once. The Italians take Guadalajara and Madrid is almost surrounded.', flag: { madridRing: 1 }, ita: 6, inf: { franco: 4 }, delay: -12 };
    const lose = { r: 'In the sleet, the Italian columns are caught on the roads by Soviet tanks and fighters. Italian anti-fascists of the Garibaldi Battalion call to their countrymen through loudspeakers. The Corps breaks and runs. Rome is humiliated, and from now on its generals take your orders.', ita: -4, legit: -2, morale: -3, inf: { franco: 3 } };
    return {
      title: 'Guadalajara · 8 March 1937', scene: { t: 'road', town: 'village', sky: 'north', weather: 'rain' },
      text: "Mussolini's Corps attacks from the north-east toward Guadalajara, to close the ring around Madrid from the other side. Its tanks and lorries are fast on good roads. Then the sleet starts, and the roads turn to mud." +
        (S.flags.ctv ? ' The Italian volunteers you accepted in December are in the lead.' : ''),
      ledger: { k: 'Guadalajara', hist: "Between 8 and 23 March 1937 the Italian Corps was routed at Guadalajara, the Republic's first clear victory. The attack at the Jarama that was meant to accompany it never came." },
      choices: [
        { t: 'Attack at the Jarama again to pin the Republic down', h: `Army −4,000 · Italian success ${pct(p + 0.2)}`, you: 'You attacked at the Jarama to help the Italians.', fx: { tS: -4000, roll: { p: p + 0.2, win, lose } } },
        { t: 'Let the Italians fight their own battle', h: `The historical choice · Italian success ${pct(p)}`, you: 'You let the Italians fight alone.', fx: { roll: { p, win, lose } } },
        { t: 'Call off the attack', h: 'No risk · Mussolini furious', you: 'You called off the Italian attack.', fx: { ita: -10, delay: 4 }, r: 'Mussolini sends a furious telegram. His generals say you have robbed them of a victory.' }
      ]
    };
  },

  guernica(S) {
    const ledger = { k: 'Guernica', hist: "On 26 April 1937, a market day, the Condor Legion and Italian aircraft bombed Guernica for about three hours. Modern estimates put the dead at between 150 and 300. Franco's headquarters claimed the Basques had burned the town themselves. Picasso's painting of the raid was shown in Paris that summer." };
    const ruins = { t: 'road', town: 'ruins', sky: 'sunset', fires: 1 };
    if (S.flags.freeHand) {
      return {
        title: 'Guernica · 26 April 1937', scene: ruins, ledger,
        text: 'Monday is market day in Guernica, the old Basque town where the assemblies of Biscay met beneath an oak tree. This afternoon, for about three hours, the Condor Legion and Italian aircraft bombed and machine-gunned it. By evening the town is burning. Nobody asked you first: the bombers had a free hand. Reporters from London and Paris are already walking through the ruins.',
        choices: [
          {
            t: 'Say the Basques burned their own town', h: 'The historical choice · legitimacy falls if it is disproved', you: 'You said the Basques had burned Guernica themselves.',
            fx: { ger: 2, roll: { p: 0.65, win: { r: "Your press office tells the world that retreating \"Red\" arsonists set Guernica on fire. Then George Steer's report in The Times describes the raid hour by hour, with the German bomb casings he found in the streets. Few people abroad believe you.", legit: -10 }, lose: { r: 'Your press office tells the world that retreating "Red" arsonists set Guernica on fire. For now, many people abroad believe it.', legit: -3 } } }
          },
          { t: 'Admit the raid and blame the Germans', h: 'Legitimacy · Germany furious', you: 'You admitted the raid and blamed the Germans.', fx: { legit: 4, ger: -12, loy: { mola: -4 } }, r: "Berlin is outraged, and the Legion's commanders ask whose side you are on." },
          { t: 'Order the Legion to stop bombing towns', h: 'Legitimacy · slower · Germany cools', you: 'You stopped the bombing of towns.', fx: { legit: 5, ger: -6, terror: -2, delay: 5 }, r: 'Richthofen protests to Berlin. The Basque front holds a little longer.' }
        ]
      };
    }
    return {
      title: 'Guernica · 26 April 1937', scene: { t: 'road', town: 'village', sky: 'north' }, ledger,
      text: 'Richthofen comes to your headquarters with a plan. To cut off the retreating Basque army, he wants to bomb the bridge and roads at Guernica, a market town behind the lines where the assemblies of Biscay once met. Monday is market day. His aircraft will carry incendiary bombs.',
      choices: [
        { t: 'Approve the raid', h: 'Faster · terror · the world will see', you: 'You approved the raid on Guernica.', scene: ruins, fx: { ger: 4, terror: 10, legit: -10, delay: -2 }, r: 'On the afternoon of 26 April, for about three hours, German and Italian aircraft bomb and machine-gun Guernica. The town centre burns to the ground. Your press office says the Basques set the fires themselves; few people abroad believe it.' },
        { t: 'Bridges and roads only, no incendiaries', h: 'Germany cools · slower', you: 'You limited the raid to the bridge and roads.', fx: { ger: -4, legit: 2, delay: 2 }, r: 'The bombers go for the bridge and the roads. In this history, the houses of Guernica still stand.' },
        { t: 'Forbid it', h: 'Legitimacy · Germany furious · slower', you: 'You forbade the raid.', fx: { ger: -8, legit: 4, delay: 4, loy: { mola: -6 } }, r: 'Richthofen goes over your head to Berlin, and gets nowhere. The Basque army escapes west.' }
      ]
    };
  },

  mola(S) {
    const hist = 'Mola died on 3 June 1937 when his plane crashed in fog near Alcocero, north of Burgos. Rumours of sabotage spread at once; none has ever been proven. With him died the only general who might have rivalled Franco.';
    if (rand(S) >= 0.12) {
      S.alive.mola = false; S.inf.mola = 0;
      return {
        title: 'Burgos · 3 June 1937', scene: { t: 'road', town: 'burgos', sky: 'north' },
        text: 'In thick fog, the plane carrying General Mola from Vitoria to Valladolid has flown into a hillside near Alcocero, north of Burgos. Everyone on board is dead. The general who planned the rising, and the only one who might still challenge you, is gone.',
        ledger: { k: 'Mola', hist, you: 'Mola died, as in history.' },
        choices: [
          { t: 'Give the northern command to General Dávila', h: 'The historical choice · influence', fx: { inf: { franco: 6 } }, r: 'Fidel Dávila, a careful staff officer, takes over the Army of the North. He will do as you ask.' },
          { t: 'Take the northern command yourself', h: 'More influence · slower elsewhere', fx: { inf: { franco: 10 }, delay: 3, morale: 3 }, r: "You move into Mola's office in Vitoria. The northern generals now report straight to you." },
          { t: 'Give him a hero\'s funeral', h: 'Legitimacy · morale', fx: { legit: 3, morale: 4, inf: { franco: 3 } }, r: 'Mola is buried with full honours in Pamplona, and you walk behind the coffin.' }
        ]
      };
    }
    return {
      title: 'Burgos · 3 June 1937', scene: { t: 'road', town: 'burgos', sky: 'north' },
      text: "In thick fog, Mola's pilot turns back from the hills near Alcocero and lands safely at Burgos. In this run, history has changed. Mola is still the most powerful general after you, and he is impatient with the pace of the war.",
      ledger: { k: 'Mola', hist, you: 'Mola survived the flight.' },
      choices: [
        { t: 'Make him your deputy', h: 'Mola loyal · he gains influence', fx: { loy: { mola: 20 }, inf: { mola: 6 }, rev: ['mola'] }, r: 'Mola accepts, and comes to every meeting you hold.' },
        { t: 'Keep him busy at the front', h: 'Mola resents it · your influence', fx: { loy: { mola: -12 }, inf: { mola: -6, franco: 3 }, rev: ['mola'] }, r: 'Mola goes back to Vitoria with more divisions and less say.' }
      ]
    };
  },

  brunete(S) {
    const p = Math.min(0.75, 0.35 + (S.ger >= 60 ? 0.15 : 0) + (S.flags.moreAir ? 0.1 : 0) + (S.tS > 60000 ? 0.05 : 0));
    return {
      title: 'Brunete · 6 July 1937', scene: { t: 'road', town: 'village', sky: 'day' },
      text: 'The Republic has struck west of Madrid with 80,000 men and Soviet tanks. They have taken the village of Brunete and are pushing into your rear. Your generals in the north beg you not to stop the offensive against Santander.',
      ledger: { k: 'Brunete', hist: 'The Republican offensive at Brunete in July 1937 was stopped after three weeks of fighting in extreme heat. Franco paused the northern offensive to counterattack.' },
      choices: [
        { t: 'Bring divisions from the north and counterattack', h: 'The historical choice · Army −10,000', you: 'You paused the north and counterattacked.', fx: { tS: -10000, inf: { franco: 3 }, morale: 3 }, r: 'Two divisions and the Condor Legion come south. After three weeks of heat you retake Brunete village and the front settles again.' },
        {
          t: 'Hold with what is there and keep the north going', h: `${pct(p)} chance · faster if it works`, you: 'You kept the northern offensive going.',
          fx: { roll: { p, win: { r: 'Your thin line west of Madrid holds just long enough. In the north, Santander is attacked weeks earlier than planned.', tS: -4000, delay: -15, inf: { franco: 4 } }, lose: { r: 'The Republic breaks through toward Navalcarnero. You have to halt the north after all, and late.', tS: -12000, delay: 12, morale: -8, legit: -3 } } }
        },
        { t: 'Bomb them day and night', h: 'Faster · terror', req: { min: { ger: 50 } }, you: 'You stopped Brunete from the air.', fx: { tS: -6000, ger: 3, terror: 2, delay: -3 }, r: "The Condor Legion's new fighters and bombers catch the Republican columns in the open. The offensive stalls." }
      ]
    };
  },

  teruel(S) {
    const p = Math.min(0.55, 0.22 + (S.ger >= 60 ? 0.1 : 0) + (S.tS > 60000 ? 0.05 : 0) + (S.flags.madridRing ? 0.1 : 0));
    const target = S.flags.madridFell ? 'Valencia' : 'Madrid';
    const choices = [
      { t: 'Cancel the offensive. Retake Teruel', h: 'The historical choice', you: 'You cancelled the offensive to save Teruel.', fx: { morale: 2, inf: { franco: 2 } }, r: 'You call off the offensive and send your best divisions east, into the snow.' },
      {
        t: 'Let Teruel go. Attack Madrid as planned', h: `A gamble · about ${pct(p)}`, you: 'You let Teruel go and attacked Madrid.',
        fx: { roll: { p, win: { r: "With the Republic's reserves tied up at Teruel, your attack breaks through. Madrid falls. Teruel can wait.", flag: { skipTeruel: 1, madridFell: 1 }, delay: -40, legit: 8, inf: { franco: 10 } }, lose: { r: 'The attack on Madrid fails, and Teruel falls on 8 January. Now you must retake it anyway, from a stronger enemy.', tS: -10000, morale: -10, delay: 12, inf: { franco: -6 }, flag: { teruelHard: 1 } } } }
      },
      { t: 'Send a small relief force and keep the main army ready', h: 'Teruel may fall · 8 days lost', you: 'You sent a small relief force.', fx: { delay: 8, tS: -3000, flag: { teruelHard: 1 } }, r: "The relief force is too weak. Teruel's garrison surrenders on 8 January, and the main army has to come after all." }
    ];
    if (S.flags.madridFell) choices.splice(1, 1);
    return {
      title: 'Zaragoza · 15 December 1937', scene: { t: 'road', town: 'pilar', sky: 'winter', weather: 'snow' },
      text: `Your army is ready to attack ${target}. Then news comes from the mountains of Aragon: in a blizzard, the Republic has surrounded Teruel, a provincial capital held by a few thousand of your troops. Some of your generals say Teruel is not worth losing the offensive for. Others say you cannot let the Republic take a provincial capital.`,
      ledger: { k: 'Teruel', hist: 'The Republic attacked Teruel on 15 December 1937. Franco cancelled a planned offensive against Madrid to retake it.' },
      choices
    };
  },

  sea(S) {
    const p = Math.min(0.7, 0.4 + (S.ger >= 60 ? 0.1 : 0) + (S.legit >= 60 ? 0.05 : 0));
    return {
      title: 'Vinaròs · 15 April 1938', scene: { t: 'road', town: 'sea', sky: 'day' },
      text: `Your Navarrese troops reach the Mediterranean at Vinaròs and wade into the sea. The Republic is cut in two: Catalonia to the north, ${S.flags.madridFell ? 'Valencia and the south-east' : 'Madrid and Valencia'} to the south. Your generals urge you to drive into Catalonia at once, while its army is in disarray. But France has just reopened its border to arms for the Republic, and fighting near it could bring the French in.`,
      ledger: { k: 'The sea', hist: 'Nationalist troops reached the Mediterranean at Vinaròs on 15 April 1938, cutting the Republic in two. Franco then turned south toward Valencia instead of north into Catalonia, a decision many of his generals questioned.' },
      choices: [
        { t: 'Turn south toward Valencia', h: 'The historical choice · safe from France', you: 'You turned south toward Valencia.', fx: { inf: { franco: 2 } }, r: 'Your army wheels south into the mountains of the Maestrazgo, toward Valencia.' },
        {
          t: 'Drive north into Catalonia now', h: `A gamble · about ${pct(p)} · France may react`, you: 'You drove north into Catalonia.',
          fx: { roll: { p, win: { r: 'Your columns reach the lower Ebro and hold the whole river line before the Republic can recover. If it strikes back, you will be waiting.', flag: { ebroReady: 1 }, delay: -15, inf: { franco: 4 } }, lose: { r: 'French guns and aircraft pour across the border and your attack stalls in the foothills. Paris warns you to keep away.', tS: -8000, delay: 15, legit: -3, morale: -5 } } }
        }
      ]
    };
  },

  ebroChoice(S) {
    const p = Math.min(0.65, 0.35 + (S.ger >= 60 ? 0.1 : 0) + (S.flags.ebroWell ? 0.1 : 0));
    const near = S.flags.gandesaFell ? 'The Republic has taken Gandesa and its bridgehead is deep.' : "The Republic's bridgehead across the Ebro has been stopped short of Gandesa.";
    return {
      title: 'Gandesa · 15 August 1938', scene: { t: 'road', town: 'village', sky: 'sunset' },
      text: `${near} Now you must decide how to destroy it. Some of your generals want to cross the river further north and cut it off from behind. Or you can grind it down hill by hill with artillery and aircraft, and let the Republic's last army bleed to death in front of you.`,
      ledger: { k: 'Attrition', hist: "Franco chose a battle of attrition at the Ebro. It lasted until 16 November 1938 and destroyed the Republic's last major army. Both sides together suffered well over 100,000 casualties." },
      choices: [
        { t: 'Grind them down, hill by hill', h: 'The historical choice · Army −20,000', you: 'You fought a battle of attrition.', fx: { tS: -20000, morale: -4, inf: { franco: 2 } }, r: 'For three months your guns and bombers pound the bridgehead, and your infantry take the hills one at a time.' },
        {
          t: 'Cross the river and cut them off', h: `A gamble · about ${pct(p)}`, you: 'You tried to cut the bridgehead off.',
          fx: { roll: { p, win: { r: 'Your divisions cross upstream and close the bridges behind the Republican army. Tens of thousands of its soldiers surrender in September.', tS: -8000, delay: -20, inf: { franco: 6 } }, lose: { r: 'The crossing is spotted and beaten back. You have lost weeks, and the bridgehead is still there.', tS: -12000, delay: 15, morale: -8 } } }
        },
        { t: 'Contain them and wait', h: 'Fewer losses · 25 days lost', you: 'You contained the bridgehead and waited.', fx: { tS: -6000, delay: 25, morale: 2 }, r: 'Your lines hold. The Republic rests, digs in and waits for Europe.' }
      ]
    };
  },

  munich(S) {
    return {
      title: 'Burgos · 27 September 1938',
      text: 'Hitler is threatening war over Czechoslovakia. If Britain and France fight Germany, they could strike at you across the Pyrenees and in Morocco. London and Paris want to know whose side you would be on.',
      ledger: { k: 'Munich', hist: "During the Munich crisis of September 1938, Franco declared that Spain would stay neutral in a European war, angering Berlin. The Munich Agreement ended the Republic's hope that Britain and France would come to its aid." },
      choices: [
        { t: 'Declare that Spain will stay neutral', h: 'The historical choice · legitimacy · Berlin is furious', you: 'You declared neutrality.', fx: { legit: 6, ger: -8 }, r: 'Your note to London and Paris promises neutrality. In Berlin it is called betrayal. Two days later at Munich, Britain and France give Hitler what he wants without a war.' },
        { t: 'Promise Hitler your support', h: 'Germany · Britain and France take note', you: 'You promised Hitler your support.', fx: { ger: 8, legit: -8, flag: { axis: 1 } }, r: 'At Munich, Britain and France give Hitler what he wants without a war, and your promise is never tested. It is not forgotten in Paris.' },
        { t: 'Say nothing and wait', h: 'No change', you: 'You said nothing.', fx: { legit: -1 }, r: 'At Munich, Britain and France give Hitler what he wants without a war. The Republic\'s last hope of outside help goes with it.' }
      ]
    };
  },

  mines(S) {
    const p = Math.min(0.75, 0.5 + (S.ger >= 60 ? 0.15 : 0) - (S.flags.axis ? 0 : 0.05));
    return {
      title: 'Burgos · 18 November 1938',
      text: 'Your army needs new guns, aircraft and ammunition to finish the war, and only Germany will supply them. In return, Berlin demands what it has wanted since 1936: large shares in Spanish mining companies.',
      ledger: { k: 'Arms for mines', hist: 'In November 1938 Franco gave German companies large stakes in Spanish mines in exchange for the weapons he needed to attack Catalonia.' },
      choices: [
        { t: 'Give Berlin the mines', h: 'The historical choice · ammo +40 · Germany', you: 'You traded mines for arms.', fx: { ammo: 40, ger: 8, funds: -6, legit: -3 }, r: 'The agreement is signed. Within weeks German freighters are unloading guns in Spanish ports.' },
        {
          t: 'Bargain hard', h: `${pct(p)} chance of a better deal · Berlin may stall`, you: 'You bargained hard over the mines.',
          fx: { roll: { p, win: { r: 'Berlin settles for less than it asked. The guns come anyway.', ammo: 35, ger: 2, funds: 2, legit: 2 }, lose: { r: 'Berlin lets the talks drag on for weeks while the guns sit on the docks in Hamburg.', ammo: 10, ger: -6, delay: 12 } } }
        },
        { t: 'Refuse, and make do with Spanish factories', h: 'Ammo +10 · 20 days lost', you: 'You refused the German terms.', fx: { ammo: 10, delay: 20, legit: 3, ger: -8 }, r: 'Your factories in Bilbao and Asturias work day and night. It is not enough, and the offensive waits.' }
      ]
    };
  },

  casado(S) {
    const city = S.flags.madridFell ? 'Valencia' : 'Madrid';
    return {
      title: `${city} · 5 March 1939`,
      text: `In ${city}, Colonel Segismundo Casado has overthrown the Republic's last prime minister, Juan Negrín, and set up a National Defence Council. Communist units loyal to Negrín are fighting Casado's troops in the streets. Casado offers you peace: no reprisals against those who committed no crimes, and time for anyone who wants to leave Spain to sail from the ports of the south-east.`,
      ledger: { k: 'Casado', hist: 'Colonel Casado overthrew Negrín on 5 March 1939 and tried to negotiate a peace. Franco would accept only unconditional surrender.' },
      choices: [
        { t: 'Demand unconditional surrender', h: 'The historical choice', you: 'You demanded unconditional surrender.', fx: { inf: { franco: 4 }, terror: 4 }, r: "Your answer is that only unconditional surrender is possible. Casado's envoys fly back with nothing." },
        { t: "Accept Casado's terms", h: 'Ends the war now · history changes', you: "You accepted Casado's terms.", fx: { legit: 10, terror: -10, end: 'peace' }, r: "Casado's envoys fly back with your signature. The guns fall silent within days." },
        { t: 'Attack now, while they fight each other', h: 'Faster · terror', you: 'You attacked during the coup.', fx: { delay: -6, tS: -5000, terror: 6 }, r: 'Your divisions attack while the Republic fights itself. Its front starts to dissolve.' }
      ]
    };
  },

  // Played between chapters when the war is running far behind the historical calendar.
  hurry(S) {
    const months = Math.round(S.delay / 30);
    return {
      title: 'Time is running out',
      text: `Your war is about ${months} months behind where your staff expected it to be. In Europe, Germany is rearming and everyone expects a general war. The Republic's leaders say openly that their strategy is to hold out until it comes, when Britain and France will have to help them.`,
      choices: [
        { t: 'Throw everything into the next offensive', h: 'Army −12,000 · faster', fx: { tS: -12000, delay: -12, morale: -4 }, r: 'Your generals are ordered to attack whatever the cost.' },
        { t: 'Ask Berlin and Rome for more of everything', h: 'Faster · legitimacy falls', req: { min: { ger: 50 } }, fx: { ger: 4, ita: 4, delay: -8, legit: -4 }, r: 'More aircraft, guns and advisers arrive, and with them more foreign control.' },
        { t: 'Keep to your own pace', h: 'No change', fx: { inf: { franco: 1 } }, r: 'You tell your staff that you will win this war slowly and completely.' }
      ]
    };
  },

  // Played between chapters when a rival general's influence comes close to yours.
  challenge(S, D, r) {
    const N = D.generals[r].name;
    return {
      title: `${N}'s ambitions`,
      text: `${N} is gathering support among the other generals, and some of your own staff officers have begun reporting to him. They say the war is going too slowly and that you are too fond of power. If his influence passes yours, the generals may decide they need a new commander.`,
      choices: [
        { t: 'Promote him out of the way', h: 'His influence falls · he resents it', fx: { inf: { [r]: -12 }, loy: { [r]: -15 }, rev: [r] }, r: `${N} is given a grand title and an office far from the front.` },
        { t: 'Win him over with a senior command', h: 'His loyalty rises', fx: { loy: { [r]: 22 }, inf: { [r]: 3, franco: 2 }, rev: [r] }, r: `${N} accepts the command and, for now, your authority.` },
        { t: 'Have your police watch him', h: 'His influence falls · terror', fx: { inf: { [r]: -8 }, terror: 3, legit: -2, rev: [r] }, r: `Reports on ${N}'s visitors and telephone calls reach your desk every morning.` }
      ]
    };
  }
};
