# Architecture — CLB Báo Chí sandbox

Plain HTML + CSS + Canvas + ES modules. No dependency or build step.

```
src/main.js                 composition and UI actions
src/core/config.js          parameters and validation
src/core/fixtures.js        temporary staff and fixed 96 subjects
src/core/rules.js           pure math and publication preview
src/core/game.js            immutable state transitions
src/app/Simulation.js       policies using actual core actions
src/app/SaveService.js      isolated and validated localStorage save
src/infra/DebugMap.js       generated room, movement, stations
src/ui/dom.js               safe DOM helpers
tests/                      core and real browser UI tests
archive/clb-hoi/            verified legacy snapshot
```

Core imports only core. UI/storage never duplicate formulas. The editor preview
and `closeWeek` use `publicationPreview`. Biên tập recomputes article values while
retaining Q from the original interview.

Add story content/maps after validating the loop. Legacy engine and assets can
be selectively adapted from the archive later; active entry points do not import them.

## Bible gameplay and pixel map

`gameplay.html` and `pixel.html` compose the same `src/gameplay/main.js` UI
and immutable `src/gameplay/engine.js`. Pixel mode attaches a persistent
Canvas world without rebuilding it on state changes. Its separate save
contains gameplay state and room/tile position.

`src/pixel/maps.js` defines four tile maps, collision footprints, portals,
NPC schedules, BFS paths and safe spawn validation. `PixelWorld.js` loads
local PNG atlases, runs movement at a fixed tick, sorts sprites by feet,
tracks camera and emits nearby interactions to the shared UI. It does not
charge time/energy or compute article results itself.

`assets/pixel/` contains the original prototype atlases and metadata.
`tools/build_pixel_assets.py` reproducibly authors them with standard Python.
See `docs/PIXEL-MAP.md` for map interactions and limitations.
