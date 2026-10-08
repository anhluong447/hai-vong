# Architecture

Plain HTML + ES modules, with no build step. The active world is `Canvas2DWorld`
in `src/infra/render2d/`, with no runtime library dependency. The former Three.js
adapter remains under `src/infra/render/` but is not imported by the entry point.

## Layers

```
            ┌──────────────────────────────────────────────────────────┐
            │  src/main.js — composition root (wires everything)       │
            └──────────────────────────────────────────────────────────┘
   ┌──────────────┐   ┌──────────────────────────────┐   ┌──────────────┐
   │   src/ui/    │   │          src/infra/          │   │  content/    │
   │ DOM views    │   │ render/ (Three.js world)     │   │ .vns scripts │
   │ implements   │   │ audio/  (Web Audio)          │   │ .json data   │
   │ ViewPort     │   │ storage/ content/            │   │              │
   └──────┬───────┘   └──────────────┬───────────────┘   └──────┬───────┘
          │  implement ports          │                          │ loaded via
          ▼                           ▼                          ▼ ContentPort
   ┌──────────────────────────────────────────────────────────────────────┐
   │ src/app/ — use cases: StoryDirector, GameSession, SaveService,        │
   │            ChapterRepository, Backlog.  Talks only to ports.js        │
   └──────────────────────────────┬───────────────────────────────────────┘
                                  ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │ src/core/ — pure logic, no DOM/Three/storage:                         │
   │   script/ScriptParser → program   script/ScriptRunner → commands      │
   │   state/GameState, Profile, conditions   model/CharacterRegistry      │
   └──────────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** arrows point inwards. `core` imports nothing outside `core`.
`app` imports `core` and `app/ports.js` only. `infra` and `ui` implement the ports.
Only `main.js` knows every concrete class. This is why `core` and `app` run
unchanged under Node in the test suite, using fakes for the ports (`tests/fakes.js`).

## How a line gets on screen

1. `ChapterRepository` fetches `c01.vns` and `ScriptParser` compiles it into a flat
   instruction list with labels. `@if` and `@choice` become jumps, so a script position is one integer.
2. `StoryDirector.run()` loops: `runner.next()` executes state-only instructions
   (flags, bonds, jumps) silently and returns the next **command**
   (`say`, `scene`, `choice`, `explore`, ...).
3. The director dispatches the command to a port: `view.say()`, `world.loadScene()`,
   `world.explore()`, and so on, then awaits the player.
4. Blocking commands resolve with `runner.choose(i)` or `runner.interact(hotspot)`.
5. Observers (backlog, debug panel, HUD) listen on the `EventBus` and never
   drive the story.

## Saves

`GameState` holds everything for one playthrough, including `pc`, which always points at
the line currently on screen, so loading re-presents exactly that line. It also stores a
presentation snapshot (scene, cast, audio) so `StoryDirector.restore()` can rebuild the
screen. `Profile` holds cross-playthrough data: endings reached (used to unlock the hidden
route), lines already read (used by skip), and settings. Both are versioned; add
migrations in `GameState.js › migrate()`.

Slots: `auto` (every `@save` checkpoint), `quick` (F5/F9), `slot1`…`slot6`.
The optional `presentation` snapshot also preserves player position/direction,
actor positions and camera framing. Existing version-1 saves without it still load.
Storage write failures are surfaced to the UI rather than reported as successful saves.

Menus pause the shared `PresentationClock` (dialogue auto/skip and story waits)
and world movement. Cancelling a session aborts pending movement and checks the
director generation after asynchronous transitions before changing the stage.

## Extending

| To add… | Do this |
|---|---|
| A chapter | Write `content/chapters/<route>/<id>.vns`, list it in `manifest.json`, chain it with `@next`. |
| A character | Add an entry to `content/characters.json` (id, name, short, aliases, colours, height). |
| A 3D location | Create `src/infra/render/locations/<id>.js` following `contract.js`, register it in `locations/index.js`, set `"built": true` in `content/locations.json`. |
| A sound | Put the file under `content/audio/` and map its id in `content/audio.json`. Synth placeholders live in `infra/audio/synth.js`. |
| A script directive | Add a builder to `DIRECTIVES` in `ScriptParser.js`. State-only effects go in `ScriptRunner.next()`; presentation effects go in `StoryDirector.#perform()` plus a port method. Add a test. |
| A new condition root | Extend `GameState.resolve()` and `CONDITION_ROOTS`. |
| Real character models (VRM/glTF) | Replace `CharacterFactory.createCharacter()`. Keep the contract: a Group facing +Z, feet at y=0, `userData.animate(t, moving)`, and `userData.height`. |
| Portrait art | Replace the placeholder in `DialogueView.#render()` with an `<img>` from `content/portraits/<id>/<expr>.webp`. |
| A new UI screen | Add a view under `src/ui/`, compose it in `UIRoot`, and reach the app only through `actions` in `main.js`. |

## Testing

- `tests/index.html` (in the browser, via the dev server) or `node tests/run-node.mjs`.
- `core` has unit tests; `story.test.js` plays every branch of Chapter 1 through the real
  director and session with fake ports, including save/load in the middle of a choice.
- The content tests compile every chapter in the manifest and check every speaker.

## Roadmap (not in the skeleton yet)

- Touch controls: a virtual joystick. Input already has `requestInteract()`, and the prompt is tappable.
- Portrait and CG art pipeline; expressions (`expr=`) driving model or portrait variants.
- glTF asset loading with a loading screen per location, plus a `kit.model()` helper.
- Music, and audio ducking under dialogue.
- A gallery or endings screen, powered by `Profile.endings`.
- Localization: UI text is already isolated in `src/ui/strings.js`.
