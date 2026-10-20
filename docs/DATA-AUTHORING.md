# Chỉnh giao diện và bản đồ

Ba công cụ authoring dùng dữ liệu JSON có kiểm tra schema. Game đọc các ES module
được sinh từ JSON; bản phát hành không cần server ghi file hay editor.
Giao diện công cụ dùng tiếng Anh; nội dung game trong preview dùng bản tiếng Việt.

## Mở công cụ

Từ thư mục dự án, chạy server tĩnh hiện có:

```powershell
python tools/serve.py --port 8096
```

| Công cụ | URL |
|---|---|
| Menu sáu tab | http://127.0.0.1:8096/tools/coastal-menu-v2-preview.html?edit=1 |
| Bản đồ | http://127.0.0.1:8096/tools/world-editor.html |
| HUD | http://127.0.0.1:8096/tools/ui-layout-editor.html |
| Hội thoại SVG Stage 4 | http://127.0.0.1:8096/tools/ui-layout-editor.html?screen=dialogue |

Trong menu, chọn vùng bằng danh sách hoặc nhãn trên hình. Kéo thân vùng để di
chuyển, kéo góc vàng để đổi kích thước khi vùng hỗ trợ. Inspector cho phép sửa
vị trí, kích thước, cỡ chữ và khoảng cách theo phạm vi từng vùng. Mũi tên dịch
1 design px, Shift+mũi tên dịch 10 px; Shift khi kéo bỏ bám lưới 4 px.
Ctrl+Z/Ctrl+Y hoàn tác/làm lại, Esc huỷ lần kéo, F1 đổi chỉnh sửa/chơi thử.
Các vùng chỉ có thông số grid hoặc typography được chỉnh qua inspector.

Editor bản đồ hỗ trợ `home`, `yard`, `newsroom`, `street`, `interaction`. Chọn
prop/NPC trên bản đồ hoặc danh sách, kéo theo ô, thêm từ palette hoặc xoá.
Inspector tách vị trí ô, điểm neo, lệch hình và footprint va chạm. Khung xanh
biểu thị hình, vàng biểu thị vùng chọn, ô đỏ biểu thị footprint. Mũi tên dịch
1 ô, Shift+mũi tên dịch 5 ô; Delete xoá, Ctrl+Z hoàn tác.
Chế độ sửa dừng movement và đồng hồ animation; chơi thử dùng draft đã kiểm tra
và vị trí đứng hợp lệ. Lịch NPC vẫn được giữ đầy đủ trong JSON, kể cả NPC đang
ẩn trong gameplay. Phiên thử ở bộ nhớ, không ghi save người chơi.

HUD có ba vùng DOM; Dialogue dùng đúng `ReplicaStage` SVG Stage 4 với 28 object.
Inspector phân cấp nhóm khung thoại, thẻ ngày, lựa chọn và logo. Có thể chỉnh
riêng giấy/sóng, cảng, biểu tượng, tên nhân vật, chữ thoại, hoa, notebook/chữ viết
tay, chữ/con dấu mặt trời trên thẻ ngày, từng lựa chọn/nhãn chữ và nút tiếp tục.
Click object trên canvas để chọn và kéo; chọn nhóm trong danh sách rồi kéo viền
để di chuyển cả nhóm. Phím mũi tên dịch 1 px, Shift dịch 10 px. Các field X/Y và
Scale X/Y áp dụng riêng từng object; scale của nhóm cha được tính khi kéo con.
`Show Logo`/`Hide Logo` chỉ đổi preview, chọn object logo sẽ tự hiện logo.
Vị trí/tỷ lệ của object SVG tách khỏi transform animation, clip và mask.
Undo/redo và import/export riêng cho từng màn. Preview thoại DOM cũ đã được thay
vì không đúng bộ UI đích.

Export Dialogue thành `coastal-dialogue-ui.json`, thay file cùng tên trong
`content/ui/`, rồi chạy `python tools/build_dialogue_ui.py --build`. File xuất
giữ đầy đủ artwork, text keys, lighting, clip/mask và `layout` của 28 object SVG.
Export cũ gồm đúng ba nhóm được nâng cấp khi import: giữ giá trị của nhóm cũ,
các object mới nhận vị trí 0 và scale 1. Import thiếu object ở format mới bị từ
chối. Không đưa các thông số này vào `screen-layout.json` của DOM.

## Vẽ địa hình bằng Tiles

Trong World Editor, chọn **Tiles** bên cạnh **Entities**. Palette có 16 ảnh tile,
nhãn tiếng Anh và mô tả Walkable/Blocked. Chọn Brush, Rectangle hoặc Fill rồi
chọn tile cần vẽ; Eyedropper lấy mẫu và trở về Brush. Eraser thay ô bằng **Erase
Tile** đã chọn (mặc định Grass), không tạo ô trong suốt.

Nét kéo chỉ hiện preview, thả chuột mới ghi vào draft và tạo một undo. Rectangle
bao gồm hai góc; Fill nối bốn hướng. Nét chặn spawn hoặc portal bị từ chối toàn bộ.
Brush ngừng vẽ ngoài canvas và bắt đầu đoạn mới khi quay vào. Escape hủy preview;
đổi map/tool/mode, import, undo, export hoặc lưu source cũng hủy preview đang kéo.

Khi canvas có focus: **B/R/F/I/E** chọn tool, **G/C** bật grid/collision, mũi tên
dịch cursor một ô, Shift dịch năm ô, **Enter** dùng tool. Rectangle dùng Enter
đặt góc đầu, mũi tên đặt góc sau rồi Enter xác nhận. **Space + drag** pan camera;
cursor tự cuộn tới ô đang chọn. Ctrl+Z/Shift+Ctrl+Z undo/redo dùng chung với Entities.

Playtest dùng terrain đã commit trong draft và camera gameplay. Trở lại Edit
khôi phục camera editor; ô player vừa bị vẽ thành vật cản sẽ dùng safe spawn khi
chơi thử. Save Scene Draft, Restore Draft, Export/Import Scene JSON và Save Scene
to Source giữ nguyên quy trình bên dưới. V1 sửa năm map hiện có, một lớp nền;
map mới, resize, zoom, nhiều lớp và autotile chưa nằm trong phạm vi.

Định nghĩa tile nằm ở `content/world/tileset.json`; builder world compile TILESET
vào `scenes-data.js`. Giữ ID/atlas/collision ổn định khi authoring; không sửa file
generated bằng tay. Xem [bằng chứng tilemap](ui-reviews/tilemap-editor/README.md).

## Nháp, export và áp dụng

Menu và bản đồ có bản nháp local riêng với version và hash nguồn. Nháp khác
phiên bản nguồn bị từ chối; có thể export JSON để đối chiếu thủ công. Nháp và
JSON authoring không chứa session, con trỏ DOM hay save người chơi.

Export rồi thay source tương ứng và chạy builder:

```powershell
python tools/build_menu_layout.py --build
python tools/build_screen_layout.py --build
python tools/build_dialogue_ui.py --build
python tools/build_world_scenes.py --build
```

| Nguồn chỉnh sửa | Output sinh tự động |
|---|---|
| `content/ui/menu-layout.json` + `menu-layout-contract.json` | `menu-layout-data.js`, `menu-layout-regions.js` |
| `content/ui/screen-layout.json` + `screen-layout-contract.json` | `screen-layout-data.js`, `screen-layout-regions.js` |
| `content/ui/coastal-dialogue-ui.json` + `coastal-dialogue-layout-contract.json` | `coastal-dialogue-ui-data.js`, `coastal-dialogue-layout-data.js` và metadata pack v3 |
| `content/maps/scenes/*.json`, `prefabs.json`, `scene-contract.json` | `content/maps/scenes-data.js` |
| `content/assets/active-packs.json` + manifest của các pack | `active-packs.js`, `active-inventory.json` |

Không sửa tay output sinh tự động. Stage menu cố định 1672×941; world tile
16 px. Frame và điểm neo sprite có đơn vị pixel riêng. Builder scene cần chạy
lại khi thêm key trong locale vì nó sinh danh sách text key hợp lệ.

## Lưu thẳng vào source

Tính năng này chỉ bật bằng server authoring riêng:

```powershell
python tools/authoring_server.py --enable-authoring --port 8097
```

Mở cùng URL công cụ ở cổng **8097**, rồi bấm **Save to Source** (menu) hoặc
**Save Scene to Source** (bản đồ). Allowlist
hiện tại gồm menu layout và năm scene. HUD/hội thoại dùng export + builder.
API chỉ nhận resource ID, kiểm tra schema/hash nguồn và ghi atomic. Mỗi lượt
lưu compile lại output; nếu compile lỗi, thông báo phân biệt source đã lưu
với dữ liệu chạy chưa cập nhật, đồng thời giữ output tốt trước đó. Source bị
sửa từ IDE sẽ gây conflict, không bị ghi đè. Khi có chỉnh sửa mới trong lúc
chờ lưu, bản gửi và draft mới được giữ riêng. Tải lại trang sau khi áp dụng.

Server thường `tools/serve.py` không có API ghi source. Game không import
`tools/authoring/` và không phụ thuộc các endpoint này.

## Kiểm tra

Chạy browser/capture tuần tự trên Windows, giữ log main cho baseline checker:

```powershell
python tools/build_menu_layout.py --check
python tools/build_screen_layout.py --check
python tools/build_dialogue_ui.py --check
python tools/build_dialogue_motion.py --check
python tools/build_world_scenes.py --check
python tools/check_asset_packs.py --check
python -m unittest discover -s tools -p 'test_*.py' -v
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/check_architecture.py
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --real-time --timeout 240 --profile-root tmp/browser-tests
python tools/check_baselines.py
python tools/review_authoring.py
python tools/review_authoring.py --dialogue-only
python tools/review_world_authoring.py --output docs/ui-reviews/data-authoring/world-pointer
python tools/review_authoring_source.py
```

Các review tool ghi bằng chứng vào `docs/ui-reviews/data-authoring/`.
Review source dùng bản sao tạm và server riêng, không ghi source đang làm việc.
Asset binary vẫn theo chính sách local: registry lưu hash, provenance/license
và cách khôi phục, không thay thế bản sao lưu ảnh/font. Xem
[kết quả triển khai](ui-reviews/data-authoring/README.md) và
[quyền sở hữu dữ liệu](ui-specs/authoring/ownership.md).
