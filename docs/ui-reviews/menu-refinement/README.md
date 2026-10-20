# Menu Coastal — đồng bộ sáu tab và điều khiển bàn phím

Ngày 2026-10-20. Áp dụng mặc định trong `pixel.html`; Esc mở Hồ sơ, M mở Bản đồ.
Preview từng tab: `tools/coastal-menu-v2-preview.html?tab=skills` (hoặc cases,
equipment, team, map, settings).

[Thiết kế đã duyệt](../../superpowers/specs/2026-10-20-menu-refinement-design.md)
và [kế hoạch triển khai](../../superpowers/plans/2026-10-20-menu-refinement.md).

## Kết quả giao diện

- Dùng chung scene, bàn/hoa, sóng vẽ, giấy kem, màu mực, nét cọ và typography
  của Hồ sơ. Mỗi tab giữ bố cục riêng theo concept v2.
- Ngày, năng lượng và tiền nằm trong ba hàng rõ ràng của sidebar. Tiền nằm
  dưới năng lượng, dùng chữ số cùng độ rộng, không xuống dòng, nằm trên sóng.
  Test dùng số dư 123.456.789 để kiểm tra chiều rộng.
- Kỹ năng có ribbon từng nhánh, node tròn, trạng thái khóa/đã học/đang chọn,
  đường nối và thẻ giấy chi tiết. Cây giữ đủ 30 node; tự cuộn theo focus và
  ẩn scrollbar. Nút học được nâng lên trên vùng sóng.
- Trang bị có sáu slot bố trí hai cột và bảy minh họa SVG nguồn: mũ, áo, đồng
  hồ, giày, sổ, máy ghi âm, máy ảnh. Slot trống dùng hình mờ; item đang chọn có
  preview, bonus và so sánh stat. Bộ chọn có focus ổn định và đường quay lại.
- Đồng đội có dải chân dung, khung chọn vàng, chân dung lớn và hồ sơ giấy:
  tên/biệt danh, bond, nhiệm vụ, kỹ năng và tiểu sử. Dữ liệu đến từ session;
  chân dung dùng registry đã có. Nội dung tiểu sử hiện tại vẫn theo content pack.
- Địa danh trên bản đồ dùng nền kem đặc, đổi sang vàng khi hover/focus/chọn.
  Thanh di chuyển và chú giải nằm trên lớp trang trí, đọc được đầy đủ.
- Cài đặt có ba nhóm kèm icon, bảng giấy, postmark, các hàng thiết lập và
  reduced motion. Những thiết lập đang phát triển giữ trạng thái disabled.

## Bàn phím

| Phạm vi | Điều khiển |
|---|---|
| Chung | Tab/Shift+Tab đổi vùng; mũi tên chọn trong vùng; Enter thao tác; Esc quay lại/đóng |
| Sidebar | Lên/xuống chuyển tab |
| Kỹ năng | Trái/phải đổi nhánh, lên/xuống đổi bậc, Home/End đến bậc đầu/cuối; Enter vào nút học rồi Enter học; Esc về node |
| Trang bị | Mũi tên chọn slot theo vị trí; Enter mở bộ chọn; mũi tên chọn item; Enter trang bị; End đến thao tác tháo; Esc về slot |
| Đồng đội | Lên/xuống chọn người; Tab vào vùng hồ sơ |
| Bản đồ | WASD/mũi tên chọn địa danh; Enter di chuyển; xác nhận về trọ giữ luồng hiện có |
| Cài đặt | Lên/xuống chọn nhóm; Tab vào thao tác của nhóm; hủy xác nhận trả focus về nút nguồn |

## Ảnh đối chiếu native

Các bản `native-v1` và `native-v2` giữ lại quá trình review. `native-v3` là bộ
capture cuối ở 1672 × 941, DPR 1; mỗi PNG có metadata JSON, SHA-256, Chrome
version, trạng thái session và motion. Fixture gameplay là ngày 1 buổi chiều.
Capture dùng font/ảnh đã decode và clock presentation cố định.

| Tab/trạng thái | Concept | Capture cuối |
|---|---|---|
| Hồ sơ | [01](../../ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png) | [Hồ sơ](native-v3/01-cases.png) |
| Kỹ năng | [02](../../ui-concepts/coastal-editorial-menu-prototypes-v2/02-ky-nang.png) | [Kỹ năng](native-v3/02-skills.png) |
| Trang bị | [03](../../ui-concepts/coastal-editorial-menu-prototypes-v2/03-trang-bi.png) | [Trang bị](native-v3/03-equipment.png) |
| Đồng đội | [04](../../ui-concepts/coastal-editorial-menu-prototypes-v2/04-dong-doi.png) | [Đồng đội](native-v3/04-team.png) |
| Bản đồ | [05](../../ui-concepts/coastal-editorial-menu-prototypes-v2/05-ban-do.png) | [Bản đồ/hover](native-v3/05-map.png) |
| Cài đặt | [06](../../ui-concepts/coastal-editorial-menu-prototypes-v2/06-cai-dat.png) | [Cài đặt](native-v3/06-settings.png) |
| Bộ chọn item | Bố cục phụ cùng hệ giấy | [Bộ chọn](native-v3/07-picker.png) |

Ảnh/JSON sinh ra giữ local theo chính sách Git; code, SVG nguồn, công cụ,
thiết kế/kế hoạch và README review được giữ để tái tạo. Concept gốc không đổi.

## Kiểm chứng

Server: `python tools/serve.py --port 8096`. Các lượt Chrome chạy lần lượt.

```powershell
python tools/check_architecture.py
python tools/check_menu_v2_assets.py
python tools/check_dossier_assets.py
python tools/run_browser_tests.py --profile-root tmp/browser-tests --url http://127.0.0.1:8096/tests/index.html --real-time --timeout 240
python tools/check_baselines.py
python tools/run_browser_tests.py --profile-root tmp/browser-tests --url http://127.0.0.1:8096/tests/menu-refinement.html --real-time --timeout 90 --output-prefix playtest --reduced-motion --width 1672 --height 1080
python tools/review_menu_refinement.py --base-url http://127.0.0.1:8096 --output docs/ui-reviews/menu-refinement/native-v3
python tools/review_menu_v2.py --base-url http://127.0.0.1:8096 --skip-captures
```

Windows sandbox chặn IPC của Chrome trong lượt đầu; các lượt kiểm chứng thực tế
sau đó chạy với quyền cho phép Chrome. Tham số `--profile-root` tránh lỗi quyền
thư mục Temp; runner chờ đọc được DevToolsActivePort và đóng Browser sạch.
Harness báo tên test đang chạy để tránh một màn hình chờ không có chẩn đoán.

Trước triển khai, 88/88 test hiện có đạt trong lượt chẩn đoán. Năm test mới
ban đầu thất bại đúng các hành vi thiếu; sau triển khai đạt 5/5. Review độc lập
phát hiện preview item cũ còn sót sau đổi slot/tab; regression tái hiện thất bại,
sau sửa đạt 7/7 cùng kiểm tra zero points, item đã dùng, team rỗng/chữ dài.
Reviewer kiểm tra lại và không còn finding Critical/Important.

Lượt main cuối sau hai test bổ sung đạt **95/95**; 8 formula policy + 4 gameplay
policy khớp baseline, không regenerate. Reduced motion đạt **7/7** trong lượt
runner cuối ở cửa sổ 1672 × 1080; lượt CDP diagnostic riêng cũng đạt 7/7. Hai
lượt reduced trước đó có một preview timeout ở các test khác nhau, trước
assertion; giữ đây là ghi nhận độ ổn định môi trường tải iframe, không tính các
lượt đó là pass. Không có thay đổi runtime để bỏ qua assertion.

Architecture đạt **0 lỗi**, 1134 text entries; hai asset checker đạt; SVG nguồn
có đủ bảy symbol; Python tools compile và `git diff --check` đạt. Node không có
trên máy, không chạy Node suite. Browser suite là kiểm chứng execution ở đây.

Phím thật qua Chrome CDP trong `pixel.html` đã học `investigation-1`, trừ đúng
1 điểm, Esc về cây, trang bị mũ và trả focus về slot. Evidence ở
`native-v3/runtime-keyboard.json`. Hover thực bằng pointer CDP cho nền
`rgb(249, 193, 85)`, opacity 1 tại Thư viện.

Lifecycle review đạt: UI đứng yên trong bốn thời điểm motion, contour đổi,
100 lần mở/chuyển/ẩn vẫn một root, pause khi ẩn và reduced motion hoạt động.
Software renderer ghi frame mean 53.32 ms/p95 83.30 ms; JS paint mean 0.30 ms.
Đây là chẩn đoán headless, chưa chứng nhận 60 fps trên GPU/thiết bị mục tiêu.

## Phạm vi nghiệm thu

Luật, balance, schema save và baseline không đổi. Nghiệm thu visual với người
dùng và profile thiết bị thật vẫn là bước tiếp theo. Hình nhân vật/nền tiếp tục
dùng art sẵn có theo scope dự án; nội dung minh họa trong concept không thay
thế dữ liệu gameplay thật. Logo dùng placeholder đã ghi nhận từ đợt Hồ sơ.
