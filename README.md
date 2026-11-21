# Generalísimo

A pixel-art strategy game about the first months of the Spanish Civil War, played as Francisco Franco, from the Canary Islands in July 1936 to the generals' vote at Salamanca in September. Oregon Trail-style: travel legs, random events, resources, mini-games, and choices with consequences. Each run ends by comparing your choices with what really happened.

Draft 3 covers five chapters, from July to November 1936: The Flight, The Strait, The March North, Salamanca and Madrid. It has four mini-games (loading the Ju 52 against the clock, the military tribunal, the Salamanca council, and the three-day assault on Madrid), 47 random events, and a chiptune soundtrack with its own theme for each chapter and mini-game.

## Play it

Live site: https://wagglyrhombus17.github.io/generalisimo/

GitHub Pages serves this repository's `main` branch directly, so every push to `main` updates the site.

## Run it locally

The game is plain HTML, CSS and JavaScript modules with no build step. Modules and data files load over HTTP, so serve the folder instead of opening `index.html` from disk:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

To package the game for itch.io or another host, run `python3 tools/build.py`. It writes `dist/` and `generalisimo-web.zip`.

## Layout

```
index.html              page shell: stage, HUD, overlay containers
styles/game.css         all styling (sizes in container units, so the 16:9 stage scales as one)
data/
  events.json           landmark events ("anchors") and the random event deck
  generals.json         generals: starting influence, loyalty, portrait traits
  chapters.json         chapter cards, the story script (steps), scenes, map locations, battles, endings
  tribunal.json         case files for the military tribunal mini-game
  music.json            the soundtrack: one theme per chapter and mini-game
src/
  main.js               boot, keyboard, title screen and game switching
  settings.js           music, sound effects and motion settings (saved in the browser)
  audio/                chiptune music sequencer and sound effects (Web Audio API)
  engine/               pixel framebuffer, palettes, sprites (incl. portraits)
  scenes/               one file per scene: road (the march), island, airfield, sky, night, strait
  screens/              HUD, event dialog, campaign map, generals board, title/chapter/ending cards
  minigames/            ju52.js (load the transport), tribunal.js (case files), council.js (Salamanca meetings and vote), siege.js (Madrid)
  game/                 state + seeded RNG, effect interpreter, story runner, battles, special events
```

## Adding content

Most content is data. To add a random event, append to `deck` in `data/events.json`:

```json
{ "id": "unique-id", "pool": "march", "title": "Title", "text": "What happens.",
  "req": { "min": { "ger": 30 } },
  "choices": [
    { "t": "Choice label", "h": "Hint shown to the player", "fx": { "ammo": 10, "loy": { "mola": 5 } }, "r": "Result text." }
  ] }
```

Pools are `flight`, `strait` and `march`. Effect keys are documented at the top of `src/game/effects.js`. Events whose odds depend on the game state live in `src/game/specials.js`.

The story order is the `steps` list in `data/chapters.json`. Step kinds: `card`, `route`, `ev`, `rand`, `move`, `battle`, `air`, `tribunal`, `council`, `vote`. A step with `"if": "flag"` or `"unless": "flag"` runs only when that story flag is set or unset.

## Music

The soundtrack lives in `data/music.json`: one theme per chapter and mini-game, each with lead, harmony, bass and drum tracks written as bars of eight eighth-note tokens (a note name plays, `-` holds, `.` rests; drums are `k` kick, `s` snare, `h` hi-hat, `t` tom, `c` crash). The game synthesises it live with the Web Audio API.

To open the music in MuseScore or another notation program, run `python3 tools/export_musicxml.py`. It writes one `.musicxml` file per theme to `music/`, plus a zip of them all.

## Determinism

All game randomness goes through `rand(S)` in `src/game/state.js`, seeded per run, so a seed replays the same way. Scenery uses its own fixed random numbers.
