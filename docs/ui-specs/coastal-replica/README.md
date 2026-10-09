# Coastal replica — Stage 0

2026-10-09 · **R01–R04 hoàn thành phần chuẩn bị**. Bốn màn đã có vùng đo, lớp, fixture chữ, asset backlog và quy trình capture/overlay/diff. [Stage 1 / R05–R08](../../ui-reviews/coastal-replica-stage1/README.md) đã bổ sung pipeline và mẫu xếp lớp; G1 chỉ áp dụng mẫu art, G2–G5 chưa nghiệm thu. UI game hiện tại vẫn là prototype coastal v1.

## Phạm vi hiện hành — UI scope revision 2

Người dùng chốt lại: replica **UI cố định và trang trí gắn UI**. Background,
nhân vật/pose, scene props/world và camera làm sau, thay được bằng art tạm.
[ui-scope.json](ui-scope.json) phân loại đủ 169 vùng thành UI/context/tùy chọn/vùng
pha trộn. Hoa, notebook và minh họa bờ kè của thanh thoại thuộc UI; không bỏ chúng
vì có hình thức như cảnh nền. Logo được lưu dùng lại, thoại hiển thị tùy chọn.

Các sheet/inventory/fixture và reference-lock giữ dữ liệu đo **full-scene lịch sử**;
mapping mới quyết định các task/gate cần làm. 104 asset ban đầu gồm context,
không phải chỉ tiêu bắt buộc cho UI. File scope chỉ phân loại vùng.
[Stage 3](../../ui-reviews/coastal-replica-stage3/README.md) đã bổ sung dialogue
UI-isolated views, local lighting và conservative interior mask/comparison.
Reference alpha đầy đủ cho mixed/occluded fringe còn thiếu. G2 UI chưa nghiệm thu.

## Bộ dữ liệu và layout sheets

| Màn | Vùng đo | Sheet / bảng lớp |
| --- | --- | --- |
| Thoại | 32 | [dialogue](layouts/dialogue.md) |
| Menu | 49 | [menu](layouts/menu.md) |
| World/HUD | 37 | [hud](layouts/hud.md) |
| Hồ sơ | 51 | [dossier](layouts/dossier.md) |

- [reference-lock.json](reference-lock.json): hash bốn PNG gốc, prompt và manifest; đích replica và trạng thái prototype. PNG được hash theo byte; JSON chuẩn hóa newline LF để không lệch do checkout Windows.
- [layouts.json](layouts.json): nguồn biên tập của **169 vùng**, x/y/w/h, z, sampled contours, anchors, crop envelopes, ánh sáng và vùng đọc cần bảo vệ. Stage **1672 × 941**, gốc trái trên, uniform fit + letterbox.
- [fixtures.json](fixtures.json): **61 nhóm chữ / 96 key dự kiến**, nội dung theo ảnh, typography ước lượng, trạng thái chọn và HUD actors tại tọa độ screen. Đây là fixture visual, không phải save hay luật gameplay.
- [asset-inventory.json](asset-inventory.json): **104 asset dự kiến / 108 instance phi văn bản**. Mỗi instance có nguồn, crop envelope, kích thước nhìn thấy, z/pivot, cách sản xuất, task phụ trách và rủi ro che khuất. Master/export chưa tồn tại; không coi bounding box là asset đã tách.
- [status.json](status.json): tiến độ và gate hiện hành theo scope UI, task context hoãn; bằng chứng cũ được giữ nguyên.

Ảnh gốc và prompts được giữ nguyên trong [coastal-editorial-v1](../../ui-concepts/coastal-editorial-v1/README.md). Chân dung/plate đã có có thể dùng làm context; pose, identity và hidden scene geometry thuộc backlog độc lập làm sau. UI decorations vẫn cần shape/alpha/mask đúng. Shared asset ID vẫn cần review biến thể hình dạng/material ở từng instance.

## Độ chính xác và phần còn thiếu

Các khung hiện là **envelope đo thủ công**: ước lượng ±4 px cho vùng chữ nhật và ±12 px cho hình hữu cơ. Đường trắng là sampled guide của mép nhìn thấy, không phải production alpha mask. Ngưỡng review 2 px trong roadmap áp dụng khi kiểm tra bản dựng sau này; dữ liệu Stage 0 chưa được chứng nhận ở ngưỡng đó.

Font trong ảnh raster không có metadata. Font size hiện là ước lượng; typeface, weight, kerning, rotation, line boxes và baseline chính xác cần R07. Chữ rất nhỏ trên hóa đơn/báo/sổ/poster được ghi `microcopy-pending`; không tự bịa hàng số hay bake chữ từ ảnh vào art. Chỉ phần UI decoration/mask bị che cần phục dựng cho motion UI; background, người và scene props không chặn motion UI. HUD anchors là tọa độ ảnh, chưa phải tile/navigation coordinates. Năm actor bị che chân dùng `feet:null` và visible contact anchor tạm; đây là dữ liệu context lịch sử, không phải motion pivot hay task bắt buộc của UI. Các việc trong `fixtures.unresolved` chỉ áp dụng G1/G2/G4 nếu thuộc UI theo ui-scope; scene lettering, actor feet và geometry world chuyển backlog làm sau.

Text key hiện chỉ là namespace dự kiến trong docs. Khi làm renderer, thêm chúng vào `content/locales/vi.js` và dùng text service; không import fixture authoring vào domain, save hoặc runtime UI. Dữ liệu thật vẫn đến từ content/session. Không cố định số bước, energy cap hoặc lịch gameplay theo concept.

## Công cụ review

Chạy server như thường lệ rồi mở [reference review](http://localhost:8080/tools/coastal-reference-review.html). Chọn màn và vùng để xem geometry, fixture và ánh sáng; bật/tắt khung; con trỏ báo tọa độ native qua transform SVG. Công cụ scale đồng đều, giữ nguyên composition.

Mở PNG capture **đúng 1672 × 941** để xem overlay 50/50 hoặc difference ×4. Không resize/crop/align tự động. Xuất được hai PNG và report JSON gồm hash nguồn/candidate, hash spec/fixture, raw MAE RGBA, số pixel đổi và kết quả theo từng vùng. Difference được khuếch đại để nhìn rõ; metrics tính trên sai lệch gốc, kể cả alpha. Vùng overlap được tính riêng, không cộng các vùng thành điểm tổng.

Browser-decode/color management/antialiasing có thể ảnh hưởng diff. MAE toàn frame chỉ là diagnostics lịch sử. G2 hiện hành review shape/anchors/light/type/detail của UI theo ui-scope; vùng pha scene cần pixel mask, không chỉ chọn bounding box. Upload ảnh tự nó không chứng minh đúng camera, text, fixture hay motion state.

## Capture có thể lặp lại

1. Dùng viewport **nội dung** 1672 × 941 và DPR 1; không suy ra từ kích thước cửa sổ Chrome. Khóa locale `vi-VN`, timezone `Asia/Bangkok`, clock/seed/motion trong `fixtures.capture`.
2. Chọn cùng màn và UI text/line breaks/selection/resources/target anchors. Đối với UI review mới, context/actors/camera được thay; ghi context variant trong report. Tắt toolbar, scroll 0/0; reset animation về settled/static với `motionTimeMs = 0`. Chờ font và decode ảnh hoàn tất.
3. Capture ở native plane; giữ ảnh, report browser/environment, overlay, diff và danh sách sai lệch trong một thư mục review có version. Dùng tên/thư mục mới để giữ lịch sử. Không ghi đè concept hay baseline gameplay.
4. Review từng vùng chính trước, ghi cả sai khác chủ ý. Qua G2 UI rồi mới tiến hành motion UI; headless software capture không nghiệm thu GPU, lighting realtime hoặc motion quality.

`tools/capture_replica.py` dùng DevTools để đặt viewport thật, chờ readiness rồi chụp đúng frame. Ví dụ kiểm chứng Stage 0:

```powershell
python tools/capture_replica.py --url 'http://127.0.0.1:8080/tools/coastal-reference-review.html?screen=dialogue&capture=layout' --screen dialogue --hook referenceReview --output docs/ui-specs/coastal-replica/verification/dialogue-layout.png
```

`capture=reference` xuất ảnh gốc qua stage, `capture=layout` thêm lớp đánh số. Cả hai được ghi rõ `reference-tooling-proof`, **không phải replica runtime**. [Ảnh đối chứng](verification/reference-plane.png) có zero pixel diff với nguồn trong browser test; [layout capture](verification/dialogue-layout.png) và report JSON cùng tên kiểm chứng viewport/DPR.

R08 triển khai `window.replicaCapture.prepare(request)` cho preview replica riêng. Capture tool đã nhận contract này: `request = {screen, capture, fixture, catalog}`; `prepare` phải nạp fixture/camera, freeze clock/seed/motion, chờ renderer/texture và trả `{ready:true, screen, clock, motionTimeMs, randomSeed}` khớp request. Tool tiếp tục chờ fonts/images và hai frame, kiểm tra viewport/DPR/scroll rồi mới ghi PNG/report. Thiếu hook hoặc state sai sẽ fail. Hook cần xác nhận readiness của Canvas/SVG textures; `document.images` chỉ kiểm tra HTML images. Production hook chưa được tích hợp ở Stage 0.

## Biên tập và kiểm chứng

Sửa `layouts.json` / `fixtures.json`, rồi regenerate các file được đánh dấu generated:

```powershell
python tools/coastal_reference_specs.py --build
python tools/coastal_reference_specs.py --check
python tools/check_architecture.py
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8080/tests/coastal-reference-tools.html
```

Builder dùng Python stdlib, kiểm tra hash, dimensions, vùng trong stage, IDs, sources, anchors, contours, text keys và generated artifacts bị stale. Browser tests chạy ở wall time qua DevTools vì virtual time có thể hết khi Canvas/crypto worker vẫn đang xử lý. **13/13** kiểm chứng self-diff của bốn màn, perturb một pixel/ROI, file sai kích thước/format, metadata, export và control capture; đây là kiểm chứng công cụ, không phải visual acceptance của game.

R08 đã có `replicaCapture.prepare` trong preview Stage 1 (`?version=1`), với tùy chọn `variant`, readiness của SVG resources và metadata font/asset/typography. Tool thêm `--compare-reference` để lưu overlay/diff native. Các capture kiểm chứng Stage 0 ở trên giữ vai trò lịch sử. [Stage 2](../../ui-reviews/coastal-replica-stage2/README.md) hiện là preview mặc định: art/clip/chữ riêng và native comparison đã có, G2 UI còn scope isolation/masks và vòng sửa UI R11–R14, rồi light/depth UI ở P3. Fixture bổ sung `dialogue-production.json` được capture tool ghi rõ trong report, không thay đổi fixture Stage 0 hoặc import vào runtime.
