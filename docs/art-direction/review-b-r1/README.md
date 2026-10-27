# C1 — bố cục, tỷ lệ và chiều sâu Phòng số 3

Trạng thái: **bản nháp chờ người dùng review C1**, chưa duyệt production hoặc Review B.
User đã cho commit C1 (`af2b30c`) và đi tiếp. [Bản thử C2](c2/README.md) hiện có
chuyển động/foley/camera/nắng-bụi riêng; chưa nghiệm thu chân trụ hoặc toàn R1.
[Plan R1](../../superpowers/plans/2026-10-27-g1-review-b-cohesion.md).

Mở `/docs/art-direction/review-b-r1/` trên server project (ví dụ
http://127.0.0.1:8765/docs/art-direction/review-b-r1/). Nếu server chưa chạy:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/dev.py --port 8765
```

Nhấn Tab/Enter để dùng các nút vị trí; Space bật/tắt checkbox. Focus canvas rồi
A/D để đi trong session xem riêng. Có thể tắt riêng bàn, ghế, tủ, cửa, khung cửa
sổ, chồng báo hoặc bảng. Thước đo và bóng tiếp xúc có công tắc riêng. Bản xem dùng
GameSession/World2D/AssetService thật, nhưng không tạo profile hay save database.

Nguồn layout là [scene.json](scene.json), preset bóng [presentation.json](presentation.json)
và cấu hình [review.json](review.json). Chúng được thêm vào một bản project tách
riêng rồi chạy cùng `validateProject`; player entry First3 hiện chưa thay scene.
R01 có bốn save thật baseline3/.3 để kiểm tương thích ở các task sau.

Điểm cần duyệt:

- Bàn cao64units so với Khuê152; Vân139.84. Alpha thật của mặt/apron/chân bàn che
  lower body; khoảng trống dưới bàn vẫn thấy chân đúng hình, không có mask chữ nhật.
- Tường không còn furniture/khung cửa vẽ chết. Sàn gỗ, từng món và bóng tiếp xúc
  độc lập; bỏ món nào là thấy nền/người phía sau, không còn bản trùng trong shell.
- Props được xuất native pixel, nền xa giữ smooth. Mặt bàn nhìn được từ góc chếch.
- Cửa cao205units, chân cửa ở mặt sàn phía tườngy380; walking lane của ngườiy420.
  Hai điểm tiếp đất khác nhau vì chiều sâu; thước đo so kích thước của từng vật,
  không lấy chiều cao đầu cửa từ chân người ở lane trước để phóng đại tỷ lệ.
- Board center y283 quanh eye line. Cabinet/cửa sổ/báo có scale và vị trí riêng.
  Cửa sổ dùng ảnh biển riêng vẽ sau tường và dưới frame pixel; không lặp shell cũ.

Các ảnh `c1-x*.png` và `c1-guides.png` được chụp từ chính renderer; hãy dùng bản
xem live để tách lớp và đổi vị trí. Chúng chưa đại diện camera lerp/zoom, gia tốc,
cadence theo distance, foley hay nắng/bụi mới — các phần đó thuộc C2 và tasks sau.

Tạo ảnh bằng **built-in imagegen**. Exact prompts/references/provenance ở
`assets/sources/g1-cohesion/{raw,inputs,GENERATION.json,SOURCE-MANIFEST.json}`;
sources có trong candidate `assets/bundles/first3-art-g1-v2.zip`. Wall-v1 bị loại
vì còn framing dính; wall-v2 là bản tường sạch dùng ở C1. Không sửa PNG concept.
Master nguồn thực quanh1930×814 (các prop có canvas riêng), không claim2560×1080.
Crop/resize/blur là managed rendition recipes; raw masters nguyên byte.

Build44renditions và audit đã pass; blur alpha/hash/bounds và depth/shadow/native
controls có focused RED→GREEN. Chưa claim fresh V2 clean restore hoặc toàn bộ
acceptance R1; source production chỉ chốt sau phản hồi C1.

Kiểm tra tại handoff C1: architecture/content PASS; unit **158 JS + 64 Python**,
browser **70/70**, authoring **47/47**, cả năm receipts khớp source hiện tại.
Không chạy bot/release hoặc nghiệm thu toàn R1 ở checkpoint này.
Bảy captures đều pass: năm vị trí, guides và [tắt riêng bàn](c1-desk-off.png).
19 file design được bảo vệ cùng First3Days raw và bundle V1 nguyên byte.

**Dừng tại review C1:** chưa chốt production assets/commit R01–R02; chưa bắt đầu
R03 hoặc gia tốc/foley/camera/nắng-bụi của C2. Cần phản hồi bố cục, scale và độ
hòa hợp nét giữa người–đồ–nền trước khi đi tiếp.
