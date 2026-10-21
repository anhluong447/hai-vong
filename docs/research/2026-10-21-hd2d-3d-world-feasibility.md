# Thế giới 3D với nhân vật 2D: nghiên cứu khả thi

Ngày: 2026-10-21. Trạng thái: nghiên cứu và đề xuất, chưa chốt engine,
chưa benchmark, chưa triển khai hoặc thay thế runtime hiện tại.

Cập nhật cùng ngày: người dùng đã đổi hướng sang **3D hoàn toàn, cả nhân vật**.
Tài liệu này giữ làm nghiên cứu so sánh; hướng tiếp theo nằm ở
[thiết kế full 3D](../design/specs/2026-10-21-full-3d-foundation-design.md).

## 1. Mục tiêu và kết luận

Người dùng muốn chuyển khỏi cách trình bày map 2D phẳng, hướng tới thế giới
2.5D trên nền 3D như Octopath Traveler. Giả định để so sánh: cần giữ được
gameplay hiện tại; nền tảng phát hành cuối cùng chưa được quyết định.

Khả thi. Với repo này, nên thử một cảnh 3D có thể chơi được trước khi chuyển
cả game. Hướng ít phải chuyển code nhất là giữ JavaScript, UI DOM/SVG và luật
chơi, bổ sung renderer web 3D. Nếu ưu tiên editor dựng cảnh và bản desktop,
Godot/Unreal cần được cân nhắc như một cuộc chuyển engine thực sự.

Repo hiện tại là game web tự viết bằng Canvas/ES modules. RPG Maker MZ là
nguồn tham khảo của editor map, không phải engine đang chạy dự án.

## 2. Những gì xác nhận được từ Octopath

Đội Acquire mô tả nhân vật là pixel art 2D, bối cảnh phần lớn là 3D; việc
phối hai loại hình ảnh và giới hạn xoay camera là những thách thức chính.
Khi khám phá, camera có hướng cố định; phần hai nhấn mạnh ánh sáng ngày/đêm.
Nguồn: [phỏng vấn Square Enix/Acquire trên Unreal Engine, 2023-08-22](https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style).

Đề xuất riêng cho game này:

- Nhà, sàn, tường, mái, cầu thang và đồ nội thất lớn có hình khối 3D.
- Nhân vật dùng sprite animation đặt trên mặt phẳng trong cảnh 3D.
- Camera nghiêng với hướng được kiểm soát; so sánh perspective góc hẹp với
  orthographic bằng cùng một cảnh, chưa coi một cách chiếu là bắt buộc.
- Nắng chiều, đèn phòng, bóng tiếp xúc, sương nhẹ và màu sắc gắn với thị trấn
  ven biển; bloom/độ sâu trường ảnh chỉ bổ sung sau khi cảnh đã đọc rõ.
- Giữ chữ/menu/thoại ngoài chuỗi hiệu ứng làm mờ của thế giới.

Đây là hướng mỹ thuật đề xuất, không phải thông số kỹ thuật được xác nhận
của Octopath. Đổi engine không tự tạo được chất lượng mỹ thuật tương đương.

## 3. Đối chiếu trực tiếp với code hiện tại

| Thành phần | Khả năng tái sử dụng nếu giữ nền web |
| --- | --- |
| `src/application/GameSession.js`, `src/domain/` | Giữ luật chơi, command, quest và tiến trình; không đưa engine 3D vào domain |
| `src/pixel/maps.js` | Giữ truy vấn đi lại, BFS và tương tác trên mặt bằng một tầng |
| `src/world/MovementSystem.js` | Giữ ý nghĩa di chuyển; cần rà soát liên kết tới world và khoảng cách animation tính theo pixel |
| `content/maps/scenes/`, prefab, stable ID | Giữ layout logic, spawn, portal, lịch NPC và footprint |
| Menu/HUD/Dialogue DOM/SVG | Giữ được khi tiếp tục chạy trên web; cần nối lại lifecycle và khóa input |
| Sprite và portrait hiện có | Dùng làm đầu vào thử; phải kiểm tra góc nhìn, kích thước và ánh sáng mới |
| World/Tileset Editor | Giữ authoring logic và dữ liệu cũ; bổ sung authoring hình khối/ánh sáng sau khi xác nhận hướng hình ảnh |

Các chỗ phải thay hoặc tách thêm:

- `src/world/WorldRenderer.js` đang gọi Canvas 2D, sắp actor theo trục y và
  vẽ hai lớp nền dưới/trên nhân vật. Cần renderer dùng camera và depth 3D.
- `PixelWorld.load()` và `rebuildBackgrounds()` đang gắn với ảnh atlas và
  canvas nền. Asset loading/caching cần có đường riêng cho cảnh 3D.
- `PixelWorld.click()`, `screenPosition()` và
  `content/world/metrics.js:clientToGrid()` dùng phép đổi tọa độ 2D. Camera
  3D cần picking bằng ray, chiếu vị trí ra màn hình và kiểm tra che khuất.
- Renderer hiện còn cập nhật biển tên DOM, hint và portrait. Các nhiệm vụ này
  cũng cần được nối lại; chỉ thay hàm vẽ là chưa đủ.
- `tools/authoring/WorldEditor.js` đang dựa vào canvas, scale và camera 2D.
  Không thể coi inspector mới là một editor 3D hoàn chỉnh.

Đây là đánh giá từ mã nguồn, không phải kết quả chạy một bản 3D thử nghiệm.

## 4. So sánh lựa chọn công nghệ

Khả năng kỹ thuật từ tài liệu chính thức:

- **Three.js:** WebGLRenderer dùng WebGL2; có loader glTF và chuỗi
  post-processing. [Renderer](https://threejs.org/docs/pages/WebGLRenderer),
  [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html),
  [EffectComposer](https://threejs.org/docs/pages/EffectComposer.html).
- **Babylon.js:** có scene graph, công cụ Inspector và pipeline tích hợp
  bloom, depth of field, color grading.
  [Danh sách tính năng](https://www.babylonjs.com/specifications/),
  [pipeline](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline).
- **Godot:** Sprite3D/AnimatedSprite3D có thể đặt sprite trong thế giới 3D;
  có billboard và tùy chọn chịu ánh sáng.
  [SpriteBase3D](https://docs.godotengine.org/en/stable/classes/class_spritebase3d.html).
- **Unreal:** Paper 2D hỗ trợ sprite/flipbook kết hợp môi trường 3D.
  [Tài liệu Epic](https://dev.epicgames.com/documentation/en-us/unreal-engine/paper-2d-overview-in-unreal-engine).

Đánh giá phù hợp với repo này — suy luận kỹ thuật, chưa benchmark:

| Lựa chọn | Điểm phù hợp | Công việc/chuyển đổi đáng kể |
| --- | --- | --- |
| Three.js | Thử một renderer riêng, giữ JS và UI hiện có | Phải tự tích hợp công cụ dựng cảnh, quản lý asset, picking và hiệu ứng |
| Babylon.js | Giữ web/JS, có sẵn nhiều công cụ 3D để chỉnh và kiểm tra | Inspector không thay cho hệ thống authoring game, validator và lưu nháp hiện tại |
| Godot | Ưu tiên workflow scene/editor 3D và sản phẩm desktop | Gameplay JS và UI DOM/SVG không chạy nguyên trạng trong runtime Godot tiêu chuẩn; cần port hoặc cầu nối |
| Unreal | Ưu tiên dựng cảnh/camera/ánh sáng và pipeline nội dung trên engine lớn | Chuyển gameplay/UI, pipeline asset và cách kiểm thử; phạm vi khác hẳn thêm renderer web |

Godot Web dùng Compatibility/WebGL2; depth of field tích hợp không được hỗ trợ
trong Compatibility. Vì vậy không nên suy từ demo desktop sang chất lượng web.
[Web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html),
[CameraAttributesPractical](https://docs.godotengine.org/en/stable/classes/class_cameraattributespractical.html).

Đề xuất: dùng Three.js cho phép thử hẹp trong repo; Babylon.js là ứng viên
web đáng cân nhắc nếu công cụ chỉnh cảnh trở thành tiêu chí hàng đầu. Chốt
production engine sau khi rõ nền tảng và xem được cảnh chạy thật. Nếu chọn
desktop cùng editor 3D làm trọng tâm, đánh giá Godot trước khi mở rộng editor
tự viết. Không cần dựng bốn prototype để ra quyết định đầu tiên.

## 5. Những giới hạn cần giải quyết đúng

**Ảnh PNG không chứa hình khối.** Tileset cũ có thể giúp thử màu và texture;
chiều cao tường, mái nhà, cạnh cầu thang và mặt sau vật thể phải được dựng hoặc
gán thủ công. Dùng mesh đơn giản trước, rồi bổ sung bộ asset glTF/GLB có phong
cách thống nhất. Chi phí tạo cảnh là phần đáng kể, dù chọn engine nào.

**Sprite có ánh sáng và bóng là một bài riêng.** Three.js Sprite luôn hướng
camera nhưng không đổ bóng. Đề xuất thử mesh mặt phẳng có material chịu sáng,
alpha cutout và điểm neo chân, hoặc bóng tiếp xúc riêng. Phải kiểm tra xuyên
tường, che khuất và bóng khi camera dịch chuyển.
[Sprite](https://threejs.org/docs/pages/Sprite.html),
[MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html),
[alpha test](https://threejs.org/docs/pages/Material.html).

**Bốn layer không phải bốn tầng cao độ.** Có thể giữ tọa độ logic `(x,y)` và
chiếu ra mặt bằng `(X,Z)` 3D; độ cao hình ảnh lấy từ cấu hình cảnh. Tuy nhiên,
cầu đi phía trên một con đường hoặc nhiều mặt sàn cùng tọa độ đòi hỏi mô hình
navigation/surface và rà soát save/schema. Chưa nên hứa giữ nguyên mọi save
khi thêm gameplay nhiều tầng.

**Pixel art trong phối cảnh có thể rung hoặc nhòe.** Phải kiểm tra lọc texture,
viền atlas, texel density, camera và chuyển động thực tế. Một ảnh tĩnh đẹp
không chứng minh cảnh di chuyển đẹp. Các hiệu ứng hậu kỳ cần mức chất lượng
và ngân sách GPU riêng; chữ HUD tiếp tục render rõ bên ngoài hiệu ứng world.

## 6. Phép thử đề xuất trước khi lập kế hoạch chuyển đổi

Làm một phòng CLB/toà soạn nhỏ, dùng Khuê và Vân hiện có. Dựng sàn, tường có
độ dày, cửa sổ, vài bàn và kệ; đặt camera nghiêng cùng nắng chiều. Cảnh phải
đi lại được, có vật thể che nhân vật, tương tác với Vân và mở được UI hiện tại.
Kèm một bộ prop hoàn thiện nhỏ để đánh giá chất lượng vượt khỏi graybox.

Điều kiện đánh giá:

1. Sprite bám sàn, che khuất đúng, không xuyên bàn/tường; click và bàn phím
   điều khiển cùng một không gian logic.
2. Đổi ánh sáng và dịch camera không làm nhân vật thành một tấm ảnh lạc cảnh.
3. Menu/thoại khóa movement đúng và tiếp tục dùng GameSession; không ghi đè
   save đang có chỉ để phục vụ demo.
4. So sánh có/tắt hiệu ứng, đo frame time và bộ nhớ trên thiết bị mục tiêu đã
   chọn. 60 fps desktop là mục tiêu cần đo, chưa phải kết quả hoặc cam kết.
5. Nếu dùng cùng logic gameplay, baseline cũ tiếp tục khớp. Cảnh mới có bộ
   kiểm tra projection, picking, input, lifecycle và đối chiếu hình ảnh riêng.

Sau phép thử mới chốt: engine, mỹ thuật, nền tảng và ngân sách asset. Tiếp đó
mới mở rộng editor thành công cụ đặt mesh/prefab, chỉnh cao độ, light/camera
và vùng tương tác; chuyển từng map sau khi pipeline nhỏ đã dùng được.

Nghiên cứu này không cập nhật roadmap hay thay đổi scope UI replica hiện hành.
