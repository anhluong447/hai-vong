# World map foundation design

Ngày: 2026-10-21. Mốc khảo sát: `2185a55`.
Phạm vi: mốc 1–2 của [chương trình world authoring](../../WORLD-MAP-AUTHORING.md).
Tài liệu được chuẩn bị theo yêu cầu lập kế hoạch; code chưa được triển khai.

## 1. Ý định và tiêu chí thành công

Tác giả nội dung nhập tileset PNG, đánh dấu wall/walkable/overhead, vẽ bốn layer,
lưu rồi đi thử ngay trong World Editor. Giữ undo/redo, draft, keyboard, camera và
luồng nguồn hiện tại. Người dùng đã yêu cầu editor dùng tiếng Anh; không thay
ngôn ngữ game hoặc thiết kế HUD/menu.

Thành công là một cảnh thử có nền, hoa, thân cây, tán cây, tường và mái hiên;
đi bộ/click-to-move thấy cùng quy tắc va chạm; lưu/reload giữ đúng ảnh/layer.
Năm scene gốc vẫn hiển thị và chơi như trước.

## 2. Phạm vi và lựa chọn

Chọn mở rộng hệ thống hiện tại thay vì dùng editor ngoài làm nguồn chính hay
tương thích toàn project MZ. Tách nguồn ảnh, placement layer, draw priority và
collision. Bốn layer có thứ tự cố định; tên gợi ý không áp đặt mục đích gameplay.

Bao gồm regular-grid PNG import, nhiều atlas, thuộc tính va chạm/cạnh/priority,
source save, bốn tile layer và migration v1 đọc được. Chưa gồm autotile, region,
shadow pen, bridge có hai độ cao, event interpreter, arbitrary script hoặc MZ
A1–A4 import. Các phần tiếp theo đã có đầu ra trong chương trình tổng thể.

## 3. Global constraints

- Giữ tile ID 0–15, thứ tự atlas cũ và blocked IDs `[5,6,7,8,12,13,15]`.
- Đơn vị ô world vẫn 16 px; source tile size chỉ đổi crop và scale hình.
- Editor chrome dùng tiếng Anh qua `content/locales/vi.js` + `t()`; shell dùng `data-text`.
- Giữ năm scene gốc, formula/gameplay rulesets, save schema, balance và baselines.
- Candidate invalid bị từ chối toàn bộ; một gesture tạo tối đa một undo entry.
- Runtime không phụ thuộc authoring server; source write chỉ trên loopback được bật rõ ràng.
- Dùng ES modules, Canvas, JSON, Python và Pillow hiện có; không thêm runtime package.
- Không chỉnh archive/clb-hoi hoặc mở rộng ignore policy để track toàn bộ binary.

## 4. Tile catalog v2

Mở rộng `content/world/tileset.json` thành catalog schema v2; builder đọc cả v1/v2.
V1 được chuẩn hóa trong bộ nhớ; không bắt buộc rewrite source cũ khi build.

Catalog v2 có `schemaVersion`, `nextTileId`, `atlases`, `tiles`:

- Atlas: `id`, `imagePath`, `sha256`, `sourceName`, `imageWidth`, `imageHeight`,
  `tilePixels`, `margin`, `spacing`. ID/path legacy ánh xạ từ atlas đang có;
  atlas import dùng ID/hash của ảnh. `sourceName` chỉ là metadata tác giả.
- Tile: `id`, `atlasId`, `atlasIndex`, `collision`, `blockedEdges`, `drawPriority`,
  cùng `labelKey` cho tile gốc; tile import có `editorName` tùy chọn.
- `collision`: `none | solid`; `drawPriority`: `below | above`;
  `blockedEdges`: tập không trùng trong `up, right, down, left`.
- Tile ID là số nguyên không âm; ID 0 là tile thật, không phải ô trống.
  Import cấp ID mới từ `nextTileId`; không tái sử dụng hoặc đánh lại ID.
  Import tối đa 8192 tile trong catalog; đếm theo records, không dùng ID làm count.
- `tileSourceRect(id, catalog)` trả `atlasId,x,y,width,height`; `tileDefinition`
  kiểm tra bằng membership. Không tiếp tục giả định `id === atlasIndex`.
- Xóa atlas/tile đang được source hoặc draft tham chiếu bị từ chối. Mốc này chỉ
  hỗ trợ append/import và sửa properties, chưa có nút delete hoặc thay ảnh tại chỗ.

Runtime/game không dùng `editorName` làm logic hay player text. Tile import chưa
đặt tên dùng label key chung có tham số ID. Khi lưu properties, kiểm tra mọi scene
và draft đang mở; đổi collision làm spawn/arrival không hợp lệ bị từ chối.

## 5. Import và lưu ảnh

Luồng UI tiếng Anh: `Import Tileset` → chọn PNG → preview grid → đặt tile size,
margin/spacing → review → `Import`. Default source tile size 16; hỗ trợ 16,24,32,48.
Margin/spacing là số nguyên 0–32; số ô phải khớp cả hai chiều, không có dải pixel
thừa. Chỉ nhận PNG tĩnh, tối đa 8 MiB và mỗi chiều tối đa 4096 px.

Browser decode để preview; Python/Pillow kiểm tra độc lập signature, decode đầy đủ,
kích thước và số tile trước khi ghi. Tên file người dùng không trở thành đường dẫn.
Ảnh giữ nguyên bytes, nằm tại `assets/tilesets/<sha256>.png`; duplicate hash/layout
trả lại atlas/tile IDs đã có; cùng ảnh với layout khác được từ chối ở mốc này.
Legacy atlas tiếp tục đọc từ `assets/pixel/` và không bị copy/thay thế.

Static server: import tạo preview/draft, export metadata và download ảnh cùng hướng
dẫn chép vào path hash; báo rõ chưa lưu vào source. Không dùng data URL/blob URL
trong JSON export hoặc generated runtime. Native File System Access không bắt buộc.
Playtest trong editor dùng ảnh trong bộ nhớ khi chưa lưu; reload chỉ được kỳ vọng
phục hồi ảnh sau khi source save hoặc bàn giao file theo workflow thủ công.

Authoring server: thêm GET catalog qua resource ID `tileset-catalog`, và hai POST
chuyên biệt `/__authoring/tilesets/import`, `/__authoring/tilesets/save`.
Giữ Host/Origin/token policy; không biến writer thành API ghi file tùy ý.

- Import request: `{baseHash,pngBase64,sourceName,tilePixels,margin,spacing}`.
  Giới hạn body riêng 12 MiB; route `/__authoring/save` cũ vẫn 1 MiB. Properties save:
  `{baseHash,payload}` với catalog v2, tối đa 4 MiB để đủ catalog 8192 tile.
- Thành công: `{hash,payload,applied:true}`. Conflict: HTTP 409 cùng hash hiện tại;
  candidate invalid: 422. Không tự retry đè dữ liệu khi conflict.
- Shared writer lock với scene save. Đọc fresh source, validate toàn project,
  build output rồi mới thay catalog và generated module. Hash phải recheck
  source/dependencies ngay trước publish, kể cả IDE sửa trong lúc stage.
- Write PNG immutable trước khi publish catalog. Lỗi trước publish không làm
  catalog tham chiếu ảnh thiếu; file ảnh chưa tham chiếu có thể còn lại.
- Catalog/generated thay qua staging, backup và recovery journal riêng trong
  `tmp/authoring-transactions/`. Lỗi publish rollback; startup recovery chạy dưới
  lock trước khi phục vụ source API. Không tuyên bố nhiều file atomic ở cấp OS.
  Giữ nguyên response contract source-saved/build-failed của menu/scene cũ.

Binary theo `.gitignore` hiện tại. Track catalog/provenance và hướng dẫn restore;
ảnh phải nằm trong asset pack đi cùng project. Preflight báo thiếu/hash lệch ảnh,
không bỏ qua silently hoặc tự download. Không hứa clone Git riêng đã đủ asset.

## 6. Scene v2 và tương thích

Scene v2 thay `tiles` bằng `layers`, đúng bốn entries có ID `layer-1`..`layer-4`
theo thứ tự cố định, mỗi entry `{id,tiles}` cùng width/height scene. Layer 1 không
chứa null; ba layer còn lại dùng null để biểu diễn trống. Tile IDs khác phải có
trong catalog. Các field entity/NPC/portal/sign giữ nguyên.

`normalizeTileLayers(scene)` đọc scene v1 thành bốn grid trong bộ nhớ: tile gốc
ở layer 1, ba layer rỗng. Scene v2 có đồng thời `tiles` và `layers` bị từ chối.
Không có nguồn tile thứ hai để đồng bộ. Runtime hydration mang `layers`; `tiles`
compatibility view lấy từ layer 1 cho consumer chưa chuyển, không dùng cho collision.

Mở editor hoặc chọn layer không làm dirty/upgrade. Gesture tile đầu tiên dùng
đường layer API nâng draft v1 → v2 và nằm trong cùng undo entry; undo trở lại
đúng source v1. Entity-only edit tiếp tục giữ v1. Build/source validation hỗ trợ
cả hai version; nguồn mặc định không tự rewrite hàng loạt.

Scene editor mới lưu qua POST `/__authoring/scenes/save`, tối đa 8 MiB, vì bốn
grid 256×256 có thể vượt 1 MiB. Request là
`{resourceId,schemaVersion:1,baseHash,catalogHash,payload}`; resource chỉ nhận năm
scene allowlisted, payload v1/v2. `catalogHash` phải khớp catalog source hiện tại
trước publish; mismatch trả 409. Response giữ contract scene save hiện tại.
API `/__authoring/save` giữ compatibility v1/giới hạn cũ cho consumer cũ;
transport version và payload version không được đánh đồng.

Draft envelope v2 thêm `catalogHash` và `tileIdentities` (ID, atlas ID, atlas index), giữ `sourceHash`. Read draft v1 qua adapter;
chỉ restore nếu source hash khớp và mọi tile còn hợp lệ. V2 mismatch catalog hash
không âm thầm restore; cho export bản draft để giữ việc, reload catalog rồi thử
revalidate rõ ràng. UI giữ nguyên envelope bị từ chối, chặn ghi đè và có nút tải
xuống/revalidate. Revalidate vẫn kiểm tra source hash và identity từng tile;
envelope cũ thiếu identity chỉ cho tải xuống để phục hồi thủ công khi lệch catalog.
Undo/Redo cũng kiểm tra identity và validate trước khi đổi draft/history. Import
đang lưu bảo vệ identity đã cấp để Undo không tái sử dụng ID đang được publish.
Image blob chưa lưu không được giả vờ là durable draft.

## 7. Collision và renderer

Quy tắc chọn cho dự án: **tile `solid` ở bất kỳ layer nào đều chặn ô**; các cạnh
bị chặn được hợp lại giữa các layer. Tile collision `none` không xóa block ở lớp
khác. Đây là lựa chọn bảo thủ của dự án, khác cách một số tile MZ ưu tiên passage
trên cùng. Bridge đi đè nước cần thiết kế override/độ cao riêng, chưa hỗ trợ.

`cellPassage(scene,x,y,catalog)` trả `{blocked,blockedEdges}`.
`canStep(map,from,to,npcs,catalog)` chỉ nhận bước Manhattan 1, kiểm tra ô đến,
cạnh ra của ô nguồn, cạnh vào đối diện của ô đích và entity footprints. Có thể
thoát khỏi ô nguồn đang có NPC overlap; vẫn tôn trọng terrain/cạnh nguồn.
`walkable` tiếp tục là truy vấn khả năng đứng tại ô; spawn/arrival không cần có
đường tới mọi nơi. Movement và BFS phải dùng `canStep`, không chỉ `walkable`.

Nền grass+flowers: cả hai none. Trunk solid; canopy above+none. Wall solid dưới
roof above+none vẫn bị chặn. Inspector trình bày collision và priority riêng;
chọn above mặc định none cho tile mới, không âm thầm đổi properties đã lưu.

Renderer tạo cache dưới và trên nhân vật, duyệt layer 1→4 cho mỗi nhóm. Vẽ dưới
→ actors hiện có theo y/x → trên → các overlay hiện có. Không thay actor pivots.
Cache key gồm map content và catalog/image revision, không chỉ grid layer 1.
Sau đổi atlas/layer/properties/undo phải invalidation đúng cả hai cache.

Preview hide-layer chỉ đổi cách nhìn, không làm ô đi được; collision overlay vẫn
thể hiện tổng collision và ghi rõ khi có lớp bị ẩn. Playtest bỏ hide/lock editor
và dùng toàn bộ layer. Nếu thiếu ảnh, báo lỗi cụ thể; không cho bước import/save
thành công rồi vẽ silently bằng atlas khác.

## 8. UI, history và isolation

Giữ World Editor làm host; thêm Tileset Editor panel và layer controls trong
Tiles mode. Không đổi `Entities` thành engine event chung ở mốc này.

- Palette chọn atlas, search label/ID, highlight selection; properties hỗ trợ
  multi-select và một undo entry cho một lần apply batch.
- Layer controls: active, visible, locked. Hide/lock thuộc editor preference,
  không vào scene JSON, source hash hoặc save game. Không reorder layer mốc này.
- Keyboard: Alt+1..4 chọn layer trong tile canvas; Ctrl+Z/Ctrl+Y dùng history của
  panel đang focus; input/select/contenteditable không bị tool shortcuts lấy mất.
  Tab/Shift+Tab vào palette, properties và layer controls; nút có focus-visible.
- Eraser layer 1 tiếp tục dùng replacement tile; layer 2–4 đặt null. Brush,
  Rectangle, Fill, Eyedropper chỉ sửa/đọc active layer. Layer lock chặn mutation.
- Đổi layer/tool/map/mode, import/save, blur, mất capture hoặc Play hủy preview
  đang chạy. Registry edit có document/history riêng, không trộn undo scene.
- Shared project context truyền catalog tường minh vào validators, document,
  renderer và collision. Không sửa global generated constants để làm preview.
- Chỉ source-saved snapshot được accept; chỉnh thêm trong lúc request đang chạy
  vẫn dirty. Không cho paint với tile chỉ tồn tại trong catalog chưa lưu rồi lưu
  scene source trước catalog; draft/Playtest được phép dùng working catalog.

## 9. Ranh giới module

| Module | Trách nhiệm |
| --- | --- |
| `content/world/tileset.json`, `tileset.js` | Catalog content và lookup thuần |
| `src/shared/tileLayers.js`, `tilePassage.js` | Normalization/composition thuần |
| `src/shared/validateTileset.js`, `validateWorldScene.js` | Validation JS; nhận catalog rõ ràng |
| `tools/world_tilesets.py`, `build_world_scenes.py` | Validation Python và deterministic compile |
| `tools/authoring_tilesets.py` | Import, fixed paths, conflict, transaction/recovery |
| `tools/authoring/TilesetDocument.js`, `TilesetEditor.js` | Working catalog, history và UI |
| `tools/authoring/WorldDocument.js`, `TilePaint.js`, `TileMapEditor.js` | Layer edits qua history/gesture hiện có |
| `src/pixel/PixelWorld.js`, `src/world/WorldRenderer.js` | Asset loading, cache và render ordering |
| `src/world/TileAssets.js` | Load atlas images, kiểm soát lỗi và stale async completion |
| `src/pixel/maps.js`, `MovementSystem.js` | Standing queries, directional steps và BFS |

Không thêm state field vào GameSession trong nền tảng; đó là boundary riêng của
event project. Event pages và command runner không được lén đưa vào task renderer.

## 10. Kiểm chứng và bàn giao

Fixtures kiểm tra cùng input qua JS/Python: v1/v2 migration, null/0, sparse IDs,
collision union, hướng đối diện, invalid portal/spawn. Failure injection kiểm tra
writer conflict/rollback/recovery và image limits trên disposable project root.

Browser/native review có import, properties, layer paint, hide/lock, eraser,
undo/redo, keyboard, reload và Playtest; ảnh gốc so với v1 fixture không đổi.
Main suite và baseline comparison giữ nguyên; thời gian đo map 256×256 được
ghi lại, không đặt một SLA hiệu năng tùy ý khi chưa có measurements.

Docs cập nhật cách lưu/khôi phục PNG và phân biệt preview, draft, source save.
Mỗi commit phải có kiểm tra phù hợp; cổng bàn giao cuối chạy architecture,
Python, builder check, focused browser, main browser rồi baselines tuần tự.
