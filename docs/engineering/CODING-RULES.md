# Hoi Am — coding, resource and context-recovery rules

Status: project rules requested by the user on 2026-10-22. These rules govern future
implementation. The legacy project remains archived; this document creates no new
runtime, manager, editor or dependency.

## 1. Recover before continuing

After every compaction, session restart or loss of context, reopen root `AGENTS.md`,
`PROJECT-STATE.md`, this file and the project `SKILL.md` using file tools before
mutating the project. A summary or recollection that the files were previously read
does not complete this step. Then read the current task's relevant specification,
plan and protected design sections.

Recover five facts: the latest user task; confirmed requirements versus proposals;
completed changes; unfinished work; and actual verification evidence. Continue from
that checkpoint without redoing completed work or silently expanding scope. A new
explicit user task can supersede an old stopping point.

Keep `PROJECT-STATE.md` useful at handoff and during long tasks: record authorization,
changed paths, decisions, checks and their results, pending work, and blockers. When
an upcoming compaction is visible, update the checkpoint before handing off. Do not
assume the application exposes a compaction hook; this is a mandatory agent recovery
procedure anchored in root instructions.

## 1.1. Keep the project inside its folder

Code, plans, recovery skills, dependencies, portable tools, worktrees, caches,
temporary workspaces, browser profiles and generated artifacts must remain inside
the resolved project folder. Reject symlink/junction escapes before writing.
Never install project dependencies globally or into user/AppData/Windows folders,
register a service, edit registry/PATH or write external tool configuration.

Python third-party imports come only from a private `.venv` with
`include-system-site-packages = false`. Bootstrap through `tools/setup.py`,
then invoke that venv's Python for every check, server and pipeline command.
No `pip --user`, global package reuse, or `.cache/python` path injection.
Pip caches/build temporaries and subprocess temporary files use project `.cache/`.
Other toolchains must be portable/local, versioned and documented; inability to
keep a tool local is a reported limitation, not permission to install externally.

Existing system interpreters and browsers are execution prerequisites; do not
install or modify them for the project. Browser automation receives a new profile
under `.cache/tmp` and must never use the person's normal browser profile.
Keep project skills in `skills/`; the root recovery rule loads them directly.
Do not publish/sync a project skill into an external Codex directory.

## 2. Dependencies point toward gameplay contracts

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Domain | Entities/value objects, pure algorithms, invariants and immutable transitions | DOM, rendering, storage, fetch, asset decoding, browser clocks or a global manager locator |
| Application | Use cases, session ownership, command validation and orchestration through explicit ports | Scene drawing, UI layout or duplicated gameplay outcomes |
| Presentation | World/UI rendering, focus, prompts, animation and conversion of input into intents | Permanent gameplay mutations or calculations that bypass use cases |
| Infrastructure | Browser input, files, persistence, asset/audio loading and lifecycle adapters | Authoritative gameplay rules or authored story decisions |
| Content/contracts | Schemas, stable IDs, authored definitions, resource metadata and tuning | Arbitrary executable scripts, browser side effects or mutable live session state |
| Authoring | Working documents, validated edits, history, drafts, export and isolated preview sessions | Direct mutation of player saves or a second incompatible interpretation of gameplay data |

Domain/application declare the interfaces they need; outer adapters implement them.
Pass validated definitions, configuration and services explicitly. Domain logic
does not import a concrete browser loader, storage service or global resource singleton.
Wire concrete dependencies in the composition/bootstrap boundary.

UI and scene interactions issue commands through the session/application boundary
(the `GameSession` responsibility). A successful domain transition returns new state
and structured outcomes. Presentation consumes those outcomes. Reading state must
not mutate it; ownership of state changes must be unambiguous.

Separate responsibilities where they genuinely differ. Add focused interfaces for
implemented features; do not introduce a generic engine or a universal manager
framework to speculate about future features.

## 3. Authored data belongs to managed content

Every authored or tunable value must have an identifiable source, schema/contract
and resolution path through its responsible catalog/service. This includes the
following data; the directory names describe the conventions to establish when
implementation is authorized, not folders created by this rules-only task.

| Data | Responsible service/contract | Source convention |
| --- | --- | --- |
| Visible text, dialogue lines, labels, errors, titles, accessibility copy | Text/localization service | `content/locales/` and keyed text references |
| Images, portraits, fonts, video, source/export mapping, URLs and load groups | Asset catalog/loader | `content/assets/` and versioned manifests |
| Animation clips, frames, durations, pivots and authored transitions | Animation catalog/player | `content/animations/` |
| Music, ambience, sound effects, cues, gains and fades | Audio catalog/service | `content/audio/` |
| Story events, triggers, conditions, effects, sequence and repetition | Event definitions and registered handlers | `content/events/` |
| Quests, NPC schedules, items, evidence and hearing definitions | Validated gameplay catalogs | `content/gameplay/` |
| Costs, rewards, thresholds, scores, probabilities and movement tuning | Balance/configuration service | `content/gameplay/` or feature-specific configuration |
| Scenes, walk bounds, interaction areas, doors, spawn points, camera and parallax | Scene catalog | `content/scenes/` |
| Default bindings, semantic actions and navigation configuration | Input bindings service | `content/input/` |
| Authored layout, theme tokens, styles, materials and motion settings | UI/theme/layout contracts | `content/ui/` and token-driven styles |

Resolve the responsible definition by stable technical ID. Do not embed the payload
in a component, controller, renderer, page shell or domain handler because a manager
is not implemented yet. For the authorized feature, build the minimum useful
definition, validator and resolution path together.

Authored source is authoritative. Generated modules/atlases/manifests are derived
artifacts: update the source and generator, then regenerate and verify. Do not patch
generated output independently.

### Meaning of "no hardcoding"

Do not put game-specific content, resource paths, scenario branches or tunable
values into executable feature code. Technical identifiers, protocol/schema
versions, generic algorithm constants, structural markup and registered handler
implementations are code contracts. Keep those centralized and named where shared;
they are not a reason to turn every loop index or mathematical constant into content.

The practical test is: changing a line, asset, event sequence, quest cost, scene
placement or default binding should change managed data, not the generic algorithm
that consumes it. Changing a new kind of behavior can require a handler and schema
change as well as data; record that explicitly instead of hiding executable logic
inside content.

Synthetic test fixtures may contain explicit values needed to test behavior. Keep
them in test/authoring-only sources; never ship them as a production fallback.

## 4. Strings are always keyed

- All player-visible text goes through the shared text service: dialogue, buttons,
  HUD, placeholders, tooltips, loading/empty/error states, notifications, page titles,
  SVG text, accessible names and keyboard hints.
- Runtime HTML/page shells contain structure and text keys, not inline player copy.
  Static no-JavaScript fallback copy belongs in the dedicated fallback content.
- Catalog parameters provide dynamic values. Locale formatting and pluralization
  belong in the text service; do not concatenate sentence fragments in components.
- Stored events use message keys and structured parameters where display is needed;
  format for the active locale at presentation time.
- Missing keys/parameters produce actionable validation diagnostics and a controlled
  error path. Do not hide the problem with an inline English/Vietnamese fallback.
- Technical diagnostics can use stable developer-facing codes; user-facing error
  messages still resolve through the catalog. Translated labels never select rules.

## 5. Events are data plus explicit handlers

Separate three contracts:

1. **Gameplay outcomes:** structured domain results such as quest completion or
   publication; produced by validated commands.
2. **Story/scene sequences:** authored conditions, steps, ordering and effects;
   executed through a bounded set of registered capabilities.
3. **Presentation reactions:** animation, audio, focus or visual feedback responding
   to outcomes without calculating permanent gameplay results.

Event IDs and payload schemas are declared centrally. Event triggers, target IDs,
conditions, consequences and run-once/repeat rules live in managed definitions.
Conditions and effects reference known, typed handlers. The handler implements a
generic operation; the definition provides scenario-specific parameters.

Do not branch in renderers/controllers on a particular NPC name, quest title,
Boss ID or week to manufacture story progression. Do not embed event timelines
or reward tables there. Validate the authored conditions and dispatch the appropriate
use case instead.

Do not execute data with `eval`, `Function` or arbitrary script callbacks. Introduce
a new capability through an explicit schema/handler/application contract. Validate
unknown IDs, parameters, dependencies and relevant ordering before execution.

Define interruption, cancellation, repetition and save/resume semantics. Reopening
a screen, loading a save or re-entering a scene cannot silently duplicate an event
reward. Own subscriptions by lifetime; dispose them at the matching boundary.

## 6. Managers have narrow responsibilities

- A catalog resolves validated immutable definitions. A loader/player owns external
  I/O or playback. A gameplay handler owns the rule. Keep these responsibilities
  distinct even if a small implementation packages related pieces together.
- Consumers depend on small interfaces and explicit IDs. Managers must not become
  global singletons that every layer imports or services that mutate all systems.
- Prefer an existing suitable catalog/service over inventing a competing source.
  Shared registry entries identify capabilities; they do not absorb all game logic.
- Resource ownership defines loading, reuse, release, cancellation and error paths.
  A disposed scene or outdated load cannot claim resources for a new scene.
- Tools expose source location, preview, dependencies and usage. Renaming/removing
  a resource must reveal impacted references instead of silently rewriting gameplay.

## 7. Validation, saves and authoring share contracts

Validate authored structure, cross-references and gameplay meaning. The same
definition must be interpreted consistently by editor, generator, runtime and tests.
An editor-only relaxed schema must not silently accept invalid production content.

Validate commands at the application/domain boundary regardless of disabled UI
controls. Validate all required state/world data before replacing a session. New
persisted fields require an explicit schema version/migration review and defined
behavior for missing, old and invalid data.

Keep player progress, preferences, authoring drafts and playtest fixtures separate.
Editor operations produce validated working-document changes with undo/redo; invalid
edits do not replace the last valid source. Writes detect conflicts and preserve
recoverable data if validation, generation or persistence fails.

## 8. Input and timing do not bypass architecture

Bindings map physical input to semantic actions through the input service. Route
each action to the active context; domain behavior does not read keyboard events.
Every player operation has a visible, predictable keyboard path, with optional
mouse input issuing the same intents.

Separate presentation/movement time from the action-driven calendar. Obtain clocks,
randomness where used, persistence and network access through explicit adapters or
parameters so behavior is testable. Animation/render callbacks cannot directly
advance the day, spend energy or grant a quest result.

## 9. Verification gates when implementation is authorized

Implement enforcement alongside the first real code/content paths. Architecture
checks must detect forbidden imports, cycles across boundaries, UI-to-domain mutation
bypasses and production imports of test fixtures. Content checks must detect missing
text keys/parameters, duplicate IDs, broken references, invalid definitions and
feature-specific gameplay constraints.

Add meaningful behavioral checks for changed rules/use cases, keyboard flows,
save/migration behavior and editor export/reload. Exercise failure paths such as
missing content, failed resource loads and interrupted transitions when relevant.
Static search alone does not prove there are no hardcoded events or logic errors.

Before claiming completion, review the diff for:

- Literal player copy or untranslated accessibility text in runtime/shells.
- Inline game content, paths, tuning, event sequences or scenario-specific branches.
- Dependency violations, hidden mutable globals and duplicated rules.
- Missing schemas, references, validation, lifecycle ownership or save review.
- Keyboard-only paths and actionable errors for the changed feature.

Run the checks appropriate to the task and report what actually ran. The old runtime
and its checkers are archived. New architecture/content checks will be created when
code implementation is requested; their existence or success must not be implied
by this document. For rules-only changes, verify rule links, consistency, protected
documents and the handoff state; do not scaffold a runtime merely to test the rules.
