# World map foundation verification

Feature: regular PNG tileset import/properties and four tile layers. Source
checkpoint: `388b3e1`; implementation lives on `feature/world-map-foundation`.
See [spec](../../design/specs/2026-10-21-world-map-foundation-design.md).

## Acceptance evidence

- Shared JS/Python cases distinguish tile 0/null, sparse IDs, malformed catalog
  and layer grids, directional edges and composition under overhead decoration.
- Focused browser coverage includes imported image painting, properties history,
  scene v1→v2→undo, context cancellation, layer lock/visibility, source snapshot
  races and stale import-preview rebase.
- `review_world_authoring.py` uses native CDP pointer/key input at 1400×900 and
  390×844: entity drag, tile stroke, Alt+2 layer selection, zero/null overlay
  painting/erase, undo, Tab/Escape cancellation and camera pan.
- `review_authoring_source.py` imports a generated four-tile PNG, persists
  properties and layer placements, reloads, enters Playtest and checks collision.
  It corrupts/restores the copied PNG to exercise hash failure/recovery. All
  writes are inside a disposable source fixture; original source hashes match.
- Writer failure injection covers stale hashes, concurrent import, edits during
  staging, rollback and restart recovery. Scene saves support four 256×256 grids.

Local ignored evidence: `report.json`, `source-save.json` and captures
`05-tiles-native-*`, `06-tiles-compact-*`. The report records the actual fill time
for 65536 cells; it is a measurement, not a performance guarantee.

## Commands

```powershell
python tools/check_architecture.py
python -m unittest discover -s tests -p "test_world*.py"
python -m unittest discover -s tools -p "test_authoring*.py"
python tools/build_world_scenes.py --check
python tools/run_browser_tests.py --url http://127.0.0.1:8098/tests/world-authoring.html --profile-root tmp/browser-tests --real-time
python tools/review_world_authoring.py --base-url http://127.0.0.1:8098 --output docs/ui-reviews/world-map-foundation
python tools/review_authoring_source.py --output docs/ui-reviews/world-map-foundation/source-save.json
python tools/run_browser_tests.py --url http://127.0.0.1:8098/tests/index.html --profile-root tmp/browser-tests --real-time --timeout 240
python tools/check_baselines.py
```

Chrome commands run sequentially on Windows. Python/Chrome need local temp/IPC
permissions. Main suite uses real-time mode with 240-second timeout: the default
40 seconds is too short for the expanded suite, and virtual time caused two
unrelated UI/font readiness failures. Node is unavailable in this environment.

## Boundaries and deliberate decisions

- Default scene source bytes, original catalog, art, save schema and rulesets are
  preserved. No baseline is regenerated.
- Imported atlas hashes are mandatory; the legacy atlas keeps its existing pack
  validation and a null hash in the new normalized metadata.
- Legacy hydrated layer metadata is non-enumerable to keep old MAPS snapshots.
- Catalog save allows 4 MiB, correcting the initial plan's 1 MiB limit for 8192
  records. Old save API remains 1 MiB; new scene save is 8 MiB; PNG import 12 MiB.
- PNG persistence follows existing ignored-binary/asset-pack workflow; static
  hosting supports preview and export, not automatic disk writes.
- Layer ordering is separate from draw priority. Collision unions solid tiles
  and blocked edges; passable decoration does not cancel a wall underneath.
- Autotile, regions, event pages and map expansion beyond the existing five
  scenes belong to subsequent roadmap work.

Final verification: focused browser **51/51**, main browser **164/164**;
**13 world tests** and **40 authoring tests** run, with two environment skips.
Architecture reports zero issues and generated world data is synchronized.
Eight formula and four gameplay baseline policies match unchanged. Node is
unavailable. The native 256×256 fill measured **80 ms** in the final run
(22.3 ms previously); measurements are diagnostic, not a performance guarantee.

## Whole-branch review and fixes

One independent review identified the following issues. Each was reproduced by
a failing regression before the fix, then passed in the final suites:

- Scene Undo/Redo could install missing or reassigned tile IDs. History now
  records tile identities and validates the candidate before changing stacks.
- Undoing an import while its native save was pending could reuse its IDs.
  Pending publication identities stay protected; later property edits stay dirty.
- Scene save accepted an ID different from the resource filename. Both route
  and builder now reject this before writing source.
- Rejected local drafts lacked recovery UI. The original envelope is preserved,
  Save Draft cannot overwrite it, and Download/Revalidate actions are available.
  Revalidation still checks source hash, stable identities and project validity.
- Ctrl+Y did not redo tileset properties. It now shares the panel history with
  Ctrl+Shift+Z and respects text/select/contenteditable focus. This was treated
  as required keyboard behavior rather than deferred polish.

No findings declined or minor findings deferred. No second review was dispatched.

Implementation decisions, in order: native Windows bookkeeping replaces POSIX
skill helpers (portability cost only); legacy hydrated layers are non-enumerable
(clones must normalize them again); legacy atlas SHA remains null (existing pack
validation supplies integrity); catalog save limit is 4 MiB (larger local request
cap); optional working-catalog injection moved into the tileset UI task (legacy
callers retain defaults). Real-time browser timeout is 240 seconds because the
default is too short for the expanded suite; tests and baselines were unchanged.
