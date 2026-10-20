# Thiết kế dài hạn: dữ liệu authoring và visual editor

Ngày lập: 2026-10-20. Mốc khảo sát: `19fe9c3`.

**Trạng thái:** đã triển khai các capability M0–M8 theo lệnh “triển hết” của
người dùng. Hợp đồng cụ thể nằm trong JSON source, builders và adapters thực tế.
Xem [workflow](../../DATA-AUTHORING.md) và
[bằng chứng](../../ui-reviews/data-authoring/README.md). Nội dung dưới đây giữ
lại quyết định thiết kế. M7 hội thoại ban đầu nối nhầm component DOM cũ; đã sửa
theo phản hồi người dùng để dùng đúng ReplicaStage SVG Stage 4, giữ pipeline
`coastal-dialogue-ui.json` và motion hiện có. HUD vẫn dùng component DOM.
Capture M0 gồm sáu tab và picker; thêm 10 cặp ảnh
dài/rỗng/locked đối chiếu source gốc `19fe9c3` được dựng lại trong thư mục tạm.

## 1. Kết quả cần đạt

Người phát triển chỉnh các thông số bố cục menu thường dùng bằng preview,
kéo thả hoặc inspector; xem ngay ảnh hưởng trên sáu tab; undo, import/export và
đưa kết quả vào source qua bước kiểm chứng rõ ràng. Sau khi quy trình này hữu
ích, mở rộng cùng nguyên tắc sang dữ liệu asset và một scene world mẫu.

Thành công được đo bằng các việc authoring cụ thể: di chuyển cụm tiền, đổi
bề rộng giấy, chỉnh khoảng cách slot, đặt lại một prop và điều chỉnh footprint.
Các thao tác đó không cần sửa thuật toán render/gameplay. Thêm một loại mechanic
hoặc kiểu tương tác mới vẫn là công việc lập trình.

## 2. Hiện trạng phải kế thừa

- HTML/CSS/Canvas và ES modules; server Python; runtime không có bước build.
- `content/` sở hữu locale, gameplay, maps, UI và tuning. `src/core/` là luật
  sandbox công thức, không phải vị trí cho một engine mới.
- UI dùng mặt phẳng 1672 × 941, scale đồng nhất. Nền/nhân vật/world matching
  tách khỏi cổng nghiệm thu fixed UI và trang trí gắn với UI.
- World dùng lưới 16 px; sprite có frame riêng. Khuê/Vân override có frame
  32 × 48 và pivot pixel `(16,46)`; giá trị này phải được giữ nguyên.
- Renderer đã có Y-sorting; pathfinding/collision đang dựa trên tile và footprint.
- Atlas/manifest, các JSON authoring, builder Python, preview và CDP capture đã
  tồn tại. Mở rộng chúng khi phù hợp thay vì tạo pipeline song song.
- Menu có model/view, keyboard controller, effects lifecycle và các fixture.
  GameSession sở hữu command; save được validate trước replace.

## 3. Ranh giới kiến trúc

| Phần | Sở hữu | Không sở hữu |
|---|---|---|
| `content/ui/` | Layout/token được author, schema version, ID vùng và asset metadata | DOM node, callback, trạng thái người chơi |
| `src/ui/coastal/` | Áp cấu hình vào view và CSS; layout theo từng tab | File IO, editor history, save gameplay |
| `src/shared/` | Validator và phép tính dữ liệu thuần cần dùng ở runtime/tools | Browser storage, DOM, server |
| `tools/authoring/` | Draft, selection, inspector, gizmo, history, import/export | Thay luật domain, ghi save gameplay |
| `content/maps/` | Scene và prefab được author bằng ID ổn định | Danh sách NPC sau khi lọc theo trạng thái |
| `src/pixel/`, `src/world/` | Adapter scene, input, movement, render | Locale prose hoặc cơ chế engine tổng quát |
| `tools/` Python | Validate/compile offline; ghi source có giới hạn ở chặng sau | Endpoint ghi file tùy ý trong game phát hành |

Không thêm `src/data/`, `UIManager` tổng quát, ECS hay hệ plugin editor.
Mỗi extension gắn với một khả năng cụ thể trong roadmap.

## 4. Luồng dữ liệu UI

`content/ui/menu-layout.json` là nguồn chỉnh sửa chính. Builder Python validate
rồi sinh `content/ui/menu-layout-data.js` xác định; file JS được commit để trang
game tiếp tục chạy trực tiếp. Cặp source/output được kiểm tra bằng `--check`.
Đây là bước authoring offline, không thêm yêu cầu build khi mở game.

Runtime lấy bản compiled mặc định và áp các CSS custom property đã cho phép.
Trong preview, editor giữ một draft clone riêng và đưa draft đã validate qua
cùng layout adapter. Draft không tự trở thành source hoặc save gameplay.

Field descriptor, allowlist và giới hạn chung có nguồn ở
`content/ui/menu-layout-contract.json`; builder sinh descriptor ES module cho
validator/runtime, Python đọc trực tiếp cùng contract. Các quy tắc liên trường
được kiểm tra bằng cùng bộ fixture hợp lệ/không hợp lệ ở cả hai phía để phát
hiện drift. Không thêm thư viện hoặc ngôn ngữ schema tổng quát cho hai tài liệu.

V1 chỉ chỉnh các thông số hữu ích: khung sidebar/resources, vị trí/kích thước
vùng nội dung, bề rộng thẻ giấy, khoảng cách grid và typography tokens. DOM,
thứ tự đọc, action routing và thuật toán grid tiếp tục ở view/CSS.

Mỗi trường có owner, đơn vị, khoảng hợp lệ và phạm vi `shared` hoặc tab cụ thể.
Giá trị shared được sửa một lần cho cả sáu tab; inspector báo rõ phạm vi này.
Override tab là dữ liệu tường minh, không phát sinh từ chuỗi CSS override mới.

## 5. Hợp đồng bố cục và input

- `schemaVersion: 1`, ID ổn định; stage khóa ở 1672 × 941.
- Tọa độ chỉnh sửa là design pixel. Anchor có hệ tham chiếu rõ: stage hoặc
  container đã đăng ký; không suy ra từ parent DOM tùy ý.
- Đổi client → stage bằng bounding rectangle hiện tại: trừ vị trí stage rồi
  nhân `1672 / rect.width` và `941 / rect.height`. Bao gồm letterbox và zoom;
  không làm tròn từng pointer event, chỉ chuẩn hóa lúc commit thao tác.
- Gizmo chỉnh các nhóm đã đăng ký, không kéo riêng glyph hay clone raster UI.
  Vùng lặp như slot dùng thông số grid; không thay thứ tự slot bằng tọa độ tự do.
- Slot layout và keyboard spatial navigation dùng cùng dữ liệu topology khi
  topology được cấu hình. Thay spacing không được đổi hướng chọn hiện tại.
- Token màu/font/style là allowlist có kiểu; không nhận CSS tùy ý hay script
  từ JSON import. Geometry phải hữu hạn, kích thước dương, region ID hợp lệ.
- Artwork bleed được khai báo riêng; không cấm mọi tọa độ âm. Stage, vùng text,
  hit target và trang trí gắn với UI có constraint tương ứng.

## 6. Editor menu v1

Mở từ preview bằng `?edit=1`; dynamic import các module editor từ `tools/`.
Trang game mặc định không import, mount hoặc đăng ký phím editor. F1 chỉ là
phím bật/tắt trong preview đã tải editor, có nút thay thế trên toolbar.

Editor có danh sách vùng, outline, inspector số, kéo/resize nhóm, snap tùy chọn,
nudge bằng phím, reset trường/nhóm/tab và undo/redo. Một lần kéo dù có hàng trăm
pointer event chỉ tạo một history entry. Pointer cancel/Esc khôi phục giao dịch.

Khi edit: lớp chọn nhận input, menu inert; callback command tại preview được
chặn; effects freeze để đo ổn định. Khi test/play: bỏ inert, trả input và effects
về đúng trạng thái trước đó. Không cần tạo cơ chế pause domain vì menu preview
không tự tiến ngày. Editor world sau này có hợp đồng pause riêng.

Rerender/chuyển tab giữ selection theo ID, không giữ DOM node đã bị thay thế.
Điều khiển editor đặt ngoài vùng menu inert và có focus/shortcut riêng.

## 7. Draft, import/export và source

- Draft local dùng namespace `clb-bao-chi.authoring.menu.v1`, kèm version và
  hash source gốc. Phát hiện source đã đổi trước khi khôi phục draft cũ.
- Import validate toàn bộ ứng viên trước khi thay draft; lỗi giữ nguyên draft
  và history. Unknown version bị từ chối; migration chỉ thêm khi có version thật.
- Export JSON không chứa selection, DOM, clock, fixture session hoặc history.
  Chuẩn hóa thứ tự key và precision đến 0.01 design px, có round-trip test.
- Download JSON là đường chuẩn đầu tiên. Copy clipboard là tùy chọn độc lập;
  lỗi clipboard không làm mất download hoặc bản nháp.
- Chặng đầu đưa JSON đã duyệt vào source bằng thao tác file bình thường rồi
  chạy builder/check. Live write là capability riêng ở chặng cuối.

## 8. Asset và scene ở các chặng tiếp theo

Manifest có stable ID, path, loại, frame/region, đơn vị pivot, provenance/license
và pack/version liên quan. Khởi đầu bằng các asset active của menu và pixel;
không preload toàn bộ kho art/audio hay đưa archive vào registry runtime.

Scene source tách khỏi trạng thái gameplay. Giữ tất cả object/NPC, schedule ID,
text key, spawn, portals, tile data, interaction ID và prefab override. Adapter
thuần dựng lại shape MAPS đang dùng; hydration text diễn ra qua text service.
Export từ authored draft, không export danh sách NPC hiện nhìn thấy.
Contract scene có version riêng ở `content/maps/scene-contract.json`; builder,
validator runtime và writer về sau dùng chung descriptor/fixtures tương ứng.

Canonical vị trí gameplay vẫn là grid integer. `offsetPx` ở schema đầu chỉ là
offset hình ảnh; footprint tile vẫn quyết định walkable. Visual bounds, vùng
click/chọn và collision là ba hợp đồng khác nhau. Collider pixel/free movement
là thay đổi gameplay riêng, không được lén đưa vào đợt refactor này.

Thí điểm `home`; giữ ID map, object và portal để save cũ vẫn khôi phục được.
Sau khi đạt gate mới chuyển `yard`, `newsroom`, `street`, rồi map lab `interaction`.

## 9. Giới hạn live write

Chỉ xem xét sau khi export/import và compile thủ công đã ổn định. Dùng server
Python authoring riêng, bật tường minh trên loopback. Server map resource ID vào
allowlist file, validate cùng schema, kiểm tra base hash chống ghi đè bản mới,
ghi atomic và trả lỗi rõ ràng. Không nhận đường dẫn client tùy ý; không được
ghi generated output, code runtime, archive hay save người chơi. Origin/Host,
token phiên và giới hạn payload phải được kiểm tra trước khi ghi.

Server game tĩnh hiện tại tiếp tục hoạt động bình thường; không thêm Node/Vite
để phục vụ tính năng này. Download/export luôn là đường khôi phục độc lập.

## 10. Cách quyết định tiếp tục

Mỗi chặng phải chạy được độc lập, có test/capture và rollback riêng. Sau editor
menu v1 và scene home pilot có điểm dừng đánh giá: nếu công cụ chưa giúp hoàn
thành việc authoring cụ thể nhanh và dễ kiểm tra hơn, sửa chặng đó trước khi
mở rộng. Công việc engine không thay thế backlog truyện, balance và visual gate.

Danh sách task, test, phụ thuộc và tiêu chí hoàn thành nằm trong
[roadmap triển khai](../plans/2026-10-20-data-authoring-roadmap.md).
