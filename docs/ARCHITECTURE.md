# Architecture — CLB Báo Chí

Updated 2026-10-09. Plain HTML/CSS, Canvas and ES modules; no dependency or build
step. Two explicit rulesets remain: the original formula sandbox and the newer
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
