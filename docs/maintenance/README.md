# Bảo trì tài liệu

## Sắp xếp ngày 2026-10-21

Chuyển 43 file vào các nhóm hướng dẫn, kỹ thuật, thiết kế, kiểm chứng, nghiên
cứu và lịch sử. Kiểm tra SHA-256 trước/sau chuyển, rồi sửa các liên kết tương
đối và đường dẫn được tool sử dụng. Baseline, dữ liệu playtest, Python mô phỏng
và ảnh nguồn được chuyển nguyên bytes.

Bản layout menu Stage 5 viết tay từng đè lên output Markdown của Stage 0
generator ngay từ trước đợt dọn. Đã giữ bản viết tay ở
[history/ui](../history/ui/MENU-STAGE5-LAYOUT.md), sau đó sinh lại riêng sheet
menu từ layouts/fixtures JSON giữ nguyên. Geometry, ảnh và reference lock
không thay đổi. File sheet ở đường dẫn cũ tiếp tục là output generator.

Đã xóa 11 tài liệu được thay thế và một screenshot cũ:

| File cũ | Lý do / nơi thay thế |
| --- | --- |
| PIXEL-UI.md | UI thoại/menu cũ; dùng thiết kế Coastal và menu sáu tab |
| UI-SINGLE-SCREEN.md | Đặc tả menu năm tab cũ; dùng scope cố định và menu hiện hành |
| refactor_guide.md | Prompt engine tổng quát đã được thay bằng thiết kế authoring theo dự án |
| DIALOGUE-SPRITES-PLAN.md | Checklist sprite đầu tiên đã hoàn tất; giữ thiết kế v2 và generation inputs |
| PIXEL-MAP-PLAN.md | Checklist map prototype đã hoàn tất; giữ hướng dẫn và review |
| superpowers/plans/2026-10-20-data-authoring-roadmap.md | M0–M8 đã hoàn tất; giữ spec, guide và review |
| superpowers/plans/2026-10-20-dialogue-editor-correction.md | Checklist cũ còn mô tả ba nhóm; editor hiện có 28 object |
| superpowers/plans/2026-10-20-menu-refinement.md | Checklist đã hoàn tất; giữ thiết kế và review |
| superpowers/plans/2026-10-20-tilemap-editor.md | Checklist một layer đã được foundation bốn layer thay thế |
| superpowers/plans/2026-10-21-world-map-foundation.md | T1–T9 đã hoàn tất; giữ spec, guide, roadmap và review |
| superpowers/specs/2026-10-20-tilemap-editor-design.md | Thiết kế một layer/16 tile cố định đã được spec tileset/bốn layer thay thế |
| screenshot.png | Ảnh preview thoại cũ không được tham chiếu; giữ native review mới |

Chi tiết đường dẫn cũ/mới, byte size, hash, trạng thái tracked và lý do xóa ở
[inventory JSON](2026-10-21-reorganization.json). Revision trước khi dọn là
`192b3fa`; các file đã tracked có thể tra lại bằng Git. Một số checklist/ảnh
vốn chỉ có local đã được xóa theo yêu cầu dọn tài liệu; không tuyên bố Git có
bản sao của những file đó.

`engineering/repository-local-files.json` vẫn giữ nguyên các đường dẫn/hash lịch
sử của lần dọn repository trước đây. Tương tự, log/inventory trong các bộ review
cũ là ghi nhận tại thời điểm chạy, không phải link điều hướng hiện hành.

Kiểm tra sau khi dọn: 510 liên kết Markdown hợp lệ, không còn đường dẫn doc
cũ trong phần điều hướng hiện hành; architecture 0 lỗi; browser 164/164;
tám policy công thức và bốn policy gameplay khớp baseline giữ nguyên. World
builder, Stage 0 reference sheets, menu asset checks và active asset packs đều
qua kiểm tra. Hai đường dẫn hướng dẫn trong runtime đã trỏ sang `guides/`.

[Mục lục tài liệu](../README.md).
