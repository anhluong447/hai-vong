# Backup 2D và chuẩn bị chuyển 3D — 2026-10-21

Cập nhật sau M0: người dùng đã duyệt web/Three.js và triển khai trực tiếp.
[M1 đã có bản chạy và báo cáo riêng](../world3d-foundation/README.md).
Các mô tả chưa triển khai dưới đây ghi lại trạng thái tại bước backup/plan.

Phạm vi hiện tại: tạo snapshot sản phẩm cũ, kiểm tra phục hồi và viết thiết kế/
kế hoạch. Chưa cài Three.js, tạo world 3D hoặc thay runtime trong bước này.

## Bản lưu

- [Snapshot và hướng dẫn mở bản cũ](../../../archive/products/coastal-2d-2026-10-21/README.md).
- Revision gốc: `a52c58a5b7d4d097d265856c0b4c06c49d07d476`; working tree trước copy có trong inventory.
- **1.583 file; 1.076.338.104 byte**; hash nguồn/đích đối chiếu khi copy.
- Verifier độc lập với `--compare-live`: **0 issue(s)** ngay sau backup.
- Probe verifier trên fixture riêng: nhận byte đúng, từ chối byte hỏng, file
  thừa và path thoát payload. Các probe không sửa snapshot thật.
- Bao gồm binary asset local và đầu vào tạo sản phẩm; không gồm browser cache,
  secrets, Git internals và các archive lịch sử đang được giữ riêng.
- Chạy bộ browser suite từ **chính root snapshot** tại cổng 8098:
  **168/168 passed**. Baseline khớp **8 sandbox policies và 4 gameplay policies**.
- Architecture check trên working tree hiện tại: **0 issues**. Runtime,
  content, styles, tests và công cụ live chưa thay đổi trong bước backup/plan.

Các file được tạo mới sau snapshot như thiết kế/kế hoạch 3D không được chèn
ngược vào bản lưu. Một số tài liệu live được cập nhật link sau đó; vì thế
`--compare-live` không phải phép kiểm tra để nghiệm thu phát triển về sau.

## Thiết kế và kế hoạch

- [Thiết kế full 3D](../../design/specs/2026-10-21-full-3d-foundation-design.md).
- [Kế hoạch M1](../../design/plans/2026-10-21-full-3d-foundation.md).
- Nhân vật và môi trường đều là mesh 3D, không phải HD-2D/billboard pixel.
- M1 là phòng CLB có điều khiển, collision, tương tác, pause và lỗi/lifecycle;
  các mốc art, nối gameplay, editor và chuyển map được tách tiếp theo.
- Thiết kế đề xuất giữ web/JS và một renderer Three.js local; đang chờ review
  lựa chọn nền tảng và kế hoạch trước khi thay sản phẩm.

## Tái kiểm tra bản lưu

```powershell
python archive/products/coastal-2d-2026-10-21/verify_snapshot.py
python archive/products/coastal-2d-2026-10-21/files/tools/serve.py --port 8098
# Terminal khác, chạy Chrome tuần tự:
python tools/run_browser_tests.py --url http://127.0.0.1:8098/tests/index.html --profile-root tmp/browser-tests --real-time --timeout 240
python tools/check_baselines.py
python tools/check_architecture.py
```
