# Map thử tương tác

Mở `/interaction.html`, hoặc chọn **Map tương tác** từ `/pixel.html`.

Map là một buổi giao lưu tại CLB, chia thành khu phóng viên, đối chiếu tư liệu, giao lưu và nguồn tin. Khuê là nhân vật điều khiển; Vân, Long, Nhi, Ngọc, Ân, bác bảo vệ, thầy phụ trách và người làm cảng luôn có mặt. Tương tác bàn ghi chép để xem cảnh riêng của Khuê.

- WASD / phím mũi tên hoặc pad để đi. Bấm NPC để tìm đường, hoặc đến sát và nhấn E/Enter.
- **Tiếp tục** chuyển lời và người nói; sprite tự chọn theo biểu cảm của lời đó. Enter chuyển câu khi focus ngoài nút; trên nút, Enter kích hoạt nút đang chọn.
- Các thành viên có hai nhánh: hỗ trợ trực tiếp hoặc Khuê xem lại tư liệu. Có thể quay về lời trước, nói lại từ đầu và đóng bằng Esc.
- Thanh tên đánh dấu các cảnh đã nghe đến cuối, chỉ giữ trong phiên hiện tại.

Đây là lời thoại mock để kiểm tra tương tác và art; không tính energy, không đọc/ghi save vòng chơi. Không áp dụng lịch gia nhập hoặc lịch làm việc cho các NPC thử nghiệm.

`src/pixel/interaction-scenes.js` định nghĩa từng câu với `speaker`, `expression`, `text`, `next` hoặc `choices`. Sáu biểu cảm của Khuê, ba biểu cảm của mỗi đồng đội và ảnh mặc định của ba nguồn tin đều xuất hiện. Các nguồn tin hiện chỉ có một sprite mỗi người; tâm trạng trong lời kể chưa có biến thể hình riêng.

`src/pixel/maps.js` chứa layout; `interaction-main.js` điều khiển hội thoại và dùng chung PixelWorld/DialogueSprite với map game. Các test kiểm tra đường đi thật, hai nhánh, sprite theo câu, quay lại/đóng, khóa di chuyển khi thoại và bố cục mobile.

Đã xem trực tiếp [khung thoại Nhi trên mobile](../tools/interaction-map-mobile-preview.png). Focus canvas dùng `preventScroll` để thao tác bấm không bị lệch tọa độ khi map nằm dưới phần đầu trang. Preview tự đi map có tại `/tools/interaction-map-preview.html?character=nhi&expression=serious&mobile`.

Kết quả sau bản sửa cuối: **63/63 browser tests pass**, bao gồm đường đi trên desktop/mobile và các map vòng chơi hiện có. [Bố cục map thử](../tools/interaction-map-room-preview.png).
