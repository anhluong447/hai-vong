# Menu tối giản — prototype v2

**Điều chỉnh sau concept:** bỏ Khuê trang trí trên nền các tab, dùng cảnh vật để
nhường chỗ cho nội dung. Chân dung đồng đội có chức năng vẫn giữ. Thêm sóng xanh/
xanh nhạt lượn, hoa/lá đung đưa, particle và ánh sáng nắng nhẹ. Các PNG dưới đây
chưa tạo lại; áp điều chỉnh này khi dựng runtime theo
[kế hoạch triển khai](../../design/ui/MENU-V2-IMPLEMENTATION.md).

Bản chạy đầu tiên đã có trong `pixel.html` (Esc mở menu, M mở bản đồ).
Xem [ghi nhận triển khai và kiểm tra](../../ui-reviews/coastal-menu-v2/README.md).

Ngày: 2026-10-15. Bộ **6 màn menu** tạo bằng **built-in image_gen**. **Mỗi lần mở menu, vào thẳng tab Hồ sơ** với danh sách quest và chi tiết; không có bước menu tổng trung gian. Sáu tab luôn sẵn để chuyển qua lại.

| Ảnh | Mục đích |
| --- | --- |
| [01-ho-so.png](01-ho-so.png) | Màn mặc định khi mở menu. Main / Side / General; danh sách title; chi tiết gồm title, description, quá trình đã diễn ra và hint; main có dấu !. |
| [02-ky-nang.png](02-ky-nang.png) | Skill tree; mô tả và cost chỉ hiện cho node đang chọn. |
| [03-trang-bi.png](03-trang-bi.png) | Sáu slot: đầu, thân, tay, chân và hai phụ kiện; món đang chọn và stat. |
| [04-dong-doi.png](04-dong-doi.png) | Danh sách chân dung, tên, biệt danh, bond, quest phụ trách, kỹ năng và tiểu sử. |
| [05-ban-do.png](05-ban-do.png) | Bản đồ Hải Vọng với địa điểm, focus, ký hiệu quest / bond / làm thêm và hướng dẫn chọn để di chuyển. |
| [06-cai-dat.png](06-cai-dat.png) | Thiết lập cơ bản placeholder, lưu game và tải game. |

Ảnh 00 đã được người dùng xóa do không cần màn menu tổng. Ảnh Hồ sơ là reference chung cho các chỉnh sửa tiếp theo để giữ thanh điều hướng, wordmark, energy, typography và đồ trang trí. [prompts.json](prompts.json) ghi hành vi mở menu và prompt đã điều chỉnh cho reference hiện có; các PNG còn lại chưa được tạo lại.

[generation-history.json](generation-history.json) giữ nguyên prompt và reference của lần tạo ảnh ban đầu để bảo toàn nguồn gốc. Các tên ảnh đã xóa xuất hiện trong lịch sử chỉ là provenance, không phải dependency hiện hành. Màn Đồng đội dùng [concept dossier gốc](../coastal-editorial-v1/04-dossier.png) làm reference cho Vân; bản đồ dùng [hai-vong.png](../references/hai-vong.png) làm reference địa hình.

Ảnh là prototype raster để đánh giá bố cục; chưa phải UI tương tác hoặc asset runtime. Skill, chỉ số, biệt danh, quest, mức bond và tiền là dữ liệu minh họa. Chân dung đồng đội phụ cần thay bằng art nhân vật đã duyệt (đặc biệt thumbnail Ngọc trong ảnh hiện tại chưa đúng giới tính/nhận diện). Không xem lettering phát sinh trong cảnh hoặc giấy tờ là nội dung canonical.

Sáu ảnh giữ sáu mục trên thanh điều hướng, energy 7/10, dấu ! của main, sáu slot trang bị, các trường hồ sơ đồng đội, ký hiệu bản đồ và placeholder thiết lập. Chi tiết pixel, icon phụ và vị trí bề mặt nội dung vẫn cần thống nhất khi làm component. Riêng popup xác nhận về trọ, màn chọn item, màn nghe ngóng/phân công general quest, save/load slots và các trạng thái tương tác khác chưa nằm trong bộ ảnh này.

[inventory.json](inventory.json) lưu kích thước, byte và hash của sáu ảnh hiện có/reference; thông tin ảnh đã xóa nằm riêng trong removedOutputs. Bản cập nhật này sửa tài liệu và metadata, không sửa runtime.

![Hồ sơ — màn mặc định khi mở menu](01-ho-so.png)

![Kỹ năng](02-ky-nang.png)

![Trang bị](03-trang-bi.png)

![Đồng đội](04-dong-doi.png)

![Bản đồ](05-ban-do.png)

![Cài đặt](06-cai-dat.png)
