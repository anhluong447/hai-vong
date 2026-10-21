# Map test 2D pixel

Mở <http://localhost:8080/pixel.html>. Server: `python tools/serve.py`
hoặc `powershell -ExecutionPolicy Bypass -File tools/serve.ps1`.

## Điều khiển

- **WASD / phím mũi tên:** đi theo ô tile, có animation bốn hướng.
- **E / Enter / Space:** tương tác khi đứng cạnh NPC hoặc đồ vật.
- **Bấm map:** tìm đường tới ô; bấm NPC/đồ vật sẽ đi tới cạnh rồi tương tác.
  Không teleport, không đi xuyên tường/đồ vật/người.
- **Esc:** đóng hội thoại/menu. Tin nhắn bắt buộc trước ngủ phải duyệt hết.
- Nút hướng và nút tương tác hỗ trợ màn hình cảm ứng.

Canvas phóng theo tỷ lệ nguyên, không làm mờ sprite. Camera theo chân Khuê;
tối có lớp màu lạnh. Di chuyển và hội thoại giới thiệu không tốn lượt.
Hành động nghiệp vụ vẫn tính energy/slot/tiền qua engine sandbox.

## Bốn map

| Map | Điểm tương tác |
| --- | --- |
| Sân trường | Cửa lớp để đi học; bác bảo vệ mở hồ sơ sân bóng/lời kể quest; thầy phụ trách mở hồ sơ tài liệu/phản hồi chính thức; điểm chụp hiện trường; ghế nghỉ |
| CLB Hồi Âm | Bảng phân công; tủ hồ sơ để đối chiếu; bàn Khuê để chấp bút; máy in xem đội soạn; đồng hồ kết thúc buổi CLB; Vân, Long, Nhi và thành viên gia nhập sau |
| Phố ven biển | Tiệm công cụ/đồ uống/nâng cấp; quầy làm thêm; góc đọc sách/luyện stat/bắt đầu điều tra ngoài giờ; nguồn tin bến cảng; đồng đội lúc rảnh |
| Nhà Khuê | Giường ngủ/feedback; ghế nghỉ; bàn viết; sổ báo cáo |

Cửa CLB ở tòa nhà nhỏ bên trái sân trường; lối xuống phố ở cuối đường phía
nam. Từ phố, cửa về trường ở phía bắc và cửa nhà Khuê ở phía tây nam.
Đi lên ô cửa sẽ đổi map; điểm đến nằm ngoài ô cửa để không bật qua lại.

## Một vòng ngày gợi ý

1. Đi tới cửa lớp và tương tác, chọn đi học để vào buổi CLB.
2. Gặp bác bảo vệ, trả energy phỏng vấn mở hồ sơ sân bóng.
3. Vào CLB, tới bảng phân công, chọn Long giao trọn hồ sơ.
4. Có thể tự điều tra: lời kể/phản hồi ở NPC sân trường, ảnh tại điểm
   hiện trường, tài liệu trong tủ CLB. Bàn Khuê chỉ viết khi đủ bốn bước.
5. Dùng đồng hồ kết thúc buổi CLB; ra phố gặp một đồng đội và hangout.
6. Dùng slot tối làm thêm hoặc luyện stat. Khi tới giai đoạn đi ngủ,
   trở về nhà và tương tác giường.
7. Duyệt tin nhắn hiện ra miễn phí. Sau đó tương tác giường tiếp để ngủ
   và chuyển ngày. Mỗi ngày chỉ tính tiến độ/phát hành một lần.

NPC đồng đội ở CLB trong giờ học/CLB, ra phố trong giờ rảnh. Cuối tuần
họ không ở CLB làm việc; vẫn có thể gặp ở phố để hangout. Lịch mở nhân sự
và đoạn thoại giữ ở mức mock, không phải lịch/cốt truyện chính thức.

## Sprite khi hội thoại

Tương tác NPC hiện dùng ảnh minh họa anime nền trong suốt, độc lập với sprite pixel di chuyển. Bán thân neo cạnh khung thoại trên desktop và phía trên khung trên mobile; phần lời thoại/lựa chọn cuộn riêng. Vân dùng biểu cảm neutral trong CLB và happy cho lời chào ngoài phố; các NPC khác mặc định neutral. Mỗi nguồn tin có chân dung riêng.

Nút **Dialogue art** mở `/tools/dialogue-sprite-lab.html`: chọn đủ chín nhân vật và biểu cảm riêng, đổi nền sáng/tối hoặc khung 390px; bảng cast phía dưới có link prompt từng người. Bộ v2 lấy `characters-anime-source.png` làm design pivot, tạo mỗi master độc lập với pose/góc nhìn/cá tính riêng. Đây là cảnh mock; xem Khuê và các đồng đội chưa gia nhập tại đây không thay lịch chơi. Khi viết hội thoại tiếp có thể gắn `portraitId` và `expression` vào dữ liệu NPC. Xem [bộ art và prompt](../../assets/dialogue/v2/README.md).

## Save và debug

Save riêng `clb-bao-chi.pixel.v1` chứa state và vị trí/map/hướng. Không đọc
hoặc ghi đè save của sandbox click. Nếu vị trí không hợp lệ hoặc bị chặn,
load trở về ô spawn an toàn trong map.

**Menu sandbox** giữ bảng số liệu, editor, debug và các bảng thao tác cũ
để kiểm tra nhanh. Đây là công cụ lab; tương tác trực tiếp từ map vẫn yêu
cầu đứng cạnh NPC/đồ vật. Đổi cấu hình/tạo lượt mới đặt Khuê lại sân trường.

## Asset và kiến trúc

`assets/pixel/tiles.png`: 16 tile 16×16. `characters-anime.png`: bảy bộ sprite
pixel anime, mỗi bộ 3 frame × 4 hướng, frame 24×36; mỗi hàng là một nhân vật.
`objects.png`: 12 đồ vật 32×48. `atlas.json` mô tả vị trí và kích thước.
Khuê dùng override `pilot-v6/`, Vân dùng `pilot-v2/`: frame 32×48, 64 khung/người với idle/walk/talk. Walk lên/xuống của Khuê được làm lại từ đúng ảnh idle và guide theo tỉ lệ idle; mỗi hướng có tám pha. Walk trái/phải và idle/talk giữ nguyên từ v5. Pilot-v6 được gắn vào map ngày 2026-10-08. Preview sheet đang dùng tại `/tools/khue-animation-lab.html`, đối chiếu ảnh đứng tại `/tools/khue-proportion-audit.html`. Xem [sheet đang dùng](../../assets/pixel/pilot-v6/README.md).
Xem `/tools/sprite-lab.html` để phát loop, chỉnh tốc độ, hướng và onion-skin.
Tile/prop là prototype tự dựng; sprite nhân vật tạo bằng imagegen và đóng gói
bằng `tools/import_anime_sprites.ps1`. Xem [nguồn và prompt](../../assets/pixel/CHARACTER-ART.md).
Không sử dụng tài nguyên thương mại RPG Maker. Bộ nhân vật cũ giữ trong `prototype-v1/`.

Chỉnh/tạo lại bằng `python tools/build_pixel_assets.py` (chỉ cần thư viện
chuẩn Python). Map và bố trí đồ vật/NPC nằm ở `src/pixel/maps.js`.

`PixelWorld.js` lo di chuyển theo tile, BFS tìm đường, va chạm, cửa, camera,
vẽ atlas và depth sort. Loop fixed tick chạy 60Hz, giới hạn dt sau khi
tab bị tạm dừng, dọn input khi mất focus. Tile địa hình/tường bị chặn;
đồ vật dùng footprint ở chân, giường/tủ có thêm ô phía trên. Cành cây và
phần cao của sprite có thể che người đi phía sau như map RPG từ trên xuống.

`src/gameplay/main.js` nối đối tượng map vào engine và bảng thao tác chung;
`src/gameplay/engine.js` vẫn là nguồn luật duy nhất. Bản map không sửa
công thức điểm trung bình hoặc cân bằng được nêu trong báo cáo playtest.

Kiểm tra trình duyệt tại `/tests/` gồm atlas tải thật, keyboard, va chạm
NPC, tìm đường/cửa qua bốn map, giao hồ sơ, hangout, làm thêm, feedback khi
energy bằng 0, ngủ/chuyển ngày, save/load vị trí và layout rộng 390px.

Kết quả ngày 2026-10-06: **56/56 passed**, gồm kiểm tra cũ, map, 84 frame anime cũ,
128 frame pilot, nhịp clip, chuyển idle/walk/talk trong map và UI Sprite Lab.
[Ảnh preview](../../archive/development/reviews/pixel-map-preview.png).

Sau khi thay walk lên/xuống Khuê bằng pilot-v6 ngày 2026-10-08: **58/58 passed**. Đã kiểm tra các pha animation trong lab và đường đi sân trường → CLB trên map thật. [Preview v6](../../archive/development/reviews/pixel-map-v6-preview.png).

Map còn là một khu test nhỏ. Chưa có cutscene, lịch di chuyển tự động của
NPC, portrait cuối cùng, nội thất đầy đủ từng cửa hàng hay asset truyện thật.
