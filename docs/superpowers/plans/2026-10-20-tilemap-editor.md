# Tilemap Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Vẽ địa hình bằng tile trực tiếp trong World Editor, dùng chung draft,
undo/redo, collision, Playtest và lưu scene hiện có.

**Architecture:** Một registry tile trong `content/` là nguồn cho renderer,
walkability và validators. Thuật toán tạo patch không phụ thuộc DOM; controller
TileMapEditor giữ preview và điều phối input, chỉ commit patch hợp lệ vào
WorldDocument một lần mỗi gesture. WorldEditor tiếp tục sở hữu scene và session.

**Tech Stack:** JavaScript ES modules, Canvas 2D, JSON, Python builders/unittest,
browser test harness và Chrome CDP hiện có; không thêm package.

**Spec:** [2026-10-20-tilemap-editor-design.md](../specs/2026-10-20-tilemap-editor-design.md).
Mốc source: `624a21b`. Đọc spec, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`
và `docs/DATA-AUTHORING.md` trước khi triển khai.

## Global Constraints

- Năm map hiện có; một lớp nền; scene schema v1, `tiles[y][x]`, ID 0–15, 16 px.
- Giữ blocked IDs `[5,6,7,8,12,13,15]`, atlas order, sprite pivots và footprints.
- Không sửa source map mặc định, art, archive, save schema, GameSession hay balance.
- Toàn bộ chrome editor bằng tiếng Anh, copy qua `content/locales/vi.js` + `t()`;
  page shell dùng `data-text`. Game preview giữ locale hiện tại.
- Mỗi gesture chỉ tạo một history entry; candidate invalid bị từ chối nguyên vẹn.
- Dùng writer/allowlist/hash conflict hiện hành; không mở API ghi tile registry.
- Chạy Chrome tuần tự trên Windows. Node không bắt buộc; ghi đúng các test đã chạy.
- Không cập nhật fixture/baseline gốc để hợp thức hóa refactor.

## Review Focus

1. Fast drag, ra khỏi canvas rồi quay vào, scale CSS/camera khác nhau: không lỗ
   giữa các ô hợp lệ, không ghi ngoài map hoặc nối nét qua đoạn đã ra ngoài (T2/T4).
2. Gesture gián đoạn bởi capture loss, blur, map/tool/mode switch hoặc import/save:
   không ghi nhầm document, không còn preview/capture treo (T4/T6).
3. Fill/rectangle có một ô spawn/portal không hợp lệ: rollback cả thao tác,
   history và redo giữ nguyên, UI còn dùng được (T2/T3).
4. Nhiều draft và save bất đồng bộ: cập nhật sau thời điểm submit vẫn dirty,
   không bị reload/acceptSource ghi đè; collision đọc cùng metadata (T1/T6).
5. Map lớn/nhỏ và camera pan: mọi ô tiếp cận được, cursor/collision/paint cùng hệ
   tọa độ, Play dùng camera cũ và default renderer pixels không đổi (T4/T5).

## File map và trách nhiệm

| File | Thay đổi / trách nhiệm |
|---|---|
| `content/world/tileset.json` (new) | Registry tile, atlas index, label keys, blocked |
| `content/world/tileset.js` (new) | Facade thuần cho compiled TILESET; lookup/crop/blocked helpers |
| `content/maps/scenes-data.js` (generated) | Thêm export TILESET; vẫn một generated output cho world writer |
| `tools/build_world_scenes.py` | Validate registry, compile TILESET, thay hardcoded tile limits/collision |
| `src/shared/validateWorldScene.js`, `src/pixel/maps.js` | Đọc cùng registry; giữ guard hiện tại |
| `src/pixel/PixelWorld.js`, `src/world/WorldRenderer.js` | Tile crop theo registry; editor-only camera override |
| `tools/authoring/TilePaint.js` (new) | Raster line, rectangle, flood fill và immutable tile patch |
| `tools/authoring/WorldDocument.js` | Validate/apply tile patch qua history hiện tại |
| `tools/authoring/TileMapEditor.js` (new) | Gesture/preview, palette state, tile cursor, tool shortcuts và overlay |
| `tools/authoring/WorldEditor.js` | Compose Tile mode với Entities/Edit/Play/source lifecycle |
| `tools/world-editor.html`, `tools/world-editor.css` | Toolbar, palette và accessible English controls |
| `content/locales/vi.js` | `authoring.tiles.*`, tên tile/tool, help và lỗi |
| `tests/tile-paint.test.js`, `tests/tilemap-editor.test.js` (new) | Pure algorithms/document và browser integration |
| `tests/fixtures/tile-paint-cases.json` (new) | Expected patches cho các tool/edge case xác định trước |
| `tests/world-scenes.test.js`, `tests/test_world_scenes.py` | Metadata parity/invalid tiles/collision guards |
| `tests/world-editor.test.js`, `tools/test_authoring_write.py` | Runtime equivalence, source fixture dependencies, snapshot/save |
| `tests/index.html`, `tests/world-authoring.html` | Đăng ký test mới, giữ main log cho baseline checker |
| `tools/review_world_authoring.py`, `tools/review_authoring_source.py` | Native CDP input và save trên disposable fixtures |
| `docs/DATA-AUTHORING.md`, `docs/ARCHITECTURE.md`, `docs/ui-reviews/tilemap-editor/README.md` | Workflow, boundaries và bằng chứng nghiệm thu |

Không tách lại toàn bộ WorldEditor. Chỉ extract TileMapEditor và thuật toán tile,
không tạo framework command/entity/layer engine mới.

## T1 — Một nguồn định nghĩa tile cho runtime và validators

**Files:** tileset JSON/facade mới; world builder/generated module, PixelWorld,
maps.js, JS validator, locale; tests world-scenes/Python/authoring-write fixtures.

**Interfaces:** `TILESET` là registry đã validate;
`tileDefinition(id:number) -> TileDefinition` ném lỗi nếu ID không tồn tại;
`tileSourceRect(id:number) -> {x,y,width,height}`;
`isTerrainBlocked(id:number) -> boolean` dựa trên lookup đã validate.
Python thêm `tile_definitions(root=ROOT) -> dict` và đổi thành
`blocked_cells(scene,prefabs,tileset) -> list[list[int]]`, truyền registry tường minh.

- [x] Thêm failing tests: đủ ID 0–15, crop ID 0=`[0,0,16,16]`, ID 15=
  `[112,16,16,16]`, blocked set giữ nguyên; từ chối ID 16/-1, bool, string,
  duplicate/missing registry ID, atlasIndex ngoài atlas và label key không tồn tại.
- [x] Chạy Python world tests và focused browser suite; xác nhận lỗi do chưa có
  registry/helpers. Dùng danh sách file kiểm thử hiện có, không tạo test phụ mirror
  từng dòng triển khai.
- [x] Thêm registry/facade và compile TILESET vào output world hiện hành. Validate
  columns/count/tile size với `assets/pixel/atlas.json`; default ID = atlas index.
  Thêm English label keys trước build; không chạy lại art generator.
- [x] Thay các giới hạn ID và blocked lists lặp ở renderer/runtime/JS/Python bằng
  registry. Cập nhật `render_outputs(root=fixture, overrides=...)` và fixture copier
  trong writer tests để mang theo tileset JSON + atlas metadata; không lệ thuộc
  registry của checkout thật khi đang compile bản sao.
- [x] Build/check world; chạy tests Python, focused browser và original renderer
  equivalence cho đủ năm map. Kết quả bắt buộc: MAPS materialize như fixture và
  pixels cũ khớp; không đổi source scene hay fixture.
- [x] Commit `refactor(world): share tile definitions across rendering and validation`.

## T2 — Thuật toán tạo patch thuần và transaction trong document

**Files:** TilePaint.js, WorldDocument.js, tile-paint.test.js, shared fixture cases;
đăng ký test trong hai browser entry. Chưa gắn pointer vào editor.

**Interfaces:** `Cell={x:number,y:number}`, `TileEdit={x:number,y:number,tile:number}`.
`lineCells(from:Cell,to:Cell) -> Cell[]` nhận các đầu mút hợp lệ trong map;
`rectangleCells(from:Cell,to:Cell,{width,height}) -> Cell[]` inclusive/clamped;
`floodCells(tiles:number[][],start:Cell) -> Cell[]` bốn hướng;
`applyTileEdits(tiles:number[][],edits:TileEdit[]) -> number[][]` không sửa input,
reject tọa độ/ID invalid, deduplicate theo ô (edit sau thắng).
`WorldDocument.applyTileEdits(edits:TileEdit[]) -> boolean` trả false cho no-op,
ngược lại validate candidate rồi dùng `replace` đúng một lần.

- [x] Thêm failing fixture tests: đường ngang/dọc/chéo/đảo chiều và bước nhảy nhanh;
  rectangle đảo góc, biên map; fill vùng đóng/bốn hướng và map 256×256 không recursion;
  duplicate edits, input bất biến, malformed edits và no-op không đổi history/redo.
- [x] Thêm document regression: một patch 100 ô = một undo, redo khôi phục;
  patch chặn spawn, portal nguồn hoặc incoming spawn bị từ chối toàn bộ, byte draft,
  source hash và history/future không đổi; painting không sửa objects/NPCs/portals.
- [x] Chạy focused suite để chứng minh các test mới fail trước triển khai.
- [x] Viết các hàm thuần; dùng raster line số nguyên và queue fill với visited set
  cùng head index (không Array.shift), tối đa width×height ô. WorldDocument không
  nhận state tool/cursor/preview.
- [x] Chạy focused suite; xác nhận mọi fixture expected patch khớp, cancel/undo cũ
  của object editor vẫn qua. Không lưu candidate invalid vào document.
- [x] Commit `feat(authoring): add immutable tile painting operations`.

## T3 — Palette và gesture vẽ có preview, không thay draft giữa chừng

**Files:** TileMapEditor.js mới; WorldEditor.js, HTML/CSS, locale;
tilemap-editor.test.js và world-editor.test.js.

**Interfaces:** `new TileMapEditor(editor:WorldEditor)`; `tool` thuộc
`brush|rectangle|fill|eyedropper|eraser`; `primaryTile:number`, `eraseTile:number`
(default 0); `setActive(active:boolean)`, `setTool(tool)`, `cancel()`, `dispose()`.
`handlePointerDown/Move/Up(event) -> boolean` cho biết có consume event;
`draw(context,world) -> void` vẽ preview/cursor, dùng T1/T2. WorldEditor giữ
`editLayer:'entities'|'tiles'` và `setEditLayer(layer)`; không tách lịch sử.

- [x] Viết failing browser tests: palette đủ 16 thumbnail từ ảnh đã load; hai mode
  riêng Entities/Tiles; mỗi tool cho patch mong đợi; Eyedropper không thêm history
  và trở về Brush; Eraser dùng eraseTile, không sinh null/transparent.
- [x] Thêm regression: pointermove chỉ đổi preview, draft/history còn nguyên;
  pointerup commit một lần, rectangle/fill invalid rollback cả gesture; no-op không
  xóa redo. Overlay không cho object drag chạy khi Tiles đang active.
- [x] Chạy focused suite, xác nhận RED; rồi tạo palette/tool controls qua t()/data-text,
  focus/aria-pressed và cursor tile outline. Tái sử dụng world.tiles đã load;
  không hardcode đường dẫn ảnh mới trong JS.
- [x] Nối pointer handlers qua TileMapEditor. Preview dùng Map ô khác nhau, không
  gọi WorldEditor.changed()/rebuildBackgrounds trên từng pointer event. Khi commit
  dùng document đã khóa lúc bắt đầu; validate fail thì xóa preview, báo lỗi rồi
  giữ document nguyên vẹn. Grid/Collision là các toggle độc lập.
- [x] Chạy focused suite và object editor regressions; chụp desktop + compact để
  xác nhận palette/toolbar không che canvas hoặc làm mất focus/capture.
- [x] Commit `feat(authoring): add tile palette and painting mode to world editor`.

## T4 — Input gián đoạn, keyboard và điều hướng camera editor

**Files:** TileMapEditor.js, WorldEditor.js, PixelWorld.js, WorldRenderer.js,
locale, tilemap-editor.test.js; mở rộng CDP review world.

**Interfaces:** `TileMapEditor.handleKey(event:KeyboardEvent) -> boolean`;
`TileMapEditor.panBy(dxPx:number,dyPx:number)`, `ensureCursorVisible()`,
`PixelWorld.setEditorCamera(position:{x:number,y:number}|null) -> void`.
Camera override chỉ dùng khi world.editing; units là native pixels. Renderer dùng
quy tắc clamp/căn giữa sẵn có, không biến editor camera thành session state.

- [x] Viết failing tests cho đúng phím tắt trong spec; không cướp key ở field,
  Ctrl/Cmd/Alt+B/R/F/I/E, Play hoặc Entities. Rectangle bằng hai Enter và Escape;
  cursor clamp, auto-pan và keyboard-only paint/undo đều hoạt động.
- [x] Thêm tests hủy stroke qua Escape/capture loss/pointercancel/blur, đổi map,
  tool/layer/Edit–Play, import/restore/reset, undo/redo/export/source-save và dispose.
  Kiểm tra draft/history/redo giữ nguyên, không repaint sau cancellation.
- [x] Thêm mapping cases: fast drag ở CSS scale khác nhau; sample ngoài map
  không ghi và không nối nét khi quay vào; pointerId thứ hai/nút phải bị bỏ qua;
  document đổi từ ngoài hủy preview. Chạy suite để xác nhận RED.
- [x] Triển khai keyboard/input lifecycle. Release capture một lần; không rebuild
  overlay DOM trong gesture. Pan bằng Space+drag dùng transport riêng, không tạo
  history. Reset previous brush point khi pointer sample ra ngoài map.
- [x] Thêm editor camera override + camera state theo map trong tool. Play bỏ
  override và dùng safePosition hiện tại; trở lại Edit khôi phục camera tool.
  Map nhỏ giữ căn giữa, map lớn 256×256 tiếp cận được cả bốn góc bằng pan/cursor.
- [x] Chạy focused suite + original renderer equivalence. CDP thực: brush nhanh,
  kéo ra ngoài canvas khi capture, Escape, pan, undo và map switch tại desktop và
  compact viewport; session snapshot không đổi trong edit. Lưu report input/scale.
- [x] Commit `feat(authoring): support tile keyboard input and editor camera panning`.

## T5 — Cache, collision overlay và chơi thử bản nháp

**Files:** TileMapEditor.js, WorldEditor.js, PixelWorld.js;
tilemap-editor.test.js, world-editor.test.js, review_world_authoring.py.

**Interfaces:** Giữ `replaceMapCatalog(catalog)` và background cache hiện có;
TileMapEditor.draw dùng T1 terrain metadata cộng solid footprints từ cùng draft.
Không thay đổi quy tắc visibleNPCs hoặc pathfinding.

- [x] Thêm integration tests: commit/undo/redo đổi tile pixels và collision tương ứng;
  map khác không bị mất draft; overlay solid footprint khớp runtime; tắt overlay
  không thay walkability. Đổi tile dưới vị trí player rồi Play dùng safe spawn.
- [x] Chạy tests để xác định phần còn thiếu. Với case đã pass do cơ chế sẵn có,
  giữ regression và ghi rõ không cần code fix; không tạo failure giả. Nối cache
  update sau commit nếu cần, giữ preview ở lớp tool và chỉ vẽ các ô preview nằm
  trong viewport. Không refactor cache hoặc tối ưu khác khi chưa có measurement.
- [x] Chơi thử draft: tile blocked chặn di chuyển, tile walkable đi được, portal
  còn dùng được và thoát Play không ghi save/session. Giữ interactionDisabled hiện
  hành của world editor; không âm thầm chạy story commands.
- [x] Review thao tác vẽ map 256×256 trên scene fixture hợp lệ, Fill vùng lớn và
  drag dài: không stack overflow, palette/canvas không bị thay node, mỗi gesture
  một history. Ghi thời gian đo được như diagnostic, không tự đặt tuyên bố FPS.
- [x] Chạy focused suite, đối chiếu ảnh mặc định đủ năm map và chụp một draft đã
  vẽ + collision + Play. Hoàn tác draft sau capture, không ghi source thật.
- [x] Commit `fix(authoring): keep painted terrain and playtest collision synchronized`.

## T6 — Lưu/reload, gate toàn dự án và hướng dẫn sử dụng

**Files:** tests tilemap/world editor, tools/test_authoring_write.py,
tools/review_authoring_source.py, review_world_authoring.py, docs workflow/review.

**Interfaces:** Giữ `scene/<mapId>`, `baseHash`, payload scene v1 và generated output
`content/maps/scenes-data.js`; không mở rộng resource allowlist. `acceptSource`
chấp nhận submitted snapshot, không dùng draft mới hơn trong lúc chờ response.

- [x] Thêm integration tests bằng disposable source root: paint → save →
  compile → reload → save lần hai giữ tile và hash; stale409/invalid422 giữ source
  và generated bytes. Registry/atlas được đọc từ đúng root fixture.
- [x] Test save đang chờ: stroke chưa thả bị hủy trước submit; stroke commit mới
  sau submit vẫn còn trong draft và dirty khi response về. Import/draft restore
  giữ tile, objects/NPCs/schedules, identity; lỗi import không thay history.
- [x] Chạy targeted tests; xác nhận RED cho hành vi còn thiếu, giữ các case đã
  pass mà không tạo failure giả. Chỉ sửa writer/acceptSource nếu test chứng minh
  có thiếu sót, không thêm endpoint hoặc nguồn state thứ hai.
- [x] Chạy gate ở phần dưới theo đúng thứ tự main → baselines, Chrome tuần tự.
  Tiêu chí: mọi test main đều pass, 12 policies khớp, builder/inventory đồng bộ,
  architecture không có lỗi và source map gốc không đổi.
- [x] Cập nhật DATA-AUTHORING, ARCHITECTURE và review README: phím tắt, Eraser là
  replacement, invalid stroke rollback, pan/Edit–Play, save/export, feature deferred,
  lệnh reproduce và kết quả thật. Retain ảnh/report local theo ignore policy.
- [x] Review cuối tập trung vào năm mục Review Focus, sửa issue trước bàn giao;
  ghi commit IDs và file source để rollback. Commit
  `test(authoring): verify tilemap persistence and document painting workflow`.

## Lệnh kiểm tra

Server tĩnh: `python tools/serve.py --port 8096`. Với source-save review, dùng
recipe fixture của `tools/review_authoring_source.py`, không bật ghi source thật.

```powershell
python tools/build_world_scenes.py --build
python tools/build_world_scenes.py --check
python tools/check_asset_packs.py --check
python tools/build_menu_layout.py --check
python tools/build_screen_layout.py --check
python tools/build_dialogue_ui.py --check
python tools/build_dialogue_motion.py --check
python -m unittest discover -s tests -p 'test_*.py'
python -m unittest discover -s tools -p 'test_*.py'
python tools/check_architecture.py
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/world-authoring.html --real-time --timeout 180 --profile-root tmp/browser-tests --output-prefix playtest
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --real-time --timeout 240 --profile-root tmp/browser-tests
python tools/check_baselines.py
python tools/review_world_authoring.py --output docs/ui-reviews/tilemap-editor
python tools/review_authoring_source.py
git diff --check
git diff -- content/maps/scenes/
```

Sau khi thêm locale keys phải build world; sau main không ghi focused test vào
`tools/test_results.log`. Thư mục profile nằm trong workspace; Windows có thể cần
quyền chạy Chrome/tạo fixture temp. Không tính test skip thành pass. Không đặt
trước số test mới; baseline hiện tại trước triển khai là main126 và 12 policies.

## Thứ tự, nghiệm thu và rollback

T1 → T2 → T3 → T4 → T5 → T6. Đề xuất triển khai native tuần tự trong cùng phiên,
vì phần input phụ thuộc interface patch/document và camera; review độc lập một lần
cuối. Trước khi thực thi, áp dụng workflow execution/worktree phù hợp workspace.
Trạng thái thực thi: T1–T6 đã hoàn thành trên feature branch; final review và hai
regression focus/cursor đã qua. Main145/145, focused32/32; 12 baseline khớp.

Gate bàn giao: toàn bộ năm điểm nghiệm thu trong spec có test hoặc capture/report,
map source/fixture/baseline giữ nguyên, English chrome đầy đủ, các editor khác
không hồi quy. Mỗi task commit theo ranh giới phía trên sau khi test liên quan qua.
Rollback bằng revert các commit tính năng theo thứ tự ngược; không xóa art/source
hoặc regenerate baseline. Source ví dụ nếu có chỉ nằm trong bản sao disposable.

## Self-review kế hoạch

- [x] Năm tool, palette, grid/collision, pan, keyboard, Play và persistence đều có task.
- [x] Registry không tạo output thứ hai hay resource allowlist mới cho writer.
- [x] Patch/controller/document có interfaces thống nhất; chỉ commit candidate hợp lệ.
- [x] Năm Review Focus có regression được chỉ định ở task sở hữu.
- [x] Tách rõ task độc lập, tiêu chí pass và deferred scope; không yêu cầu sửa source
  map, save schema, asset binary hoặc baseline để hoàn thành editor.
