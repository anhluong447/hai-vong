# Menu theo concept 02 — sửa lại bố cục

Tham chiếu: [02-menu.png](../../ui-concepts/coastal-editorial-v1/02-menu.png).
Khung thiết kế: 1672 × 941. Trang chạy thật: `pixel.html`.

## Thay đổi

- Bỏ bố cục sidebar cộng bảng trắng lớn đã thêm trong lần gom màn hình.
- Khôi phục mảng mực xanh hữu cơ, wordmark/mark/nhãn tuần, tagline viết tay,
  trục điều hướng có icon và vệt cọ vàng; giữ đúng năm mục của concept.
- Thẻ hồ sơ dùng giấy nghiêng, lỗ ghim, số thứ tự, ảnh, băng dính và nhãn cổng.
  Thẻ lấy dữ liệu game thật; Enter mở panel thao tác hiện có, Esc quay lại.
- Hiển thị hai thẻ mỗi trang, thêm PageUp/PageDown và nút đổi trang cho dữ liệu
  nhiều hơn hai hồ sơ. Điều tra/đội soạn/đời sống vẫn truy cập được qua các mục phụ.
- Năng lượng, chấm trạng thái và tiền nằm ở góc trái dưới; tuần/capacity lấy từ
  state. Mép sóng/giấy đáy, hoa và báo tiền cảnh nằm trên plane riêng; phím Chọn/
  Trở lại nằm trên mép giấy phía phải. Không có HUD ngoài khung game.
- Chất liệu/vector được giữ trong asset code, chữ và hit target là DOM riêng.
  Plate scene giữ bối cảnh thay thế; không dùng ảnh tham chiếu làm UI phẳng.
- Cập nhật nguồn `tools/build_menu_assets.py` cùng exports của grain/icon.
  SVG newspaper là alpha mask dùng lại art sẵn có, không chứa các key hint baked.

## Kiểm chứng

Kiểm tra kiến trúc đạt 0 lỗi. Cú pháp JavaScript, đường dẫn art, SVG và đồng bộ
nguồn/export được kiểm tra riêng. Tests được cập nhật cho năm mục, mở/quay lại
hồ sơ và nút Esc hiển thị mới.

Ngày 2026-10-13, lệnh chụp chuẩn `python tools/capture_replica.py` chạy thành công
ba lần liên tiếp. Đã mở và so sánh trực tiếp ảnh native với reference:

- [Trước sửa bằng ảnh render](menu-standard-retry.png).
- [Bản hiện tại](menu-native-v3.png), [metadata](menu-native-v3.json),
  [overlay](menu-native-v3-overlay.png), [difference](menu-native-v3-difference.png).
- Cả ba capture có viewport 1672 × 941, DPR 1, font và ảnh đã tải, motion dừng.
  Đây là authoring preview dùng MenuView thật và dữ liệu concept; chưa phải
  kiểm chứng các panel với dữ liệu gameplay.

Đã sửa chấm năng lượng rỗng bị class `.empty` toàn cục thêm padding thành hình
bầu dục: dùng `.is-empty` riêng, kích thước cố định và không có padding. Đã chỉnh
cỡ tiêu đề, baseline wordmark/nhãn tuần, bố cục chữ viết tay, cụm tài nguyên,
icon tiền và kích thước hoa. Grain sóng được clip theo SourceAlpha để bỏ dải
chữ nhật ngoài mép giấy; nền mực có loang và hạt nhẹ, nguồn SVG được cập nhật.

**Chưa nghiệm thu visual:** mảng mực và đường sóng vẫn quá đều so với nét cọ
reference; hai card còn dùng giấy chữ nhật xoay thay vì đúng tứ giác; hoa và
mép báo chưa khớp hình dáng/crop reference. Full-frame metrics chỉ là chẩn đoán,
không phải bằng chứng UI đạt; background/nhân vật không thuộc gate này.

Kiểm tra kiến trúc sau sửa: 0 lỗi, 1003 text entries. Browser suite thử lại qua
runner chuẩn và workspace-profile wrapper đều bị lỗi quyền trước assertion.
`check_baselines.py` báo khớp 8 sandbox + 4 gameplay policies nhưng đọc log cũ
ngày 2026-10-12 16:05:10, vì vậy **không tính là validation cho thay đổi hiện tại**.
`static-comparison.json` giữ lại ước tính lịch sử trước khi chụp được ảnh.

## Lệnh chụp đã chạy thành công

```powershell
python tools/capture_replica.py --url 'http://127.0.0.1:8090/tools/coastal-menu-preview.html?capture=1' --screen menu --output docs/ui-reviews/single-screen-menu-v2/menu-native-v3.png --compare-reference
```

Preview capture dùng cùng MenuView, asset và CSS với game, nhưng dữ liệu concept
được dựng ở trang authoring riêng. Hook chờ font/art và tắt motion, không sửa save.
Ảnh tham chiếu và review lịch sử được giữ nguyên.
