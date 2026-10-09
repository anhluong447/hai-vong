# Hồi Âm — concept UI tòa soạn ven biển, v1

Ngày: 2026-10-09. Tạo bằng công cụ image_gen tích hợp, để đánh giá hướng nghệ thuật trước khi triển khai UI.

Người dùng đã chọn bộ này làm mốc tham chiếu để lập kế hoạch component và chuyển động. Giữ nguyên bốn ảnh và prompt trong phiên bản này; lưu hash trong [references.json](references.json). Xem [roadmap hiện hành](../../UI-REPLICA-ROADMAP.md); [plan v1](../../UI-COMPONENTS-PLAN.md) giữ như lịch sử. Các thử nghiệm tiếp theo tạo phiên bản mới.

Yêu cầu được chốt lại ngày 2026-10-09, scope revision 2: **tái dựng phần UI cố định và trang trí gắn UI trong bốn concept**, gồm composition UI, shape, asset, lớp chồng, chữ/icon, ánh sáng và vật liệu; sau đó làm animation. Background/cảnh lớp học/cảng, nhân vật và world có thể khác concept, dùng art tạm hoặc gen mới; làm sau và không chặn các gate UI. Hoa, notebook và minh họa bờ kè của thanh thoại vẫn thuộc UI. Logo được lưu làm nguồn dùng lại, hiển thị ở thoại tùy chọn. Xem [roadmap hiện hành — 45 bước](../../UI-REPLICA-ROADMAP.md). Khung chuẩn là 1672×941, ưu tiên giữ composition thay vì reflow mobile. Mô tả/prompt phía dưới ghi lại giai đoạn tạo concept; không còn giới hạn việc triển khai ở mức lấy cảm hứng.

## Bộ màn hình

- [01 — Thoại và lựa chọn](01-dialogue.png): vùng đọc giấy sáng, chân dung nhân vật và lựa chọn vàng.
- [02 — Menu](02-menu.png): điều hướng xanh sâu, bố cục bất đối xứng và chân dung Khuê.
- [03 — HUD khám phá](03-hud-map.png): ngày, năng lượng, tiền, mục tiêu và gợi ý tương tác trên cảnh tòa soạn.
- [04 — Hồ sơ](04-dossier.png): nội dung dạng hồ sơ biên tập, nguồn tin và cộng tác viên.

## Hướng nghệ thuật

Chỉ lấy cảm hứng ở sự thoáng, chiều sâu và nhịp thị giác của hướng số 3 đã chọn. Bản sắc riêng dựa trên tòa soạn học đường tại Hải Vọng: đường cong thủy triều, dấu sóng kết hợp ngoặc trích dẫn, cột báo và chất giấy.

Bảng màu: xanh mực #102D42, xanh biển #087F8C, turquoise #62D6D0, giấy ấm #F4F1E7, vàng nắng #F6C968. Chữ lớn có chất biên tập; khi triển khai cần chọn font có đầy đủ dấu tiếng Việt và kiểm tra độ đọc ở kích thước thực.

## Giới hạn và hướng thử tiếp

Đây là ảnh concept tĩnh. Chữ, số liệu, nội dung hồ sơ và một số chi tiết cảnh chỉ minh họa; chưa xác nhận hành vi gameplay. HUD có nền tranh diễn giải giàu chi tiết hơn cảnh pixel hiện tại, không phải ảnh chụp game đã nâng cấp.

Ảnh tĩnh chưa kiểm chứng chuyển động. Hướng prototype đề xuất: lớp sóng vào màn trong 200–350 ms, chân dung trượt nhẹ, lựa chọn đổi màu kèm dịch chuyển nhỏ; giữ vùng đọc ổn định, hỗ trợ giảm chuyển động. Cần thử ở màn hình nhỏ và tránh để chân dung che nội dung hồ sơ.

Khi triển khai, tách text vào content/locales/vi.js, dữ liệu màn hình vào content/, dùng token thiết kế cho màu, font, khoảng cách và chuyển động. Không dùng chữ đã raster hóa trong các ảnh này làm UI thực tế.

Prompt đầy đủ và tham chiếu được lưu trong [prompts.json](prompts.json). Các ảnh là bản sao; đầu ra gốc của image_gen được giữ nguyên.
