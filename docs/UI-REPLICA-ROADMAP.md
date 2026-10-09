# Hồi Âm — roadmap replica UI và chuyển động

Ngày: 2026-10-09 · revision 2, **phạm vi UI được người dùng chốt lại**.
Stage 0 và Stage 1 đã có dữ liệu/pipeline; Stage 2 đã có bản dựng thoại ở commit
`c21e732`. Stage 3 đã triển khai **R15/R16 light/depth UI** và evidence R17.
G2 vẫn mở: tinh chỉnh sai khác UI tĩnh trong
[review Stage 3](ui-reviews/coastal-replica-stage3/README.md) trước motion R18–R23.
G2 UI chưa được nghiệm thu; background/pose không còn là điều kiện chặn.

## Mục tiêu và ranh giới

Tái dựng **các thành phần UI cố định** trong bốn ảnh
[coastal-editorial-v1](ui-concepts/coastal-editorial-v1/README.md): hình dáng,
bố cục, crop, lớp chồng, chất giấy/mực, typography, icon, ánh sáng và chiều sâu.
Sau khi UI tĩnh đạt chuẩn, thêm animation/effect vào chính các lớp UI đó.

Background, cảnh lớp học/cảng, nhân vật và đạo cụ trong world là context thay
được. Có thể dùng art đang có, cảnh game hiện tại, màu trung tính hoặc ảnh gen
mới phù hợp; không cần khớp camera, pose, tóc/áo, bàn ghế hay nắng của concept.
Việc sản xuất scene/character/world art riêng nằm ở backlog làm sau.

**Trang trí gắn với UI vẫn thuộc replica:** hoa, notebook và minh họa bờ kè/cảng
của thanh thoại; sóng/giấy/hoa viền menu; kẹp/băng dính/ghi chú/minh họa trong
hồ sơ. Nội dung ảnh nằm trong thumbnail/evidence là slot của UI, không kéo theo
yêu cầu phục dựng toàn cảnh ngoài slot. Logo Hồi Âm được lưu làm asset/component
dùng lại; hiển thị logo trên màn thoại là tùy chọn.

Ưu tiên: shape/layout UI → art/mask/texture → type/icon → light/depth UI →
motion/feedback → gameplay integration → hiệu năng. Khung thiết kế **1672×941**,
scale đồng đều và letterbox, giữ composition UI. Không giản lược thành toolbar
web hay reflow mobile. Text từ catalog, dữ liệu và thông số visual từ content;
không đóng chữ/nút vào một bitmap hoặc cố định dữ liệu gameplay theo ảnh.

[Bản phân loại phạm vi](ui-specs/coastal-replica/ui-scope.json) ánh xạ toàn bộ
169 vùng Stage 0 thành UI, UI tùy chọn, vùng pha trộn cần mask và context.
Dữ liệu đo/asset inventory cũ được giữ như nguồn lịch sử; mapping này quyết định
backlog/gate hiện hành. 104 asset dự kiến ban đầu gồm cả context, không còn là
số lượng asset UI bắt buộc. Giữ R01–R45 để truy vết; các task đổi phạm vi được
ghi rõ, không sửa lịch sử commit/capture để giả vờ đã đạt yêu cầu mới.

## Bốn bộ UI đích

| Màn | Replica bắt buộc | Context thay được |
| --- | --- | --- |
| 01 — Thoại | Giấy thoại nhiều lớp, mép sóng/mực, hoa, notebook, minh họa bờ kè; speaker/rules/body/continue; ba choice với icon/arrow/states; card ngày góc trái. Lưu logo, hiển thị tùy chọn | Lớp học/cảng, Khuê/Vân, báo cầm tay, bàn/cốc/poster trong scene |
| 02 — Menu | Mảng xanh hữu cơ, brand/header/tagline, navigation/icon/highlight; hai card hồ sơ có thumbnail; resource strip, quote, sóng/giấy/hoa viền, key hints | Cảnh cảng/tòa soạn, Khuê và sổ đang cầm, poster tường |
| 03 — HUD | Mảng mực viền, date seal, resources, objective note/highlight/spine, interaction prompt, location và controls | World/map, room/furniture/plants, ánh nắng, actors và chữ trên vật thể world |
| 04 — Hồ sơ | Navigation, stack giấy/kẹp/ornament, heading/rules/steps; evidence frame/tape/nội dung trong slot; note, harbor print/hoa trang trí; collaborator tag/arrow, CTA nét cọ và back | Cảnh phía sau, Vân ngồi, mặt bàn/đồ vật scene |

Collaborator tag và interaction prompt phải nhận anchor/target qua adapter để
vẫn hoạt động khi context đổi. Không cần portrait đúng pose mới dựng được UI.
Mọi chữ đọc được trong component/trang trí/evidence được render từ catalog;
ảnh minh họa không chứa chữ giao diện đã bake.

## Cổng nghiệm thu áp dụng cho UI

| Cổng | Bằng chứng | Điều kiện |
| --- | --- | --- |
| G0 — Phạm vi/thiết kế | UI scope, layout/layer map, source/crop/mask plan, text keys | Mọi UI bắt buộc có ownership và cách sản xuất; ranh giới UI/context rõ |
| G1 — Asset UI | Masters/exports/hash, contact sáng/tối, alpha/native crops | Shape, palette, nét và texture UI đúng; không halo/seam, thiếu mép hoặc chữ bake |
| G2 — UI tĩnh | Native 1672×941, UI-isolated capture, overlay/diff theo mask UI, backlog từng component | Không thiếu UI bắt buộc và không còn lỗi lớn về shape/layout/crop/type/material/light UI |
| G3 — Motion UI | Video realtime/chậm, still đầu/giữa/cuối, loops và interruption | Có nhịp/trọng lượng; không seam, texture trượt, text rung, pop hay hit area dịch |
| G4 — Hành vi | Input/focus/lifecycle, command/save/load, text dài/loading/error | Callback đúng, input/modal đúng ưu tiên, state/dispose ổn định |
| G5 — Production UI | Profile browser có GPU, asset/build inventory, visual sau tối ưu | Budget đã đo, chất lượng UI giữ nguyên, baseline gameplay khớp |

G2 không xét độ giống background/nhân vật. Context chỉ cần cho thấy UI đọc được
và che lớp đúng khi đặt trên nền sáng/tối/chi tiết khác nhau. Phân loại lỗi UI:
chặn (thiếu component/sai composition), lớn (shape/crop/type/edge/light thấy rõ),
nhỏ (chi tiết cục bộ). Không qua G2 nếu còn lỗi UI chặn/lớn.

Anchor/đường biên UI lệch trên 2 px ở native phải được review; đây là ngưỡng
phát hiện, không phải chứng nhận similarity. Bounding box pha cả scene không
đủ để chấm UI: cần mask phần giấy/hoa/sổ/wave thật và loại pixel context.
MAE toàn frame cũ chỉ là lịch sử. Mask/reference extraction phải có version/hash;
ghi rõ vùng mép alpha hay chữ bị che chưa đo được, không chứng nhận bằng số giả.

## P0 — Khóa reference và phạm vi UI (R01–R04)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R01 | Giữ PNG/prompt/hash gốc; ghi yêu cầu UI replica và context linh hoạt | Reference đã có |
| R02 | Đo shape/anchors/type/layers của UI bốn màn; phân loại mọi vùng bằng ui-scope | R01 |
| R03 | Inventory source/crop/vector/reconstruction cho UI và UI decoration; context tách backlog | R02 |
| R04 | Native capture, fixture và overlay/diff; bổ sung UI isolation/mask ở R14 | R02 |

**Đã có:** 169 vùng, 96 text key dự kiến, native capture và comparison tooling.
Scope revision 2 bổ sung phân loại; Stage 3 có dialogue interior mask độc lập.
File scope không phải pixel mask; reference alpha hoàn chỉnh cho fringe vẫn mở.
Giữ nguồn Stage 0; không chạy lại toàn bộ phép đo world/actors.

## P1 — Pipeline và component nền (R05–R08)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R05 | Source/master/export/manifest cho UI; version/hash/alpha/crop/layer/text keys/provenance | R03 |
| R06 | Paper/ink/wave material và masks; contact sáng/tối, native/scale crops | R05 |
| R07 | Typography tiếng Việt, icon/marks; lưu logo mark + wordmark live text dùng lại | R02, R05 |
| R08 | Stage fixed, layer UI độc lập context, hit testing/focus/dispose và callbacks | R04, R06, R07 |

**Đã có:** pack mẫu 15 asset, ba font local OFL, bảy plane và input scale.
Tiếp tục dùng các boundary hiện tại, chưa thêm engine/framework. Art scene đã
sinh là nguồn minh họa có thể giữ lại; chất lượng pose không chặn pipeline UI.

## P2 — Replica UI thoại tĩnh (R09–R14)

| ID | Công việc / đầu ra theo phạm vi mới | Phụ thuộc |
| --- | --- | --- |
| R09 | Context background slot cho preview; dùng plate hiện có hoặc placeholder. Phục dựng newsroom 1:1 cũ được hoãn | R08; không chặn R11–R14 |
| R10 | Context portrait slot tùy chọn; tái dùng sprites/art có sẵn. Pose/identity/character art cũ được hoãn | Không chặn UI |
| R11 | Tách hoa, notebook, lá gắn thanh thoại; alpha/crop/mask/overlap đúng. Không sửa bàn/báo/cốc scene | R03, R05 |
| R12 | Paper/wave/shore ink/harbor print, speaker/rules/body/continue thành lớp riêng, chữ live | R06, R07, R11 |
| R13 | Choice strips/states/icon/arrow, date card, brand asset/component dùng lại; logo thoại tùy chọn | R07, R12 |
| R14 | Review UI isolation và mask; sửa layout/shape → type → texture/edge; capture trên context sáng/tối khác nhau | R08, R11–R13 |

**Đã có:** Stage 2 pack 19 asset/29 instance gồm cả UI và context; UI có bản dựng,
live text, input và native captures. Không tự đánh dấu G2 đạt sau đổi scope.
**Tiếp theo:** UI scope/mask → giấy/sóng/harbor/hoa/sổ → date/choices/type/marks.
Dừng vòng căn tóc/áo/tay/báo, bàn ghế/cửa sổ và scene lettering.

**Mốc P2:** G1/G2 cho UI thoại. Các sửa light/depth UI thuộc P3; một lỗi thuộc
R15/R16 có thể xử lý trong lượt đó để đóng G2, không tạo vòng chờ gate tự khóa.

## P3 — Ánh sáng và chiều sâu UI (R15–R17)

**Đã triển khai:** pack v3 UI độc lập, local shadows/washes, paper clip/notebook
alpha union, bốn nền review, lighting A/B và masked diagnostics. R17 đã có review
package; chưa tự nghiệm thu G2. Mask interior không chấm fringe bị khuất như alpha
đã trích xuất. Chữ, shapes/icon/foam và decoration cần các chỉnh sửa đã ghi trong
[review hiện hành](ui-reviews/coastal-replica-stage3/README.md).

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R15 | Light/shadow riêng giấy, choice, card, hoa/sổ: bóng tiếp xúc, độ nổi, ink density và palette | UI geometry R11–R14 ổn định |
| R16 | Compositing UI: clip/mask, edge/alpha, foreground softness, overlap/texture; sạch halo/seam/double shadow | R15 |
| R17 | Chốt UI tĩnh sau light/depth; UI-isolated + context variants, overlay/diff UI và backlog đóng | R14–R16 |

**Mốc P3:** xác nhận G2 UI. UI phải giữ chất liệu và độ đọc khi đổi background;
không dùng filter phủ cả cảnh để thay bóng/ánh sáng từng component. Nắng cửa
sổ, rim light tóc/áo và scene atmosphere không thuộc tiêu chí stage này.

## P4 — Motion và effect UI (R18–R23)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R18 | Motion sheet từng lớp UI: pivot/path/time/easing/amplitude/loop/occlusion/end state | R17 |
| R19 | Mép sóng chuyển động nhẹ, mực/texture bám hình, loop liền; chữ/vùng đọc ổn định | R18 |
| R20 | Paper/choice enter-exit, stagger, hover/select/press có trọng lượng; target input ổn định | R18, R19 |
| R21 | Hoa/lá/notebook trang trí UI: sway/parallax/lift tinh tế, pivot/edge/overlap đúng. Character blink/breath/hair chuyển backlog | R11, R18 |
| R22 | UI sheen/ink reveal/highlight/focus/transition từng effect; kiểm tra độ đọc và reduced motion | R15, R18–R21 |
| R23 | Review realtime/chậm, loop dài, thao tác nhanh, đổi nội dung, tab hidden, interruption/dispose | R19–R22 |

**Mốc P4:** G3 thoại. Effect dẫn mắt, tăng chiều sâu; không rung chữ, bloom lóa
hoặc tất cả lớp cùng slide/fade. Sea shimmer, sunlight/dust scene tùy chọn sau,
không cần để đạt G3 UI.

## P5 — Menu UI riêng (R24–R27)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R24 | Component map/menu layer slots; silhouette UI và extraction plan. Cảnh cảng/Khuê chỉ minh họa | R02, R03, R05; kinh nghiệm UI thoại |
| R25 | Teal organic surface, nav spine/icons/highlight, header/quote/resource strip/controls, wave/hoa/giấy viền | R24, R06, R07 |
| R26 | Hai case cards: punched paper, số/title/teaser, thumbnail crop/frame/overlap, state/data riêng | R25 |
| R27 | Review G1/G2 menu; sau đó light/depth/reveal/selection/card focus và video G3 | R24–R26; tái dùng motion R18–R23 phù hợp |

**Mốc P5:** G1–G3 UI menu. Không phụ thuộc pose Khuê, sổ cầm tay hay plate cảng
đúng concept. Thumbnail trong card là UI content slot; xác minh border/crop/type.

## P6 — Hồ sơ UI riêng (R28–R30)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R28 | Folio paper stack, góc/kẹp/bề dày/masks/contact shadows; navigation composition riêng | R03, R05–R07 |
| R29 | Steps, evidence/frame/tape/live annotations, note/harbor print/hoa; collaborator tag/arrow, brush CTA/back | R28 |
| R30 | G1/G2 dossier rồi folio/tab/CTA/evidence motion; text phẳng/dễ đọc; video G3 | R29; motion sheet tương ứng |

**Mốc P6:** G1–G3 UI hồ sơ. Vân là portrait slot tùy chọn; collaborator label
nhận anchor độc lập. Không phải menu đổi heading và không cần clone cảnh bàn.

## P7 — HUD UI replica (R31–R35)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R31 | HUD anchors/layout/layer map: date/resources/objective/prompt/location/controls | R02, R03, R08 |
| R32 | HUD material/icon/marks: ink edge, paper/date, resource ribbon, objective spine/highlight, prompt | R31, R05–R07 |
| R33 | HUD-only gallery trên nền trung tính và scene sáng/tối/chi tiết; fake target anchor chỉ trong preview | R31, R32 |
| R34 | Ghép HUD fixed-stage; typography, reading lanes, scale/input, target mapping và UI-mask G2 | R33, R07, R08 |
| R35 | HUD enter/update/feedback/prompt tracking/reduced motion, video G3. Nối world adapter thật ở P8 | R34; R18–R23 |

**Mốc P7:** G1–G3 HUD. Không có dependency dựng room/tiles/collision/camera mới,
actor walk/idle hay ánh sáng world. Có thể tái dùng world hiện tại làm context.

## P8 — Gameplay và trạng thái UI đầy đủ (R36–R39)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R36 | Nối thoại/menu qua view models và callbacks/guards GameSession; context/portrait providers riêng | G3 UI tương ứng |
| R37 | Case/evidence/resource thật; collaborator/prompt anchor adapter cho world hiện tại; dữ liệu dài/nhiều mục | R30, R35, R36 |
| R38 | Empty/loading/disabled/error/save/load/feedback/confirmation cùng art direction, chữ catalog | R36, R37 |
| R39 | Input/focus/modal priority, load/cancel/dispose/reduced motion/scale; browser suite và baseline | R36–R38 |

**Mốc P8:** G4. Controller sở hữu gameplay/world input, UI không tính outcome.
Số bước/ngày/energy đến từ session/content. Scene production mới không chặn
tích hợp vào world hiện tại. Các tab bổ sung cần component/content thật khi làm.

## P9 — Hiệu năng và bàn giao UI (R40–R45)

| ID | Công việc / đầu ra | Phụ thuộc |
| --- | --- | --- |
| R40 | GPU browser profile trên máy chuẩn; frame/drop/CPU/GPU/memory/load, UI-only và integration riêng | R23, lặp R27/R30/R35/R39 |
| R41 | Tối ưu exports/preload/cache/repaint/layers với UI overlay/diff; giữ masters | R40 |
| R42 | Polish sequence thoại → menu → dossier → HUD: material/type/light/motion thống nhất | R39, R41 |
| R43 | Native/full-HD/tỷ lệ khác uniform fit, text dài, content và backgrounds khác nhau | R42 |
| R44 | UI captures/video/masks/manifest/G0–G5, docs/entry/integration version và commit review được | R43 |
| R45 | Archive phần thật sự được thay; kiểm tra usage, inventory/hash/link; giữ concept/master/history | R44 |

**Mốc P9:** G5 UI; hướng tới 60 fps trên thiết bị/browser được ghi rõ, budget cụ
thể sau đo. Không tuyên bố production từ headless still/tests. Context cost được
ghi riêng để không nhầm với cost UI.

## Backlog context độc lập — làm sau, không chặn UI

- Newsroom/harbor/environment/props, camera/depth/world art; collision/lanes nếu
  một dự án world mới thật sự cần.
- Character poses/expressions, hidden body geometry, blink/breath/hair và actors.
- Báo/cốc/poster/chữ scene, scene sun/shadows/dust/sea shimmer.
- Không xóa các asset đã sinh; tái dùng làm context preview và source lịch sử.
  Khi quay lại nhánh này, lập plan/gate riêng, không gắn lại vào G2/G3 UI.

## Quy tắc triển khai và review

Mỗi screen có composition riêng và UI/context providers tách được; không thêm
framework tổng quát. Các lớp có thể là paper → print/wave → UI decorations →
reading text/hit targets; thứ tự thực theo concept. Hoa/sổ/print thuộc UI được
tách alpha/mask và phục dựng phần bị che cần thiết cho animation; không bake
panel/text vào một ảnh. Art bỏ pointer events, interaction targets độc lập.

Tất cả player-facing text từ `content/locales/vi.js` qua text service, kể cả
note/slogan/controls/evidence và scene lettering nếu dùng. Asset IDs, layouts,
styles và motion presets có source/version trong content; runtime nhận dữ liệu
và callback, không import fixtures/specs. Domain/session/save không đổi vì visual.

Capture UI độc lập và trên background khác nhau; reset selection/time/seed,
chờ fonts/resources, native 1672×941/DPR1. Công cụ hiện tại có full-frame/ROI
diagnostics lịch sử và **UI-isolated views/conservative interior comparison**
đã triển khai ở Stage 3. Mixed fringe reference alpha còn mở. Review theo component và mask,
không lấy MAE toàn ảnh hay tests làm chứng nhận G2/G3.

Nơi lưu: reference ở `docs/ui-concepts/`; scope/layout/motion ở
`docs/ui-specs/coastal-replica/`; masters/exports ở `assets/ui/coastal-replica/`;
content/layout ở `content/ui/`; chữ ở catalog; review versioned ở
`docs/ui-reviews/`. Giữ [review Stage 2](ui-reviews/coastal-replica-stage2/README.md)
và validation cũ như lịch sử, bổ sung đánh giá theo scope mới.

Tiến độ dùng trạng thái chưa bắt đầu / cần sửa UI / qua gate / context hoãn.
Thay scope không tự nâng task thành complete. Commit theo component/work package.
Khi đổi runtime/content/world chạy architecture, browser suite và baselines;
khi chỉ đổi plan chạy architecture, source lock, JSON/scope/link checks phù hợp.

## Thứ tự tiếp tục

**R11–R14 UI thoại → R15–R17 UI light/depth → R18–R23 UI motion → menu →
hồ sơ → HUD → gameplay → polish/production.** G2 UI trước motion của màn đó;
light/depth được sửa trong P3 để đóng G2. Không chờ background/portrait khớp
concept và không tự bắt người dùng duyệt từng task.

Nguồn plan full-scene trước khi sửa nằm trong lịch sử commit `c21e732`.
Stage 3 bổ sung implementation/evidence theo scope mới; giữ các gate còn mở,
không nâng G2 thành đạt chỉ từ đổi scope hoặc kết quả tests.
