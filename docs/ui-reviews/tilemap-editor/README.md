# Tilemap editor review

Implementation starts from `c242d59` under the approved
[design](../../superpowers/specs/2026-10-20-tilemap-editor-design.md) and
[plan](../../superpowers/plans/2026-10-20-tilemap-editor.md).

World Editor now has Entities/Tiles modes, a 16-tile image palette and Brush,
Rectangle, Fill, Eyedropper and replacement Eraser. Scene schema, object/NPC and
portal definitions, source writer and GameSession boundaries remain in place.
Source scenes, renderer/map fixtures, art and baselines are preserved.

One tile registry drives atlas cropping and blocked terrain in runtime and both
validators. Gesture preview stays outside the document; confirmation validates
the complete patch and creates one history entry. Protected-spawn/portal edits
and canceled strokes leave the draft intact. Cursor and Space+drag pan reach the
entire map without moving the player.

Verification so far:

- Focused world browser **32/32**, including original renderer pixels for five
  maps, pure patch fixtures, 65,536-cell fill, 256×256 camera navigation,
  cancellation, viewport capture boundaries, focus/modifiers, hidden entity
  selection, collision/cache/Playtest, draft and asynchronous save.
- Python **42 pass, 2 skip** (Node absent; symlink creation unavailable).
- Architecture **0 issues**, world builder synchronized.
- Native CDP pointer review passes at **1400×900** and **390×844**: brush preview
  does not change source, release creates one undo, Escape cancels, pan leaves
  the document/session unchanged.
- Real browser source-save review passes on disposable roots: paint → save →
  compile/reload → second save, invalid422 and stale409 preserve source/generated
  bytes. Original sources remain unchanged.

Final whole-project browser: **145/145**, with all **12 baseline policies matching**.
All layout/world/dialogue builders and the asset inventory pass their checks.
The source scene files, original map/renderer fixtures and archive have no diff
against the starting revision.

Independent branch review found no critical/important implementation defects and
identified two focus/cursor issues. Both were addressed with regressions: initial
cursor uses spawn and is visible on first activation; leaving canvas focus cancels
a keyboard rectangle. Native CDP Tab exercises the focus transition at both sizes.
The browser iframe regression explicitly transports blur because background
headless iframes do not emit native focus events. Final main remains 145/145.
No deferred review findings remain. No skip counts as a pass and no capture
certifies performance. A 256×256 flood visits 65,536 cells; per-run milliseconds
are retained in report.json as a diagnostic.

Reproduce with a static server (8096 normally; isolated worktree used 8097):

```powershell
python tools/serve.py --port 8096
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/world-authoring.html --real-time --timeout 180 --profile-root tmp/browser-tests --output-prefix playtest
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --real-time --timeout 240 --profile-root tmp/browser-tests
python tools/check_baselines.py
python tools/review_world_authoring.py --output docs/ui-reviews/tilemap-editor
python tools/review_authoring_source.py --output docs/ui-reviews/tilemap-editor/source-save.json
```

Captures/logs stay local under the ignore policy. The pointer tool captures Entity
editing, Tile palettes and painted previews; `report.json` records input/browser
metadata. `source-save.json` records live saves on copies. V1 defers new map IDs,
resize, zoom, multilayer maps and autotiling.
