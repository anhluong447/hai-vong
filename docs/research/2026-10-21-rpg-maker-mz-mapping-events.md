# RPG Maker MZ mapping and event research

Researched 2026-10-21 against official help, product announcements and published
core API source. This is a research note, not an approved implementation plan.
Recommendations below describe an adaptation for this project.

## The distinctions that matter

| Concern | Meaning in MZ |
| --- | --- |
| Tileset palette A–E | Collections of source tiles, not five map layers |
| Map Layer 1–4 | Four tile placements at a map coordinate; Auto chooses placement, manual selection edits one layer |
| Passage and priority | Tile behavior, including blocked edges and tiles displayed above characters |
| Events | Positioned interactive definitions with pages, conditions, triggers and commands |
| Regions and shadows | Additional map information, separate from decorative tile placement |

MZ supports manual stacking of tiles from A or B–E in any combination across its
four layers. A higher numbered editing layer does not automatically mean above
the player. [Official mapping preview](https://www.rpgmakerweb.com/blog/rpg-maker-mz-preview-2-graphics-mapping-eventing).

The published `Tilemap` renderer reads four tile planes, then routes tiles into
lower/upper drawing batches using tile flags. It also reads a separate shadow
plane. This confirms that editing layers and rendering priority are separate
concepts. [Official Tilemap source](https://developer.rpgmakerweb.com/rpg-maker-mz/Tilemap.js.html).

## Tilesets and map painting

Custom PNG resources go under `img/tilesets`, then are assigned to a database
tileset and selected by a map. A1 contains animated terrain, A2 ground, A3
buildings, A4 walls and A5 ordinary tiles; B–E contain ordinary decorative tiles.
Autotile sheets have specialized layouts. Loading a PNG as a uniform grid alone
does not implement MZ autotile compatibility.
[Official asset standards](https://rpgmakerofficial.com/product/MZ_help-en/01_11_01.html).

Painting supports pencil, rectangle, ellipse, fill, shadow pen, multi-tile palette
selection and right-drag map sampling. Autotiles adjust their boundaries from
neighboring placements; Shift allows painting/sampling without those adjustments.
Manual layer selection lets an author change the floor without replacing the
decorations. Transparent upper tiles provide empty placements.
[Official map editing help](https://rpgmakerofficial.com/product/MZ_help-en/01_07_01.html).

MZ's v1.10.0 announcement additionally documents a dedicated eraser and Show
Passability overlay. Older help sections should not be read as a complete list
of current tools.
[Official release announcement](https://steamcommunity.com/games/1096900/announcements/detail/520863048256192858).

Tile properties include ○ passable, × blocked, ☆ above-character decoration,
four-direction passage, ladder, bush, counter, damage floor and terrain tags.
Counter supports interaction across a desk. Terrain tags describe a tile type;
they do not supply an event command list.
[Official tileset settings](https://rpgmakerofficial.com/product/MZ_help-en/01_08_10.html).

An important composition rule: a ☆ decoration does not override an impassable
tile beneath it. Consequently, tree canopies and roofs do not by themselves make
the ground traversable. The help describes this under upper-layer behavior;
its automatic stacking descriptions should be distinguished from manual layers.
[Official map editing help](https://rpgmakerofficial.com/product/MZ_help-en/01_07_01.html).

Maps also select a tileset, size, looping, ambient audio, parallax and encounter
settings. Region painting assigns one region ID per cell, with IDs 1–255. Regions
mark locations independently of which tile image is there.
[Official map properties](https://rpgmakerofficial.com/product/MZ_help-en/01_07_03.html).

## Events: authoring and execution

Map events can represent NPCs, chests or invisible interaction points; battle
events and common events serve separate contexts.
[Official event overview](https://rpgmakerofficial.com/product/MZ_help-en/01_09.html).

Switching to event editing replaces the tileset palette with a list of the map's
events. Double-clicking a list entry opens it for editing, making events easier
to find on a busy map.
[Official event-list preview](https://www.rpgmakerweb.com/blog/rpg-maker-mz-preview-4-event-list-system-tab-options-new-ui-release-date-price).

Each map event has pages. A page defines appearance, movement, priority, trigger
and command contents. Conditions can inspect switches, variables, self switches,
items and party members. Conditions within a page are ANDed; the highest numbered
eligible page wins. If no page qualifies, the event has no active page.
[Official map event settings](https://rpgmakerofficial.com/product/MZ_help-en/01_09_03.html).

| Trigger | Typical use |
| --- | --- |
| Action Button | Talk, inspect, open a chest |
| Player Touch | Step onto a transfer point or enter a cutscene |
| Event Touch | A moving enemy initiates contact |
| Autorun | A cutscene that occupies player control |
| Parallel | Repeated processing while the player remains able to move |

Priority separately places an event below, at the same level as, or above
characters. Autorun repeats while its conditions remain satisfied, so a one-off
cutscene must change its conditions/page. Parallel also repeats and must be
designed with its ongoing execution in mind.
[Official priorities and triggers tutorial](https://www.rpgmakerweb.com/blog/event-priorities-and-triggers).

Contents are editable command lists: text, choices, inventory changes, transfer,
movement routes, waits, audio, pictures and more.
[Official command catalog](https://rpgmakerofficial.com/product/MZ_help-en/01_10.html).
Conditional branches and loops provide flow control; a common-event call resumes
the caller after its command sequence finishes.
[Official flow-control help](https://rpgmakerofficial.com/product/MZ_help-en/01_10_03.html).

For example, a chest can have a default closed page whose commands grant a reward
and turn Self Switch A on. A later page conditioned on A uses the opened image
and no reward command. MZ exposes self switches A–D, separate from the shared
switches and variables used for wider progression.
[Official progression commands](https://rpgmakerofficial.com/product/MZ_help-en/01_10_02.html).

Erase Event is temporary: it lasts until the party changes maps. It should not
be confused with a persistent opened-chest condition.
[Official character commands](https://rpgmakerofficial.com/product/MZ_help-en/01_10_07.html).

## Current project: verified source boundaries

| Current source | What exists today |
| --- | --- |
| [tileset.json](../../content/world/tileset.json) | One 16-pixel atlas, 16 stable tile IDs and boolean `blocked` metadata |
| [scene-contract.json](../../content/maps/scene-contract.json) | One `tiles` grid, plus objects, NPCs, portals, spawn and signs |
| [TileMapEditor.js](../../tools/authoring/TileMapEditor.js) | Painting, palette, collision preview, keyboard navigation and editor camera |
| [PixelWorld.js](../../src/pixel/PixelWorld.js) | Cached tile background and nearby object/NPC interaction callbacks |
| [WorldRenderer.js](../../src/world/WorldRenderer.js) | Background first, then objects/NPCs/player sorted by position |
| [gameplay-controller.js](../../src/presentation/gameplay-controller.js) | Interaction behavior selected by existing `kind` values |
| [interaction-scenes.js](../../content/dialogue/interaction-scenes.js) | Existing dialogue graphs, distinct from a general map-event interpreter |
| [GameSession.js](../../src/application/GameSession.js) | Application entry point for immutable gameplay commands |

We have useful foundations but no general event-page model, directional terrain
passage or multi-layer tile renderer. Existing object placement and dialogue work
should be reused rather than replaced wholesale.

## Recommended adaptation for this project

These are engineering recommendations, not claims about MZ implementation.

1. **Tileset import and properties.** Import a regular PNG atlas with explicit
   tile size, margin and spacing. Persist image provenance and metadata. Preserve
   old IDs; do not infer collision from pixels. Distinguish ordinary-grid import
   from an eventual MZ autotile importer.
2. **Four explicit tile layers.** Start with manual layer selection, visibility,
   locking and empty overlay cells. Keep render priority and passage independent
   of layer number. A migration must put the existing grid on the base layer
   without changing old maps. Define collision composition before adding Auto.
3. **Improve painting.** Add multi-tile stamps and region painting, then neighbor
   based autotiling with explicit family/layout metadata. Reuse the existing pure
   patch, undo, draft and validated source-save pipeline.
4. **Events for concrete game needs.** Extend existing entities with page
   conditions, triggers and typed command lists. Start with NPC dialogue, map
   transfer and an interact-once clue. Reuse the dialogue presentation and issue
   gameplay changes through `GameSession`.
5. **Event tools and playtest diagnostics.** Add templates, an event list,
   destination picker, active-page explanation, trigger preview and command
   trace. Introduce reusable sequences and parallel execution only when concrete
   content needs them.

For event state, prefer existing quest/day/phase data where it expresses the
condition. Persistent per-event flags require stable scene/event keys, save
validation and migration. Authoring JSON remains separate from playthrough state.
Separate asynchronous presentation waits from immutable domain transitions;
prevent repeated rewards, duplicate triggers and stale execution after transfer.
Editor controls remain English; player-facing text continues to use locale keys.

Suggested acceptance scenes:

- Grass under flowers: erasing flowers leaves the ground intact.
- Wall under a canopy: the canopy never cancels wall collision.
- A tree: solid trunk, overhead canopy, correct walk-behind behavior.
- Transfer point: destination and spawn validate before playtest.
- One-time clue: collecting it, leaving and reloading never grants it twice.
- Quest NPC: the inspector explains which page won and why.

The next deliverable should be a scoped design/plan for the first two stages,
with event authoring specified separately after those data/rendering foundations.
