# Hồi Âm — kế hoạch component và chuyển động UI

> Kế hoạch v1 được giữ để đối chiếu lịch sử. Yêu cầu hiện tại là replica phần UI cố định và trang trí gắn UI trong cả bốn ảnh, với asset/layer/lighting/motion đạt chuẩn cao. Background, nhân vật và world là context thay được, làm sau; scope revision 2 được ghi ở roadmap. **Kế hoạch thực thi hiện hành: [UI-REPLICA-ROADMAP.md](UI-REPLICA-ROADMAP.md), 45 work packages và 6 cổng nghiệm thu.** Những lựa chọn v1 về giản lược art, reflow mobile và dùng chung bố cục menu/hồ sơ đã được thay thế. Prototype v1 chưa đạt đích visual.

Ngày: 2026-10-09. Trạng thái: đã triển khai v1 của component nền, thoại, shell/HUD, overlay và menu/hồ sơ. Xem [review triển khai](ui-reviews/coastal-v1/README.md).

## Mốc nghệ thuật

Người dùng chọn hướng số 3 và yêu cầu dùng bộ concept làm tham chiếu cho UI có chuyển động. Bộ [coastal-editorial-v1](ui-concepts/coastal-editorial-v1/README.md) là mốc cho bốn màn: thoại, menu, HUD khám phá và hồ sơ. Giữ nguyên ảnh và prompt; lưu SHA-256 trong [references.json](ui-concepts/coastal-editorial-v1/references.json). Những lần thử tiếp theo tạo phiên bản mới, không ghi đè mốc này.

Bản sắc Hồi Âm: tòa soạn học đường ven biển, giấy sáng, xanh mực/xanh biển, vàng nắng, đường kẻ biên tập và đường cong thủy triều. Giữ nhịp bố cục, khoảng trống và thứ bậc thông tin của ảnh; điều chỉnh theo nội dung thật và thiết bị. Các chi tiết nền tranh và số liệu minh họa trong concept không phải yêu cầu thay đổi thế giới hoặc cơ chế game.

## Quyết định triển khai

- Giữ HTML/CSS, SVG, ES modules và Canvas hiện tại. Bắt đầu bằng CSS và Web Animations API; chưa cần thêm framework hay thư viện hiệu ứng.
- Dựng lại bề mặt UI bằng DOM và vector. Ảnh concept là tài liệu tham chiếu; chữ, nút và đường viền không được đóng thành ảnh nền.
- Tiếp tục dùng `t(key, params)` và `content/locales/vi.js` cho mọi chữ người chơi thấy, kể cả trạng thái rỗng, lỗi, phím tắt và nhãn trợ năng. Không dùng nhãn dịch làm ID.
- Dùng CSS custom properties cho màu, kiểu chữ, khoảng cách, lớp chồng và thông số chuyển động. Giá trị là điểm khởi đầu để chỉnh qua prototype.
- Ưu tiên pixel.html cho UI chơi thật và interaction.html cho thoại. index.html hiện là formula/debug UI; giữ lối vào đó trong đợt này. Quyết định đổi trang mặc định thành game là bước riêng.
- UI phát command qua controller và GameSession. Component không tính chi phí, phần thưởng hoặc sửa state; view model chỉ chiếu dữ liệu và quyền thao tác sẵn có.

## Những điểm cần xử lý trong code hiện tại

`src/presentation/gameplay-controller.js` đang dùng `app.replaceChildren()` trong renderPixel; Canvas host được tái sử dụng nhưng HUD, điều hướng và overlay thường bị dựng lại. Cần mount shell một lần và cập nhật từng vùng để giữ animation, focus, vị trí cuộn và trạng thái form.

`src/pixel/interaction-main.js` thay overlay ở mỗi lượt thoại. Chuyển nó sang cùng DialogueView dùng trong gameplay, giữ chân dung và vùng đọc tồn tại qua lượt thoại.

`src/ui/DialogueSprite.js` đã có registry, preload, fallback và token chống kết quả tải cũ. Tái sử dụng các khả năng này, bổ sung quản lý animation khi clear/dispose; không tạo hệ portrait thứ hai. Chân dung chỉ chuyển ảnh hoặc trượt nhẹ, chưa có asset tách lớp để chớp mắt/tóc chuyển động.

CSS hiện được chồng từ main.css, gameplay.css, press-ui.css, pixel.css và dialogue-sprites.css. Tạo lớp coastal có phạm vi rõ, thay từng cụm và loại bỏ rule cũ đã thay; tránh tiếp tục chồng override toàn cục. Không archive stylesheet hoặc asset trước khi xác minh tất cả nơi đang dùng.

## Phân lớp dự kiến

```text
content/locales/vi.js                 chữ và nhãn mới
content/ui/coastal.js                 định nghĩa navigation, text keys, icon/asset IDs
assets/ui/coastal/                    texture nhỏ, minh họa tách lớp, font có giấy phép
styles/coastal/tokens.css             màu, font, khoảng cách, z-index, motion tokens
styles/coastal/surfaces.css           giấy, sóng, đường kẻ, nút và focus
styles/coastal/screens.css            bố cục responsive của bốn màn
styles/coastal/motion.css             keyframes và reduced motion
src/ui/coastal/                       component DOM/SVG dùng lại
src/presentation/coastal/             view của màn hình và view-model adapters
src/presentation/gameplay-controller.js  kết nối command, world và view
tools/coastal-ui-preview.html/.js     gallery component và kịch bản review
```

Đây là đích dự kiến, chỉ tạo module khi milestone sử dụng nó. Tách motion helper, OverlayHost và component cụ thể; không thêm engine, event bus toàn cục hay component framework.

Hợp đồng chung của component có trạng thái: `node`, `update(viewModel)`, `dispose()`. Callback mang ID/action có cấu trúc. Vòng đời thuộc view/controller; dispose phải hủy animation, timer và listener của component. Component trang trí đơn giản có thể chỉ là hàm tạo node.

## Component và trách nhiệm

| Component dự kiến | Nội dung / đầu vào | Hành vi và phạm vi |
| --- | --- | --- |
| CoastalShell | worldHost, HUD slot, screen slot, overlay host | Mount một lần; Canvas không bị thay khi đổi tab/lượt thoại; quản lý safe area và lớp chồng |
| WaveLayer | tone, density, motion preset | SVG sóng trang trí lặp liền mạch; pointer-events none, aria-hidden; chuyển động độc lập chữ |
| PaperSurface | variant, nội dung DOM | Giấy sáng, đường kẻ và texture nhẹ; vùng đọc luôn ổn định |
| EditorialButton / ChoiceList | text key, params, ID, selected, disabled, callback | Nút thật; focus/hover/press, lý do không khả dụng; hit area không xê dịch theo hiệu ứng |
| PortraitStage | speaker ID, expression, placement | Adapter dùng DialogueSprite; crossfade, crop responsive và fallback tải lỗi |
| DateSeal / ResourceRibbon | ngày, phase, năng lượng, tiền đã định dạng | HUD cập nhật tại chỗ; phản hồi khi giá trị đổi, không restart cả HUD |
| ObjectiveNote / InteractionPrompt | mô tả, target và vị trí màn hình | Chỉ hiện dữ liệu mục tiêu thật; không che nhân vật; có phương án vị trí cố định trên màn nhỏ |
| NavigationRail / MenuView | mục có ID, selected ID, nội dung, callback | Menu có layout riêng; bàn phím/chuột/touch; giữ selected và scroll khi state cập nhật |
| DialogueView | speaker, line, choices, callbacks | Dùng chung ở interaction/gameplay; portrait, surface và choices là các lớp riêng |
| CaseDossierView / CaseStepList | case hiện có, tiến độ, cộng tác viên, command callbacks | Bố cục hồ sơ biên tập; bước lấy từ dữ liệu game, không cố định ba bước theo concept |
| OverlayHost | loại overlay, nội dung, close policy | Khóa input world, focus trap, nền inert, Esc và trả focus; overlay phản hồi có ưu tiên rõ |
| NoticeView / SceneTransition | thông báo hoặc sự kiện đổi map | Thông báo polite; chuyển cảnh chỉ khi sự kiện thật xảy ra, không kích hoạt lại khi render |

Một controller tạo view model từ session/world và truyền callback. Không truyền toàn bộ session cho mọi component. Quyền thao tác và lỗi vẫn đi qua command hiện tại; text key mới dùng namespace `ui.coastal.*` có nghĩa rõ.

## Ngôn ngữ chuyển động

Ba nhóm: chuyển động nền chậm, chuyển màn có chủ đích, phản hồi thao tác nhanh. Không làm tất cả lớp chuyển động cùng lúc. Khoảng thời gian và biên độ dưới đây là giá trị thử, chưa phải chuẩn đã đo.

| Hiệu ứng | Cách dựng / giá trị thử | Điều kiện |
| --- | --- | --- |
| Sóng nền | 2–3 dải SVG lặp; translate ngang bằng transform, lệch pha, chu kỳ 12–24 s; nhấp nhô 2–4 px ở mép trang trí | Không dịch vùng chữ; tắt loop khi giảm motion hoặc tab ẩn |
| Mở menu / hồ sơ | Sóng phủ mép 280–360 ms; giấy vào 12–20 px với opacity; tối đa 3 nhóm stagger 30–45 ms | Có thể hủy/đảo chiều khi đóng nhanh; nội dung không chờ animation để thao tác |
| Chân dung | Slide 12–18 px 220 ms khi đổi speaker; crossfade biểu cảm 160–200 ms | Giữ fallback hiện có; kết quả tải cũ không thay ảnh mới |
| Lựa chọn | Dải vàng đi vào hoặc nhấn 2–4 px trong 100–160 ms | Kích thước/hit area ổn định; focus khác selected và disabled |
| Tài nguyên | Pulse nhẹ hoặc một delta nhỏ 250–400 ms | Chỉ một lần trên thay đổi giá trị; không thêm energy cap giả từ ảnh |
| Đổi map | Dải sóng quét 320–450 ms, caption mờ vào | Không delay command hay thay đổi giờ game; chỉ gắn với đổi map |
| Ánh sáng / chiều sâu | Gradient hoặc overlay ánh nắng tĩnh trước; parallax tùy chọn 2–6 px thử sau | Bỏ trên touch/reduced motion; đo chi phí trước khi bật |

Đợt đầu dùng SVG path cố định chuyển động qua transform để tạo cảm giác sóng. Morph path, displacement filter, blur động toàn màn và particle dày chỉ thử riêng khi hiệu ứng cơ bản đã đạt hiệu năng. Không mặc định dùng shader hoặc video nền.

CSS cho loop và hover; một motion helper nhỏ dùng Web Animations API cho enter/exit/crossfade. Theo dõi Animation handles, hủy animation cũ khi thao tác mới đến, xử lý Promise bị reject do cancel và dọn tài nguyên khi dispose. Trạng thái UI mới nhất luôn thắng; hoàn tất animation không được dispatch command hay mở lại màn cũ.

`prefers-reduced-motion` áp dụng cho cả CSS và JavaScript, kể cả thay đổi tùy chọn trong lúc chơi: bỏ sóng loop/parallax/slide, hiện trực tiếp trạng thái cuối hoặc fade ngắn. Nếu thêm lựa chọn motion trong game, giữ nó ở preferences trình bày, không nhét vào gameplay save. Tab ẩn tạm dừng trang trí và trở lại không chạy bù frame.

## Asset và kiểu chữ

- Tái sử dụng portrait có trong assets/dialogue và registry hiện tại. Muốn tóc, áo, chớp mắt chuyển động cần asset từng lớp hoặc expression frame mới; không bẻ méo cả ảnh chân dung để giả chuyển động.
- Sóng, đường kẻ và icon đơn giản dựng SVG gốc; texture giấy nhỏ có thể dùng raster nhẹ. Nội dung tương tác luôn là DOM.
- Be Vietnam Pro hiện đã được lưu trong assets/fonts; dùng cho body trước. Kiểm tra đầy đủ dấu, độ đọc và trọng lượng file; chỉ thêm font tiêu đề sau khi xác nhận giấy phép và so sánh ở kích thước thực.
- Lưu manifest asset về nguồn, giấy phép, vai trò, kích thước và phiên bản khi thêm tài nguyên production. Art background mới là công việc riêng; ưu tiên UI chạy trên world hiện tại trước.

## Lộ trình và commit dự kiến

1. **Mốc tham chiếu và plan** — lưu bốn ảnh, prompt, hash và tài liệu này; link từ architecture/development. Đã hoàn thành.
2. **Nền component và gallery** — token, PaperSurface, WaveLayer, EditorialButton, motion helper; gallery đọc text/fixture từ content. Review giấy, sóng, chữ, focus và reduced motion tại 390, 768, 1366, 1920 px.
3. **Thoại có chuyển động** — DialogueView, ChoiceList và PortraitStage; tích hợp interaction.html trước. Thử lượt thoại dài, nhiều lựa chọn, tải ảnh lỗi, đổi speaker nhanh và đóng giữa animation.
4. **Shell, overlay và HUD** — mount ổn định trong pixel.html, đưa DateSeal/ResourceRibbon/Notice vào shell; giữ Canvas/world; OverlayHost quản lý input/focus. Thử mở menu khi đang đi, cập nhật resource, load save khi overlay mở và chuyển map.
5. **Menu và hồ sơ** — chuyển panel hiện tại vào MenuView/CaseDossierView; nội dung còn lại (đội, editor, reports) dùng PaperSurface trước rồi nâng dần. Giữ nguyên command, guard, chi phí và các bước hồ sơ thật.
6. **Hoàn thiện và dọn CSS** — nhịp motion, responsive, input touch, focus, overflow, contrast và đo performance; archive chỉ file được chứng minh không còn dùng, kèm inventory/hash và sửa link.

Mỗi milestone là commit review được; tách asset lớn khỏi thay đổi hành vi nếu cần. Mỗi đợt tạo screenshot/video review mới và ghi điểm khác concept. Prototype thoại là mốc xem chuyển động đầu tiên, trước khi lan style ra toàn game.

V1 dùng view trực tiếp trong `src/ui/coastal/` và controller hiện tại; chưa cần thư mục adapter riêng. Bước điều tra và command tiếp tục lấy từ panel/gameplay thật. Menu/hồ sơ đã có bề mặt giấy và bố cục mới; hồ sơ chi tiết từng trang, background tranh, portrait tách lớp và parallax vẫn là đợt art tiếp theo. CSS cũ vẫn được các lab dùng, vì vậy chưa archive.

## Tiêu chí hoàn thành

- Bốn màn chia sẻ hệ màu, giấy, đường kẻ, sóng và typography; nội dung dài vẫn đọc được ở màn nhỏ, không crop nút hoặc che chữ bằng portrait.
- Shell/Canvas/portrait giữ identity qua update phù hợp; không reset animation nền, focus hay scroll khi tài nguyên đổi.
- Bàn phím, chuột và touch thao tác được. Focus trap/restore hoạt động; Esc tuân theo overlay ưu tiên; world bị khóa khi overlay modal đang mở. Decoration không bắt click hoặc bị đọc bởi screen reader.
- Khi đóng/mở nhanh hoặc đổi nội dung giữa animation không có command chạy hai lần, màn cũ hiện lại hay listener/timer còn sót. Tôn trọng giảm motion.
- Mục tiêu 60 fps trên máy review ở 1366×768: profile world + HUD và chuyển menu, ghi thiết bị/trình duyệt, frame time và paint/layout. Đây là mục tiêu kiểm chứng, không cam kết sẵn trên mọi máy; giảm số lớp/texture khi cần.
- Không thêm chữ inline vào runtime, không thay gameplay/baseline để phục vụ UI. Lỗi ảnh/font vẫn có fallback dùng được.

Với mỗi milestone runtime: chạy architecture checker, browser suite qua server local và baseline comparison theo DEVELOPMENT.md. Thêm kiểm tra browser có ý nghĩa cho lifecycle/focus/input/command; không kiểm tra snapshot số frame animation mong manh. Screenshot/video và profiling bổ sung review thị giác, không thay kiểm tra hành vi.

## Cơ sở kỹ thuật

Ưu tiên transform/opacity và đo repaint thay vì giả định mọi animation đều rẻ: [web.dev — animation performance guide](https://web.dev/articles/animations-guide). Điều phối/cancel animation qua [MDN — Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API) và [Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel). Giảm chuyển động theo [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).
