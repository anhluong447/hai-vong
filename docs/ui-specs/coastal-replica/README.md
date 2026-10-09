# Coastal replica — Stage 0

2026-10-09 · **R01–R04 hoàn thành phần chuẩn bị**. Bốn màn đã có vùng đo, lớp, fixture chữ, asset backlog và quy trình capture/overlay/diff. G0 có dữ liệu để bắt đầu sản xuất; G1–G5 chưa nghiệm thu. UI game hiện tại vẫn là prototype coastal v1.

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
- [status.json](status.json): tiến độ R01–R04 và các giới hạn phải mang sang giai đoạn sau.

Ảnh gốc và prompts được giữ nguyên trong [coastal-editorial-v1](../../ui-concepts/coastal-editorial-v1/README.md). Chân dung đang có chỉ là nguồn đối chiếu danh tính. Các pose mới, plates sạch, silhouette, hidden edges và alpha cần được sản xuất ở R05 trở đi. Shared asset ID vẫn cần review biến thể hình dạng/material ở từng instance.

## Độ chính xác và phần còn thiếu

Các khung hiện là **envelope đo thủ công**: ước lượng ±4 px cho vùng chữ nhật và ±12 px cho hình hữu cơ. Đường trắng là sampled guide của mép nhìn thấy, không phải production alpha mask. Ngưỡng review 2 px trong roadmap áp dụng khi kiểm tra bản dựng sau này; dữ liệu Stage 0 chưa được chứng nhận ở ngưỡng đó.

Font trong ảnh raster không có metadata. Font size hiện là ước lượng; typeface, weight, kerning, rotation, line boxes và baseline chính xác cần R07. Chữ rất nhỏ trên hóa đơn/báo/sổ/poster được ghi `microcopy-pending`; không tự bịa hàng số hay bake chữ từ ảnh vào art. Nền, người và props bị che phải phục dựng trước motion. HUD anchors là tọa độ ảnh, chưa phải tile/navigation coordinates. Năm actor bị che chân dùng `feet:null` và visible contact anchor tạm; đây chưa phải motion pivot. Các việc này nằm trong `fixtures.unresolved`, gắn task và cổng G1/G2/G4 tương ứng.

Text key hiện chỉ là namespace dự kiến trong docs. Khi làm renderer, thêm chúng vào `content/locales/vi.js` và dùng text service; không import fixture authoring vào domain, save hoặc runtime UI. Dữ liệu thật vẫn đến từ content/session. Không cố định số bước, energy cap hoặc lịch gameplay theo concept.

## Công cụ review

Chạy server như thường lệ rồi mở [reference review](http://localhost:8080/tools/coastal-reference-review.html). Chọn màn và vùng để xem geometry, fixture và ánh sáng; bật/tắt khung; con trỏ báo tọa độ native qua transform SVG. Công cụ scale đồng đều, giữ nguyên composition.

Mở PNG capture **đúng 1672 × 941** để xem overlay 50/50 hoặc difference ×4. Không resize/crop/align tự động. Xuất được hai PNG và report JSON gồm hash nguồn/candidate, hash spec/fixture, raw MAE RGBA, số pixel đổi và kết quả theo từng vùng. Difference được khuếch đại để nhìn rõ; metrics tính trên sai lệch gốc, kể cả alpha. Vùng overlap được tính riêng, không cộng các vùng thành điểm tổng.

Browser-decode/color management/antialiasing có thể ảnh hưởng diff. MAE chỉ hỗ trợ tìm sai lệch; G2 cần review silhouette → anchors → lighting → typography → chi tiết, theo mức chặn/lớn/nhỏ trong roadmap. Upload ảnh tự nó không chứng minh đúng camera, text, fixture hay motion state.

## Capture có thể lặp lại

1. Dùng viewport **nội dung** 1672 × 941 và DPR 1; không suy ra từ kích thước cửa sổ Chrome. Khóa locale `vi-VN`, timezone `Asia/Bangkok`, clock/seed/motion trong `fixtures.capture`.
2. Chọn cùng màn, cùng text/line breaks, selection, actors, resource và camera. Tắt toolbar, scroll 0/0; reset animation về settled/static với `motionTimeMs = 0`. Chờ font và decode ảnh hoàn tất.
3. Capture ở native plane; giữ ảnh, report browser/environment, overlay, diff và danh sách sai lệch trong một thư mục review có version. Dùng tên/thư mục mới để giữ lịch sử. Không ghi đè concept hay baseline gameplay.
4. Review từng vùng chính trước, ghi cả sai khác chủ ý. Qua G2 rồi mới tiến hành motion; headless software capture không nghiệm thu GPU, lighting realtime hoặc motion quality.

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

Tiếp theo là [P1 / R05–R08](../../UI-REPLICA-ROADMAP.md): source/master/export pipeline, một mẫu giấy/mực/mép sóng, font/icon và stage có 5–7 lớp art thật.
