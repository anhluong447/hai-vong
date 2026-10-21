# CLB Báo Chí

Map debug và sandbox cho game quản lý CLB báo chí trường Tĩnh Tâm.
Giai đoạn hiện tại: thử cơ chế trước khi viết câu chuyện thật.

## Chạy

Git chỉ giữ mã nguồn và các đầu vào nhỏ. Asset nhị phân, BGM, font, plan và
ảnh review được giữ riêng trên máy; clone mới cần bổ sung gói asset trước khi
chạy giao diện và browser test. Xem [quy tắc Git và khôi phục asset](docs/engineering/REPOSITORY.md).

```powershell
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

- Map debug: <http://localhost:8080/>
- Sandbox: <http://localhost:8080/sandbox.html>
- Sandbox vòng chơi theo bible mới: <http://localhost:8080/gameplay.html>
- Map test 2D pixel: <http://localhost:8080/pixel.html>
- Coastal UI có chuyển động: <http://localhost:8080/tools/coastal-ui-preview.html>
- Replica Stage 4 — motion UI theo lớp, pause/slow/replay và reduced motion: <http://127.0.0.1:8080/tools/coastal-replica-preview.html>
- Replica Stage 3 — UI thoại tĩnh và lighting A/B: <http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=3>
- Replica Stage 2 lịch sử: <http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=2>
- Replica Stage 1 — pilot được giữ lại: <http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=1>
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
Xem [hướng dẫn và giới hạn](docs/guides/GAMEPLAY-SANDBOX.md). Map truyện thật chưa triển khai.

## Tài liệu

- [Mục lục tài liệu](docs/README.md)
- [World Editor: tileset, bốn layer, object/NPC và lưu map](docs/guides/WORLD-EDITOR-GUIDE.md)
- [Editor menu, HUD và hội thoại](docs/guides/DATA-AUTHORING.md)
- [Bible v2 và thiết kế sản phẩm](docs/design/README.md)
- [Kiến trúc](docs/engineering/ARCHITECTURE.md) và [quy trình phát triển](docs/engineering/DEVELOPMENT.md)
- [Kiểm chứng và baseline](docs/testing/README.md)
- [Git và khôi phục asset](docs/engineering/REPOSITORY.md)

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
