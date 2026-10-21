# World Map Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nhập tileset, chỉnh thuộc tính và vẽ bốn layer trong World Editor, lưu
và Playtest được mà không làm thay đổi năm map gốc.

**Architecture:** Catalog và scene sources được chuẩn hóa/validate trước khi
compile vào world module hiện có. Collision/layer algorithms thuần được dùng
chung bởi renderer, movement, validators và editor. Asset/source write ở tools,
working catalog và scene documents độc lập với session gameplay.

**Tech Stack:** ES modules, Canvas 2D, JSON, Python/Pillow, unittest, browser
harness và Chrome CDP hiện có; không thêm runtime dependency.

**Spec:** [2026-10-21-world-map-foundation-design.md](../specs/2026-10-21-world-map-foundation-design.md).
**Programme:** [WORLD-MAP-AUTHORING.md](../../WORLD-MAP-AUTHORING.md).
**Source checkpoint:** `2185a55`. Status: planned; chưa task nào được triển khai.

## Global Constraints

- Giữ tile ID 0–15, thứ tự atlas cũ và blocked IDs `[5,6,7,8,12,13,15]`.
- Đơn vị ô world vẫn 16 px; source tile size chỉ đổi crop và scale hình.
- Editor chrome dùng tiếng Anh qua `content/locales/vi.js` + `t()`; shell dùng `data-text`.
- Giữ năm scene gốc, formula/gameplay rulesets, save schema, balance và baselines.
- Candidate invalid bị từ chối toàn bộ; một gesture tạo tối đa một undo entry.
- Runtime không phụ thuộc authoring server; source write chỉ trên loopback được bật rõ ràng.
- Dùng ES modules, Canvas, JSON, Python và Pillow hiện có; không thêm runtime package.
- Không chỉnh archive/clb-hoi hoặc mở rộng ignore policy để track toàn bộ binary.

## Review Focus

1. Tile 0, sparse IDs, null overlays và catalog mới: không chọn nhầm atlas hoặc
   chấp nhận ID đã bị mất; v1 không tự dirty (T1/T6).
2. Wall dưới canopy, cạnh nguồn/đích và BFS: mọi cách di chuyển dùng cùng quy tắc,
   không đi xuyên cạnh do click-to-move (T2/T9).
3. Import đồng thời, source IDE edit, lỗi publish và server restart: không mất
   source hiện tại, không published catalog tham chiếu ảnh thiếu (T4).
4. Edit trong lúc save, tile catalog chưa lưu, mất ảnh sau reload: dirty snapshot
   được giữ và lỗi có thao tác phục hồi cụ thể (T5/T8).
5. Gesture đổi layer/map/mode, blur, input focus và hide/lock: không ghi nhầm lớp,
   không nuốt phím trong field, Play dùng mọi layer (T7/T9).

## File map

| Area | Create / modify |
| --- | --- |
| Catalog | Modify `content/world/tileset.js`; extend format of `content/world/tileset.json` when explicitly saved; create `src/shared/validateTileset.js`, `tools/world_tilesets.py` |
| Layers/collision | Create `src/shared/tileLayers.js`, `src/shared/tilePassage.js`; modify `content/maps/scene-contract.json`, `materialize.js`, `src/shared/validateWorldScene.js`, `src/pixel/maps.js`, `src/world/MovementSystem.js` |
| Compile | Modify `tools/build_world_scenes.py`, regenerate `content/maps/scenes-data.js`; keep source scenes unchanged |
| Assets/render | Create `src/world/TileAssets.js`; modify `src/pixel/PixelWorld.js`, `src/world/WorldRenderer.js` |
| Source writer | Create `tools/authoring_tilesets.py`; modify `tools/authoring_server.py`, `tools/authoring_write.py`, `tools/authoring/SourceSaveClient.js` |
| Editor | Create `tools/authoring/TilesetDocument.js`, `TilesetEditor.js`; modify `WorldDocument.js`, `WorldEditor.js`, `TilePaint.js`, `TileMapEditor.js`, `tools/world-editor.html`, `tools/world-editor.css`, `content/locales/vi.js` |
| Tests | Create `tests/tileset-catalog.test.js`, `tile-layers.test.js`, `tile-passage.test.js`, `tileset-editor.test.js`, `tests/test_world_tilesets.py`, `tools/test_authoring_tilesets.py`, `tests/fixtures/tile-foundation-cases.json` |
| Integration | Extend existing world/editor/Python/writer tests, `tests/index.html`, `tests/world-authoring.html`, `tools/review_world_authoring.py`, `tools/review_authoring_source.py` |
| Docs | Update `docs/DATA-AUTHORING.md`, `docs/ARCHITECTURE.md`; create `docs/ui-reviews/world-map-foundation/README.md` and `assets/tilesets/README.md` |

New PNGs exist only in disposable fixtures/review roots until an author explicitly
imports an asset. Do not add imported assets to default maps as part of refactoring.

## Verification commands

Use the selected worktree's server, not another checkout's existing process.

```powershell
python tools/check_architecture.py
python -m unittest discover -s tests -p "test_world*.py"
python -m unittest discover -s tools -p "test_authoring*.py"
python tools/build_world_scenes.py --check
python tools/serve.py --port 8096
```

Server is a separate background process. Run browser calls sequentially:

```powershell
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/world-authoring.html --profile-root tmp/browser-tests
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --profile-root tmp/browser-tests --real-time --timeout 240
python tools/check_baselines.py
```

Expected: architecture zero issues; unittest OK (report any environment skips);
builder no drift; focused/main browser all registered cases pass; existing
formula/gameplay baseline values match. Main browser must run immediately before
baseline comparison because the checker consumes its log. Never regenerate a
baseline as a task step. Node is optional; report the checks actually run.

## T1 — Catalog và layer contracts, giữ v1 đọc được

**Files:** catalog/helper/JS validator mới, Python `world_tilesets.py`, builder,
scene contract/hydration; catalog/layer/shared fixture tests và harness registration.

**Interfaces:**
- `normalizeTileset(source, legacyAtlas) -> CatalogV2` in `validateTileset.js`;
  pure, throws technical validation codes. `CatalogV2` follows spec §4.
- `tileDefinition(id, catalog=TILESET) -> TileDefinition`;
  `tileSourceRect(id, catalog=TILESET) -> {atlasId,x,y,width,height}`.
- `normalizeTileLayers(scene) -> Array<{id,tiles}>` in `tileLayers.js`, exactly
  four copied grids. Accept v1/v2; do not mutate source or use 0 as empty.
- Python `normalize_tileset(source,legacy_atlas) -> dict` and
  `normalize_tile_layers(scene) -> list` in `world_tilesets.py`.
- `render_outputs(root=ROOT, overrides=None, tileset_override=None)` compiles
  the working catalog without temporarily writing its JSON source.

- [x] Add shared fixtures: v1 legacy; v2 IDs 0/27; invalid ID 16 when absent;
  duplicate ID, invalid atlasIndex, malformed grid, null base and null overlays.
  Assert legacy crops `[0,0,16,16]`, `[112,16,16,16]` and exact blocked set.
- [x] Run Python world tests and focused browser; confirm failures concern missing
  contracts. Register tests before relying on a green harness summary.
- [x] Implement normalization/membership/crop and four-layer representation;
  expose compiled normalized TILESET plus catalog source hash. Keep source JSON v1.
- [x] Update hydration to supply layers and a derived layer-1 `tiles` view.
  Existing default map data/labels/entities remain equal to old fixtures.
- [x] Run fixture parity in Python/JS, builder build/check and architecture.
  Assert normalize and render outputs do not mutate inputs or source bytes.
- [x] Commit focused change: `feat(world): define compatible tile catalog and layer contracts`.

## T2 — Một quy tắc collision cho standing, steps và pathfinding

**Files:** `tilePassage.js`, JS scene validator, Python world validation, maps.js,
MovementSystem, builder references; passage/world scene/coordinate fixtures/tests.

**Interfaces:**
- `cellPassage(scene,x,y,catalog) -> {blocked:boolean,blockedEdges:string[]}`.
- `canStep(map,from,to,npcs=[],catalog=TILESET) -> boolean` exported by maps.js.
  Uses terrain/cell passage plus entity footprints. Non-adjacent steps return false.
- `walkable(map,x,y,npcs=[],catalog=TILESET)` remains a standing query.
- `findPath(map,start,goal,npcs=[],catalog=TILESET)` uses `canStep` per BFS edge;
  `pathToObject`/`safePosition` forward catalog.
- `validateWorldScene(candidate,prefabs,knownRefs,{catalog=TILESET}={})` and
  `validateWorldProject(scenes,prefabs,knownRefs,catalog) -> validatedScenes`;
  project validation rebuilds cross-map arrivals/blocked cells from candidate data.
- Python equivalents live in `world_tilesets.py` and builder; validators never
  rely on stale compiled blocked-cell lists for working catalog changes.

- [x] Add exact cases: wall+canopy blocked; flower removal keeps grass passable;
  source-right or destination-left blocks rightward step; unblocked pair allows;
  reverse-direction checks; diagonal/non-adjacent rejected; null contributes nothing.
- [x] Add BFS fixture where direct route crosses a blocked edge and valid detour
  is required; assert all resulting steps pass `canStep`. Include source NPC overlap
  escape and invalid source terrain/spawn/arrival checks.
- [x] Run red tests, implement pure union rules, project validation and adapters;
  update MovementSystem.step, BFS and every call site passing working catalog.
- [x] Compare JS/Python rejection codes/cells for shared fixtures; run focused
  browser, Python world tests, architecture and builder check.
- [x] Commit: `feat(world): unify layered passage and directional movement`.

## T3 — Load nhiều atlas và render dưới/trên actors

**Files:** `TileAssets.js`, PixelWorld, WorldRenderer; world asset/render tests.

**Interfaces:**
- `loadTileImages(catalog,loadImage) -> Promise<Map<atlasId,Image>>` in TileAssets;
  include image-path validation and actionable technical errors.
- PixelWorld accepts optional `tileCatalog` defaulting to compiled TILESET;
  `replaceTileCatalog(catalog,images)` swaps a complete validated snapshot.
- `rebuildBackgrounds()` generates lower/upper caches using all layers and catalog
  revision. Asynchronous image completion has a generation guard against stale swaps.

- [x] Add render fixture with tile 27 sourced from a second atlas, below/above
  placements on each layer and actor overlap. Verify draw order and source crops.
- [x] Add missing/decode-failed image and out-of-order catalog load tests; the last
  selected project remains current, partial loads do not replace the active catalog.
- [x] Run red tests; implement loader, two caches and revision invalidation.
  Preserve actor y/x ordering, pivots, signs and current overlays.
- [x] Compare legacy fixture pixels and map data before/after; change a property,
  undo and ensure both caches update. Run focused tests and architecture.
- [x] Commit: `feat(world): render multiple atlases across tile layers`.

## T4 — Import/source save có validation, conflict và recovery

**Files:** `authoring_tilesets.py`, server/writer/client, builder adapter,
`tools/test_authoring_tilesets.py`, existing writer tests.

**Interfaces:**
- `TilesetWriter(root,lock)` shares `AuthoringWriter.lock`;
  `read()`, `import_png(request)`, `save_catalog(request)`, `recover()`.
- Request/response contracts and size limits are spec §5, not the scene save protocol.
- SourceSaveClient adds `importTileset(request)` and `saveTileset(request)` methods;
  token/bootstrap/error mapping reuse existing transport.
- `GET /__authoring/resource?id=tileset-catalog` reads current source/hash;
  import/properties POST routes use specialized writer.

- [x] Create disposable-root tests: valid PNG retained byte-for-byte under its hash;
  duplicate hash/layout idempotent; 16/24/32/48 crop layouts; dimensions, leftovers,
  APNG, decode error, oversized bytes and >8192 tile catalog rejected.
- [x] Test malicious source names/path/symlink, wrong Origin/token, disabled mode,
  endpoint-specific body limits and old `/__authoring/save` 1 MiB limit unchanged.
- [x] Test stale base hash, two simultaneous imports and IDE change during staging.
  Inject failure at each catalog/generated replacement; assert restore old bytes.
  Simulate startup recovery from interrupted publish; referenced image always exists.
- [x] Run failing Python tests, implement fixed-path import and transaction journal.
  Validate every source map against candidate properties before staging publication.
- [x] Recover journal before serving writer API; stale dependency hash returns 409
  without overwriting. Keep old menu/scene partial-build response behavior intact.
- [x] Run new and existing authoring tests, Python world tests and architecture.
- [x] Commit: `feat(authoring): persist tileset imports and properties safely`.

## T5 — Tileset Editor và working catalog trong preview

**Files:** TilesetDocument/Editor mới, WorldEditor, TilePaint registry injection,
world HTML/CSS, locales, tileset-editor tests and source transport tests.

**Interfaces:**
- `TilesetDocument({source,sourceHash,validate})` has draft/dirty/subscribe,
  `updateTiles(ids,properties)`, undo/redo and `acceptSource(hash,submittedPayload)`.
  New IDs are allocated by import workflow, not a freely editable field.
- `TilesetEditor(host,{document,onCatalogChange,onImport,onSave})` owns controls,
  focus and catalog history; it does not modify a world scene directly.
- `WorldEditor.applyTilesetDraft(catalog,images)` validates all open scene drafts
  plus untouched source scenes before swapping working catalog/images as one unit.
- `applyTileEdits(tiles,edits,{catalog=TILESET}={})` preserves old call sites and
  validates imported tile IDs against the passed working catalog.

- [x] Add UI cases: import preview → correct crop count → valid source import;
  properties single/batch undo; solid change rejected if it blocks any map arrival.
- [x] Add static-server case: preview/Playtest works with selected image, export
  references durable hash path and downloads PNG; status never claims source saved.
  Explain unsaved image/draft recovery limit explicitly in UI.
- [x] Run red tests; implement atlas selector, grid preview, properties and image
  lifecycle. Labels/errors/aria/help come from English authoring locale keys.
- [x] Pass working catalog explicitly to renderer, scene documents and helpers;
  do not mutate compiled TILESET. Text fields retain Ctrl+A/arrows/space.
- [x] Verify catalog snapshot save keeps later edits dirty; source save is disabled
  for a scene referencing IDs not in persisted catalog. Draft/Playtest remain usable.
- [x] Run focused browser, source transport tests and architecture.
- [x] Commit: `feat(authoring): add tileset import and property editor`.

## T6 — Layer edits qua document, migration và source roundtrip

**Files:** WorldDocument, TilePaint, JS/Python scene validators, builder, writer
payload version checks, source client consumers; document/scene/writer tests.

**Interfaces:**
- `applyLayerEdits(scene,layerId,edits,{catalog}) -> SceneV2` in TilePaint;
  edit `{x,y,tile:number|null}`, pure all-or-nothing result.
- `WorldDocument` adds optional `getCatalog:()=>CatalogV2` and
  `getCatalogHash:()=>string` callbacks;
  `applyLayerEdits(layerId,edits) -> boolean` uses one history entry.
- Layer UI always calls new layer API. Legacy `applyTileEdits` keeps old v1 behavior
  for callers/tests; do not reinterpret it silently as a multi-layer patch.
- Draft envelope v2 and read-v1 behavior follow spec §6. Export source keeps v1
  until first real layer mutation.
- `SourceSaveClient.saveScene(resourceId,{baseHash,catalogHash,payload})` calls
  `/__authoring/scenes/save` with transport schemaVersion 1; payload may be 1/2.
  `AuthoringWriter.save_scene(request)` implements the resource/version/hash
  contract and 8 MiB limit from spec §6. Old saveResource/menu API is unchanged.

- [x] Test open/select/no-op does not dirty v1; first real mutation produces v2;
  undo restores exact v1; redo restores v2; entity-only mutation stays v1.
- [x] Test null overlay erase, forbidden null base, ID 0 placement, unknown ID,
  wrong layer/grid size and invalid arrival rollback with redo stack unchanged.
- [x] Test v1/v2 import/export/draft roundtrip; reject ambiguous tiles+layers and
  stale catalog hash without overwriting draft. Keep export available for recovery.
- [x] Test full four-layer 256×256 scene save >1 MiB succeeds on new 8 MiB route;
  >8 MiB is rejected; old API still rejects >1 MiB; menu cannot use scene route.
- [x] Run red tests; implement pure edits, document integration and version handling.
  Add scene route, client and writer methods; validate resource payload version
  independently from transport version and cross-map catalog/arrival references.
- [x] Run Python world/writer, focused browser, builder build/check and architecture.
  Confirm all default scene source files are byte-identical to checkpoint.
- [x] Commit: `feat(authoring): persist versioned layer edits with compatible history`.

## T7 — Layer controls, tools và keyboard lifecycle

**Files:** TileMapEditor, WorldEditor, world HTML/CSS, locales, tilemap tests,
native review script.

**Interfaces:** TileMapEditor owns `activeLayerId`, visibility and lock state;
`cancelGesture()` runs before every context transition; document mutations use T6.
Visibility controls preview only; Play starts with all content and current catalog.

- [x] Test paint/rectangle/fill/sample affect active layer only; eraser overlays
  produce null, base eraser uses selected replacement; locked layer rejects edits.
- [x] Test hide does not alter JSON/hash/collision and Play includes hidden layer;
  overlay states explicitly mention hidden-layer collision.
- [x] Test context changes mid-pointer stroke: layer/tool/map/mode/import/save,
  capture loss and blur; none commits into the new context. Test Alt+1..4 scope,
  field focus, Tab reachability, Ctrl+Z routing and palette keyboard selection.
- [x] Run red tests; implement controls/preference state and cancel integration.
  Preserve brush rasterization, camera transform, edge clipping and fill behavior.
- [x] Native CDP exercise pointer and keys at multiple canvas scales and map sizes;
  inspect console, selection/focus and resulting draft, not screenshots alone.
- [x] Run focused browser and architecture.
- [x] Commit: `feat(authoring): add four-layer painting and keyboard controls`.

## T8 — Persistence và dependency races xuyên toàn workflow

**Files:** WorldEditor/source client/document integration, writer dependency checks,
existing review_authoring_source script, browser/source and Python tests.

**Interfaces:** saving captures scene payload, scene base hash and persisted catalog
hash together; later in-memory edits cannot be accepted as that submitted snapshot.
Catalog save revalidates source scenes; scene save validates against fresh catalog.

- [x] Add disposable-project sequence: import → edit properties → paint several
  layers → undo/redo → save catalog → save scene → new page/reload → Playtest.
  Assert image SHA, tile IDs, layer values, flags and resulting collision.
- [x] Add delayed-save edit, unsaved tile dependency, changed catalog during scene
  save, scene update during catalog save and incompatible incoming-spawn cases.
  Explicit reload/revalidate preserves an exportable recovery copy on conflict.
- [x] Add missing file/hash mismatch after reload and catalog image load failure;
  show specific status, prevent false applied success, allow restoring correct PNG.
- [x] Run failing cases, fix integration in owning modules; do not add a second
  project model, storage service or undo stack to work around an integration issue.
- [x] Run Python authoring/world tests, focused browser and native source review
  against temporary root; verify real default maps/atlas bytes did not change.
- [x] Commit: `test(authoring): verify layered map and tileset persistence`.

## T9 — Regression, documentation và handoff

**Files:** docs/review README, asset recovery README, review scripts and tests only
where remaining observed regressions justify changes.

- [x] Build acceptance scene in disposable fixture: grass+flower, solid trunk,
  overhead canopy, wall+roof, directional fence and valid transfer destination.
  Exercise keyboard walking and click-to-move, preview/play, save/reload.
- [x] Check 256×256 fill/cache refresh and small-map camera/selection; record actual
  measurements and failure symptoms. Do not introduce arbitrary performance claims.
- [x] Update authoring docs: English controls, empty vs 0, base eraser, independent
  collision/priority, hidden-layer collision, binary retention and restore workflow.
- [x] Run verification commands above: architecture, Python, builder, focused
  browser, main browser, then baselines. No repeated broad reruns after green unless
  later changes/failures justify them. Report skipped/unavailable checks accurately.
- [x] Record evidence in review README; PNG captures stay local per ignore policy.
  List acceptance scene steps, exact commands/results and remaining limitations.
- [x] Review diff for unintended source maps/art/save changes and commit:
  `docs(authoring): document tileset and layered map workflow`.

## Handoff and next plans

Execution recommendation: native using `superpowers:executing-plans`, in an
isolated worktree established at execution time. T1 → T9 is the default order;
each task must satisfy its verification before its commit. Review against spec
and programme; resolve any changed interface in both spec and dependent tasks.

After T9, prepare the advanced-painting plan and event-authoring plan from the
programme, using the shipped APIs. This foundation plan does not authorize a
generic event engine, new save fields or changing gameplay balance.
