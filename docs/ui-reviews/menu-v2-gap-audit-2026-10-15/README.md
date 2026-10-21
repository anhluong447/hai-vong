# Đối chiếu menu runtime với concept v2

Ngày kiểm tra: 2026-10-15. Phạm vi: kiểm tra giao diện đang chạy và đối chiếu với [sáu màn prototype v2](../../ui-concepts/coastal-editorial-menu-prototypes-v2/README.md). Đây là audit; chưa thay đổi runtime, balance, save hoặc baseline.

## Kết luận

Runtime vẫn triển khai menu theo concept [02-menu cũ](../../ui-concepts/coastal-editorial-v1/02-menu.png), có năm mục. Bộ prototype mới có sáu tab và các bố cục nội dung riêng. Chênh lệch về cấu trúc và chức năng lớn hơn việc chỉnh màu/font.

Chỉ đánh giá UI, vùng nội dung và thao tác. Không yêu cầu khớp pose nhân vật, cảnh nền hoặc camera để đánh giá các khác biệt này.

## Phương pháp và bằng chứng

- Mở `pixel.html` qua server local; Chrome headless, viewport 1672×941, DPR 1, prefers-reduced-motion.
- Profile trình duyệt riêng, không nạp save hiện có. Chỉ mở menu, đổi tab, chọn hồ sơ và xem bản đồ; không phát lệnh gameplay thay đổi tiến độ.
- [runtime-audit.json](runtime-audit.json) ghi tab, DOM text, kích thước vùng nội dung, state tối thiểu và hash ảnh. [map-followup.json](map-followup.json) kiểm tra riêng focus địa điểm + Enter.
- [preview-current.png](preview-current.png) chụp authoring preview bằng capture contract chuẩn, [metadata](preview-current.json). Preview và gameplay dùng cùng MenuView nhưng dữ liệu khác nhau; kết luận hành vi dựa trên gameplay.
- Không thấy JavaScript error hoặc ảnh DOM tải thất bại trong các trạng thái kiểm tra. Đây không phải kết quả của full browser regression suite.
- Ảnh là bằng chứng bố cục tĩnh; không chứng nhận motion, hiệu năng hay pixel parity.

## Khoảng cách chính

| Ưu tiên | Hạng mục | Runtime quan sát được | Concept/quyết định mới | Bằng chứng |
| --- | --- | --- | --- | --- |
| Cao | Cấu trúc tab | Hồ sơ, Đồng đội, Lịch, Nhật ký, Thiết lập; Bản đồ là overlay riêng | Hồ sơ, Kỹ năng, Trang bị, Đồng đội, Bản đồ, Cài đặt | [Mở menu](runtime-01-open.png); [menu definitions](../../../content/ui/coastal-menu.js) |
| Cao | Mặc định khi mở | Lần đầu ở Hồ sơ; đóng từ Đồng đội rồi mở lại vẫn ở Đồng đội | Mỗi lần mở vào thẳng Hồ sơ | [Mở lại](runtime-04-reopened.png); report reopenedTab = team; [controller](../../../src/presentation/gameplay-controller.js) |
| Cao | Kỹ năng | Không có tab/cây kỹ năng trong MenuView hoặc routes hiện hành | Skill tree có node, điều kiện, cost và phần chi tiết đang chọn | [Concept kỹ năng](../../ui-concepts/coastal-editorial-menu-prototypes-v2/02-ky-nang.png) |
| Cao | Trang bị | Không có màn sáu slot; công cụ đang được biểu diễn qua panel đội/hoạt động cũ | Đầu, thân, tay, chân, hai phụ kiện và stat | [Concept trang bị](../../ui-concepts/coastal-editorial-menu-prototypes-v2/03-trang-bi.png); [panels](../../../src/presentation/gameplay-panels.js) |
| Cao | Bản đồ | Overlay giấy lớn xem tile map từng phòng, bốn nút địa điểm; chọn/Enter không teleport | Bản đồ thành phố Hải Vọng, pin sự kiện, focus không gian và xác nhận di chuyển | [Map hiện tại](runtime-06-map.png); [focus + Enter](runtime-08-map-focused-enter.png); [MapView](../../../src/ui/coastal/MapView.js) |
| Vừa | Hồ sơ | Overview hai card/trang; submenu Hồ sơ/Khuê/Đội soạn; chọn card mở form tác nghiệp | List title theo Main/Side/General, dấu ! cho main; chi tiết title/description/quá trình/hint | [Danh sách](runtime-01-open.png); [Chi tiết](runtime-02-dossier-detail.png); [concept](../../ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png) |
| Vừa | Đồng đội | Danh sách dài với avatar chữ cái, stat và bond bằng chữ; phải cuộn | Chọn chân dung rồi xem tên, biệt danh, tiểu sử, quest, skill và bond của một người | [Runtime](runtime-03-team.png); [concept](../../ui-concepts/coastal-editorial-menu-prototypes-v2/04-dong-doi.png) |
| Vừa | Cài đặt | Giảm chuyển động, hướng dẫn phím, Lưu/Tải, Xuất lượt thử, Lượt mới và nút chuyển buổi gameplay | Thiết lập cơ bản placeholder, lưu game, tải game | [Runtime](runtime-05-settings.png); [concept](../../ui-concepts/coastal-editorial-menu-prototypes-v2/06-cai-dat.png) |
| Vừa | Diện tích và thứ bậc | Vùng nội dung khoảng 685 px, 40.97% chiều rộng stage; panel chi tiết khoảng 409 px cao. Wordmark, tagline, chân dung cố định và phần trang trí chiếm phần lớn vùng còn lại | Rail trái khoảng 21%; phần bên phải dành cho bố cục riêng của từng tab, ít chữ thừa | [MenuView](../../../src/ui/coastal/MenuView.js); [menu.css](../../../styles/coastal/menu.css); DOM rects trong report |
| Liên quan gameplay | Energy và quy trình | Fresh session sáng hiện 0/4; config clubEnergy=4, outsideEnergy=2; còn route Đội soạn, bước chấp bút và chọn bài | Quỹ energy chung 10/5, chiều tự do, tài liệu tự bàn giao xuất bản | Report state; [balance](../../../content/gameplay/balance.js); [bible v2](../../design/narrative/game_story_bible_v2.md) |

Lượt kiểm tra map đầu tiên trong runtime-audit.json gọi click qua DOM rồi Enter khi focus còn ở nút cũ. Không dùng lượt đó làm chứng cứ cho focus/teleport. Follow-up đã focus đúng `newsroom`, click rồi Enter: selectedMap=newsroom nhưng world.mapId vẫn là yard. Đây là bằng chứng kiểm tra map đầy đủ hơn.

## Nguyên nhân trong implementation

- `content/ui/coastal-menu.js` vẫn định nghĩa năm section và ánh xạ các route cũ.
- `MenuView.refresh()` dùng một overview card hoặc một `customBody` chung. Chưa có bố cục riêng cho sáu màn.
- `gameplay-panels.js` đưa các form/list prototype vào khung nội dung cũ, nên chỉ thay CSS của khung không đủ cho skill tree, loadout hoặc hồ sơ nhân vật.
- `openMenu()` không reset `tab`, trái quyết định luôn mở Hồ sơ.
- `MapView.select()` chỉ vẽ background phòng và đổi selection; không thực hiện chuyển vị trí thế giới.
- [ARCHITECTURE.md](../../engineering/ARCHITECTURE.md) và roadmap vẫn ghi mục tiêu replica theo bốn concept gốc. Khi triển khai menu mới cần cập nhật phạm vi menu có chủ đích, giữ reference/art cũ và các phần dialogue/HUD không liên quan.

## Thứ tự sửa đề xuất

1. Chốt contract menu sáu tab và reset Hồ sơ mỗi lần mở; chuẩn hóa shell chung.
2. Dựng Hồ sơ theo list/detail của v2, thay overview hai card và submenu cũ.
3. Làm bố cục Đồng đội và Cài đặt; giữ save/load contract hiện có.
4. Làm Bản đồ thành phố cùng điều hướng, teleport và xác nhận chuyển buổi ở trọ.
5. Làm skill tree và trang bị kèm dữ liệu/cơ chế được chốt; không hiển thị tính năng giả hoặc giá trị UI lệch state.
6. Tích hợp gameplay mới qua GameSession, validator/migration nếu có state mới, rồi chạy browser suite và baseline checks theo hướng dẫn dự án.

## Ảnh đang chạy

![Mở menu](runtime-01-open.png)

![Chi tiết hồ sơ](runtime-02-dossier-detail.png)

![Đồng đội](runtime-03-team.png)

![Cài đặt](runtime-05-settings.png)

![Bản đồ](runtime-06-map.png)
