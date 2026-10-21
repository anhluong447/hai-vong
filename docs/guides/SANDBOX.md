# CLB Báo Chí — map debug và sandbox

Đây là bản thử bộ luật quản lý, chưa có câu chuyện chính thức. Nhân sự,
đề tài và lịch gia nhập đều là dữ liệu cân bằng tạm. Chạy qua HTTP.

## Chạy

```powershell
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

- `http://localhost:8080/`: map debug tòa soạn.
- `http://localhost:8080/sandbox.html`: map và bàn thử cơ chế.
- `http://localhost:8080/tests/`: test công thức, vòng chơi, save/load và UI thật.

Không cần dependency, font mạng hoặc build. Map được vẽ bằng Canvas.

Server dev gửi `Cache-Control: no-store`; entry point và các module có mã phiên
bản để không tái dùng file CLB Hỏi cũ. Nếu tab đã mở trước khi di cư vẫn hiện lỗi
`/content/manifest.json`, mở `http://localhost:8080/?v=press-sandbox-2`
hoặc nhấn Ctrl+Shift+R một lần.

## Thao tác

Đi bằng WASD/mũi tên, đến gần bàn và nhấn E. Có thể bấm trực tiếp vào bàn,
bấm nút bên dưới map hoặc chọn tab bên phải; cả ba mở cùng hệ thống.

1. **Đề tài:** xem sơ miễn phí, thăm dò tốn 1 energy. Chỉ đề tài đã xuất hiện
   và chưa hết hạn mới dùng được. Hạn ngày +4 bao gồm cả ngày cuối.
2. **Đội:** chọn đề tài, phóng viên và hỗ trợ rồi chốt. Không giao trùng người,
   người chưa gia nhập hoặc người đã làm hôm nay. Khuê tự hỗ trợ khi
   không còn người khác khả dụng, sở trường hỗ trợ được nhân 0,5.
3. **Biên tập:** chỉnh gai góc từng bài, tick bài đăng hoặc kéo bài vào vùng
   số báo. Chọn tối đa bốn bài thành công; slot tự xếp theo điểm giảm dần.
4. **Chuyển ngày:** reset energy, hồi mệt. Ngày thứ năm, nút đổi thành
   **Phát hành & sang tuần**, chốt báo cùng phản ứng của Huy.
5. **Báo cáo:** mở mỗi số báo để xem phép tính điểm, Uy tín, áp lực, bằng chứng.

Có thể phỏng vấn hơn bốn bài/tuần nếu đủ người và energy. Bài chưa đăng
được bỏ khi sang tuần mới, không có kho bài tồn qua tuần trong bản thử này.

## Sandbox

- Chỉnh Uy tín, Uy tín cao nhất, áp lực, bằng chứng, energy, độ khó,
  chuỗi Uy tín 0 và cờ đình bản.
- Chỉnh mệt và tuần gia nhập của sáu nhân sự thử.
- Sửa tham số công thức qua JSON; áp dụng tạo lượt mới. Lịch 12 × 5 ngày
  và bốn slot được cố định để không lệch fixture.
- **Ví dụ S04:** tạo lượt ngày 2 bằng tham số gốc, Nhi gia nhập sớm,
  trang bị 1, chọn Khuê + Nhi. Chốt sẽ tạo Q=1,08, điểm=69.120,
  áp lực=18, bằng chứng=12,96 ở gai góc 50%.
- Tự chơi một ngày, hết tuần hoặc hết học kỳ thông qua các hành động của game.
- So sánh tám chiến thuật từ ngày 1 với cùng dữ liệu, cấu hình và lịch
  gia nhập hiện tại. Không dùng mệt, energy, bằng chứng hay áp lực của phiên
  đang chơi làm trạng thái khởi đầu. Riêng Khuê đơn độc chỉ có Khuê trong đội.
  Đây là một lượt xác định/chiến thuật, không phải xác suất thắng.
- Lưu/Tải state đầy đủ bằng `clb-bao-chi.sandbox.v1`; vị trí map lưu riêng.
  Không đọc hoặc ghi save `clbhoi.*` của game cũ.
- Xuất JSON tải state, journal, báo cáo và vị trí map. Chưa có nhập JSON ngoài.

## Kiểm thử

```powershell
# Server phải đang chạy; Edge headless:
powershell -ExecutionPolicy Bypass -File tools/test_unit_tests.ps1
# Hoặc Python + Chrome:
python tools/run_browser_tests.py
# Khi có Node (core tests):
npm test
```

Test browser kiểm tra cả core và thao tác thật qua iframe. Báo cáo ghi ở
`tools/test_results.log` và `tools/test_browser.log`.

Không áp dụng trực tiếp bảng thắng 95% trong Draft cho sandbox: dữ liệu cố
định và một số luật đã được chuẩn hóa khác Python gốc. Đọc `docs/design/gameplay/RULES.md`
trước khi đối chiếu. Chỉ số nhân sự ở `src/core/fixtures.js` là dữ liệu tạm.

Kết quả lần kiểm tra đầu và baseline tám chiến thuật nằm trong `docs/testing/reports/VALIDATION.md`.
