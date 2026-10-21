# Editor usability — 2026-10-21

Scope: World/Entities, Tileset, Menu, HUD and Stage 4 dialogue authoring.
All editor chrome stays English; the real game preview keeps Vietnamese content.

The workbenches share a dark shell, grouped actions, clear selection and unsaved
badges, searchable object lists, visible focus, and separate properties panels.
World painting keeps layers and tools beside the map. Tileset Properties and
Import PNG use separate tabs, with a selected-tile preview and staged Floor,
Wall and Overhead presets. Presets require Apply Properties.

Menu keeps its six tabs and real renderer, with object search, zoom/snap and
grouped file/draft actions. HUD/dialogue use the same browser and properties
layout. Small screens put panels below the preview; controls remain scrollable.

## Evidence

- Full browser suite: **168/168**. Both preserved baselines match: **8 sandbox**
  policies and **4 gameplay** policies. Architecture: **0 issues**, 1416 text keys.
- Menu, screen, dialogue and world generated-output checks passed.
- Focused authoring browser suite: **18/18**. Covers shared panel styling,
  compact toolbar/footer fit, unobstructed HUD object selection, history,
  command isolation, import/export and nested dialogue transforms.
- World/tileset focused browser suite: **55/55**, including four new integration
  cases for staged presets, inspector tabs, palette navigation and save snapshots.
- Native CDP input: Menu, HUD and dialogue at **1400×900** and **390×600**;
  search, selection, nudge/drag and undo/redo passed. Menu drag remains one
  transaction and leaves the game session unchanged.
- Native World input: **1400×900** and **390×844**; real painting, undo,
  cancellation, pan, layer keyboard selection and tile `0` versus `null` passed.
- Dialogue visual comparison with revision `19fe9c3`: **0 changed pixels**,
  **0 maximum channel difference** at 1672×941. Direct flower/panel drag,
  undo and Escape cancellation passed.
- Menu default geometry comparison: **0 px maximum error** across the six tabs.
- Actual source-save client, conflicts, validation, deferred snapshot and reload
  checks passed in an isolated fixture. The project source was not saved by
  these review scripts.

Review found missing panel styles on the Menu Editor's shared CSS roots. The
computed-style/scroll regression failed before the fix and passed afterward.
Native compact review also exposed toolbar overlap and a sticky status bar
covering object buttons; both have browser regressions and native verification.

Generated screenshots/reports are local review artifacts:

| Location | Evidence |
| --- | --- |
| `layouts/workbenches.json`, `layouts/workbench-*.png` | Current editor chrome and native desktop/compact input |
| `world/report.json`, `world/05-*.png`, `world/06-*.png` | Native map painting and compact tile palette |
| `dialogue/dialogue-replica-comparison.json` | Unchanged Stage 4 render and direct object input |
| `source-save.json` | Fixture-only source save/reload checks |

The full historical menu edge-variant capture was attempted but its reconstructed
preview did not become ready. It is not claimed as passed; the focused current
workbench review, menu geometry gate and dialogue visual gate above completed.

## Reproduce

Run a static server at port 8096, then execute Chrome commands sequentially:

```powershell
python tools/review_authoring.py --base-url http://127.0.0.1:8096 --workbenches-only --output docs/ui-reviews/editor-usability/layouts
python tools/review_world_authoring.py --base-url http://127.0.0.1:8096 --output docs/ui-reviews/editor-usability/world
python tools/review_authoring.py --base-url http://127.0.0.1:8096 --dialogue-only --output docs/ui-reviews/editor-usability/dialogue
python tools/review_authoring_source.py --output docs/ui-reviews/editor-usability/source-save.json
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --profile-root tmp/browser-tests --real-time --timeout 240
python tools/check_baselines.py
python tools/check_architecture.py
```

Use the static server for review, since tileset tests import temporary images.
Source-save review starts its own fixture server. No art, map source, tileset
catalog, layout source, gameplay rules or baseline values are changed here.

Usage: [all authoring tools](../../guides/DATA-AUTHORING.md),
[World/Tileset walkthrough](../../guides/WORLD-EDITOR-GUIDE.md).
