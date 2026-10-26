# G1 — Phòng số 3: visual specification

Status: đang chuẩn bị Review A, 2026-10-26. Chưa có lựa chọn cuối về kích thước
sprite, mật độ pixel, palette hoặc asset sản xuất. Không dùng tài liệu này làm
bằng chứng đã có background sạch hay animation hoàn chỉnh.

## Nguồn và hướng đã chốt

- [Phòng CLB](../design/concept/locations/bao-chi-hoang-hon.png): bố cục, vật liệu, không khí và quan hệ giữa world/portrait/UI.
- [Hành lang](../design/concept/locations/Sunset_Corridor.png): tính nhất quán kiến trúc và màu sắc.
- [Khuê](../design/concept/characters/Diệp%20Khuê%20Character%20Design%20Sheet.png), [Vân](../design/concept/characters/Lục%20Thanh%20Vân%20Character%20Design%20Sheet.png): ngoại hình, trang phục, tóc, phụ kiện và biểu cảm.
- [Plan G1](../superpowers/plans/2026-10-26-g1-room3-art-direction.md) và [roadmap](../superpowers/plans/2026-10-26-first3-art-roadmap.md).

Đường dẫn, kích thước byte và SHA-256 của bốn ảnh tham chiếu được ghi trong
[g1-reference-hashes.json](g1-reference-hashes.json). Ảnh gốc giữ nguyên.

Nostalgic Coastal Anime, sắc thái biển miền Trung, cũ kỹ và hoài niệm; background
độ phân giải cao nhiều lớp. Nhân vật là sprite pixel nhiều chi tiết, tỉ lệ không
quá chibi. Sprite minh họa trong sheet không định nghĩa tỉ lệ runtime cuối.
Ánh sáng xuyên cửa là hướng môi trường; chưa đầu tư hệ thống ánh sáng động.

## Composition và layer proposal

Giữ logical viewport `960×540`, phòng `1280×540`, baseline chân `y=420`, bounds
và spawns như content hiện hành. Image resolution không thay domain coordinates.

| Layer | Nội dung cần sạch | Quan hệ với nhân vật |
| --- | --- | --- |
| Exterior | Biển/cảng/núi/trời ngoài cửa sổ, không chữ/UI/người | Xa, parallax nhẹ; đủ coverage ở hai mép camera |
| Shell/floor | Tường, cửa, khung cửa sổ, sàn, cấu trúc phòng | Cố định theo world; mặt sàn khớp chân |
| Furniture back | Bàn, ghế, tủ, bảng tin ở phía sau vùng đi | Nhân vật ở trước; tránh đạo cụ cản lối nhìn giả |
| Props | Báo, bản thảo, đèn và cây tại các vị trí đã định | Tách phần cần tái dùng hoặc tương tác; không cấp gameplay mới |
| Foreground | Đồ gần máy cần che khuất một phần cảnh | Không che mặt nhân vật/điểm tương tác; transparency sạch |

Không nhân cùng một PNG thành 5 bản để gọi là lớp. Nguồn production phải có hình
sạch ở các vùng concept đang bị nhân vật/HUD/hộp thoại che. Chữ bảng hiệu được
biên tập theo nguồn truyện, không mặc định chép các chữ méo hoặc thông tin lớp/tầng
trong concept. UI/name/portrait là các thành phần runtime riêng.

## Bộ so sánh Review A

| Board | Điều giữ cố định | Các phương án |
| --- | --- | --- |
| Density | Cùng pose, nhận diện, nền và chiều cao hiển thị 136 logical units | Hình nhân vật nguồn cao 128 / 192 / 256 px |
| Scale | Cùng một mẫu density 192 px, góc nhìn, pivot và nền | Cao 120 / 136 / 152 logical units |

Các kích thước là đề xuất từ plan. Density phải khác ở số chi tiết pixel thực,
không chỉ nearest-upscale cùng một hình ít pixel. Chưa có board mới được tạo.
Đặt Khuê/Vân cạnh nhau với chân cùng baseline, nhìn nhau, có khoảng cách hội thoại;
giữ nhận diện ba lô, tóc, nơ và đồng phục khi xem ở kích thước chơi.

## Các câu hỏi người dùng sẽ duyệt trên mẫu

1. Tỉ lệ người và mật độ pixel có đúng ý "nhiều pixel, không quá chibi" không?
2. Cỡ nhân vật có cân bằng với căn phòng và đọc rõ khi đi lại không?
3. Cảnh có chất trường cũ ven biển miền Trung, không bị quá rực hoặc quá tối không?
4. Vùng thoại/portrait còn đủ khoảng trống để thấy nhân vật và tương tác không?

Chỉ ghi lựa chọn sau khi người dùng thấy mẫu cụ thể. Review A chưa mở khi chỉ có
bảng thông số hoặc character sheet gốc. Review B cần đoạn playable, không thể
đóng bằng screenshot tĩnh.

## Phần kỹ thuật không phụ thuộc lựa chọn hình

Contracts speaker/expression, actor sampling và NPC visibility theo calendar có
thể được test/triển khai bằng fixtures. Những fixtures này không phải production
art và không được dùng thay mẫu người dùng cần duyệt. World state, costs, flags,
quest effects và trình tự recruit không thay đổi vì asset.

## Nhật ký lựa chọn

| Điểm duyệt | Trạng thái | Lựa chọn |
| --- | --- | --- |
| Review A — density/scale/composition | Chưa có board mới; chưa duyệt | Chưa chọn |
| Review B — đoạn chơi thật | Chưa tích hợp | Chưa duyệt |
