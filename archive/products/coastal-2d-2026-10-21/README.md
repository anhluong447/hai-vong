# Bản lưu sản phẩm 2D trước hướng 3D — 2026-10-21

Snapshot đầy đủ phần sản phẩm đang hoạt động tại revision
`a52c58a5b7d4d097d265856c0b4c06c49d07d476`, kèm thay đổi working tree được
ghi trong [INVENTORY.json](INVENTORY.json). Đây là copy giữ nguyên đường dẫn
tương đối và byte; không lấy bản backup làm nguồn import của runtime mới.

**1.583 file, 1.076.338.104 byte** đã được đối chiếu SHA-256 với nguồn khi
copy và bằng lượt kiểm tra độc lập `--compare-live` ngay sau khi copy.

| Nhóm | Số file | Số byte |
| --- | ---: | ---: |
| Asset ảnh, font, audio và generation inputs | 554 | 542.966.998 |
| Docs, concept và review | 568 | 421.034.350 |
| Draft sản phẩm | 106 | 104.588.484 |
| Source/content/styles/tests/tools và file root | 355 | 7.748.272 |

Giữ cả game 2D, menu sáu tab, HUD/thoại, World/Tileset Editor, các map, sprite,
baseline và công cụ. Asset bị Git ignore vẫn có trong payload trên máy.
Browser profiles/cache, credentials, bytecode, log và thư mục tạm/build không
nằm trong snapshot. Các archive lịch sử vẫn giữ riêng ở vị trí cũ; không copy
lồng lại và không sửa `archive/clb-hoi/`.

## Kiểm tra và mở bản cũ

Từ repo root:

```powershell
python archive/products/coastal-2d-2026-10-21/verify_snapshot.py
python archive/products/coastal-2d-2026-10-21/files/tools/serve.py --port 8098
```

Đã chạy browser suite từ root snapshot: **168/168 passed**; hai baseline
gameplay/sandbox khớp đủ **4 + 8 policies**.

Server thứ hai dùng chính `files/` làm root:

- Game: http://127.0.0.1:8098/pixel.html
- Menu: http://127.0.0.1:8098/tools/coastal-menu-v2-preview.html?edit=1
- World/Tileset: http://127.0.0.1:8098/tools/world-editor.html
- HUD/thoại: http://127.0.0.1:8098/tools/ui-layout-editor.html

Đây là server tĩnh; không bật API ghi source trong snapshot. Dùng cổng riêng
để tránh chia sẻ localStorage với bản đang phát triển. Save người chơi đang
nằm trong trình duyệt không được backup bởi thao tác copy repository này;
dùng chức năng export save nếu cần lưu riêng tiến trình.

`--compare-live` có thể báo khác sau khi phát triển tiếp; đó không phải lý do
ghi đè payload để cập nhật hash. Lượt verify mặc định chỉ đối chiếu snapshot
với inventory, kiểm tra cả file thiếu/thừa và tổng byte.

## Khôi phục

Copy **toàn bộ folder này**, gồm `files/`, sang máy/ổ lưu khác nếu cần backup
độc lập với ổ làm việc. Git chỉ giữ README, inventory và verifier; payload
được ignore để không đưa hơn 1 GB bản sao và asset nhị phân vào lịch sử.

Để tiếp tục phát triển bản 2D, tạo thư mục làm việc riêng, copy nội dung
`files/` vào đó và chạy server từ bản copy. Không chép đè working tree 3D.
Các tài liệu lịch sử tham chiếu archive khác cần kho archive gốc để đọc đủ.

Kết quả chạy thử bản lưu được ghi tại
[báo cáo backup](../../../docs/ui-reviews/full-3d-backup/README.md).
