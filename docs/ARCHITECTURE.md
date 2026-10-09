# Architecture — CLB Báo Chí

Updated 2026-10-09. Plain HTML/CSS, Canvas and ES modules; runtime has no build
step. Art authoring uses the offline asset builder described below. Two explicit rulesets remain: the original formula sandbox and the newer
gameplay/pixel prototype. Their calendars, scores and state schemas are distinct.

## Responsibility boundaries

```text
content/
  locales/vi.js              player-facing text and parameterized templates
  gameplay/                  roster, cases, quest steps, balance, phase/city data
  maps/definitions.js        authored layouts, objects, portals and NPC schedules
  dialogue/                  nine mock interaction dialogue graphs
  sandbox/                   formula sandbox balance and temporary fixtures
  manifest.js                active gameplay pack and content version

src/gameplay/main.js          composition and startup validation
src/gameplay/engine.js        stable public facade for gameplay integrations
src/domain/
  session.js                 immutable transitions and day orchestration
  calendar.js                week/day/phase progression
  people.js                  availability queries and effective stats
  journalism.js              research, drafts, editorial queue, publication, summary
  personal.js                activities, gifts, romance, tools and upgrades
  actions.js                 guards, costs and structured events
  validateSave.js            state validation and v1-to-v2 migration
src/application/GameSession.js
                             session ownership, commands, replacement and snapshots
src/presentation/
  gameplay-controller.js     screen/modal lifetime and browser action wiring
  gameplay-panels.js         cases, quests, team, editorial, reports and feedback
src/infrastructure/
  GameplaySaveService.js     injected storage and versioned save envelopes
src/shared/
  text.js                    catalog lookup, interpolation and legacy event display
  documentText.js            translated HTML shell titles
  validateContent.js         authoring reference checks
src/pixel/
  maps.js                    map facade, collision, pathfinding, safe spawn
  PixelWorld.js              input/movement, Canvas rendering and interactions
  animation.js               independent animation frame selection
  interaction-main.js        dialogue test page composition
  interaction-scenes.js      compatibility facade for dialogue definitions
src/ui/                      safe DOM helpers and reusable dialogue portraits
src/world/                   separate input, movement and Canvas rendering services

src/core/                    original formula rules and immutable transitions
src/app/                     formula simulation and storage services
src/main.js                  formula/debug UI composition
src/infra/DebugMap.js         original debug world adapter
tests/                       domain, content, save, browser UI and asset checks
tools/                       serving, verification, authoring and playtests
  coastal_reference_specs.py Stage 0 spec validation and generated sheets/inventory
  coastal-reference-review.* authoring-only layer/overlay/diff viewer
  browser_cdp.py             local Chrome transport for capture and wall-time tests
  capture_replica.py         native viewport/DPR and fixture-readiness capture
docs/ui-specs/coastal-replica/ measured envelopes, planned text fixture and asset backlog
archive/development/         historical reviews and completed migration scripts
archive/clb-hoi/             unchanged historical game snapshot
```

Application commands call domain transitions; views render state and issue actions.
Storage adapters validate through domain contracts. Domain/core imports are limited
to their own modules, shared utilities and content; they do not use DOM, storage,
network or animation-frame APIs. Application code does not import storage adapters.
Composition creates the session, views and storage service with explicit dependencies.

The original config/fixtures modules and newer engine/maps/dialogue modules retain
compatibility facades. Existing tools and tests can keep their import paths.
Active entry points never import the legacy archive.

Stage 0 replica specs and review tools are authoring resources; runtime/domain
modules do not import them. [Stage 0 handoff](ui-specs/coastal-replica/README.md)
records the 1672x941 coordinate plane, layer/source inventory and capture contract.
`window.replicaCapture.prepare` is reserved for the R08 preview, not implemented
in current game pages. Planned fixture text keys move into the live catalog when
the corresponding UI is built. Visual fixture state never replaces gameplay saves.

## Text and content

Player-facing prose, dialogue, labels, errors, accessibility text and page titles
are owned by content. Runtime logic uses stable text keys and technical IDs.
`t(key, parameters)` interpolates templates and rejects missing keys/parameters.
`eventText` formats keyed events and historical rendered messages.
The historical skill identifier migrates to `synergy`; its translated name is
used only for presentation. Text-service contract failures use developer diagnostics.

Content is authored as ES modules to preserve synchronous domain APIs in browsers
and Node. Map/dialogue helpers generate authored data, not gameplay effects.
Startup validation checks duplicate IDs, stat references, map sizes, portal
destinations, dialogue speakers and graph edges.

Gameplay defaults/tuning live in `content/gameplay/balance.js`; formula defaults
live in `content/sandbox/balance.js`. Formula previews and publication share the
original pure math functions. Their numeric behavior is preserved.

## State, events and saves

`GameSession` assigns a new state only after a successful command or validated
replacement. Its snapshot returns a clone. Domain helpers mutate only the working
clone owned by a transition, preserving the caller's input.

New gameplay logs store `{day, phase, textKey, params}`, formatted by the UI.
The formula sandbox retains its historical rendered journal format. Roster/case
display text also remains in snapshots for compatibility; converting all state to
content IDs requires a separate save migration.

Gameplay state is version 2. Saves have kind, envelope version, content version,
mode, timestamp, state and optional world position. The service reads historical
raw gameplay v1 states and historical `{state, world}` pixel saves. Validation
covers numeric fields, phases, roster/stat IDs, case/message references, articles,
quests, reports, log keys and metrics before replacement. Storage keys stay isolated.

World restoration retains safe-spawn fallback for unknown maps or blocked positions.
Storage and clocks are injected, allowing tests without real browser storage.

## World timing and lifecycle

Calendar progression is action-driven. Walking and rendering spend no game energy
and do not advance the day. PixelWorld emits interactions to the controller and
keeps a persistent Canvas across UI renders; it disposes resources on page exit.
Animation frame selection remains independently testable.

PixelWorld coordinates separate PixelInput, MovementSystem and WorldRenderer
services. Input owns keyboard/pointer subscriptions and releases them on disposal;
movement advances tile steps and routes; rendering owns camera/sign/Canvas drawing.
The prototype does not require a generic ECS, global event queue or engine migration.

## Future work

### Coastal visual target

The active visual target is a faithful reconstruction of the fixed UI and its
attached decorations in the four original concepts, governed by
[UI-REPLICA-ROADMAP.md](UI-REPLICA-ROADMAP.md), scope revision 2. Backgrounds,
characters, held props and world art are replaceable context; matching their
camera/pose/identity is deferred and never blocks UI gates. The v1
components below remain a technical prototype; their visual implementation has
not passed the replica gates. Future screen compositions use a 1672x941 design
stage with uniform scaling, authored art layers/masks and separate dialogue,
menu, dossier and HUD compositions. The world remains a separate context provider.
Production assets, layout/light/motion sheets and deterministic captures follow
the roadmap. Stage 2 implements the
isolated static dialogue composition below; G2 now requires a scoped UI review.
[ui-scope.json](ui-specs/coastal-replica/ui-scope.json) classifies all 169 measured
regions. UI/context separation and masked comparison are planned at R14, not yet
provided by adding this documentation. Bright/dark/detailed context variants
check UI readability and compositing without scene reconstruction requirements.
Preserve session/text/input/save/lifecycle contracts
while replacing the presentation. Art, static visual, motion, behavior and
performance reviews are distinct acceptance gates.

### Replica authoring — Stage 1, Stage 2 and Stage 3

`src/ui/replica/ReplicaStage.js` owns a fixed 1672x941 SVG scene with seven
independent planes, uniform fit/letterboxing, scaled input, keyboard focus and
resource disposal. It receives content and structured callbacks; it does not
import domain/session/storage or advance gameplay time. It is mounted only by
`tools/coastal-replica-preview.html`, separately from the coastal v1 gameplay UI.
The default preview selects Stage 4 UI motion; `?version=1` / `?version=2` /
`?version=3` preserve the earlier pilot, full-scene reconstruction and static UI.

`content/ui/coastal-replica-pilot.json` owns authored placements, font styles,
choices and contact-sheet fixtures. `tools/build_replica_assets.py` compiles it
to `coastal-replica-data.js`; `coastal-replica.js` exposes the runtime facade.
Displayed copy comes from `content/locales/vi.js`. Asset IDs remain technical.
`assets/ui/coastal-replica/v1/` retains editable material inputs, native bitmap
masters, generation prompts, deterministic SVG exports and a versioned manifest.
The builder records each instance's layer, placement/crop/pivot, text keys and
source hash. Local font files/licenses/pinned upstream hashes live under
`assets/fonts/coastal-replica/`. Source reference art stays under `docs/` and is
never loaded as a flattened runtime UI.

Preview capture awaits decoded art/local fonts, resets choice/layer inspection,
locks interaction and publishes `replicaCapture.prepare`. Capture, contact sheets,
font measurements and overlay/diff are authoring evidence; visual acceptance is
recorded in [Stage 1 review](ui-reviews/coastal-replica-stage1/README.md). Read the
[asset contract](../assets/ui/coastal-replica/v1/README.md) before extending this pack.

`content/ui/coastal-dialogue.json` owns Stage 2 art instances, desk/paper clips,
uniform portrait registration, affine prop placement, typography and inspection
fixtures. `tools/build_dialogue_replica.py` generates `coastal-dialogue-data.js`,
while `coastal-dialogue.js` is its content facade. The version 2 manifest tracks
19 independent exports and 29 instances; its PNG bytes stay native, and SVG
paths/grain are generated from `v2/masters/materials.json`. Stage 1 sources remain
unchanged. See the [Stage 2 contract](../assets/ui/coastal-replica/v2/README.md).

The renderer receives this composition rather than importing authoring specs.
It creates unique desk/paper clips per instance, paints clean desk art over the
portraits, puts shore ink above the paper and keeps foreground props independent.
Environment lettering uses catalog keys just like dialogue text; tiny newspaper
rules remain graphics with an explicitly unresolved microcopy task. Be Vietnam
Pro reuses the existing local OFL font pack alongside the three Stage 1 families.
Typography measurements convert local text bounds into native scene coordinates.

SVG art ignores pointer events; separate choice and continue targets receive
input through transparent foreground pixels. Capture validates catalog/view
before mutating state, resets selection/layer state, locks interactions and awaits
decoded SVG resources and explicit font faces. The authoring capture tool merges
`dialogue-production.json` into its recorded fixture; runtime never imports it.
Static comparison and open G2 corrections are recorded in
[Stage 2 review](ui-reviews/coastal-replica-stage2/README.md). Existing full-scene
captures, asset packs and tests are historical evidence; their scene/portrait
mismatches no longer block G2. The next composition boundaries are an independent
UI overlay, replaceable context/portrait slots and small anchor adapters for HUD
prompts/collaborator tags. Preserve paper, wave, flowers, notebook and harbor
print attached to UI; scene desk/newspaper/cup/poster are context. Store the
reusable logo mark and catalog-rendered wordmark; dialogue logo is optional.
R15-R17 handle UI lighting/compositing; R18-R23 handle UI motion/effects. New
world/collision/actor art is a separate future backlog. Domain, gameplay
entries, session/save schemas and calendar behavior are unchanged.

Stage 3 separates fixed dialogue UI into `content/ui/coastal-dialogue-ui.json`,
compiled by `tools/build_dialogue_ui.py` and exposed by `coastal-dialogue-ui.js`.
The v3 manifest separates 14 UI assets from one reused replaceable context plate.
`DialogueUiComposition.js` paints the concrete overlay; `ReplicaStage` retains
resource ownership, uniform fit, input and disposal. Content owns shadow/wash
profiles and backdrop presets. Five local shadow filters, a paper clip and a
notebook alpha mask get unique instance IDs. Notebook edge and PNG share one
shadow; glyphs and context are unfiltered. Optional logo and static lighting
toggles do not change gameplay state. No motion framework is added yet.

Capture supports `--compare-ui`, `--flat-lighting` and `--logo`. The reference-owned
v3 mask is a conservative interior diagnostic, not complete extracted alpha;
mixed/occluded fringes remain a visual review limitation. `compareMasked` excludes
context pixels outside the mask and exposes alpha-only errors. Stage 3 review
stores light/dark/detailed/scene, contact and A/B evidence separately from old
full-frame scores. Read [Stage 3 review](ui-reviews/coastal-replica-stage3/README.md)
for remaining G2 UI corrections before motion. Passing behavior tests does not
certify parity.

Stage 4 reuses the v3 art pack. `content/ui/coastal-dialogue-motion.json` compiles
offline into motion data; its facade combines it with the static UI composition.
`DialogueMotion.js` is a concrete presentation controller owned by `ReplicaStage`,
not an engine or a gameplay scheduler. One RAF clock updates wave contour/art,
decoration transforms, paper/choice transitions and a clipped sheen. Parameters,
pivots and periods come from content. Native hitboxes and main reading baselines
remain fixed; existing harbor transforms and opacity are preserved. Notebook
edge, PNG, wash and handwriting share an outer transform; lettering stays outside
shadow filters. Renderer replacement aborts old SVG listeners and rebinds the same
clock; disposal removes frame/media/visibility listeners. Three expensive grain
SVG materials are rasterized once into native browser caches for motion; source
files stay intact, static/reduced capture uses original SVG, and temporary blob
URLs are revoked on disposal. Small cached alpha/color rounding is not art parity.

Reduced motion settles immediately, hidden tabs pause without catch-up, and
interrupted transitions continue from current progress. Callbacks remain immediate
and never wait for a transition. Static capture freezes a neutral settled state;
optional sampled time and WebM review use a separate presentation clock. Native
recorded frames and browser encoding are diagnostics, not device-performance
certification. Stage 4 authoring proceeds under the user's continuation request;
G2 static corrections and G3 visual/device review remain open. See the
[motion sheet](ui-specs/coastal-replica/dialogue-motion.md) and
[Stage 4 review](ui-reviews/coastal-replica-stage4/README.md).

### Coastal UI components (v1)

The user-selected art reference and component roadmap are documented in
[UI-COMPONENTS-PLAN.md](UI-COMPONENTS-PLAN.md). The first runtime version is used
by pixel.html and interaction.html; the formula/debug entry remains independent.
Preserve the four reference images, prompts and hashes in
`docs/ui-concepts/coastal-editorial-v1/`.

Concrete DOM/SVG views live under `src/ui/coastal/`: CoastalShell, DialogueView,
MenuView, OverlayHost, surfaces and MotionScope. The existing presentation
controller remains the composition boundary; a separate screen-adapter folder
is deferred until it has a concrete use. The persistent shell updates HUD and
overlays without replacing the world Canvas. DialogueView and MenuView reuse
DialogueSprite registry/loading behavior. Controllers own GameSession commands
and world input locking; views receive display models and structured callbacks.
Presentation motion must not advance gameplay time or dispatch domain commands.

CSS design/motion tokens live in `styles/coastal/`; gallery fixtures/navigation
keys in `content/ui/` and player-facing text in the locale catalog. Existing
portrait assets and locally licensed fonts are reused; SVG waves are code-native.
MotionScope owns cancellation, visibility pausing and reduced-motion changes;
OverlayHost owns focus trapping/restoration and background inertness. No gameplay
command waits for animation completion. See the [implementation review](ui-reviews/coastal-v1/README.md)
for entry points, checks and remaining art/performance work.

Add characters/cases/dialogue/maps through content modules and catalog entries.
Add mechanics through focused domain handlers and explicit action contracts.
Replace persistence by providing a different storage adapter. New phases, stats
or save fields require validator updates and a documented migration.

Additional locale catalogs support fallback and interpolation. Completely live
language switching needs view-time resolution of currently eager roster/map labels.
Final narrative, balance, NPC timing and production endings remain game design work.

See [development workflow](DEVELOPMENT.md) and [content authoring](../content/README.md).
Run the architecture checker, browser suite and baseline comparison. The migration
passed 68/68 browser tests; all eight formula policies and four gameplay policies
matched their existing baselines without rewriting them.
