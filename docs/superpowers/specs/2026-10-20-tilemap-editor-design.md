# Tilemap authoring in World Editor

Ngày: 2026-10-20. Mốc khảo sát: `624a21b`.

## Mục tiêu và phạm vi

Người dùng muốn tự vẽ địa hình bên cạnh việc đặt object/NPC đã có. Bổ sung chế
độ **Tiles** trong World Editor, dùng chung scene document, lịch sử, draft,
import/export, chơi thử và cơ chế lưu source hiện hành. Phạm vi v1 là năm map
`home`, `yard`, `newsroom`, `street`, `interaction`, một lớp nền và 16 tile hiện có.
Đây là thiết kế làm cơ sở cho implementation plan theo yêu cầu người dùng;
chưa phải thông báo tính năng đã được triển khai.

Không thêm dependency hay editor riêng. Không thêm map ID, đổi kích thước map,
đa lớp, autotile, vẽ texture mới, sửa atlas, sửa portal hoặc thay gameplay/save.
Zoom và bản đồ thu nhỏ để sau; pan và điều hướng cursor đủ tiếp cận toàn map v1.

## Dữ liệu và ranh giới

- Giữ scene schema v1, `tiles[y][x]`, tile ID số nguyên 0–15 và tile size 16 px.
- Thêm `content/world/tileset.json`: schemaVersion 1, asset ID `pixel.tiles`,
  tilePixels 16, columns 8, count 16 và 16 records `{id, atlasIndex, labelKey,
  blocked}`. `atlasIndex === id` cho bản đầu; labelKey thuộc `authoring.tiles.*`.
- Giữ nguyên blocked IDs `[5,6,7,8,12,13,15]`. Thuộc tính này cố định trong v1;
  editor chỉ đổi tile được đặt, không cung cấp màn sửa quy tắc collision.
- `build_world_scenes.py` kiểm tra registry với atlas metadata và compile thêm
  export `TILESET` vào `content/maps/scenes-data.js`. Facade
  `content/world/tileset.js` cung cấp lookup, source rect và collision helper.
  Runtime không fetch JSON và không import Python/tool modules.
- Renderer, runtime walkability, JS/Python scene validators và palette đọc cùng
  định nghĩa tile. Không phát sinh file generated mới ngoài pipeline hiện hành;
  source writer vẫn ghi scene và `scenes-data.js` theo allowlist cũ.
- Không thay nội dung scene mặc định. Fixture map/render gốc và 12 baseline được
  giữ nguyên. Mọi ví dụ vẽ map dùng draft hoặc bản sao source tạm.

## Trải nghiệm editor

Toolbar có **Entities / Tiles**, độc lập với **Edit / Play**. Entities giữ luồng
chỉnh object/NPC hiện có. Tiles dùng palette ảnh pixelated với tên tiếng Anh và
dấu hiệu Walkable/Blocked. Không bắt buộc tách riêng màn Characters trong v1.

Các tool: Brush, Rectangle, Fill, Eyedropper, Eraser. Brush/Rectangle/Fill dùng
primary tile. Eraser thay bằng một erase tile chọn được, mặc định ID 0; một lớp
nền không có ô transparent/null. Eyedropper lấy ID tại ô và chuyển về Brush.
Rectangle bao gồm hai ô góc; Fill nối bốn hướng và chỉ thay vùng cùng tile ID.

Chỉ nhận nút chuột chính. Brush nội suy giữa các ô được nhận để di chuyển nhanh
không tạo lỗ; lấy mẫu ngoài map không ghi ô và cắt mạch nội suy khi quay vào.
Rectangle có điểm bắt đầu trong map và endpoint được clamp vào biên.

Phím tắt khi canvas có focus: B/R/F/I/E chọn tool; G bật grid, C bật collision;
mũi tên dịch tile cursor 1 ô, Shift dịch 5 ô; Enter dùng tool tại cursor.
Rectangle dùng Enter đặt góc đầu, mũi tên đặt góc sau, Enter xác nhận. Escape hủy.
Ctrl/Cmd+Z hoàn tác, Shift+Ctrl/Cmd+Z làm lại. Không chặn nhập liệu trong field,
không cướp tổ hợp Ctrl/Cmd/Alt để chọn tool. Có focus ring và tên truy cập được.

Space+drag pan camera trong Edit; không di chuyển nhân vật hay thay session.
Cursor bàn phím tự đưa ô đang chọn vào khung nhìn. Khi vào Play, bỏ camera override
để renderer trở lại camera gameplay; về Edit khôi phục camera editor theo map.
Map nhỏ vẫn được căn giữa bằng quy tắc hiện tại.

## Transaction và kiểm tra hợp lệ

Trong gesture chỉ giữ patch preview ngoài `WorldDocument`; source, draft và history
chưa đổi. On release/Enter, tạo candidate từ draft hiện tại, áp patch một lần và
gọi scene validator trước khi `replace`. Một gesture hợp lệ tạo đúng một history
entry. No-op không tạo entry và không xóa redo. Chọn lại cùng tile trong Fill kết
thúc ngay. Fill dùng queue, không đệ quy, tối đa một lần thăm cho mỗi ô.

Nét vẽ chặn spawn, portal hoặc điểm đến từ map khác bị từ chối **toàn bộ**, giữ
draft/history và báo lỗi tiếng Anh; không bỏ qua âm thầm một phần của nét vẽ.
Preview thể hiện tile dự định vẽ; chỉ kết quả đã validate mới đi vào renderer/map.
Không thêm kiểm tra connectivity toàn map; collision/portal guard hiện có và
Playtest là các gate của v1.

Escape, pointercancel, mất pointer capture, blur, đổi map/tool/mode, import,
restore/reset, undo/redo, export và Save Source đều hủy preview trước khi chạy
thao tác tương ứng. Giữ target document và pointerId của gesture; không áp patch
sang document khác sau thao tác bất đồng bộ. Disposal giải phóng capture/listener.
Nếu document thay đổi từ ngoài trong lúc đang preview, hủy gesture trước render.

## Hiển thị và lưu

Grid và Collision là hai overlay toggle riêng. Collision dùng terrain metadata
cộng solid footprint của object/NPC; NPC authored vẫn tham gia nếu solid, kể cả
khi gameplay đang ẩn theo lịch. Tile preview/cursor được vẽ từ ảnh đã load, không rebuild palette
DOM hoặc cache nền toàn map trên từng pointer event. Sau commit/undo/redo, cache nền
cập nhật từ document; chơi thử thấy đúng tile và collision.

Draft/source hash/scene identity và saved-snapshot semantics giữ nguyên. Save
Source ghi scene hiện chọn, compile lại như trước, giữ stale-hash conflict và
rollback. Server thường chỉ hỗ trợ export; server authoring mới cho lưu source.
GameSession, player saves, nguồn art và archive không bị chỉnh.

## Nghiệm thu

1. Vẽ được mọi ô của năm map bằng chuột hoặc keyboard cursor, kể cả ngoài camera
   ban đầu; palette/crop/collision nhất quán với tileset gốc.
2. Năm tool có kết quả đúng, một gesture/một undo; hủy, no-op, redo và map switch
   không để lại thay đổi hoặc transaction treo.
3. Nét vẽ invalid bị từ chối nguyên vẹn; import và backend cùng chặn invalid IDs,
   bool/string/null và spawn/portal bị chặn.
4. Export/import, draft restore, source-save/reload và sửa trong lúc đang lưu giữ
   đúng snapshot, không mất nét vẽ mới.
5. Map JSON gốc, renderer pixels khi không vẽ, architecture và gameplay baselines
   không đổi. Có bằng chứng CDP drag/cancel và một authored map draft/playtest.

Kế hoạch triển khai: [tilemap-editor.md](../plans/2026-10-20-tilemap-editor.md).
