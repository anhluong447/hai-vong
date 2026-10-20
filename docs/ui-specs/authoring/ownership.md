# Authoring ownership — 2026-10-20

Baseline revision: `19fe9c3`. Fresh main browser suite: 95/95; all eight formula
and four gameplay policy baselines matched before runtime edits. Native six-tab,
picker, browser/hash evidence: `docs/ui-reviews/data-authoring/M0-before/`.
Measured original region bounds: `menu-geometry.json` beside this inventory.
Original complete MAPS fixture: `tests/fixtures/world-original-maps.json`.

| Editable data | Source / owner | Units / constraints |
|---|---|---|
| Resources and content placement | menu-layout.json; MenuLayoutAdapter | design px; fixed 1672 × 941 stage |
| Paper/grid spacing and typography | menu-layout.json; CSS custom properties | declared numeric field constraints, shared or tab scope |
| Slot selection topology | content UI topology consumed by view and keyboard | stable slot IDs; not free entity positions |
| Pixel placement/collision | scene JSON and prefab metadata | 16 px tiles; visual offset and footprint are separate |
| Sprite pivot/frame | active atlas/asset pack | pixel pivots; preserve Khuê/Vân (16,46), frames 32×48 |
| Gameplay commands/state/save | GameSession/domain/save service | never edited by authoring drafts |

Original CSS declarations being replaced are the active resources/content
position, dossier title/padding, skill/equipment detail dimensions, slot gap,
team detail width and settings paper dimensions. Artwork crop, texture, masks,
decorations and animated wave geometry retain their existing owners. Geometry
refactor is compared to the locked original before intentional authored edits.

Menu editor code belongs to tools/authoring and is dynamically imported only
by an opted-in preview. World editor gets its own map catalog and memory-only
session. User content, original concepts, archive and binary packs remain intact.
