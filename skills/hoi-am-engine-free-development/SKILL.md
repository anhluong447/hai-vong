---
name: hoi-am-engine-free-development
description: Use when resuming, designing, implementing, or reviewing the Hoi Am game in the Ask repository, especially after context loss or when working on its engine-free 2D runtime, keyboard UI, authoring workspace, or resource pipeline.
---

# Hoi Am: engine-free 2D development

Recover the user's actual product decisions before interpreting legacy code as the current direction. This is a project reference skill, not authorization to implement a roadmap automatically.

## Recover context

1. Read root `AGENTS.md` and `PROJECT-STATE.md`. Project paths such as `docs/` and `archive/` resolve from the repository root. Markdown links to this skill's `references/` resolve relative to this repository's `SKILL.md`.
2. Read [the foundation reference](references/foundation.md) for the relevant system; consult [research sources](references/research-sources.md) when verifying a browser limitation or evaluating an implementation choice.
3. Read the protected Bible/GDD sections for the feature being changed. Follow the latest user request and its stopping point.
4. Consult the archive inventory before retrieving reusable legacy modules or art. Archived architecture, UI targets, plans and code are historical evidence, not the current product brief.

The task that created this skill ends after skill creation and verified archiving. When `PROJECT-STATE.md` says awaiting instructions, wait for a subsequent user task; do not start a skeleton, install dependencies, scaffold a game, or produce new gameplay content just because this skill describes them.

## Project-local execution only

Keep this project and its plans, skills, dependencies, worktrees, portable tools,
caches, temporary files and test browser profiles inside the project folder.
Read this repository copy through root AGENTS.md; do not install or synchronize
it into an external Codex skills directory.

Python dependencies must be installed into the checkout's isolated `.venv`,
never global/user Python or a `.cache/python` import path. Use
`python -B tools/setup.py` to bootstrap and the venv interpreter thereafter.
Other tools must have a project-local/portable installation with local caches.
Do not alter Windows, AppData, user/machine PATH, registry or global tool settings.
Existing interpreters/browsers may be invoked without modification; give automated
browsers disposable profiles under project `.cache/tmp`. Resolve paths and reject
symlink/junction escapes. If local execution is impossible, report it rather than
installing elsewhere. These user constraints override skill installation defaults.

## Decisions confirmed by the user

- Product: Hoi Am, a school journalism narrative game following the finalized Bible and Attack/Defense GDDs.
- World: **2D side-scrolling exploration**, meeting NPCs, inspecting objects and entering connected scenes. Jumping/platform challenges are not the movement focus.
- Art: **hand-drawn/anime**, layered scenery, depth through parallax and restrained ambient motion.
- Target: desktop browser. **The entire player experience must work with a keyboard.** Mouse support is optional; mobile/Android is not the initial target.
- UI: **redesign it**. The old coastal replica and its decoration/layout gates no longer define the new UI. Keep reusable source assets available without treating their old composition as mandatory.
- Runtime: **no game engine**. The discussion preferred Canvas2D scenery with DOM UI; the exact implementation and policy for small supporting libraries remain implementation decisions, not permission to install a framework.
- Scope: eventually implement all Bible gameplay, including 12 weeks, quest types, relationships, publication and Defense/Attack hearings. Twelve weeks is the **final product criterion**, not the first development milestone.
- Priority: detailed gameplay contracts, a maintainable skeleton, resource management and dedicated authoring tools; prove them with a representative playable slice before scaling content.
- Existing narrative/gameplay documents and the finalized Bible are protected. Technical research, runtime data and new engineering specifications may support implementation without silently rewriting these sources.

The paper/magazine UI style was an assistant proposal, not a separately confirmed visual reference. New UI is confirmed; exact typography, palette and composition still need a concrete design when UI work is requested.

## Canonical documents

- `docs/design/narrative/game_story_bible_v2.md`
- `docs/design/gameplay/GDD-Defense.md`
- `docs/design/gameplay/GDD-Attack.md`
- Other retained files under `docs/design/narrative/` and `docs/design/gameplay/`, with their original stated scope and date. In particular, `RULES.md` documents the historical formula sandbox; it does not supersede Bible gameplay.

Important inherited decisions:

- 12 calendar weeks / 84 days. Daily shared energy cap 10; sleep starts the next day at 10, late-night study/game at 5, without carrying remaining energy forward.
- Walking/rendering does not itself advance the calendar or spend energy. Gameplay actions follow explicit costs; returning to rest remains possible at zero energy.
- Main and Side are played by Khue. General is normally delegated, with feedback and automatic work; Khue can also do General at a lower cost.
- Completion hands materials to automatic publication. Audience response follows publication; do not restore manual writing/editorial/publication chores from old prototypes.
- Side and General completion both archive concrete Defense evidence, including delegated General. Side has the highest evidence quality; General has standard quality even if Khue performs it.
- Match accusation/evidence relevance before applying quality. High quality does not rescue the wrong evidence. Side +50 / General +20 for a Win is a **provisional playtest table**, not finalized balance.
- Defense and covert-investigation Attack evidence remain separate. Main does not create Defense cards. Required Boss context and Attack discoveries must be obtainable from Main, without mandatory Side completion.
- Boss milestones: Khoa at week 3; Linh at the end of week 7; Huy at week 12. Week 8 is the aftermath of Linh and opening of the Huy crisis. Khoa/Linh names and titles retain their documented working-label status.

Check the actual source section before implementing details; this summary is not a substitute for the GDD turn order, edge cases or unresolved balance notes.

## Skeleton and tools must grow together

Keep responsibility boundaries explicit:

- **Domain:** pure, immutable transitions; time/calendar, energy, quests, publication, relationships, evidence and hearings.
- **Application:** session ownership, validated commands, outcomes and replacement of state. Preserve the `GameSession` role, whether a legacy implementation is reused or replaced deliberately.
- **Content:** stable IDs, schemas, definitions and tuning; shared validation for editor/build/runtime.
- **Presentation:** 2D world, camera, animation, UI, focus, sound and effects; consume outcomes instead of inventing gameplay results.
- **Infrastructure:** asset/file loading, saves, browser lifecycle and release packaging.
- **Authoring:** separate documents, history, drafts and playtest sessions; edits do not mutate a live player save.

Build concrete feature modules. Extensibility means additional scenes, NPCs, quests and hearing segments fit existing contracts; it does not require a generic engine, mandatory ECS, arbitrary scripting language or universal global event bus.

Dedicated workspace capabilities:

| Area | Required capability when that system is implemented |
| --- | --- |
| Scenes | Layers, actor baselines, collision/interaction regions, NPCs, doors, camera, parallax and preview |
| Dialogue/quests | Nodes, choices, conditions, effects, dependencies and playable branch preview |
| Gameplay | Schedules, costs, rewards, publication and progression definitions |
| Hearings | Evidence quality, accusation mappings, Defense/Attack segments and per-turn preview |
| UI/input | Layout, visible states, focus order and complete keyboard navigation |
| Resources | Strings, asset manifests, animation clips, audio and cross-reference inspection |
| Playtest | Start from fixtures, inspect commands/state/failed guards, replay and export diagnostics |

All editors share a project/resource browser, inspector, search, validation, undo/redo, dirty-state reporting and recovery. Implement a tool alongside the runtime contract it exercises, then test it against real representative content.

## Production acceptance before expanding to 12 weeks

For a requested foundation milestone, make these operations concrete and verifiable:

1. Create a scene/NPC, dialogue and quest through the workspace.
2. Assign strings, art and animation through stable references.
3. Validate structure, references and gameplay-specific conditions.
4. Play through with a keyboard, save and resume correctly.
5. Edit and rerun without contaminating player saves or granting outcomes twice.
6. Intentionally break a reference and receive an actionable diagnostic at its source.
7. Repeat scene/menu transitions without accumulating active listeners, loops or resources.
8. Restore sources and required binary inputs on a clean checkout/workspace using the documented asset recovery process.

A representative gameplay slice eventually exercises the day loop, all three quest types, delegated work, publication, evidence and both hearing phases. Use isolated fixtures for mechanics that occur later in the story; do not change canonical week scheduling to demonstrate them early.

## Verification and scope

When runtime work is authorized, use the checks appropriate to the changed contracts: domain/content tests, real keyboard browser flows, save/migration checks, editor round trips and lifecycle/performance measurements. Preserve legacy baselines as historical regression evidence; changed Bible gameplay needs its own explicit expected results.

Report what actually ran. After archiving, old checkers must be run from a restored copy or the archived payload's own root as documented; their old paths and results do not certify a new empty workspace.

For archive operations, preserve bytes, original paths, source art/generation inputs, historical snapshots and uncommitted work. Inventory SHA-256 before moving, verify afterward, preserve protected documents and repair navigation without changing their approved wording.
