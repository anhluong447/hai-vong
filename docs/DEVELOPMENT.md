# Development workflow

The project remains plain HTML/CSS, Canvas and ES modules. Python serves it; Chrome
or Edge runs the browser tests. Node is optional for the non-browser suite.

For the current Hồ sơ refinement, see [visual review and staged captures](ui-reviews/dossier-polish/README.md).
Use `python tools/review_dossier.py --base-url http://127.0.0.1:8088` for native
runtime/fixture captures and `python tools/check_dossier_assets.py` for retained
artwork provenance. Capture and browser tests sequentially on this Windows setup.
New dossier visual tuning belongs in `styles/coastal/dossier-theme.css`; quest
photos are optional presentation metadata, with sample concept content confined
to authoring fixtures. PNG exports stay local under the existing Git ignore policy.

## Required rules

- Put player-facing text in `content/locales/vi.js`; put static no-JavaScript text
  in `content/fallback/`. This includes errors, accessibility labels and log text.
- Put character/case/dialogue/map definitions and tuning in `content/`.
- Use stable technical IDs in runtime logic. Locale labels must never control rules.
- Keep domain transitions immutable. Browser APIs belong to presentation,
  infrastructure or the world adapter, not domain code.
- UI handlers issue actions through `GameSession`; views do not calculate outcomes.
- Validate a replacement save before assigning it to the live session.
- Add small extension points where there is a concrete feature. Keep the formula
  sandbox ruleset separate from the newer gameplay ruleset.

## Adding content

1. Add catalog entries with stable keys and parameter placeholders.
2. Add definitions to the relevant content module. Reuse existing action/condition
   contracts for additional cases, characters, map objects or dialogue nodes.
3. Run content validation and verify all references.
4. Exercise the affected screen and save/load path in the browser suite.

A new mechanic needs a domain handler, an explicit action contract and an
application/UI path to invoke it. Keep narrative and balance editing outside the
handler. Adding a new phase, stat or save field also requires updating the save
validator and documenting migration behavior.

## Verification

```powershell
python tools/serve.py --port 8080
# In another terminal:
python tools/check_architecture.py
python tools/run_browser_tests.py
python tools/check_baselines.py
```

If Node is installed, `npm test` runs the formula-core and architecture/session/save
tests; the full UI, asset and long gameplay tests still run in the browser.

The architecture checker verifies import resolution, dependency boundaries,
catalog references, direct UI text, non-ASCII runtime literals and relocated review
links. It is a lightweight lexical policy check, not a compiler or a complete
proof that all possible inline prose has been removed. Browser tests verify execution.

The baseline comparison checks every field in eight formula policies and four
gameplay policies, including the 84-day run. Do not regenerate baseline files to
make a refactor pass. Rebaseline only for an intentional gameplay change, with its
reason and playtest evidence recorded separately.

## Files and artifacts

Menu-only update (2026-10-15): follow
[MENU-V2-IMPLEMENTATION.md](MENU-V2-IMPLEMENTATION.md) for the new six-tab menu,
including its scenery/ambient motion scope. The older menu layout and its deferred
scene work below are superseded for this screen; dialogue/HUD scope still applies.

The six-tab first implementation runs in `pixel.html`; open with Esc (M for map).
Use `pixel.html?legacy=1` for the older UI/ruleset regression path. The isolated
authoring preview is `tools/coastal-menu-v2-preview.html?tab=cases` (also skills,
equipment, team, map, settings). Verify local images using
`python tools/check_menu_v2_assets.py`; `python tools/review_menu_v2.py --base-url http://127.0.0.1:8088`
captures all six tabs and motion/lifecycle diagnostics. See
[review notes](ui-reviews/coastal-menu-v2/README.md) for tuning, schema migration and
visual/performance work that remains before production acceptance.

For coastal UI development, follow [UI-REPLICA-ROADMAP.md](UI-REPLICA-ROADMAP.md).
[UI-COMPONENTS-PLAN.md](UI-COMPONENTS-PLAN.md) is the historical v1 plan.

The active plan is now [UI-REPLICA-ROADMAP.md](UI-REPLICA-ROADMAP.md); the older
component plan is historical. Complete its R01-R04 measurement/inventory/capture
work first, then the fixed dialogue UI and attached decorations before motion
or wider integration. Scope revision 2 excludes background/character/world
matching. Reuse existing scene art, a neutral background or a new illustration;
keep scene production in a separate future backlog.
R01-R04 are now prepared in [Stage 0 specs](ui-specs/coastal-replica/README.md).
Use `python tools/coastal_reference_specs.py --check` to validate locked sources,
geometry/text mappings and generated sheets. The layer viewer is
`tools/coastal-reference-review.html`; its focused browser suite runs with
`python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-reference-tools.html`.
For native replica evidence, use `tools/capture_replica.py` and its readiness
contract; Chrome window size alone does not guarantee the content viewport.
Use the reference's native 1672x941 UI plane, identical UI fixtures and a settled
animation state for overlays/diffs. [ui-scope.json](ui-specs/coastal-replica/ui-scope.json)
classifies measured regions; mixed UI/context regions need production masks.
Compare UI shape/type/material/light inside UI masks, not whole-frame similarity.
Capture isolated UI and bright/dark/detailed context variants. Background, actor
pose and scene lettering never need to match the reference to pass a UI gate.
Current tooling has historical full-frame/ROI diagnostics and Stage 3 isolated
UI views/conservative masked comparison. Mixed fringe alpha is still unresolved.
Store versioned
art/layer/light/motion review evidence separately from browser behavior results.
Do not certify visual parity
from passing browser tests or trade the composition for mobile reflow.
Keep the user-selected reference set in `docs/ui-concepts/coastal-editorial-v1/`
with its prompt record and SHA-256 inventory. Do not overwrite it with later
iterations or use its rasterized text/buttons as runtime UI.

Stage 1 is available at `tools/coastal-replica-preview.html?version=1`. Edit the authoring
JSON in `content/ui/coastal-replica-pilot.json` and materials under
`assets/ui/coastal-replica/v1/masters/`, then run:

```powershell
python tools/build_replica_assets.py --build
python tools/build_replica_assets.py --check
python tools/check_architecture.py
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-replica-stage1.html
python tools/capture_replica.py --url 'http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=1' --screen dialogue --compare-reference --output docs/ui-reviews/coastal-replica-stage1/pilot-native-v4.png
```

The art builder uses Pillow for read-only PNG alpha inspection; install Pillow
only when it is absent. Runtime has no Python dependency. SVG and JSON outputs
are generated; change sources first. PNG master/export bytes remain identical.
Font vendoring is an explicit network maintenance task via
`tools/vendor_replica_fonts.py`; normal offline checks use committed fonts and
their hashes/licenses. See the [asset contract](../assets/ui/coastal-replica/v1/README.md).
Capture supports `--variant material-light`, `material-dark` and `typography`.
Use a new output version after art changes; historical captures are evidence,
not proof that the current manifest matches. Always run the main browser suite
and baseline checker before the focused suite overwrites `test_results.log`.

Stage 2 is retained at `tools/coastal-replica-preview.html?version=2`. Edit
`content/ui/coastal-dialogue.json` and `assets/ui/coastal-replica/v2/masters/materials.json`;
keep bitmap masters and [generation prompts](../assets/ui/coastal-replica/v2/prompts.json).
Never edit generated JS/export SVG/manifest directly. Its review has delivered
R09-R14 implementation and historical full-scene comparison evidence. Reusable
UI/context art is retained; G2 UI remains pending a scoped review. Continue
paper/wave/harbor/flower/notebook/date/choice/type/icon work, rather than portrait,
room or held-newspaper reconstruction. Save reusable logo sources; dialogue
logo display is optional.

```powershell
python tools/build_dialogue_replica.py --build
python tools/build_dialogue_replica.py --check
python tools/build_replica_assets.py --check
python tools/coastal_reference_specs.py --check
python tools/check_architecture.py
python tools/run_browser_tests.py --url http://127.0.0.1:8080/tests/index.html
python tools/check_baselines.py
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-replica-stage2.html --output-prefix playtest
python tools/capture_replica.py --url 'http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=2' --screen dialogue --compare-reference --output docs/ui-reviews/coastal-replica-stage2/dialogue-native-v5.png
```

Use `--output-prefix playtest` for focused suites to preserve main-suite evidence
used by the baseline checker. Stage 2 also supports `--variant props` for the
six PNG masters. Contact sheets and native captures must share the current
manifest after an art change; use a new filename/version rather than replacing
review history. The dialogue capture merges its supplemental fixture into the
report; the original Stage 0 fixture/reference lock remains unchanged. Inspect
alpha/native overlays and update the explicit G2 backlog in
[Stage 2 review](ui-reviews/coastal-replica-stage2/README.md). Historical validation
and full-frame MAE keep their original meaning; they cannot certify the revised
UI gate. Once UI geometry is stable, R15-R17 fix UI light/depth/compositing and
close static G2 before motion. Keep world/portrait providers interchangeable.

Stage 3 is retained at `?version=3`, initially on a dark neutral canvas. Edit
`content/ui/coastal-dialogue-ui.json` and `v3/masters/materials.json` for the fixed
overlay and local lighting. Its builder inherits three UI PNGs byte-for-byte;
do not regenerate scene/portrait art for a UI gate. Context is a separate slot.

```powershell
python tools/build_dialogue_ui.py --build
python tools/build_dialogue_ui.py --check
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-replica-stage3.html --output-prefix playtest
python tools/capture_replica.py --url 'http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=3' --screen dialogue --variant ui-dark --compare-ui --output docs/ui-reviews/coastal-replica-stage3/ui-dark-v3.png
python tools/capture_replica.py --url 'http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=3' --screen dialogue --variant ui-dark --flat-lighting --output docs/ui-reviews/coastal-replica-stage3/ui-flat-v2.png
```

Also capture `ui-light`, `ui-detail`, `stage`, material sheets and optional
`--logo`. `--compare-ui` accepts composed UI views only and writes transparent
masked overlay/diff plus a report with reference/candidate/mask hashes. Never
compare its interior score with an old full-frame score or treat the authored
mask as recovered reference alpha. Keep uncertain/occluded edges in the visual
backlog. Capture Chrome sequentially to avoid resource contention on the local
server. Run main/baselines before focused checks, retain raw logs, update
[Stage 3 review](ui-reviews/coastal-replica-stage3/README.md) and
[status](ui-specs/coastal-replica/status.json). R15/R16 and R17 evidence are delivered;
G2 visual corrections remain before production acceptance of Stage 4 motion.

Stage 4 is now the default preview. It adds motion authoring under the user's
continuation request while keeping G2/G3 acceptance open. Reuse the unchanged
v3 art, edit `content/ui/coastal-dialogue-motion.json`, then compile with
`tools/build_dialogue_motion.py`. Do not rebuild raster/context for motion.
Use pause, ×0.25, replay and hide/show controls; OS reduced motion settles all
effects. Main glyphs/hitboxes stay fixed. Read the
[motion sheet](ui-specs/coastal-replica/dialogue-motion.md).

```powershell
python tools/build_dialogue_motion.py --build
python tools/build_dialogue_motion.py --check
python tools/verify_dialogue_motion.py
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-replica-stage4.html --output-prefix playtest
python tools/run_browser_tests.py --real-time --reduced-motion --url http://127.0.0.1:8080/tests/coastal-replica-stage4-reduced.html --output-prefix playtest
python tools/capture_replica.py --url http://127.0.0.1:8080/tools/coastal-replica-preview.html --screen dialogue --variant ui-dark --motion-time-ms 2400 --output docs/ui-reviews/coastal-replica-stage4/ambient-2400-v4.png
python tools/capture_replica.py --url http://127.0.0.1:8080/tools/coastal-replica-preview.html --screen dialogue --variant ui-dark --record-motion ambient --output docs/ui-reviews/coastal-replica-stage4/loop-review-v3.png
```

`--record-motion interaction` and `slow` produce native sampled WebM clips with
encoder/timeline reports. Run each Chrome capture to completion before starting
another. Device realtime FPS is not inferred from encoding cadence. Default
capture stays neutral/settled; explicit samples record presentation time/profile
separately from fixture time. Re-run main/baselines and affected focused suites,
retain raw logs and compare settled native pixels with Stage 3 to catch lost
opacity/registration. Update [Stage 4 review](ui-reviews/coastal-replica-stage4/README.md)
and status with G2/G3 limitations; authoring implementation does not certify art,
device/GPU performance or production integration.

The earlier component-gallery milestones below describe the v1 prototype.
Replica work continues with G2 UI corrections after Stage 3, then R18-R45 and
their UI art/static/motion gates. Scene production is deferred. Runtime
milestones require the verification above plus focused browser checks for
focus/input, interrupted transitions and resource disposal. Store new review
screenshots/video separately and record the device/browser for performance checks.

The v1 component gallery is `tools/coastal-ui-preview.html`; pixel.html and
interaction.html use the same components. See [v1 review](ui-reviews/coastal-v1/README.md).
Use `python tools/run_browser_tests.py --reduced-motion` for the browser suite
with reduced motion enabled. Capture a review without replacing historical images:
`python tools/run_browser_tests.py --capture --url http://localhost:8080/tools/coastal-ui-preview.html --screenshot-path docs/ui-reviews/coastal-v1/dialogue-desktop.png --width 1366 --height 900 --virtual-time-budget 3500`.

Keep runtime resources in `assets/`, current authoring/playtest tools in `tools/`,
and durable documentation in `docs/`. Historical review images live in
`archive/development/reviews/`; completed migration scripts live in
`archive/development/migrations/2026-10-09/`.

Do not delete historical art sources or move an active atlas, generation input or
tool solely because it looks old. Resolve runtime/tool references first. Inventory
archive moves and verify their hashes; update links after relocation.

The legacy `archive/clb-hoi/` snapshot is preserved and is not imported by active code.
