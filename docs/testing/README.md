# Kiểm chứng và baseline

## Baseline đang dùng

- [sandbox-baseline.json](baselines/sandbox-baseline.json): tám policy công thức.
- [gameplay-baseline.json](baselines/gameplay-baseline.json): bốn policy gameplay.

Các file này là đầu vào của `tools/check_baselines.py`. Khi chuyển thư mục,
bytes và SHA-256 của chúng được giữ nguyên. Không sinh lại baseline chỉ để
làm một đợt refactor pass.

Từ thư mục gốc dự án, chạy server tĩnh và bộ browser, rồi mới so baseline:

```powershell
python tools/serve.py --port 8096
# Trong terminal khác:
python tools/check_architecture.py
python tools/run_browser_tests.py --url http://127.0.0.1:8096/tests/index.html --real-time --timeout 240 --profile-root tmp/browser-tests
python tools/check_baselines.py
```

## Báo cáo

- [Playtest sandbox 2026-10-05](reports/PLAYTEST-2026-10-05.md) và
  [dữ liệu](reports/playtest-2026-10-05.json).
- [Playtest năm route](reports/GAMEPLAY-ROUTE-PLAYTEST-2026-10-05.md) và
  [dữ liệu](reports/gameplay-route-playtest-2026-10-05.json).
- [Kiểm chứng sandbox lịch sử](reports/VALIDATION.md).
- [Audit tỷ lệ sprite Khuê](reports/PIXEL-PROPORTION-AUDIT.md).
- [World-map foundation](../ui-reviews/world-map-foundation/README.md),
  [data authoring](../ui-reviews/data-authoring/README.md),
  [menu refinement](../ui-reviews/menu-refinement/README.md).

Số test và kết quả trong báo cáo là số đo tại thời điểm ghi nhận, không phải
trạng thái test hiện tại. Baseline mock không chứng minh balance hoặc kết cục
truyện đã đạt yêu cầu sản phẩm.

[Mục lục tài liệu](../README.md).
