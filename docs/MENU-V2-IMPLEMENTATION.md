# Menu v2 — kế hoạch triển khai

Ngày 2026-10-15. Trạng thái: **đã có bản chạy đầu tiên trong pixel.html**;
visual acceptance và profile GPU thật còn mở. Xem
[ghi nhận triển khai](ui-reviews/coastal-menu-v2/README.md).

## Quyết định thiết kế

Nguồn bố cục là [sáu concept v2](ui-concepts/coastal-editorial-menu-prototypes-v2/README.md),
với điều chỉnh mới nhất: **bỏ Khuê trang trí khỏi nền mọi tab**, dùng cảnh vật để
nhường diện tích cho nội dung. Chân dung có chức năng trong tab Đồng đội vẫn giữ.
Tab Trang bị dùng bố cục sáu slot và minh họa món đồ, không cần hero Khuê toàn thân.
Concept là chuẩn bố cục/chất liệu; số liệu, skill và chữ trong ảnh là minh họa.

Mở menu luôn vào **Hồ sơ**, không có màn tổng trung gian và không nhớ tab cũ khi
đóng rồi mở lại. Sáu tab dùng chung navigation, header, tài nguyên và key hints.
Giữ chất coastal editorial: xanh đậm/xanh nhạt, giấy ngà, nét cọ, typography,
hoa/lá, mép giấy và minh họa cảng gắn với UI. Không biến thành dashboard nhiều box.

Nền có sóng lượn, hoa/lá đung đưa, particle và ánh sáng. Hiểu “lightning” trong
yêu cầu là **lighting**: nắng, tia sáng nhẹ và phản quang mặt nước, phù hợp cảnh biển.
Chữ, bảng nội dung và hit target đứng yên để dễ đọc/chọn.

Gameplay theo [bible v2](game_story_bible_v2.md). Kế hoạch này thay thế phần menu
cũ trong [roadmap replica](UI-REPLICA-ROADMAP.md); phạm vi thoại/HUD giữ theo roadmap.

## Backup và hiện trạng

[Snapshot cũ](../archive/menus/coastal-menu-legacy-2026-10-15/README.md): 232 file,
61,226,013 byte; inventory SHA-256 đã đối chiếu với nguồn. Copy trước khi cập nhật
tài liệu; không di chuyển asset đang được runtime dùng. Có source, content, style,
font, master/generation inputs, concept gốc và evidence. Không phải full game build.

[Audit hiện tại](ui-reviews/menu-v2-gap-audit-2026-10-15/README.md) chỉ ra: menu cũ có
5 tab, hai card tổng quan, vùng nội dung hẹp và Khuê chiếm phía phải; thiếu skill
tree/trang bị. Bản đồ đang chọn phòng để xem, chưa teleport. Mở lại giữ tab trước;
energy và luồng làm báo còn theo luật cũ. Không thể giải quyết chỉ bằng thay skin.

## Bố cục sáu tab

Stage chuẩn **1672×941**, scale đồng đều/letterbox. Đo anchor theo từng PNG ở M1;
không áp một khung form hẹp cố định cho cả sáu màn. Navigation luôn cùng vị trí,
vùng nội dung được mở rộng vào phần trống sau khi bỏ hero.

| Tab | Bố cục và thông tin | Tương tác cần có |
| --- | --- | --- |
| Hồ sơ | Danh sách title bên trái vùng nội dung; tờ hồ sơ chi tiết bên phải. Nhóm Main / Side / General, main có `!`. Chi tiết: title, description, quá trình đã diễn ra, hint tiếp theo | Chọn quest; cuộn danh sách/chi tiết riêng. General mở luồng nghe ngóng → chọn người → xác nhận, hiện phí nếu có và ngày dự kiến hoàn thành; đọc feedback hằng ngày |
| Kỹ năng | Cây node chiếm phần lớn vùng nội dung; nhánh có hình dáng/kết nối rõ; panel gọn cho node được chọn | Chọn nhánh/node, pan/scroll có giới hạn, xem điều kiện/cost/tác dụng, mở khóa khi đủ điều kiện. Có trạng thái đã học/có thể học/chưa đủ điều kiện |
| Trang bị | Sáu slot: đầu, thân, tay, chân, phụ kiện 1–2; khu vực món đang chọn và chỉ số | Chọn slot → danh sách món phù hợp → so sánh thay đổi stat → trang bị/tháo. Không dùng màu đơn độc để biểu đạt tăng/giảm |
| Đồng đội | Danh sách chân dung và hồ sơ người đang chọn. Thứ tự ưu tiên: tên/biệt danh → bond → quest đang làm → kỹ năng → tiểu sử | Chọn người, xem tiến độ/feedback và liên kết tới hồ sơ được giao. Tiểu sử dài cuộn trong vùng riêng |
| Bản đồ | Bản đồ vẽ Hải Vọng làm nội dung chính; pin + tên địa điểm, ký hiệu quest/bond/arubaito; chi tiết điểm đang chọn gọn | Hover/click hoặc arrows/WASD đổi điểm; click/Enter xác nhận di chuyển. Điểm khóa không teleport; về trọ mở xác nhận chuyển buổi |
| Cài đặt | Nhóm thiết lập cơ bản, lưu và tải; bố cục giấy gọn cùng navigation | Âm thanh/resolution/graphics là placeholder có trạng thái rõ; save/load slot có xác nhận ghi đè, lỗi và kết quả. Không hiển thị control giả như thể đã có tác dụng |

Skill tree **chưa chốt số node hoặc balance**. Đề xuất để thử bố cục: sáu nhánh nghề
báo × năm node, viewport nhìn khoảng 10–15 node rồi pan/scroll. Kiểm chứng bằng
fixture ở M1, không coi 30 node là yêu cầu gameplay đã duyệt. Chữ chỉ hiện đầy đủ
cho node được chọn; thêm node không đồng nghĩa thêm cả trang mô tả lên màn.

Các màn phụ chưa có trong PNG phải thiết kế cùng hệ giấy/nét cọ: phân công General,
item picker, node detail, save/load, xác nhận về trọ, lỗi và trạng thái rỗng.
Không đưa khâu viết bài/biên tập/xuất bản thủ công trở lại menu.

## Lớp cảnh và chuyển động

Thứ tự lớp: **cảnh sạch → nắng xa → foliage nền → mảng sóng → bề mặt nội dung →
hoa/giấy viền → feedback/focus/modal**. Particle chia theo chiều sâu nhưng mask
khỏi vùng chữ/nút; modal nằm trên toàn bộ cảnh và bắt input.

| Thành phần | Cách dựng dự kiến | Điều kiện đạt |
| --- | --- | --- |
| Cảnh sạch | Tái dùng cảnh cảng phù hợp hoặc tạo clean plate không người; có đầy đủ cảnh phía sau lá được tách | Không còn bóng/viền Khuê, chữ bake hoặc khoảng trống chưa vẽ bù |
| Sóng xanh đậm/xanh nhạt | Hai đường biên hữu cơ chuyển động lệch pha bằng SVG path/mask; lớp giấy/bọt nhẹ bổ sung khi hợp concept. Texture đi cùng hình sóng | Đường cong thực sự lượn, không chỉ dịch một ảnh cứng; không hở mép, không làm méo chữ hay nav |
| Hoa/lá | Alpha riêng cho các cụm; xoay nhẹ quanh gốc/cành, pha khác nhau; nền sau khi tách được vá sạch | Không nhấp nháy seam, không thấy lá đứng yên bị nhân đôi dưới lớp động |
| Particle | Pool nhỏ cố định bụi nắng và glint, vùng phát có mask, tái sử dụng sprite | Không che hint, text hay focus; không sinh DOM vô hạn |
| Lighting | Wash nắng nhẹ, gradient/tia sáng mềm và glint mặt nước; ưu tiên lớp đã raster/cache | Không đổi độ tương phản chữ theo chu kỳ; không chớp sáng toàn màn |

Thông số khởi điểm để authoring, **chưa phải thông số đã nghiệm thu**: sóng chu kỳ
8–16 giây, biên độ 4–10 px ở native; lá 0.5–1.5° trong 6–12 giây; particle 16–24
hạt; feedback chọn tab/node 150–220 ms. Tinh chỉnh qua video realtime, không chỉ ảnh.

Tái dùng lifecycle của `MenuEffects`: một clock, pause khi đóng/ẩn trang, dispose
sạch; reduced motion giữ cảnh tĩnh và phản hồi focus tức thời. Clock chỉ hoạt động
khi menu hiển thị. Không dùng gameplay RNG cho hiệu ứng. Không chờ animation mới
thi hành command. Mask bảo vệ nội dung phải dựng lại theo sáu layout; mask bàn tay/
notebook của plate Khuê cũ không còn phù hợp.

## Các mốc thực hiện

| Mốc | Công việc / đầu ra | Điều kiện hoàn thành |
| --- | --- | --- |
| M0 — Backup | Snapshot byte-identical, inventory, verifier và hướng dẫn phục hồi | **Đã xong**: SHA-256 nguồn và bản sao khớp |
| M1 — Đặc tả layout | Đo sáu PNG; token type/spacing; layer map; vùng cuộn; input/focus; thiết kế các modal phụ; danh sách state/data/action từng tab | Sáu wireframe native và fixture dài/rỗng/khóa rõ ràng; không còn hero chiếm chỗ; biết phần nào chưa có gameplay hỗ trợ |
| M2 — Asset | Clean plate, foliage alpha, giấy/brush/icons, wave masks, lighting/particles; manifest ghi master/source/export/hash | Asset có vùng bleed đủ cho motion, alpha sạch trên nền sáng/tối; không bake chữ; giữ nguồn gen và công cụ có thể tái tạo |
| M3 — Shell | Sáu mục điều hướng, mặc định Hồ sơ mỗi lần mở; header/resources/hints; layout stage và focus routing | Mouse/keyboard hoạt động, không lọt input xuống world; cảnh có thể thay mà UI không đổi anchor |
| M4 — Sáu tab tĩnh | Hồ sơ → Đồng đội/Cài đặt → Bản đồ → Kỹ năng/Trang bị; view nhỏ có adapter state/command rõ | Đúng bố cục từng concept và quyết định bỏ hero; đầy đủ trạng thái select/empty/locked/long/error. Fixture chỉ dùng trong authoring |
| M5 — Motion | Sóng có biến dạng đường biên, foliage, particle, lighting và feedback tương tác | Clip realtime/chậm, reduced-motion và đóng/mở nhiều lần không lỗi; text/hit target đứng yên |
| M6 — Gameplay integration | Nối command/session thật, phân công/feedback, map teleport, save/load; triển khai hoặc nối mechanics còn thiếu theo bible | Không có nút hoạt động giả; chi phí/state đúng; validate/migrate save trước replace session; xử lý cancel/lỗi nhất quán |
| M7 — Review & chuyển sang màn mới | Capture sáu tab + modal, browser tests, baseline, profile và smoke runtime | UI/function/motion đạt cổng bên dưới; chỉ lúc đó thay menu đang chạy |

M2 và phần dữ liệu M6 có thể làm trong khi hoàn thiện đặc tả; M5 cần geometry/asset
đã ổn định. Ưu tiên dựng **Hồ sơ hoàn chỉnh làm mẫu** trước rồi áp shell/chất liệu
sang năm tab còn lại. Không coi sáu ảnh fixture đẹp là đã xong tích hợp game.

## Ranh giới code và dữ liệu

- `content/ui/`: định nghĩa tab, layout, motion và visual fixture authoring. Nội dung
  đọc được dùng `content/locales/vi.js` qua text service; không gắn logic theo label.
- `src/ui/coastal/`: shell, các view tab và ambient effects; chỉ render và phát ý định.
  Tách view theo nhu cầu cụ thể, không xây framework UI mới.
- `src/presentation/`: chuyển state thành dữ liệu cho view, quản lý modal/focus và
  gọi `GameSession`. Save qua service hiện có; world qua adapter.
- `src/domain/` và `content/gameplay/`: mechanics/balance; transition immutable,
  không phụ thuộc DOM/storage/network. Formula sandbox vẫn là ruleset riêng.

Các hợp đồng cần xử lý ở M6 trước khi chuyển runtime:

1. **Energy/ngày:** 10 tối đa dùng chung; ngủ đặt hôm sau 10/10, thức khuya đặt
   **5/10**, không cộng thêm vào số dư. Không nhét số 10 vào UI trong lúc domain còn
   tính 4. Chuyển buổi theo lựa chọn về trọ, không tự kết thúc chiều vì hết energy.
2. **Quest/phân công:** ba loại bằng ID ổn định; main/side do player trải nghiệm;
   general có người phụ trách, fee nếu áp dụng, ngày dự kiến và feedback hằng ngày.
   Đủ tài nguyên/thông tin thì tự chuyển sang xuất bản; cả đội tăng bond chỉ từ
   main/special event. Chi phí cụ thể cần content balance, không suy từ PNG.
3. **Map:** định nghĩa địa điểm Hải Vọng → world map/spawn hợp lệ. Bản đồ concept
   và các phòng runtime hiện tại không mặc nhiên ánh xạ 1:1. Quest/bond/job markers
   từ state thật; hover chỉ chọn, confirm mới di chuyển. Về trọ bằng bản đồ hoặc
   đi bộ cùng một flow xác nhận; cancel không đổi nơi, phase hay tiêu tài nguyên.
4. **Skills/gear:** chốt node/điều kiện/cost và sáu slot trước khi ghi save. Schema
   mới phải có validator, migration và kiểm tra save cũ. Không đổi stat/balance chỉ
   để lấp chỗ trống trên concept.

Mỗi thay đổi gameplay chủ ý cần test/evidence riêng. Baseline được giữ trong các
đợt refactor UI; chỉ cập nhật khi mechanics mới đã được ghi nhận và kiểm chứng.

## Cổng nghiệm thu

- **Layout:** capture 1672×941 cho cả sáu tab, có fixture tương ứng và UI mask phiên
  bản mới. So layout/type/icon/material/decoration; kiểm tra nền sáng/tối/nhiều chi
  tiết. Không dùng full-frame similarity để ép scene giống concept.
- **Hành vi:** mở lại về Hồ sơ, chọn/cancel/back đúng; focus nhìn rõ; WASD của map
  không điều khiển world; modal giữ focus và trả focus về trigger. Quest dài,
  không có quest/người/item, skill khóa, save hỏng đều có trạng thái đọc được.
- **Motion:** xem vòng lặp 30–60 giây ở realtime và chậm, điểm nối không pop/seam;
  reduced motion, tab trình duyệt ẩn và đóng/mở nhanh không để RAF/listener chạy sót.
  Kiểm tra nhiều vòng mở/chuyển/đóng, theo dõi bộ nhớ; không animate layout chữ.
- **Hiệu năng:** đo trên browser GPU/máy mục tiêu, mục tiêu 60 fps; ghi frame time
  và chi phí effects thực tế. Headless capture không chứng minh đạt fps. Giảm số
  hạt/độ phân giải lớp ánh sáng trước khi làm mất độ rõ của UI.
- **Regression:** `python tools/check_architecture.py`; server local +
  `python tools/run_browser_tests.py`; `python tools/check_baselines.py`.
  Thêm kiểm tra có ý nghĩa cho teleport/cancel, night energy, assignment, save
  migration và skill/gear khi các mechanics được triển khai. Ghi rõ cái gì đã chạy.

## Ghi nhận triển khai

- M0: backup đã xác minh lại, 232 file không đổi.
- M1–M4: shell/sáu bố cục và các state tương tác đã dựng; mở mặc định Hồ sơ.
  Geometry chính nằm trong `styles/coastal/menu-v2.css`, stage 1672×941.
- M2: ba PNG cảnh sạch/lá alpha/bản đồ sạch chữ đã có prompt, inventory và checker;
  hoa, giấy, brush, harbor và font dùng lại từ active art cũ.
- M5: contour wave, foliage, particle, ánh sáng, reduced motion và lifecycle đã nối.
- M6: state v3, daily 10/5, auto transfer, General/feedback/fee, skill/gear bonus,
  teleport/home confirmation và save validation/migration đã có đường chạy thật.
  Giá trị tuning chưa chốt được ghi rõ trong review; Side story/bio vẫn cần author.
- M7: native sáu tab và checks tự động đã có; G2/G3, material polish và profile GPU
  trên máy mục tiêu chưa được xem là hoàn tất. Đây là bản local để review/playtest.

Runtime mới là mặc định của `pixel.html`; `?legacy=1` giữ đường so sánh cũ.

Kiểm tra đợt lập kế hoạch: architecture checker 0 lỗi; 232 file snapshot khớp
SHA-256; preview chạy từ snapshot và capture native 1672×941 thành công; link trong
plan/archive README và scope JSON hợp lệ. Đợt triển khai bổ sung browser suite,
baseline và motion review.

Kết quả lượt cuối:

- Architecture: 0 lỗi; asset checker xác minh 3 PNG native/hash/alpha/prompt.
- Browser suite realtime: **86/86 passed**, gồm visibility signal mới và focus khi
  hủy modal, bonus skill/gear tác động chất lượng bài tự chuyển sang xuất bản.
- Formula baseline: 8/8 policy khớp; gameplay v2: 4/4 policy khớp. Không regenerate.
- Snapshot cũ: 232 file, 61,226,013 byte vẫn khớp SHA-256.
- Native sáu tab; bốn phase contour, header/paper đứng yên; 100 lần chuyển/mở/đóng,
  pause khi ẩn và reduced motion pass. `git diff --check` và link tài liệu pass.
- Headless software: 246 sample, frame trung bình 48.98 ms / p95 50.10 ms; phần
  JavaScript cập nhật hiệu ứng trung bình 0.57 ms / p95 0.80 ms. Có bỏ filter blur
  toàn SVG để giảm raster cost. Đây **chưa đạt bằng chứng 60 fps**, cần profile
  GPU thực và tiếp tục tối ưu compositor nếu thiết bị mục tiêu chậm.
- Node không có trong môi trường; không chạy Node suite.
