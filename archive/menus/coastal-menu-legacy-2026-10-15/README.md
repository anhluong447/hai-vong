# Legacy coastal menu — 2026-10-15

Bản copy màn menu trước khi chuyển sang sáu tab concept v2, từ working tree tại
commit `943c84ce82e4c2f7ea0384a304be8fc19f92b27d`. Mã đang chạy và asset gốc
được giữ tại chỗ cho đến khi màn mới hoàn thành. Không sửa `archive/clb-hoi/`.

**232 file, 61,226,013 byte** đã được đối chiếu SHA-256 với nguồn ngay khi copy.
[INVENTORY.json](INVENTORY.json) ghi đường dẫn nguồn, đường dẫn snapshot, số byte,
hash và tình trạng working tree. `files/` giữ nguyên đường dẫn tương đối và byte
của nguồn, kể cả generation inputs, font và các PNG bị Git ignore.

Bao gồm source/content/styles, asset menu và master, hoa dùng chung, font/license,
concept cũ với prompt, công cụ dựng/capture và evidence menu cũ. Source tích hợp
được giữ để phục hồi; đây không phải bản phân phối toàn bộ game (không đóng gói
mọi world/character/audio asset). Tài liệu trong `files/docs/` là bản lịch sử;
liên kết ra ngoài phạm vi snapshot cần checkout gốc để đọc đầy đủ.

Kiểm tra payload từ repo root:

```powershell
python archive/menus/coastal-menu-legacy-2026-10-15/verify_snapshot.py
```

`--compare-live` chỉ dùng khi cần so sánh với working tree; khác biệt sau khi phát
triển màn mới là bình thường. Không ghi đè snapshot để làm kiểm tra này pass.

Preview authoring cũ nằm tại
[files/tools/coastal-menu-preview.html](files/tools/coastal-menu-preview.html).
Serve repo bằng `python tools/serve.py --port 8088`, mở
`http://127.0.0.1:8088/archive/menus/coastal-menu-legacy-2026-10-15/files/tools/coastal-menu-preview.html?capture=1`.
Preview này dùng fixture authoring, không đại diện state gameplay thực.
Đã mở preview từ chính snapshot và capture native 1672×941, DPR 1:
[preview-frozen.png](preview-frozen.png), [metadata](preview-frozen.json).
Hai file evidence này được tạo sau backup, không nằm trong 232 file nguồn của inventory.
Xem [capture runtime cũ](files/docs/ui-reviews/menu-v2-gap-audit-2026-10-15/runtime-01-open.png)
và [capture authoring cũ](files/docs/ui-reviews/menu-v2-gap-audit-2026-10-15/preview-current.png).

Khôi phục vào checkout riêng tại base commit, kiểm tra inventory rồi copy các file
cần phục hồi theo `source`. Không tự động chép đè working tree hiện tại.
PNG/font vốn bị `.gitignore` bỏ qua vẫn có trong backup trên máy; muốn chuyển
backup sang máy khác phải chuyển cả thư mục, không chỉ các file Git theo dõi.
