# Generalísimo

A pixel-art strategy game about the first months of the Spanish Civil War, played as Francisco Franco, from the Canary Islands in July 1936 to the generals' vote at Salamanca in September. Oregon Trail-style: travel legs, random events, resources, mini-games, and choices with consequences. Each run ends by comparing your choices with what really happened.

Draft 1 covers four chapters: The Flight, The Strait, The March North and Salamanca.

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
src/
  main.js               boot, keyboard, title screen and game switching
  engine/               pixel framebuffer, palettes, sprites (incl. portraits)
  scenes/               one file per scene: road (the march), island, airfield, sky, night, strait
  screens/              HUD, event dialog, campaign map, generals board, title/chapter/ending cards
  minigames/            ju52.js (load the transport), council.js (Salamanca meetings and vote)
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

The story order is the `steps` list in `data/chapters.json`. Step kinds: `card`, `route`, `ev`, `rand`, `move`, `battle`, `air`, `council`, `vote`.

## Determinism

All game randomness goes through `rand(S)` in `src/game/state.js`, seeded per run, so a seed replays the same way. Scenery uses its own fixed random numbers.
