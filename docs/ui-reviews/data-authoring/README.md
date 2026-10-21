# Data authoring — implementation evidence

Started 2026-10-20 from `19fe9c3`; user explicitly authorized the full M0–M8
roadmap. Initial fresh main: 95/95; eight formula and four gameplay baselines
matched. Native original captures and geometry are retained under `M0-before/`.

M0–M8 technical implementation is delivered. Entry points and controls:
[DATA-AUTHORING.md](../../guides/DATA-AUTHORING.md). No save schema, gameplay tuning,
baseline, source artwork or archive was intentionally changed.

| Milestone | Delivered evidence |
|---|---|
| M0 | Original six tabs + picker, browser/hash reports and runtime keyboard smoke in `M0-before/`; locked geometry in `docs/ui-specs/authoring/menu-geometry.json`; complete original maps/renderer fixtures in `tests/fixtures/` |
| M1 | Shared JSON contract, paired JS/Python validation fixtures, deterministic builder and runtime menu adapter; all measured default region bounds unchanged, max error **0 px** |
| M2–M3 | Preview menu editor, inspector, selection, drag/resize, snap/nudge, edit/play, undo/redo, per-source draft hash, canonical import/export, source-save states; real CDP pointer drag + resize + Escape + undo at 1672×941, 1280×720 and 390×844 |
| M4 | 8 manifest-backed asset packs, 85 verified records; grid metrics, native sprite frames/pivots and original pick bounds retained |
| M5–M6 | Prefab/scene validation, all authored NPC schedules, immutable map IDs, collision/portal arrival guards; separate world editor with placement/pivot/offset/footprint controls, spawn/delete, drafts/history/import/export and safe play; real desk drag + undo leaves session unchanged |
| M7 | All 5 maps match original materialized MAPS JSON and frozen original-renderer canvas bytes; DOM HUD authoring and corrected Stage 4 SVG dialogue authoring with 28 objects, attached decorations, independent transforms and aligned input |
| M8 | Optional loopback writer, resource allowlist, Host/Origin/token/body limits, hash conflicts, atomic source/generated writes with rollback; actual browser saves/compiled reload/stale409/invalid422 and menu save→reload→second save on disposable fixtures |

Initial integration checks before the dialogue correction: browser main **123/123**; eight formula and four
gameplay baselines match; architecture **0 issues**. Python discovers 40 cases:
38 pass, two skipped (Node absent and symlink creation unavailable). The real
Windows junction guard and real HTTP/browser client tests pass. All three builders
and the active asset inventory pass `--check`. Node execution was not available.

`after/geometry.json` contains every before/after bound; `after/report.json`
records Chrome/version/viewport/input results. `after/` retains six default menu
captures, editor/mobile captures, all five maps and HUD/dialogue previews. Three authored
menu examples move resources X45→69, widen skill detail365→385 and change
equipment column gap64→80; their combined export is `after/menu-example.json`.
`world-authored-desk.png` records a real one-tile move with independent bounds.
`world-pointer/report.json` additionally records desktop1400/compact390 real
world pointer moves, undo/redo/export round trip and hidden NPC schedules.
`source-save.json` records live browser source-save requests/hashes with
`realSourcesUnchanged:true`. Binary captures/logs follow existing local ignore
policy; these recipes and source fixtures remain reviewable in the repository.

Reproduce with the commands in DATA-AUTHORING.md. Before/after captures freeze
motion and wait for fonts/images. Do not rerun `--authoring-inventory` against
refactored code: that one-time migration flag writes the original fixtures.
`after/variants.json` compares 10 long/empty/locked variants against tracked code
reconstructed from `19fe9c3` in a temporary static root, sharing the unchanged
local assets. Original/current captures and hashes are retained. The final run
matched all10 variants pixel-for-pixel. Repeated diagnostic runs previously
observed sparse1–2/255 channel differences on at most12 pixels, consistent with
compositor rounding; the gate rejects any channel delta>2 or more than64 changed
pixels. Per-run values remain in the reports. Geometry remains exactly equal.
No reference was regenerated.
`evidence-inventory.json` records sizes and SHA256 for the retained evidence files,
including the preserved `final-main.log` and `final-browser.log`.

Scope decisions: UI authoring exposes major supported regions, not arbitrary
DOM descendants or behavior. The HUD editor targets CoastalHud; the dialogue
editor now targets ReplicaStage Stage 4. Its SVG crop/masks and motion retain
the existing source/build pipeline. M7 changes were demonstrated as reversible authoring drafts;
no new story content or permanent world relocation was requested. All maps
retain default authored placements. The tools do not certify device performance
or close existing replica art gates. The six normal tabs/picker were captured
before runtime edits; the edge matrix was reconstructed afterward from the
locked original revision. Existing menu/dossier fixture tests also run in main.

Review caught and fixed key-order-only save conflicts, obsolete draft hashes,
asynchronous source/draft mixups, map-ID-changing imports, stale tile caches,
unsafe play positions, overlay border offsets and interrupted pointer history.
Corresponding regressions now run in the main suite. Original source is recoverable
from `19fe9c3`; the original MAPS/renderer fixtures preserve equivalence evidence.
No asset files were moved or removed.

Editor language update: all three tools now use English controls, including
region/field labels, tab/map selectors, status messages and keyboard help.
The authoring namespace now has161 English entries in the shared text catalog;
game preview copy retains its Vietnamese content. `english/report.json` and
four screenshots record the browser audit across all menu tabs, world controls,
HUD and dialogue inspectors. Fresh main123/123, baseline12/12 and architecture0
passed after the update; the world builder is synchronized with the new keys.

Dialogue correction: the first M7 editor incorrectly previewed legacy DOM
DialogueView. It now loads the actual Stage 4 SVG composition and motion. Paper,
flowers and notebook move together; date and choices have separate controls.
Export preserves the existing composition and changes only its validated layout.
The deep link is `/tools/ui-layout-editor.html?screen=dialogue`.

Fresh correction checks: main **125/125**, focused authoring **17/17**, Stage 3
**17/17**, Stage 4 **17/17**, reduced motion **4/4**; all twelve gameplay/formula
baselines match and architecture reports zero issues. Python discovers 41 cases:
39 pass and two skip (Node absent; symlink creation unavailable). The dialogue UI,
motion, menu, screen and world builders pass their checks.

Run `python tools/review_authoring.py --dialogue-only` with the local server.
`after/dialogue-correction-report.json` records real Chrome pointer drag, one
history entry, undo and Escape cancellation. `after/dialogue-editor.png` shows
the complete corrected editor with English controls. For a native visual gate,
the tool isolates the same SVG component node from the editor's scaled canvas,
then compares it to the original Stage 4 at `19fe9c3`: **zero changed pixels**.
The workspace screenshot is retained separately; its canvas resampling is not
used as a pixel reference. No reference artwork or gameplay baseline changed.
`dialogue-correction-main.log` preserves the fresh main result independently of
the earlier `final-main.log`.

Dialogue object expansion: the editor now exposes **28** objects in a hierarchy,
including paper/wave, harbor, shore ink, speaker emblem/name, dialogue text,
flowers, notebook/handwriting, date paper/seal/text/phase, each choice and its
label, continue text/icon, and optional logo mark/text. Direct canvas selection
picks the smallest visible object; only the selected outline is shown. Groups
drag by their outline, whose bounds are clipped to the visible stage. Nested drag
coordinates compensate every ancestor scale. The optional logo toggle affects
preview visibility; source defaults retain the original composition.

Exact legacy three-group layouts migrate on import, preserving their offsets and
adding neutral child transforms. New partial layouts remain invalid. JS/Python
validators cover both forms. Review caught duplicate notebook component matches;
only outer matches are now wrapped. A browser regression checks notebook art
and handwriting move/scale together and rejects repeated transform ancestors.
The focused browser suite passes **18/18**, final main **126/126**, Stage 4
**17/17** and reduced motion **4/4**. All twelve baselines match. Python discovers
42 cases: 40 pass, two skip (Node absent; symlink creation unavailable). Architecture
reports zero issues; generated data remains synchronized. Main results and native
visual/pointer evidence are retained separately under `dialogue-objects-*` and
`after/`. `after/dialogue-objects-flowers.png` records direct object selection and
dragging; `after/dialogue-objects-logo.png` shows the optional logo controls.
