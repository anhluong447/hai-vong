# Foundation reference

These are project engineering recommendations derived from research, not implemented features or approval to build everything at once. The user's confirmed product choices are in `../SKILL.md`.

## Runtime loop, clocks and lifecycle

- Separate input sampling, simulation updates and rendering. Use frame timestamps; cap excessive catch-up work and avoid frame-rate-dependent movement.
- Presentation/movement time and action-driven calendar time are separate. Timed hearing minigames may use a simulation clock without advancing the calendar.
- Define enter/exit/pause/resume/dispose for startup, loading, exploration, dialogue, menus, transitions, hearings and errors.
- Hidden tabs and lost focus clear held input. Resume must not replay the entire absent interval or punish a paused minigame.
- Scene transitions own their cancellation. A stale asynchronous load cannot replace a newer scene or reattach disposed UI.
- Release listeners, timers, animation frames, audio nodes and owned assets at the matching lifetime boundary.

## Spatial and rendering contract

- Define world units, screen units, logical viewport, DPR handling and world-to-screen conversion once.
- Define actor foot/baseline, sprite pivot, visible bounds, collider and interaction region independently.
- Camera follows inside authored bounds; resizing cannot move focus targets or interaction regions out of alignment.
- Exploration begins with authored walk ranges/paths, simple blockers and triggers. Add more elaborate physics only for a concrete feature.
- Separate scenery, actors and foreground presentation; parallax and decoration do not alter gameplay coordinates.
- Establish reference hardware/browser and measure loading, frame time and repeated-transition memory before choosing optimizations.

## Keyboard and UI

- Route semantic actions by active context: world, dialogue, menu, evidence picker, hearing/minigame or editor.
- Distinguish pressed, held and released. Suppress repeated confirmation from OS key repeat; clear held movement on modal/focus changes.
- Keep focus visible and distinct from selection. Return focus to a meaningful surviving control after close or list updates.
- Define Tab/Shift+Tab movement between regions and arrow navigation within composite controls. Escape/back behavior must be predictable and allow exiting dialogs.
- Every player operation has a keyboard path, including settings, map travel, inventory/equipment, save/load, evidence and hearing word/answer selection.
- Do not require hover, dragging or pointer-only picking. Optional mouse actions use the same intents as keyboard actions.
- Separate physical gameplay key bindings from typed text and IME input; reveal active bindings and handle browser/OS shortcut conflicts deliberately.
- Plan readable text sizing, contrast, subtitles/captions where needed and reduced ambient/camera motion.

## Data, state and events

- Stable IDs identify scenes, people, quests, strings, assets, clips, evidence and hearing nodes; translated labels never control rules.
- Version authored data and runtime/save contracts deliberately. Use a shared schema/validation layer and deterministic generation for compiled artifacts.
- Validate structure, cross-references and domain meaning separately. Schema correctness does not prove narrative reachability or sufficient evidence.
- Conditions/effects use a bounded, inspectable vocabulary serving actual features. Report which condition blocked an action.
- Gameplay commands change domain state; outcomes/events describe the result. Story sequencing and presentation events consume those outcomes through explicit interfaces.
- Define run-once/repeatable behavior, interruption, cancellation and save/resume boundaries. Reopening a dialogue or reloading a scene must not duplicate a reward.
- Avoid coupling animation completion callbacks directly to unvalidated permanent progression.
- Required Main/Boss routes must not depend on optional Side completion; investigate dependencies in authored content and playable fixtures.

## Resource management and production pipeline

| Resource | Decisions to make |
| --- | --- |
| Strings | Catalog keys, interpolation parameters, locale fallback, preview context, missing-key diagnostics and usage lookup |
| Images/assets | Source-to-export mapping, manifest IDs, hashes, dependencies, load groups, cache ownership and release |
| Animation | Clip/state definitions, frame timing, pivots, transition rules, preview and actor/UI/ambient scope |
| Events | Trigger conditions, effects, ordering, repetition, cancellation and persisted execution markers |
| Audio | Music/ambience/effect buses, gain settings, cue IDs, fades, pause/resume and gesture-based startup |
| Fonts/text | Vietnamese coverage, loading readiness, text measurement, line wrapping and grapheme-aware typewriter behavior |

- Retain editable masters, import/generation inputs and provenance. Exported bitmap files alone are not enough to maintain art.
- Resource tools expose search, preview, dependencies and "used by". Renaming/removing an ID must surface affected callers.
- Load scene-relevant groups rather than all 12 weeks of art at startup. Define retry/fallback behavior for failed assets without fabricating successful gameplay.
- Text reveal and animation timing need repeatable preview controls. Grapheme segmentation prevents splitting visible accented characters.
- Audio may be blocked before a user interaction. Startup and retry paths must handle this; do not assume music starts on page load.

## Saves, drafts and persistence

- Keep player progress, preferences, authoring documents/drafts and playtest fixtures separate.
- Validate all required state/world data before replacing a live session. A failed world restore must not leave half-replaced gameplay state.
- Saves reference stable content IDs, not DOM nodes, images or transient animation objects.
- Decide manual slots, autosave/checkpoints, export/import, backup retention and migration according to the milestone being built.
- Browser persistence can fail or be evicted; report failures and provide recovery/export for valuable work. IndexedDB does not itself guarantee permanent backup.
- For old top-down/3D positions, define an explicit migration or safe spawn. Do not reinterpret old coordinates as equivalent side-view coordinates.

## Workspace and authoring

- Common infrastructure: project explorer, resource browser, inspector, validation panel, undo/redo, dirty markers, drafts and recovery.
- Each gesture/change produces a validated document operation; invalid edits do not replace the authoritative document.
- Preview runs in a separate session and can start from an explicit fixture. Editor changes never leak into player saves.
- Decide how local files are read/written: supported File System Access API, an allowlisted local authoring service, or import/export fallback. Review existing legacy tooling before replacing it.
- Detect save conflicts with a source revision/hash. Preserve the last valid source if a write/build fails.
- The exported runtime content must run without the editor or authoring write service.

## Debugging and verification

- Inspect active state, commands/outcomes, failed guards, resource loads, current scene, focus and live owned resources.
- Reproduce bugs with explicit fixtures, controllable clocks and command replay. Keep side effects and randomness controllable where actually used.
- Domain/content checks cover transitions, invariants, reference integrity and reachability constraints.
- Browser checks cover keyboard-only end-to-end flows, interruptions, save/load and repeated scene/modal entry/exit.
- Editor round trips cover import, edit, undo/redo, export, reload and runtime consumption.
- Keep screenshots/trace logs for failures and profile real rendering separately from virtual-clock correctness tests.
- Choose concrete performance budgets on reference hardware; a unit test passing is not evidence of visual quality or device FPS.

## Packaging and recovery

- A release ties code, compiled content and asset manifests to compatible versions. Validate, generate and test reproducibly before packaging.
- Use deliberate cache/version rules so old code and new assets are not silently mixed.
- Keep production pages independent of authoring-only filesystem/network capabilities.
- Preserve a recovery route for binary art/audio/fonts: the current repository historically kept many binaries local and ignored by Git. Inventory/hash files alone cannot recreate those bytes.
- Git LFS or separately versioned resource bundles are possible future choices; do not change the repository's storage policy automatically.
- Archive moves need inventories, byte verification and navigation/restore instructions. Historical baselines and snapshots remain evidence, not the target product architecture.
- On Windows, a longer archive prefix can push existing filenames beyond ordinary path limits. Use extended-length paths for existence checks, hashing and recursive enumeration; an ordinary-path "missing" result alone does not establish data loss. Preserve the original inventory while diagnosing verification failures.

## Sequence and acceptance

Develop gameplay contracts, runtime features and corresponding tools together. First prove a small complete workflow; next prove the representative gameplay slice; expand production content to 12 weeks after those workflows are usable.

The practical foundation check is: author NPC/dialogue/quest, attach resources, validate, play by keyboard, save/resume, edit/rerun, diagnose a deliberately broken reference, repeat transitions without growth, and restore all necessary sources on another clean workspace.
