# UI một màn game

Khung thiết kế chung: **1672 × 941**. Các trang áp dụng: `pixel.html` và `interaction.html`.

World, HUD, menu, thoại, bản đồ, thông báo và hộp xác nhận nằm trong cùng stage.
Cửa sổ khác tỉ lệ dùng khoảng đệm trung tính; stage scale đồng nhất, không đổi layout.
Canvas world dùng tọa độ thiết kế; API vị trí màn hình và hit testing đổi sang tọa độ
hiển thị để giữ đúng tương tác khi scale.

## Điều khiển

| Ngữ cảnh | Phím |
| --- | --- |
| World | WASD/mũi tên di chuyển; E/Enter tương tác; M bản đồ; Esc menu |
| Menu | Lên/xuống chọn tab; phải sang nội dung; trái về tab; Enter chọn |
| Thoại và các bảng | Mũi tên chọn; Enter thực hiện; Tab/Shift+Tab đổi vùng |
| Trường nhập liệu | Phím điều khiển gốc của trình duyệt; Tab đổi trường |
| Quay lại | Esc đóng bảng hoặc hủy xác nhận; bảng feedback bắt buộc cần xử lý xong |
| Lưu/tải từ world | F5 lưu; F9 tải và mở xác nhận trong game |

Menu giữ năm mục chính đúng concept `02-menu.png`: Hồ sơ, Đồng đội, Lịch,
Nhật ký và Thiết lập. Hồ sơ chứa điều tra của Khuê và đội soạn; Lịch chứa
hoạt động đời sống; Nhật ký chứa báo cáo. Thiết lập chứa lưu/tải và quản lý lượt.
Danh sách hồ sơ dùng hai thẻ giấy có ảnh mỗi trang; PageUp/PageDown đổi trang.
Enter mở phần thao tác hồ sơ thật; Esc quay lại danh sách trước khi đóng menu.
Nội dung/hành động lấy từ controller và GameSession, không dùng card mock để thay
thế dữ liệu game. Lưu/tải, xuất lượt, lượt mới và hành động chuyển phase nằm trong
menu. Bản đồ xem các map hiện có, vị trí người chơi và lối đi; không thêm dịch chuyển.

Prompt E chỉ hiện khi có đối tượng tương tác hợp lệ và bám vị trí theo camera.
HUD nhận weekday, năng lượng/capacity và tiền dạng dữ liệu; không tách từ/regex
trên chuỗi dịch để suy ra trạng thái.

## Ràng buộc được giữ

Domain/gameplay và save schema không thay đổi. Văn bản mới ở
`content/locales/vi.js`. Canvas và shell tồn tại qua các lần render UI.
Overlay khóa world, giữ focus trong bảng và trả focus khi đóng. Các asset art,
ảnh concept và bản review cũ được giữ nguyên. Trang sandbox không bị gom vào stage.

## Kiểm chứng cần chạy sau khi áp dụng

1. `python tools/check_architecture.py`
2. Local server: `python tools/serve.py --port 8080`
3. `python tools/run_browser_tests.py`
4. `python tools/check_baselines.py`
5. Kiểm tra trực quan world/thoại/menu ở 1672 × 941, cửa sổ nhỏ và khác tỉ lệ.

Suite `tests/single-screen.test.js` bổ sung HUD số/ngày, focus/menu/tab thật,
bản đồ, xác nhận tải, quay lại world, scale cố định và thoại với di chuyển bằng phím.
Các test cũ được điều chỉnh cho thao tác lưu/tải trong game và việc giữ bố cục cố định.

Bản sửa đã được áp vào dự án ngày 2026-10-12 sau khi quyền ghi workspace hoạt động.
Kiểm tra kiến trúc đạt (0 lỗi). Browser suite đã được thử với Chrome và Edge,
nhưng cả hai bị sandbox chặn IPC khi khởi động (`mojo platform_channel: Access is
denied`), nên chưa chạy được các assertion, baseline hoặc review ảnh. Phần kiểm
chứng này còn mở; chưa được coi là hoàn tất.

`tools/verify_single_screen.py` chạy nguyên browser suite với profile tạm kế thừa
quyền workspace, xử lý lỗi ACL của thư mục tạm Python trên Windows. Nó không thay
đổi assertion hoặc giới hạn sandbox; lỗi IPC của trình duyệt vẫn cần được xử lý.
