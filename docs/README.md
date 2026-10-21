# Tài liệu dự án Hồi Âm

Bắt đầu từ [hướng dẫn World Editor](guides/WORLD-EDITOR-GUIDE.md) nếu muốn vẽ
map, hoặc [quy trình phát triển](engineering/DEVELOPMENT.md) nếu sửa code.

Track mới: [game 3D hoàn toàn](design/specs/2026-10-21-full-3d-foundation-design.md).
M1 đã có [phòng CLB 3D chơi thử](guides/WORLD3D-PROTOTYPE.md);
[kế hoạch triển khai](design/plans/2026-10-21-full-3d-foundation.md) ghi lại phạm vi từng mốc.
[Bản lưu sản phẩm 2D](../archive/products/coastal-2d-2026-10-21/README.md) có
inventory, hash và hướng dẫn chạy lại riêng.

| Nhóm | Nội dung |
| --- | --- |
| [guides/](guides/README.md) | Hướng dẫn dùng editor, sandbox, map pixel và lab tương tác |
| [engineering/](engineering/README.md) | Kiến trúc, quy trình phát triển, Git và khôi phục asset |
| [design/](design/README.md) | Thiết kế truyện/gameplay, art, UI, world và đặc tả đã duyệt |
| [testing/](testing/README.md) | Baseline hồi quy và báo cáo playtest |
| [research/](research/README.md) | Nghiên cứu mapping/event RPG Maker MZ và animation sprite |
| [history/](history/README.md) | Thiết kế nguồn/lore cũ còn giá trị đối chiếu, không phải hướng dẫn hiện hành |
| [ui-concepts/](ui-concepts/) | Concept, prompt, provenance và ảnh tham chiếu |
| [ui-specs/](ui-specs/) | Geometry, scope và dữ liệu đặc tả được tool/test sử dụng |
| [ui-reviews/](ui-reviews/) | Báo cáo triển khai và bằng chứng review giao diện/editor |
| [maintenance/](maintenance/README.md) | Nhật ký sắp xếp, danh sách file đã chuyển/xóa và hash kiểm tra |

## Đọc theo công việc

- **Vẽ map/import tileset:** [World Editor và Tileset Editor](guides/WORLD-EDITOR-GUIDE.md).
- **Chỉnh menu/HUD/thoại:** [quy trình authoring](guides/DATA-AUTHORING.md).
- **Tìm hướng thiết kế gameplay/truyện:** [bible v2](design/narrative/game_story_bible_v2.md).
  Đây là thiết kế đích; những phần chưa triển khai không tự trở thành luật runtime.
- **Sửa module hoặc thêm tính năng:** [kiến trúc](engineering/ARCHITECTURE.md)
  và [development](engineering/DEVELOPMENT.md).
- **Tiếp tục hệ thống vẽ map/event:** [roadmap world authoring](design/world/WORLD-MAP-AUTHORING.md).
- **Chạy test hoặc bảo toàn balance:** [kiểm chứng và baseline](testing/README.md).
- **Chuyển máy/khôi phục ảnh, font, âm thanh:** [Git và asset](engineering/REPOSITORY.md).

## Quy ước đặt tài liệu

Hướng dẫn cách dùng đặt trong `guides/`; mô tả ranh giới code trong
`engineering/`; quyết định thiết kế trong `design/`. Checklist triển khai đã
hoàn tất được xóa khi hướng dẫn, đặc tả và báo cáo đã ghi lại kết quả cần giữ.
Không coi một file là thừa chỉ vì cũ hoặc chưa được import bởi runtime.

Giữ nguyên đường dẫn của các bộ `ui-specs/`, `ui-concepts/`, `ui-reviews/` đang
được tool sử dụng. Ảnh tham chiếu Hải Vọng nằm trong
`ui-concepts/references/hai-vong.png`. Asset nhị phân và một số roadmap/capture
vẫn theo chính sách local; clone Git mới cần asset pack tương ứng.
