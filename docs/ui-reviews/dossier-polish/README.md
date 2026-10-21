# Hồ sơ — nâng giao diện theo concept

Ngày 2026-10-15. Bản chạy dùng HTML/CSS/SVG trên mặt phẳng 1672 × 941 hiện có.
Giữ sidebar, danh sách ở giữa, hồ sơ bên phải và hướng dẫn phím dưới phải.
Tiền nằm **dưới năng lượng trong sidebar**, đúng lựa chọn đã xác nhận của người dùng.

Không có file đính kèm tên `concept.png`/`prototype.png` ngoài bản kế hoạch dạng
text. Ảnh đích được chọn từ [concept Hồ sơ v2](../../ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png);
ảnh trước sửa là [capture mới từ bản đang chạy](stage-00-before.png).
Ngày/buổi/năng lượng, nội dung và tiến độ khi chơi vẫn đến từ state của game.
Các tên nhiệm vụ trong concept chỉ dùng ở authoring/test fixture, không đưa vào
session thật. Lần sửa này không đổi luật gameplay, save schema hay baseline.

## Đối chiếu ở độ phân giải gốc

Hai ảnh dưới dùng cùng ví dụ “Sân bóng bị khóa” để dễ xem cách dàn trang. Ảnh phải
là **fixture thử bố cục**, không phải trạng thái quest thực tế của game.

| Concept tham chiếu | Bản triển khai với fixture |
|---|---|
| ![Concept](../../ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png) | ![Bản mới](final-concept-fixture.png) |

State thật trong preview: [Main](final-runtime.png), [Side rỗng](final-side.png),
[General](final-general.png). Chạy `pixel.html`, nhấn Esc để mở menu vào Hồ sơ.
Preview riêng: `tools/coastal-menu-v2-preview.html?tab=cases`.

## Ảnh trước/sau bảy giai đoạn

Các bước dùng cùng state thật ngày 1 buổi chiều, Main đang mở. Mỗi bước đã chụp
và xem trước khi chuyển sang bước sau. Bước 7 bên dưới trỏ đến kết quả sau các
chỉnh cuối về luồng chữ quanh ảnh, chừa chỗ gợi ý và placeholder logo; capture
đầu tiên của bước 7 vẫn được giữ ở [stage-07-final.png](stage-07-final.png).

| Giai đoạn | Trước | Sau |
|---|---|---|
| 1. Nền sáng, bàn và hoa trong cảnh | ![Trước 1](stage-00-before.png) | ![Sau 1](stage-01-background.png) |
| 2. Giấy, ảnh và tiêu đề | ![Trước 2](stage-01-background.png) | ![Sau 2](stage-02-paper.png) |
| 3. Tape, checkbox, gợi ý | ![Trước 3](stage-02-paper.png) | ![Sau 3](stage-03-labels.png) |
| 4. Thẻ nhiệm vụ và icon | ![Trước 4](stage-03-labels.png) | ![Sau 4](stage-04-dossier.png) |
| 5. Sidebar, tài nguyên | ![Trước 5](stage-04-dossier.png) | ![Sau 5](stage-05-sidebar.png) |
| 6. Sóng vẽ, cảnh cảng | ![Trước 6](stage-05-sidebar.png) | ![Sau 6](stage-06-waves.png) |
| 7. Chữ, hướng dẫn phím, debug và hoàn thiện | ![Trước 7](stage-06-waves.png) | ![Sau 7](final-runtime.png) |

Thêm [danh sách General ở giai đoạn 4](stage-04-list.png) để xem đủ hai trạng thái
thẻ. Mỗi PNG có JSON liền kề ghi viewport, Chrome version, trạng thái, thời điểm
motion cố định và hash. Ảnh/JSON sinh ra được ignore; README, source và công cụ
giữ trong Git. Không thay ảnh concept gốc hay snapshot menu cũ.

## Đã thay đổi

- Nền xa trường học, lá trên phải và đồ bàn/hoa dưới trái tách lớp. Bỏ lớp phủ đục
  ở giữa/phải, giữ tối dần phía sidebar. Lá, hạt sáng và ánh sáng dùng clock cũ.
- Giấy kem có texture, hai lớp giấy xoay sau, bóng mềm, tiêu đề đậm và gạch vàng.
  Ảnh tùy chọn theo ID quest; không ảnh thì tiêu đề/mô tả dùng toàn chiều ngang.
- Nhãn dùng chung kiểu tape xám hoặc brush vàng. Lịch sử có tick xanh/trắng;
  trường hợp rỗng là câu thường. Gợi ý có bóng đèn, wash vàng và viền trên/dưới.
- Thẻ bo góc, vàng đặc khi chọn, viền mảnh khi chưa chọn; bỏ đục lỗ. Main có `!`
  tròn; Side/General giữ quy ước đã chốt là không có `!`. Có hover/focus và cuộn.
- Đủ sáu icon sidebar dạng filled; dải chọn có đầu xé. Thứ/buổi lấy từ state,
  energy có tia chớp lớn; tiền đặt dưới và không tràn. Logo tạm được đánh dấu.
- Sóng dọc và sóng dưới dùng ảnh vẽ có texture, cảng nằm trong dải sóng. Contour
  SVG tiếp tục đổi đường cong, lớp tranh trôi nhẹ; heading/giấy đứng yên.
- Debug tải/lưu chỉ hiện khi bật `?debug`; lỗi tương tác vẫn hiển thị. Viền phím
  rõ hơn. Enter, arrows và Esc giữ luồng input; chọn quest giữ vị trí cuộn.

## Các file sửa/thêm trong lượt nâng Hồ sơ

| Nhóm | File |
|---|---|
| Theme và style | `styles/coastal.css`; `styles/coastal/dossier-theme.css`; `styles/coastal/dossier.css` |
| View/motion | `src/ui/coastal/MenuV2View.js`; `src/ui/coastal/MenuV2Effects.js` |
| Presentation | `src/presentation/coastal-menu-model.js`; `src/presentation/gameplay-controller.js` |
| Content | `content/locales/vi.js`; `content/ui/dossier-media.js`; `content/ui/dossier-fixtures.js` |
| Art nguồn | `assets/ui/dossier-polish/`: sáu PNG, `editorial-icons.svg`, `logo-stamp-placeholder.svg`, `prompts.json`, `inventory.json`, `README.md` |
| Authoring | `tools/coastal-menu-v2-preview.js`; `tools/review_dossier.py`; `tools/sample_dossier_palette.py`; `tools/check_dossier_assets.py` |
| Test | `tests/dossier-polish.test.js`; `tests/index.html` |
| Tài liệu | `docs/ui-specs/dossier-polish/palette.json`; README này; liên kết bổ sung trong `docs/engineering/ARCHITECTURE.md`, `docs/engineering/DEVELOPMENT.md` và review menu v2 |

Các thay đổi gameplay/menu v2 và archive đã có trong working tree từ lượt trước
được giữ nguyên. Không nhập dữ liệu thử concept vào domain. `photo` chỉ là metadata
trình bày trong model, nên không thêm field vào save hay cần migration.

Màu mới lấy mẫu RGB theo vùng ảnh tham chiếu, lưu ROI/phương pháp/hash ở
[palette.json](../../ui-specs/dossier-polish/palette.json). Toàn bộ giá trị tuning
mới tập trung trong `styles/coastal/dossier-theme.css`.

## Asset đã có, placeholder và điểm còn khác

| Hạng mục | Trạng thái / giới hạn |
|---|---|
| Nền trường và đồ bàn/hoa | Có asset mới tách lớp; tranh sinh mới cùng hướng mỹ thuật, không tái dựng chính xác nét/màu cảnh gốc |
| Lá trên phải | Tái sử dụng `coastal-menu-v2/foliage.png`, có alpha và chuyển động |
| Giấy, lớp giấy, rìa | Tái sử dụng texture giấy có sẵn; lớp/xoay/rìa bằng CSS. Vân lặp và rìa chưa tinh như bản vẽ gốc |
| Polaroid/kẹp | Khung/kẹp bằng CSS; hai ảnh trường học mới. Quest không có ảnh được hỗ trợ; chưa author ảnh riêng cho mọi quest |
| Tape/highlight/dải nav | Có texture cũ + mask CSS điều chỉnh theo độ dài. Chưa có 2–3 sprite vẽ tay riêng để tránh lặp nét |
| Checkbox, bóng đèn, marker, sáu icon và trang trí heading | Native SVG/CSS theo hệ icon sẵn có; hình dáng chưa trùng minh họa concept |
| Sóng dọc/sóng cảng | Có PNG mới với alpha, nhiều lớp và cảnh cảng. Lớp tranh trôi nhẹ; chưa biến dạng toàn bộ từng nét raster theo contour |
| Logo | **Placeholder:** `assets/ui/dossier-polish/logo-stamp-placeholder.svg`, 65 × 70. Cần logo chữ viết tay được duyệt, lockup khoảng 270 × 108 ở độ phân giải gốc |

Không có ảnh nền/sóng/ảnh hồ sơ còn là placeholder hình học. Logo tạm là ngoại lệ
được đặt tên rõ; không coi là logo cuối. Danh sách file/kích thước/export/prompt và
SHA-256 đầy đủ nằm trong [asset README](../../../assets/ui/dossier-polish/README.md).
Sáu PNG được tạo bằng **built-in image_gen.imagegen**; exact prompts lưu tại
[prompts.json](../../../assets/ui/dossier-polish/prompts.json), không sửa bitmap bằng script.

Các lựa chọn đã suy ra: dùng `01-ho-so.png` thay cho tên `concept.png` không được
đính kèm; giữ native 1672 × 941; cảnh sân trường theo kế hoạch thay nền cảng cũ;
chỉ Main mang `!` theo quyết định thiết kế trước. Tiền dưới energy đã được người
dùng xác nhận, không còn là giả định. Những lựa chọn còn lại cần được xem lại khi
duyệt mỹ thuật; không chặn bản triển khai chạy thử.

## Kiểm chứng và tái tạo

Với server local đang chạy ở port 8088:

```powershell
python tools/check_architecture.py
python tools/check_menu_v2_assets.py
python tools/check_dossier_assets.py
python tools/review_dossier.py
python tools/run_browser_tests.py --url http://127.0.0.1:8088/tests/index.html --real-time --timeout 240
python tools/check_baselines.py
```

Chụp và test browser lần lượt để tránh tranh tài nguyên giữa nhiều Chrome
software renderer. Capture chờ document load, fonts, image decode và kiểm tra
kích thước menu. Một lượt chạy đồng thời từng gặp timeout ở dialogue lab ngoài
phạm vi sửa; kết quả cuối được ghi sau khi chạy suite riêng.

Test mới kiểm tra metadata ảnh theo ID, fixture không đổi session, ba nhóm,
ảnh/không ảnh, chữ hai dòng, lịch sử rỗng/24 mục (có checkbox chưa hoàn thành),
danh sách 33 Main cuộn, energy 0/10 và 10/10, tiền trong sidebar, Enter/arrows/Esc,
giữ cuộn và ẩn debug. Ảnh cuối cho các tình huống:

| Tình huống | Capture |
|---|---|
| Không ảnh | [no-photo](final-no-photo-fixture.png) |
| Tiêu đề dài | [long-title](final-long-title-fixture.png) |
| Nhiều diễn biến | [many-history](final-many-history-fixture.png) |
| Không diễn biến | [empty-history](final-empty-history-fixture.png) |
| Danh sách dài | [long-list](final-long-list-fixture.png) |
| Hết energy | [0/10](final-energy-zero-fixture.png) |
| Đầy energy | [10/10](final-energy-full-fixture.png) |

Capture chứng minh bố cục ở native; không chứng nhận pixel parity, chất lượng
animation hoặc 60 fps trên GPU/thiết bị mục tiêu. Chưa chạy Node vì môi trường
không có Node; browser suite là kiểm chứng thực tế ở đây.

Kết quả cuối: **88/88 browser tests passed** khi chạy riêng; architecture 0 lỗi,
1130 text entries; cả hai inventory asset hợp lệ. Baseline được đối chiếu sau
suite đạt: 8 formula policy và 4 gameplay policy khớp, không regenerate. Kiểm tra
whitespace bằng `git diff --check` đạt. Backup cũ đối chiếu lại đủ 232 file,
61,226,013 byte và SHA-256.

`python tools/review_menu_v2.py --skip-captures` đạt: heading/giấy đứng yên trong
bốn phase, contour đổi, 100 lần chuyển/ẩn/mở vẫn một root, pause khi tháo và
reduced motion hoạt động. Evidence ở `drafts/menu-v2/motion-review.json` và các
ảnh `motion-*.png`. Chrome headless tắt GPU ghi frame mean 28.05 ms, p95 50 ms;
JS paint mean 0.35 ms, p95 0.80 ms. Đây là số đo software renderer trên máy hiện
tại, chưa đủ kết luận đạt 60 fps trên thiết bị chơi.
