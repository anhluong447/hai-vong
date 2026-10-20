# Coastal Menu Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Complete the six-tab menu's shared visual language and keyboard-only operation against the approved concepts.

**Architecture:** Preserve MenuV2View's display-model and intent interface. Add a focused MenuV2Keyboard controller for menu-local regions, delegated by OverlayHost, and a scoped menu-refinement stylesheet using existing dossier tokens. Native SVG item artwork and presentation metadata stay outside gameplay state.

**Tech Stack:** Plain ES modules, HTML/CSS/SVG, Python local server and Chrome CDP; no new dependencies.

**Spec:** [Approved design](../specs/2026-10-20-menu-refinement-design.md).

## Global Constraints

- Design stage remains 1672 × 941 with uniform scaling.
- Player text comes from `content/locales/vi.js` through the shared text service.
- No domain, balance, save-schema or baseline changes.
- Preserve six branches × five ranks and six equipment slots.
- Money stays below energy in the sidebar.
- Preserve concepts, generation inputs, active assets and historical evidence.
- Run architecture, main browser suite, baseline and affected focused checks.

## Review Focus

- Locked/learned skills: Enter cannot execute a disabled command; focus stays recoverable.
- Empty or already-used inventory: keyboard navigation never lands on unavailable actions.
- Rerender/confirmation cancellation: return focus to the same semantic item or region.
- Long names/large money: fit or wrap inside the intended surface; resources avoid waves.
- Scaling/reduced motion/repeated opening: input is scoped and resources dispose cleanly.

## Files and responsibilities

- `src/ui/coastal/MenuV2View.js`: tab markup, illustrations and local intent wiring.
- `src/ui/coastal/MenuV2Keyboard.js` (new): region entry, arrows, Enter/Escape and focus restoration.
- `src/ui/coastal/OverlayHost.js`: defer menu-local navigation while retaining modal behavior.
- `styles/coastal/menu-refinement.css` (new), `styles/coastal.css`: shared surfaces and individual tab composition.
- `content/ui/menu-v2-media.js` (new): stable item/skill illustration metadata.
- `assets/ui/coastal-menu-v2/equipment.svg` (new): reusable native item symbols.
- `content/locales/vi.js`: navigation hints and accessible descriptions.
- `tests/menu-refinement.test.js`, `tests/menu-refinement.html` (new), `tests/index.html`: focused behavior/layout coverage and full-suite registration.
- `docs/ui-reviews/menu-refinement/README.md` (new): captures, checks and limitations.

## Task 1: Establish executable verification and behavioral regressions

**Files:** `tests/menu-refinement.test.js`, `tests/menu-refinement.html`, `tests/index.html`; runner diagnostics if required.
**Interfaces:** Consume real GameSession, coastalMenuModel, MenuV2View and OverlayHost via preview iframe. Produce a focused browser suite using the existing harness.

- [x] Investigate the previously observed browser timeout with workspace-local Chrome profile and per-test progress diagnostics; distinguish import failure from hung assertions.
- [x] Write regressions for keyboard skills/equipment/region traversal, empty states, focus restoration and native layout/resource bounds. Assertions use real commands and computed browser geometry/styles.
- [x] Run focused tests before implementation and retain expected failures.

Run: `python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/menu-refinement.html --real-time --timeout 90 --output-prefix playtest`.
Expected before implementation: failures naming missing keyboard/layout behavior; no import errors.

## Task 2: Shared shell, typography, resources and map states

**Files:** `styles/coastal/menu-refinement.css`, `styles/coastal.css`, `src/ui/coastal/MenuV2View.js`, locale catalog.
**Interfaces:** Consume dossier `--ds-*` tokens. Produce common heading/paper/resource styles and opaque map interaction states used by all tabs.

- [x] Apply the dossier scene/desk/waves across tabs except the map's own scene.
- [x] Normalize heading and paper typography, section labels, brush actions and focus treatment.
- [x] Anchor resource rows above foreground waves; use nonwrapping numeric money and test a large formatted value.
- [x] Add explicit opaque map hover/focus/selected fills and preserve map command semantics.
- [x] Run focused layout assertions and capture the common shell.

Expected: resources fit the sidebar and stage; map hover opacity is 1 with visible gold fill.

## Task 3: Skill composition and menu keyboard regions

**Files:** `src/ui/coastal/MenuV2Keyboard.js`, `src/ui/coastal/MenuV2View.js`, `src/ui/coastal/OverlayHost.js`, refinement CSS, locale catalog.
**Interfaces:** `new MenuV2Keyboard(view)`, `handle(event) -> void`, `focusRegion(delta) -> void`, `dispose()`. View owns its lifetime; OverlayHost delegates only when the active element is within `.menu-v2`.

- [x] Render branch ribbons, circular node states, connecting stems and a detail card; retain 30 stable skill IDs.
- [x] Hide tree scrollbars while retaining pointer scrolling and automatic focus reveal.
- [x] Implement Tab/Shift+Tab region navigation, directional node selection and Enter-to-action/Escape-to-node.
- [x] Preserve selected node, tree offset and focus keys across model updates.
- [x] Verify real learning changes points once, locked actions never execute, and offscreen nodes become visible.

Expected: keyboard-only selection and learning pass, including zero-points and learned/locked states.

## Task 4: Illustrated equipment and spatial keyboard selection

**Files:** equipment SVG, `content/ui/menu-v2-media.js`, MenuV2View/Keyboard, refinement CSS.
**Interfaces:** `itemMedia[id] -> {file, symbol}` consumed by view; existing `equip` actions remain unchanged.

- [x] Author seven reusable item illustrations and render them in six slots and the selected item's paper card.
- [x] Arrange slots in two spatial columns and give occupied/empty/selected states visible distinctions.
- [x] Render item picker with previews/comparison text and stable focus keys; auto-select a usable entry.
- [x] Route arrows by slot position, Enter to picker/confirmation and Escape to the originating slot.
- [x] Verify equip, replacement, unequip, cancellation, empty inventory and unavailable items using real session state.

Expected: keyboard-only gear flow changes the intended slot; cancellation leaves state unchanged.

## Task 5: Team and settings concept compositions

**Files:** MenuV2View/Keyboard, refinement CSS, presentation media, locale catalog.
**Interfaces:** Consume existing people/stats/assignment models and portrait registry; preserve save/load callbacks.

- [x] Style portrait strip and selected frame, enlarge portrait, layer the team paper, add bond and section decoration.
- [x] Keep actual bond/state values, accessible labels and scrollable long biographies; preserve quest links.
- [x] Recompose settings title/categories/paper with category icons and disabled placeholder rows.
- [x] Give category/action regions stable keyboard focus and restore focus after confirmation cancellation.
- [x] Verify long/empty team states and keyboard settings navigation.

Expected: team selection, assignment links, settings category navigation and modal return work with keyboard.

## Task 6: Visual review, regression and handoff

**Files:** review README, versioned PNG/JSON capture artifacts, plan execution record.

- [x] Capture all six tabs and picker at 1672 × 941; inspect each against its concept and fix clipping/layout mismatches.
- [x] Run `python tools/check_architecture.py`, menu/dossier asset checkers and focused browser tests.
- [x] Run the full browser suite, then `python tools/check_baselines.py`; preserve baseline bytes.
- [x] Run lifecycle/reduced-motion review and `git diff --check`.
- [x] Request a whole-change code review, fix material findings and rerun affected checks.
- [x] Document exact results, capture paths, remaining visual/device limits and changed files. Leave changes reviewable in the user's working tree; do not publish or merge.

## Execution record

- Initial revision: `a6ee927`; initial Git status clean.
- Ruling: user explicitly requested plan then implementation; continue without another approval gate.
- Ruling: work in the supplied checkout to retain the local ignored asset pack and IDE visibility; do not create a worktree or commit/push without a concrete need.
- Initial evidence: architecture and asset checks passed in the preceding assessment; browser suite timed out at 240 seconds. Task 1 investigates this before relying on test results.

- Task 1: complete ? Chrome sandbox IPC failure diagnosed; baseline diagnostic 88/88; new tests initially 0/5 with expected behavioral failures. Harness progress retained.
- Task 2: complete ? shared materials/resources/map states; native captures and geometry checks passed.
- Task 3: complete ? all 30 skills, hidden scrollbar, keyboard learning/focus; real CDP keyboard smoke passed.
- Task 4: complete ? seven SVG symbols, six spatial slots, equip/cancel/unequip and stale-preview regression passed.
- Task 5: complete ? team/settings composition and focus, empty/long content and disabled states covered in 7/7 focused tests.
- Ruling: map controls needed their own stacking levels after sharing foreground waves; map art remains below decorations and controls remain above.
- Review: one Important stale item preview reproduced and fixed; independent recheck found no Critical/Important issues.
- Verification infrastructure: added optional --profile-root, DevTools file-read retry and clean Browser.close after observed Windows permission failures.

- Task 6: complete ? final main 95/95; all 8 formula + 4 gameplay policies match unchanged baselines; focused reduced-motion 7/7; architecture 0 issues/1134 entries; inventories, native SVG, Python compile and whitespace checks passed.
- Visual evidence: inspected all six tabs plus picker in native-v3; actual CDP pointer confirms opaque gold map labels, actual keyboard smoke learns/equips and restores focus.
- Lifecycle: 100 transitions, stationary reading surfaces, moving contours, hidden pause and reduced motion passed. Headless software timing is not a physical GPU FPS claim.
- Validation limitation: two reduced-motion runs timed out loading different iframe previews before assertions; diagnostic and final native-width runner each passed 7/7. Retained in review notes.
- Handoff: working-tree changes and local captures retained for user review; no commit, merge, push or publication performed.
