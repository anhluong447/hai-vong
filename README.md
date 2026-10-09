# CLB Báo Chí

Map debug và sandbox cho game quản lý CLB báo chí trường Tĩnh Tâm.
Giai đoạn hiện tại: thử cơ chế trước khi viết câu chuyện thật.

## Chạy

```powershell
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

- Map debug: <http://localhost:8080/>
- Sandbox: <http://localhost:8080/sandbox.html>
- Sandbox vòng chơi theo bible mới: <http://localhost:8080/gameplay.html>
- Map test 2D pixel: <http://localhost:8080/pixel.html>
- Coastal UI có chuyển động: <http://localhost:8080/tools/coastal-ui-preview.html>
- Replica Stage 1 — art layers và contact sheets: <http://127.0.0.1:8080/tools/coastal-replica-preview.html>
- Thoại 9 nhân vật với component coastal: <http://localhost:8080/interaction.html>
- Tests: <http://localhost:8080/tests/>

HTML/CSS/JavaScript thuần và Canvas, không cần build hoặc cài dependency.
Di chuyển WASD/mũi tên, E tương tác; cũng có thể bấm vào bàn hoặc tab.

## Đã có

- 12 tuần × 5 ngày; energy, nhân sự, mệt, đề tài, thăm dò, phỏng vấn.
- Năng lực nhóm, Q, trang bị, gai góc, bốn slot báo và phạt Vân.
- Uy tín, áp lực, bằng chứng, đòn Huy, đình bản và kết cục.
- Save/load riêng, xuất JSON, nhật ký và báo cáo phép tính.
- Sandbox chỉnh tham số/trạng thái/lịch gia nhập, preset S04, tự chơi và so sánh tám chiến thuật.

Sandbox công thức dùng 96 đề tài thử. Bản vòng chơi mới có lịch đủ 7 ngày,
hồ sơ nhiều ngày, feedback trước khi ngủ, đồng đội nghỉ cuối tuần, quest Khuê,
đội soạn, hangout/romance, tiền, công cụ và suất nâng cấp ở mức mock.
Xem [hướng dẫn và giới hạn](docs/GAMEPLAY-SANDBOX.md). Map truyện thật chưa triển khai.

## Tài liệu

- [Bible đề xuất journalism + dating sim](docs/BIBLE-CLB-BAO-CHI-PROPOSAL.md)
- [Bible đang dùng](docs/game_story_bible.md)
- [Sandbox vòng chơi](docs/GAMEPLAY-SANDBOX.md)
- [Map test pixel và điều khiển](docs/PIXEL-MAP.md)
- [Kế hoạch triển khai map pixel](docs/PIXEL-MAP-PLAN.md)
- [Hướng dẫn sandbox](docs/SANDBOX.md)
- [Bộ luật và quyết định chuẩn hóa](docs/RULES.md)
- [Kiến trúc](docs/ARCHITECTURE.md)
- [Component và chuyển động coastal](docs/UI-COMPONENTS-PLAN.md), [review bản chạy v1](docs/ui-reviews/coastal-v1/README.md)
- [Roadmap replica visual — 45 bước, chuẩn asset/lighting/motion](docs/UI-REPLICA-ROADMAP.md)
- [Stage 0 đã triển khai — layout sheets, asset inventory, native capture và overlay/diff](docs/ui-specs/coastal-replica/README.md)
- [Stage 1 — pipeline art/font, mẫu 7 lớp và review sai lệch](docs/ui-reviews/coastal-replica-stage1/README.md)
- [Quy trình phát triển và quy tắc nội dung](docs/DEVELOPMENT.md)
- [Nội dung, văn bản và balance](content/README.md)
- [Kết quả kiểm chứng và baseline](docs/VALIDATION.md)
- [Playtest cơ chế qua UI và các chiến thuật bổ sung](docs/PLAYTEST-2026-10-05.md)
- [Thiết kế v2 gốc](docs/v0.1/Draft.md), [mô phỏng Python gốc](docs/v0.1/sym.py)
- [Backup CLB Hỏi](archive/README.md)

## Kiểm thử

```powershell
# Server phải đang chạy:
powershell -ExecutionPolicy Bypass -File tools/test_unit_tests.ps1
# Hoặc Python + Chrome:
python tools/run_browser_tests.py
# Khi có Node (core tests):
npm test
# Kiểm tra ranh giới kiến trúc và text:
python tools/check_architecture.py
# Sau browser tests, đối chiếu hai baseline đã lưu:
python tools/check_baselines.py
```

Dự án CLB Hỏi cũ nằm trong `archive/clb-hoi/`, có manifest SHA-256 đã kiểm tra
trước khi dọn bản đang chạy. Save cũ không bị đọc hoặc ghi đè.

Refactor 2026-10-09 tách gameplay domain, session, panels, saves và content.
Văn bản hiển thị nằm trong `content/locales/vi.js`; không thêm prose trực tiếp
vào runtime. Ảnh review lịch sử và script di cư đã hoàn tất nằm trong
[`archive/development/`](archive/development/README.md).
