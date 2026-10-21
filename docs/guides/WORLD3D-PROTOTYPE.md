# Chơi thử phòng CLB 3D

M1 là một phòng 3D riêng, gồm cả môi trường và nhân vật mesh. Bản này dùng
mannequin và đồ vật low-poly tạo bằng code để thử cảm giác điều khiển, camera
và tương tác. Đây chưa phải nhân vật Khuê/Vân hoàn thiện hoặc toàn bộ game 3D.

## Mở trang

Từ repo root:

```powershell
python tools/serve.py --port 8096
```

Mở **http://127.0.0.1:8096/world3d.html** bằng trình duyệt desktop hỗ trợ
WebGL2. Nếu server đã chạy, chỉ cần mở URL. Three.js đã nằm trong `vendor/`;
không cần Node, Blender, tải asset nhị phân hay CDN để dựng phòng thử này.

## Điều khiển

| Thao tác | Cách dùng |
| --- | --- |
| Đi lại | WASD hoặc phím mũi tên; hướng tương đối theo camera |
| Trò chuyện | Đến gần NPC áo kem, nhấn E/Enter hoặc bấm vào NPC |
| Tạm dừng | Esc hoặc nút Tạm dừng |
| Trở lại phòng | Esc hoặc nút Tiếp tục/Trở lại phòng CLB |
| Đổi sang bản cũ | Link Mở bản 2D trên thanh đầu trang |

Nhân vật không đi qua bàn/ghế/tường. Tương tác cần khoảng cách tối đa 1,4 m
và không có vật cản; bấm NPC ở xa không tự đi tới hoặc teleport. Click-to-move,
điều khiển cảm ứng và camera orbit chưa có trong M1. Trang tự co camera trên
màn hình hẹp nhưng bản thử hiện ưu tiên bàn phím desktop.

Mở pause/thoại, đổi focus sang control hoặc rời cửa sổ sẽ thả phím đang giữ.
Quay lại trang bằng Back vẫn có thể tiếp tục; nếu trình duyệt khôi phục trang
từ bộ nhớ, nó trở về trạng thái pause để tránh nhân vật tự đi tiếp.

## Dữ liệu và giới hạn

Phiên thử nằm trong bộ nhớ, không đọc/ghi localStorage hoặc save 2D. M1 chưa
nối menu sáu tab, quest/quan hệ hay vòng ngày; hội thoại với Vân là thông báo
tương tác để thử luồng input. Reload đưa nhân vật về spawn.

Nếu thấy thông báo lỗi đồ họa, thử lại bằng nút Thử mở lại. Khi context GPU
bị mất, renderer cũ được dọn trước khi tạo lại. Nếu vẫn lỗi, kiểm tra WebGL2
và cấu hình tăng tốc đồ họa của trình duyệt. Không cần xóa save để thử.

## Chỉnh nội dung

- `content/world3d/newsroom.js`: spawn, kích thước, prop, collider, NPC, camera,
  ánh sáng và palette. Đơn vị mét, Y-up; di chuyển trên mặt phẳng X/Z.
- `content/world3d/newsroom-art.js`: recipe hình khối và mannequin.
- `content/locales/vi.js`: copy trong namespace `world3d.*`.
- `src/world3d/`: navigation thuần dữ liệu và renderer; controller ở
  `src/presentation/world3d-controller.js`.

Đổi recipe hình ảnh chưa tự thay collider; cần kiểm tra lại kích thước va chạm
trong scene. M1 chưa có editor 3D hoặc export GLB; đó là các mốc tiếp theo.

Xem [thiết kế](../design/specs/2026-10-21-full-3d-foundation-design.md),
[kế hoạch](../design/plans/2026-10-21-full-3d-foundation.md),
[bằng chứng kiểm tra](../ui-reviews/world3d-foundation/README.md) và
[bản lưu 2D](../../archive/products/coastal-2d-2026-10-21/README.md).
