# Câu Lạc Bộ Hỏi

A story-driven 2D visual novel with anime character sprites in plain HTML, Canvas and ES modules, with
no build step or runtime library dependency. Story bible and drafts are in `Story/`;
the original prototype is `something.html`. The previous Three.js renderer remains
in `src/infra/render/`; the active renderer is `src/infra/render2d/`.

## Run

ES modules need `http://` (not `file://`):

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Then open <http://localhost:8080>. The script uses Android Studio's `jwebserver` if
available, otherwise a small PowerShell server. Any static server works.

Dev shortcuts: `?chapter=c01&label=room0_enter` jumps to a label, and `?debug` shows live story state.

## Controls

| | |
|---|---|
| Space / Enter / click | Advance dialogue |
| 1–9 | Pick a choice |
| WASD / arrows, Shift | Walk, run (during exploration) |
| Drag / wheel | Rotate / zoom camera |
| E | Interact with a hotspot |
| A (during dialogue) | Toggle auto mode |
| Hold Ctrl | Skip lines already read |
| L · N · Esc | Dialogue log · Notebook · Menu |
| F5 · F9 | Quick save · Quick load |
| `` ` `` | Debug panel |

## Test

- Browser: <http://localhost:8080/tests/>
- Node: `node tests/run-node.mjs`
- Edge headless: `powershell -ExecutionPolicy Bypass -File tools/test_unit_tests.ps1`
  (server required; returns a failing exit code if tests fail or do not finish).
- Sprite and atmosphere preview: <http://localhost:8080/tools/art-preview.html>.
- Painted anime atlases: `content/sprites/anime/` (four directions, standing/walking poses).
- Real UI playthrough: `powershell -ExecutionPolicy Bypass -File tools/test_unit_tests.ps1 -Url http://localhost:8080/tests/game-smoke.html`.

## Layout

```
index.html           entry page (import map pins Three.js)
styles/main.css      UI styles
src/
  main.js            composition root
  core/              pure logic: script parser/runner, game state, conditions
  app/               use cases: director, session, saves (talk to ports only)
  infra/             adapters: Three.js world, Web Audio, localStorage, fetch
  ui/                DOM views: dialogue, choices, HUD, menus, notebook
content/             story data plus reusable assets (assets/textures/, chapters, characters, locations, notebook, audio)
tests/               test harness + suites (browser and Node)
docs/                ARCHITECTURE.md, SCRIPT_FORMAT.md
tools/serve.ps1      dev server
```

Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Writers only need
[docs/SCRIPT_FORMAT.md](docs/SCRIPT_FORMAT.md).
