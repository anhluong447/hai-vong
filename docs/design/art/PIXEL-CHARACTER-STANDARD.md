# Nghiên cứu và chuẩn sprite nhân vật đề xuất

Ngày: 2026-10-06. Trạng thái: chuẩn làm việc; pilot Khuê/Vân đã triển khai idle/walk/talk. Các clip nghề nghiệp và roster còn lại chờ đánh giá pilot.

Khuê dùng [pilot-v3](../../../assets/pixel/pilot-v3/README.md), Vân dùng `assets/pixel/pilot-v2/`, chạy ở `pixel.html` và `tools/sprite-lab.html`. Cả hai cao 39px ở tư thế đứng nhìn xuống, dùng cùng palette 32 màu, mỗi bộ 64 frame. Khuê giữ bản thử walk trái; các hướng khác và idle/talk từ pilot-v2. Bộ mở rộng pilot-v4 đã bị loại sau feedback hình thể méo; không tiếp tục dùng nó làm chuẩn artwork. Bảng audit dưới đây ghi bộ cũ trước pilot.

Review animation pilot phát hiện pose chân chưa thành chu kỳ đúng và nhịp chưa phù hợp. Xem [audit, nghiên cứu và quy trình sửa animation](../../research/PIXEL-ANIMATION-RESEARCH.md); pilot chưa được duyệt về chất lượng chuyển động dù đạt kiểm tra kỹ thuật.

## Audit bộ đang dùng

Đã đo alpha bounds và màu RGB khác nhau của frame đứng nhìn xuống trong `characters-anime.png`:

| Nhân vật | Hình nhân vật thực trong cell 24×36 | Số màu RGB |
| --- | --- | --- |
| Khuê | 17×34 | 403 |
| Vân | 16×23 | 240 |
| Long | 18×34 | 378 |
| Nhi | 19×34 | 407 |
| Ngọc | 14×25 | 234 |
| Ân | 18×34 | 396 |
| NPC nguồn tin | 19×34 | 472 |

Vân chỉ cao khoảng 68% Khuê, Ngọc khoảng 74%. Đây là lỗi pipeline, không phải chủ ý thiết kế chiều cao.

`tools/import_anime_sprites.ps1` lấy scale nhỏ nhất giữa giới hạn rộng 22px và cao 34px, riêng cho từng nhân vật. Tóc dài và tư thế rộng ở một frame có thể làm cả hàng nhân vật bị thu nhỏ. Crop/recenter từng frame còn thay đổi vị trí các bộ phận so với pivot.

Nguồn hiện tại là hình anime nhiều chi tiết được lấy mẫu xuống sprite nhỏ. Nearest-neighbor giữ cạnh cứng nhưng không tự tạo các cụm pixel có chủ ý. Mặt, kính và tóc mất tính liên tục khi thu nhỏ; hàng trăm màu trên hình vài trăm pixel khiến nét bị nhiễu. Nhận định mặt trông đáng sợ là đánh giá thị giác; số màu chỉ là dấu hiệu hỗ trợ, không phải phép đo chất lượng tuyệt đối.

Renderer hiện chỉ phát hai frame chân `1 + floor(time/120) % 2`, dùng thời gian toàn cục. Có 84 hình không đồng nghĩa có một chu kỳ đi bộ hoàn chỉnh. Idle là một frame tĩnh, NPC không có idle/talk/work animation. Test 53/53 trước đó xác nhận tính toàn vẹn kỹ thuật và gameplay, không xác nhận chất lượng nghệ thuật.

## Những nguyên tắc từ nguồn gốc

1. Thiết kế hình khối, palette, nét và chi tiết ngay trên lưới pixel. Sprite nhỏ cần lựa chọn chi tiết theo độ đọc được. [Derek Yu — Pixel Art Basics](https://www.derekyu.com/makegames/pixelart.html).
2. Phân biệt nhiễu đơn lẻ với cụm pixel có hình; tránh outline và chuyển màu làm mất khối. [Derek Yu — Common Mistakes](https://www.derekyu.com/makegames/pixelart2.html).
3. Dựng mannequin đơn giản và kiểm tra các hướng trên cùng canvas; thêm tóc/quần áo/phụ kiện theo lớp sau khi tỉ lệ và chuyển động ổn. Thiết kế đẹp ở một frame có thể thành nhiễu khi chuyển động. [SLYNYRD — Top Down Character Animation](https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation).
4. Walk cycle cần contact/down/pass/up và nửa chu kỳ chân còn lại. 6 frame là phương án tiết kiệm, 8 frame cho đủ các pha rõ hơn; tóc, tay, thân phải cùng nhịp. [SLYNYRD — Human Walk Cycle](https://www.slynyrd.com/blog/2024/5/24/pixelblog-50-human-walk-cycle).
5. Clip được tách bằng tag; duration có thể khác nhau theo frame, không bắt mọi trạng thái chạy cùng một nhịp. [Aseprite — Tags](https://www.aseprite.org/docs/tags/), [Frame Duration](https://www.aseprite.org/docs/frame-duration/).

Không có một số pixel, số màu hoặc số frame duy nhất là chuẩn cho mọi game. Các con số dưới đây là lựa chọn đề xuất cho Hồi Âm.

## Art spec đề xuất

- Canvas cơ sở 32×48; mannequin học sinh cao khoảng 40–42px, đầu khoảng 13–14px, phong cách anime gọn khoảng ba đầu. Kiểm tra với map trước khi chốt kích thước.
- Khuê và Vân dùng cùng mannequin về thang kích thước. Chênh chiều cao theo thiết kế chỉ 1–2px. Tóc dài mở rộng silhouette, không làm giảm chiều cao cơ thể.
- Một pivot ở giữa chân và một hệ tọa độ chung cho mọi frame. Không crop, recenter hoặc scale độc lập từng frame/nhân vật theo bề rộng tóc.
- Palette chung khoảng 24–32 màu, mỗi nhân vật thường dùng 12–20 màu. Tóc/da/vải có 2–3 sắc độ rõ. Đây là ngân sách làm việc, không phải tiêu chí đẹp tuyệt đối.
- Mắt và kính đọc được bằng vài cụm pixel, giảm nét mũi/miệng không cần thiết; tránh trắng mắt quá lớn, viền đen dày và bóng mặt loang lổ.
- Pixel được kiểm tra ở 1×, 2×, 3× trên nền cỏ, sàn CLB và ban đêm. Phóng theo số nguyên; giữ nét đồng đều với tile/prop.
- Vẽ riêng các hướng có phụ kiện bất đối xứng, đặc biệt túi Khuê, kẹp tóc Vân và máy ảnh Ngọc.
- Artwork tạo bằng imagegen chỉ là đầu vào; phải kiểm tra và chỉnh pixel ở độ phân giải đích. Prompt yêu cầu pixel art không bảo đảm kết quả đã là sprite đạt chuẩn.

## Bộ animation theo gameplay

| Clip | Frame/hướng đề xuất | Mục đích |
| --- | --- | --- |
| Idle | 4, cả 4 hướng | Thở nhẹ, tóc chuyển ít; nhịp chậm, không nhún liên tục |
| Walk | 8, cả 4 hướng | Đủ pha bước chân, tay đối chân, thân nhấp 1px |
| Talk | 4, cả 4 hướng | Cử chỉ tay/đầu nhẹ khi NPC hội thoại |
| Interact | 4–6, các hướng cần dùng | Với tay tới bảng, tủ hoặc đồ vật |
| Write/edit | 6, hướng ngồi/bàn cần dùng | Khuê ghi chép, Vân biên tập |
| Photograph | 6, hướng tác nghiệp cần dùng | Nâng máy, chụp, hạ máy cho nhân vật có máy ảnh |

Core idle/walk/talk là 64 frame mỗi nhân vật với 4 hướng. Các action nghề nghiệp thêm theo nhân vật và vị trí, không bắt mọi người có toàn bộ clip. Chạy nhanh chỉ bổ sung khi có mechanic chạy, hiện chưa cần.

Runtime cần clip metadata gồm frame indices, duration, loop và pivot; đồng hồ riêng cho mỗi actor. Walk liên hệ quãng đường đã đi với pha bước chân, đổi hướng giữ pha khi đang đi, đứng lại chuyển idle. NPC nói chuyện chuyển talk; hành động nghiệp vụ phát action tương ứng. Animation không trì hoãn hoặc tự lặp hiệu ứng gameplay.

## Trình tự làm lại

1. Dựng mannequin và Khuê/Vân đứng ở bốn hướng trên một bảng so sánh cùng tỉ lệ; kiểm tra mặt và silhouette trong map.
2. Làm walk 8 frame và idle 4 frame cho hai người. Có trang preview phát loop, đổi tốc độ và onion-skin để phát hiện thay đổi tỉ lệ, rung đầu và lệch chân.
3. Thêm talk/interact, sau đó write/edit. Chỉ mở rộng roster khi hai mẫu đã đạt yêu cầu thị giác.
4. Dùng template và palette đã ổn cho Long/Nhi/Ngọc/Ân/NPC; bổ sung nghề nghiệp riêng.
5. Thay importer theo grid/pivot đã chốt; renderer theo clip metadata. Lưu bản cũ và source chỉnh sửa theo layer.

## Điều kiện nghiệm thu

- Khuê/Vân đọc được mặt ở kích thước chơi; chiều cao đồng bộ theo mannequin.
- 4 hướng nhìn nhất quán, back không có mắt, phụ kiện giữ đúng bên.
- Walk loop không giật ở điểm nối, không đổi kích thước đầu giữa frame, không trượt chân quá mức.
- Idle/talk/work phân biệt được và gắn đúng ngữ cảnh trong map.
- Kiểm tra trực quan ở tốc độ thật cùng kiểm thử atlas, clip, va chạm, tương tác, save/load. Kết quả test tự động được báo riêng với đánh giá artwork.
