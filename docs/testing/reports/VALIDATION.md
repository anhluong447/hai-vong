# Kết quả kiểm chứng sandbox

## Refactor kiến trúc — 2026-10-09

- Chrome headless: **68/68 passed**, gồm 63 kiểm tra hiện có và năm kiểm tra mới
  cho content references, text fallback, session replacement, save migration và input lifecycle.
- Architecture check: **0 issues**, 699 catalog entries.
- Tám policy trong `sandbox-baseline.json` và bốn policy trong
  `gameplay-baseline.json` khớp toàn bộ các field, gồm lượt 84 ngày; không ghi lại baseline.
- 40 PNG review và năm script di cư/inventory đã chuyển vào `archive/development/`;
  SHA-256 của cả 45 file đã kiểm tra sau khi chuyển. Link tài liệu đã cập nhật.
- Node không có trong PATH; không tuyên bố đã chạy `npm test`.

Các mục dưới đây là kết quả lịch sử. Baseline vẫn chỉ chứng minh regression của
mock, không chứng minh balance cuối hay kết cục truyện sản phẩm.

Ngày kiểm tra: 2026-10-05.

## Backup

163 file gốc, 52.632.125 byte, đã đối chiếu SHA-256 khi sao chép và sau khi
di cư. Snapshot ở `archive/clb-hoi/`, inventory ở `BACKUP-MANIFEST.json`.

## Kiểm tra tự động

34/34 bài qua trên Chrome headless và Edge headless. Bao gồm:

- Công thức S04, mệt, giới hạn Q, điểm và thất bại phỏng vấn.
- Hạn đề tài, thăm dò, phân công, tự hỗ trợ, energy và hồi mệt.
- Biên tập, bài đăng/không đăng, slot trống, phạt Vân, trang bị.
- Các ngưỡng đòn, đình bản nối tiếp, độ khó, áp lực giữ lại, kết cục.
- Save/load, save khác phiên bản và lỗi storage.
- Tám chiến thuật chạy xác định; so sánh dùng lịch gia nhập đã chỉnh.
- UI thật: phân công, phỏng vấn, thanh trượt, phát hành, save/load, bấm station.
- UI sandbox: chỉnh trạng thái/lịch gia nhập, chạy tuần, so sánh,
  đổi cấu hình, preset S04 và chạy hết học kỳ.

Ảnh desktop được kiểm tra ở `archive/development/reviews/sandbox-preview.png`.
Node không có trong PATH của môi trường thực hiện; không tuyên bố đã chạy Node.

## Baseline của dữ liệu cố định

Đây là một lượt/chiến thuật bằng cấu hình mặc định, không phải % thắng và
không thay thế bảng 400 seed của Python gốc. Dữ liệu thô:
`docs/testing/baselines/sandbox-baseline.json`.

| Chiến thuật | Kết cục | Bằng chứng | Uy tín | Điểm báo TB | Đòn nặng |
|---|---|---:|---:|---:|---:|
| Cân bằng | Thắng | 233,37 | 64,46 | 64.392 | 3 |
| Dùng Vân bất chấp | Thắng đắng | 218,80 | 47,36 | 55.152 | 4 |
| Gai góc 80% | Thắng | 351,27 | 61,31 | 66.016 | 5 |
| Tham điểm 100% | Thắng đắng | 426,78 | 32,35 | 56.943 | 8 |
| Chỉ an toàn | Bại | 0 | 44,95 | 41.926 | 0 |
| Một bài/tuần | Bại | 101,35 | 19,17 | 43.365 | 0 |
| Khuê làm một mình | Bại | 111,30 | 22,51 | 43.379 | 2 |
| An toàn 5 tuần rồi bung | Bại | 169,00 | 64,43 | 60.918 | 2 |

Với fixture này, gai góc 80% vẫn thắng. Không thể kết luận chỉ chiến thuật
cân bằng mới thắng, hoặc hệ thống đã cân bằng cho người chơi thật. Sandbox
cho phép thử thêm mức gai góc riêng từng bài và lịch nhân sự trước khi viết story.
