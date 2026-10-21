# Hồi Âm — nền tảng 3D đơn giản

Ngày: 2026-10-21. Trạng thái: người dùng đã duyệt thiết kế và plan M1; chọn
web/Three.js và triển khai trực tiếp trong phiên hiện tại.
Đây là hướng **3D hoàn toàn, gồm môi trường và nhân vật**. Nghiên cứu HD-2D
trước đó chỉ còn là tài liệu so sánh; sprite pixel/billboard không phải đích mới.

## 1. Ý định và quyết định nền

Người dùng đã chọn chuyển dần sang 3D đơn giản, muốn lưu lại sản phẩm 2D cũ
và có kế hoạch rõ ràng trước khi làm. Thành công đầu tiên là một phòng CLB
3D có thể điều khiển nhân vật, đi quanh đồ vật và tương tác; chưa phải chuyển
hết năm map hay hoàn thiện art nhân vật trong một lượt.

Giả định: giai đoạn đầu tiếp tục chạy trên trình duyệt desktop, dùng repo
JavaScript hiện tại. Người dùng đã xác nhận giữ nền web cho M1.
Chọn Three.js cho bản thử trong repo vì có thể giữ GameSession và UI DOM/SVG.
Nếu mục tiêu phát hành chuyển sang desktop với editor chuyên dụng làm trọng
tâm, đánh giá lại Godot trước khi triển khai editor 3D lớn.

Phạm vi được chia thành các mốc có sản phẩm chạy được; **kế hoạch triển khai
chi tiết hiện tại chỉ bao gồm M1**. M2–M5 là thứ tự tiếp theo, không phải lời
hứa đã có thiết kế hoặc code hoàn chỉnh.

## 2. M0 — lưu sản phẩm cũ

Snapshot: `archive/products/coastal-2d-2026-10-21/files/`.
Inventory và `verify_snapshot.py` nằm bên cạnh payload. Bao gồm mã nguồn,
content, editor, ảnh/font/audio local, concept, đầu vào tạo asset, review và
draft sản phẩm. Không gồm Git internals, browser profiles/cache, credentials,
thư mục tạm/build hoặc các archive lịch sử đã được lưu riêng.

Giữ byte và đường dẫn tương đối; đối chiếu SHA-256 sau copy. Bản cũ vẫn có thể
chạy từ chính snapshot bằng server có root tại `files/`. Không di chuyển các
module đang được runtime import hoặc sửa snapshot `archive/clb-hoi/`.

## 3. Phạm vi M1 — phòng CLB 3D chơi được

Trang riêng: `world3d.html`, không thay entry point 2D trong mốc này.
Phong cách: hình khối low-poly, màu đất/kem/gỗ và xanh biển; ánh sáng ấm.
Không dùng texture pixel, sprite nhân vật hoặc một ảnh phòng làm toàn bộ cảnh.

### Không gian và asset thử

- Nội thất rộng **12 × 10 m**; vùng sàn trong X `[-6,6]`, Z `[-5,5]`, Y=0.
- World dùng **Y-up, mét**, tọa độ mặt bằng **X/Z**. Không đồng nhất mét với
  pixel hoặc tự đổi schema tile cũ.
- Có sàn, tường/cửa sổ, bàn, ghế, kệ sách, chậu cây và đèn. Tường phía camera
  được hạ/ẩn theo cấu hình cảnh để quan sát phòng; không cho actor đi qua biên.
- Actor chính là humanoid 3D đơn giản cao **1,65 m**. Có đầu/thân/tay/chân,
  hướng quay và chuyển động chân/tay khi đi. Đây là mannequin, chưa tuyên bố
  là Khuê/Vân hoàn thiện về mỹ thuật.
- Một NPC mesh 3D mang stable ID `van` và tên lấy từ locale.

### Camera, điều khiển và va chạm

- Perspective FOV **40°**, camera nghiêng cố định ban đầu tại `(11,10,13)`
  nhìn về tâm phòng. Viewport hẹp tăng khoảng cách camera theo cùng hướng để
  giữ vùng đi lại trong khung; FOV và góc nhìn giữ nguyên. Chưa có orbit tự do,
  đổi tầng hoặc camera cutscene.
- WASD/phím mũi tên di chuyển tương đối theo camera trên mặt phẳng X/Z.
  Tốc độ **2,5 m/s**, chuẩn hóa đường chéo, bán kính actor **0,22 m**.
- Collision circle với AABB trong mặt bằng; trượt dọc cạnh khi có thể.
  Chia chuyển động thành bước tối đa **0,1 m** để không xuyên vật cản.
  dt được chặn ở **0,05 s**, giá trị không hữu hạn/âm bị từ chối.
- Chỉ hỗ trợ một mặt sàn. Chưa thêm physics engine, nhảy, navmesh, cầu chồng
  đường hoặc tự sửa tính hợp lệ của các scene 2D.
- E/Enter tương tác NPC gần nhất trong **1,4 m** khi đoạn nhìn không bị chặn.
  Chuột có thể chọn NPC bằng raycast; chọn ở ngoài tầm không teleport actor.
  Click-to-move được xem xét ở mốc nối gameplay, chưa nằm trong M1.
- Esc mở/đóng pause; blur, ẩn tab hoặc mở overlay phải xóa phím đang giữ.
  Phím trong input/textarea/select hoặc contenteditable không điều khiển actor.

### UI, session và lỗi

- Hiển thị hướng dẫn, tên cảnh, tương tác và pause bằng DOM nằm trên canvas.
  Toàn bộ text/aria/error dùng `content/locales/vi.js` và text service.
- M1 dùng session thử riêng trong bộ nhớ; đi lại/chọn NPC/pause không thay
  state gameplay và không đọc/ghi localStorage hay save 2D. Đối thoại M1 là
  thông báo tương tác có thể đóng, chưa phải nối quest/romance.
- M3 mới nối CoastalHud, menu sáu tab và dialogue thật qua controller. Không
  import world/Three.js vào domain hoặc application.
- Không có WebGL2, asset lỗi hoặc context lost phải có thông báo và nút thử
  lại bằng locale. Retry dispose instance cũ trước khi mount instance mới.
- Resize giữ tỷ lệ đúng; renderer giới hạn device pixel ratio ở **1,5**.
  Dùng một frame loop; dừng/cancel loop và giải phóng listener, ResizeObserver,
  geometry/material khi dispose. Không chạy nhiều loop sau retry/remount.

## 4. Ranh giới code và dữ liệu M1

```text
content/world3d/newsroom.js            kích thước, spawn, props, collider, màu, camera
src/world3d/navigation.js              validation, movement, tầm tương tác; thuần dữ liệu
src/world3d/meshes.js                  tạo prop/mannequin bằng mesh; sở hữu tài nguyên
src/world3d/World3D.js                 scene, camera, raycast, render và lifecycle
src/presentation/world3d-controller.js locale DOM, input/overlay, session thử và retry
world3d.html                          shell rỗng theo quy tắc text hiện tại
styles/world3d.css                    viewport, hướng dẫn, pause và trạng thái lỗi
vendor/three/r180/                    module renderer local, license và hash inventory
```

Movement không nhận DOM/Three.js object. `World3D` chuyển dữ liệu thuần sang
mesh/camera và trả snapshot vị trí cho controller; chỉ controller phát command
qua GameSession khi một mốc sau cần thay gameplay. Không mở generic engine
framework hay viết lại PixelWorld để chứa cả hai renderer.

M1 pin **Three.js 0.180.0 / r180**, vendor local cả module dependency cần dùng,
license MIT và manifest SHA-256. Đây là version pin của prototype, không tuyên
bố là bản mới nhất. Không fetch CDN lúc chơi, không bắt buộc Node hoặc bundler.
Nguồn: [release r180](https://github.com/mrdoob/three.js/releases/tag/r180).

Định nghĩa gameplay/mỹ thuật nằm trong content; thuật toán và technical ID nằm
trong source. Dữ liệu scene M1 có ID `newsroom-3d`; không ghi đè `newsroom`
trong `content/maps/scenes/` hoặc thay tile catalog đã có.

## 5. M2–M5 — thứ tự mở rộng

| Mốc | Sản phẩm và điều kiện đi tiếp |
| --- | --- |
| M2: asset và art mẫu | Bộ prop low-poly thống nhất, hai nhân vật thử có silhouette/màu khác nhau; recipe JSON + generator xuất GLB có manifest và kích thước chuẩn. Chọn một góc phòng đủ đẹp và review chuyển động trước khi nhân rộng |
| M3: nối vòng chơi | HUD/menu/thoại hiện tại chạy với world 3D; tương tác phát command qua GameSession. Thiết kế riêng world-save envelope/key và validator trước khi lưu vị trí 3D; không ghi đè save 2D |
| M4: editor cảnh 3D | Chọn/thêm/xóa prefab, transform gizmo, snap theo mét, collision, light/camera, undo/draft/export. UI editor bằng tiếng Anh; dùng lại shell/object browser, không bắt đầu bằng viết lại toàn bộ editor |
| M5: chuyển từng map | Phòng CLB → sân trường → tuyến phố/cảng; portal và lịch NPC. Chỉ đổi default entry khi scene/UI/save đã qua kiểm tra và snapshot cũ vẫn chạy được |

Các GLB là file binary local theo chính sách repo; recipe, generator, metadata,
license và manifest được giữ trong Git. Cần build lại được từ recipe và đo
bounding box/pivot/scale, không chỉ xuất một ảnh render. Blender là công cụ
chỉnh tay tùy chọn, không phải prerequisite của asset hình khối đầu tiên.
[glTF/GLB exporter](https://threejs.org/docs/pages/GLTFExporter.html).

## 6. Nghiệm thu và kiểm tra

M1 chỉ đạt khi cảnh có thể chơi được, không phải screenshot đứng yên:

1. Actor đi đủ bốn hướng và đường chéo, quay hướng/animate, dừng trước bàn và
   biên phòng; camera/picking khớp ở desktop và viewport hẹp.
2. Phím E và chuột chọn đúng NPC; vật cản chặn tương tác xuyên tường.
3. Pause/blur/hidden/retry/remount không kẹt phím, không nhân đôi renderer.
4. Thiếu WebGL2/context lost có fallback rõ ràng, không chỉ canvas đen.
5. Session gameplay và save không thay bởi thao tác prototype.
6. Browser suite cũ và baseline vẫn khớp; có test mới cho movement, picking,
   collision, input, lifecycle và lỗi GPU. Giữ nguyên baseline values.
7. Có capture desktop, viewport hẹp và một clip di chuyển; đo frame time,
   draw calls/triangles trên máy/GPU thật được ghi tên. **60 fps ở 1280×720**
   là mục tiêu, không phải kết quả đã chứng minh. Headless/software rendering
   chỉ chứng minh hoạt động, không chứng minh hiệu năng GPU người chơi.

Tài liệu báo cáo phải phân biệt rõ: đã chạy, chưa chạy, art placeholder và
art đã review. Không tự động chốt style nhân vật từ mannequin của M1.

## 7. Rollback và phạm vi thay đổi

Không đổi gameplay balance, save schema cũ, map/tile source 2D, default entry
hoặc art coastal trong M1. Cảnh 3D có URL riêng; rollback bằng quay lại entry
2D hoặc chạy snapshot trên origin khác. Biến đổi cao độ/nhiều tầng ở các mốc
sau cần đặc tả navigation/save và migration review riêng.

Đây là track world 3D mới; tiêu chí UI replica cũ tiếp tục áp dụng cho UI
đang giữ. Không dùng world/nhân vật mới để tự ý thay geometry menu/thoại.
