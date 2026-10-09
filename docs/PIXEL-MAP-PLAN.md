# Kế hoạch map test 2D pixel

Ngày: 2026-10-06. Mục tiêu: chơi sandbox theo bible bằng nhân vật di chuyển
trong map có asset, NPC và đồ vật, theo góc nhìn RPG 2D từ trên xuống.

**Trạng thái: đã triển khai.** Cả năm bước đã hoàn tất ở `pixel.html`.
Bộ kiểm thử trình duyệt 52/52 passed, gồm một vòng ngày đi thật qua bốn map
và kiểm tra lại các sandbox trước. [Hướng dẫn](PIXEL-MAP.md),
[preview](../archive/development/reviews/pixel-map-preview.png).

## Phạm vi triển khai

1. Bộ asset prototype tự dựng, tile 16×16, nhân vật 16×24 có 3 frame ×
   4 hướng, cây/bàn/giường/tủ/chậu cây. Xuất PNG atlas và metadata; script
   tạo asset được lưu để có thể chỉnh lại, không đưa asset/cốt truyện cũ
   từ archive thành canon.
2. Bốn map nối bằng cửa: sân trường, CLB, phố, nhà. Tile grid, collision,
   camera, sprite theo chiều sâu; di chuyển bằng phím và bấm đường đi.
3. Tương tác trong tầm với E/Enter. NPC hội thoại ngắn, hoạt động có chi
   phí dùng chính engine sandbox. Map không nhân bản công thức tính điểm.
4. Giữ sandbox click để đối chiếu. Trang `pixel.html` là entry mới, save
   riêng gồm trạng thái vòng chơi và vị trí nhân vật.
5. Chạy lại kiểm thử cũ; thêm kiểm tra va chạm/cửa/pathfinding, vị trí save
   và luồng đi học → CLB → nguồn tin/đồng đội → hoạt động cá nhân/tối →
   giường ngủ → feedback → chuyển ngày.

## Tiêu chí hoàn thành

- PNG atlas tải được; map và sprite hiển thị nét ở độ phóng nguyên.
- Nhân vật không xuyên tường, cây, bàn hoặc NPC; bấm vị trí khả dụng sẽ
  tìm đường, không teleport. Cửa đưa sang map đúng điểm spawn.
- Chỉ tương tác đối tượng gần nhân vật; mở hội thoại/menu dừng di chuyển.
- Bàn CLB, nguồn tin, đồng đội, cửa hàng và giường dẫn đến cơ chế đang có.
- Luật approve miễn phí/ngăn ngủ khi còn tin, nghỉ cuối tuần giữ nguyên.
- Có bàn phím và nút điều hướng trên màn hình; resize không làm mất vị trí.
- Nội dung hội thoại/ngoại hình/địa lý chỉ là mock phục vụ kiểm chứng.

## Ngoài phạm vi

Chưa dựng bản đồ Hải Vọng hoàn chỉnh, cốt truyện thật, battle, cutscene dài,
portrait cuối cùng hoặc hệ thống asset do RPG Maker cung cấp. Chưa đổi
công thức điểm số báo và balance trong lượt triển khai map này.
