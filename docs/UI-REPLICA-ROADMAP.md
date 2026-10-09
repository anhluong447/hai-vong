# Hồi Âm — roadmap replica visual và chuyển động

Ngày: 2026-10-09. Trạng thái: **Stage 0 / R01–R04 và Stage 1 / R05–R08 đã bàn giao**. Stage 1 là pipeline và mẫu xếp lớp; replica toàn màn chưa qua G2. R09–R45 chưa triển khai. Xem [bộ spec](ui-specs/coastal-replica/README.md) và [review Stage 1](ui-reviews/coastal-replica-stage1/README.md).

## Mục tiêu và thứ tự ưu tiên

Tái dựng bốn màn trong [coastal-editorial-v1](ui-concepts/coastal-editorial-v1/README.md) theo mục tiêu replica 1:1: composition, hình dáng, tỷ lệ, crop, chất liệu, typography, ánh sáng và chiều sâu. Sau khi bản tĩnh đạt chuẩn, thêm chuyển động vào chính các lớp đó. Bộ ảnh là thiết kế đích, không chỉ là gợi ý bảng màu.

Ưu tiên: độ trung thành với ảnh → chất lượng asset và xếp lớp → ánh sáng → typography → chuyển động → tương tác/gameplay → hiệu năng và đóng gói. Tiêu chuẩn cao áp dụng ở từng bước; không gom mọi thiếu sót visual thành việc polish cuối dự án.

Bản coastal v1 hiện tại là prototype kỹ thuật. Giữ khả năng session, save/load, input, text service, focus và animation lifecycle còn hữu ích. Bố cục và các surface giản lược chưa đạt mục tiêu này. Các test 72/72 trước đây xác nhận hành vi, không chứng nhận độ giống concept.

Khung thiết kế gốc: **1672 × 941** cho cả bốn ảnh. Giai đoạn replica dựng trong một stage có hệ tọa độ này; kích thước cửa sổ khác scale đồng đều và dùng khoảng đệm nếu cần. Không reflow thành layout điện thoại, ẩn chân dung hoặc thay composition để vừa màn hình nhỏ. Trợ năng, bàn phím và giảm chuyển động vẫn được giữ trong cùng thiết kế.

index.html hiện là sandbox công thức. Bản replica có đường preview riêng trước; đổi entry mặc định chỉ thực hiện ở bước tích hợp được ghi rõ. Không đổi luật gameplay hoặc baseline để phục vụ một khung ảnh.

## Bốn thiết kế đích

| Màn | Thành phần bắt buộc theo ảnh | Điểm không được giản lược |
| --- | --- | --- |
| 01 — Thoại | Nền tòa soạn/cảng; Khuê trái, Vân phải với pose ngồi; bàn và báo tiền cảnh; date seal trái trên; thương hiệu phải trên; ba dải lựa chọn xếp dọc; khung thoại giấy mép sóng ở đáy | Hai nhân vật, vị trí lựa chọn nổi ngoài vùng đọc, đường biên giấy và quan hệ che khuất với đạo cụ |
| 02 — Menu | Cảnh cảng; mảng xanh lớn có đường biên hữu cơ; navigation icon lớn; hai mẩu hồ sơ có thumbnail; Khuê cầm sổ bên phải; tài nguyên trái dưới; dải phím tắt đáy | Không thay thành panel giấy chung; giữ silhouette tổng thể, tỷ lệ chân dung, dải hồ sơ và nhịp thông tin |
| 03 — HUD/map | Tòa soạn nhiều lớp và đồ vật; nhân vật trong world; date seal trái trên, tài nguyên phải trên, mục tiêu trái; interaction prompt gần actor; location và controls ở đáy | World chiếm toàn stage; không có header/toolbar web đẩy map xuống; environment art là một nhánh công việc riêng |
| 04 — Hồ sơ | Giấy chồng và kẹp; tiêu đề lớn; danh sách đánh số; ảnh chứng từ/sổ; ghi chú dán; minh họa cảng; Vân ngồi; nhãn cộng tác viên; nút nét cọ và back | Screen riêng, không phải menu thay heading; giữ góc giấy, ảnh tư liệu, props và portrait hòa trong cảnh |

Trong fixture đối chiếu phải dùng nội dung và trạng thái giống ảnh. Khi nối gameplay, bước và số liệu thật vẫn đến từ content/session; không cố định ba bước hay energy cap giả chỉ vì concept có chúng.

## Các cổng nghiệm thu

| Cổng | Bằng chứng phải có | Điều kiện qua cổng |
| --- | --- | --- |
| G0 — Thiết kế đo được | Bản đồ lớp, bảng tọa độ/crop, inventory asset, text keys cho từng màn | Mọi thành phần nhìn thấy đã có vị trí, vai trò và cách sản xuất; ghi rõ phần bị che phải phục dựng |
| G1 — Asset đạt chuẩn | Contact sheet, xem alpha trên nền sáng/tối, crop 100%, nguồn/master/version | Đúng pose, màu, ánh sáng và nét; không viền bẩn, seam, chữ bake vào art hoặc vật bị cắt thiếu |
| G2 — Replica tĩnh | Capture 1672×941, overlay 50/50, difference image, danh sách sai lệch | Đúng silhouette và thứ bậc; không thiếu thành phần bắt buộc; không còn lỗi lớn về pose, crop, typography hoặc ánh sáng |
| G3 — Motion đạt chuẩn | Video realtime và xem chậm, still ở đầu/giữa/cuối, thử loop dài và interruption | Chuyển động có nhịp và trọng lượng; không ghost, pop, trượt chân, seam sóng, texture bơi hoặc chữ lắc |
| G4 — Tương tác đạt chuẩn | Browser checks, luồng command/save/load, input/focus, text dài và ảnh tải lỗi | Tương tác chính xác ở mọi scale; không double command, focus mất, input world lọt qua modal hay state cũ xuất hiện |
| G5 — Bản production | Profile trên browser thật có GPU, asset/build inventory, kiểm tra visual sau tối ưu | Đạt budget đã đo trên máy chuẩn; texture/ánh sáng/composition giữ chất lượng; baseline gameplay khớp |

Lỗi visual được phân loại: **chặn nghiệm thu** (sai composition/pose/missing art/ánh sáng), **lớn** (crop, type, edge, overlap sai dễ thấy), **nhỏ** (chi tiết cục bộ). G2 không qua khi còn lỗi chặn hoặc lỗi lớn. Không dùng một điểm similarity trung bình để bỏ qua lỗi tại điểm nhìn chính.

Tại kích thước gốc, sai lệch điểm neo hoặc đường biên quan trọng trên 2 px được đưa vào danh sách review. Đây là ngưỡng phát hiện để kiểm tra, không phải chứng nhận toàn màn đã giống 1:1. Chữ được xét riêng về baseline, xuống dòng, độ rộng và dấu tiếng Việt; antialiasing được tách khỏi lỗi composition.

Mỗi work package bên dưới là một đơn vị triển khai/review nhỏ. Commit asset, code và review có thể tách riêng. Không tự động bắt người dùng xác nhận từng bước; tự kiểm chứng theo cổng, báo kết quả ở các mốc lớn và xử lý phản hồi đã có. Nếu thiếu dữ liệu ảnh/source làm chặn replica, ghi chính xác phần thiếu thay vì thay bằng placeholder rồi đánh dấu hoàn thành.

## P0 — Khóa yêu cầu và chuẩn đối chiếu

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R01 | Giữ nguyên reference PNG, prompt, hash; ghi đích replica mới và phân biệt prototype v1 | Reference inventory; trạng thái v1 chưa đạt replica; không ghi đè ảnh gốc | Đã có ảnh; kế hoạch lượt này |
| R02 | Đo composition của cả bốn màn: các vùng, điểm neo, crop, type, khoảng trống và silhouette | Bốn layout sheets ở tọa độ 1672×941, có thumbnail đánh số lớp | R01 |
| R03 | Lập inventory từng chi tiết; phân loại crop được, cần vector, cần phục dựng, cần source mới | Asset backlog theo màn, kích thước cần dùng, ownership/source và rủi ro che khuất | R02 |
| R04 | Chuẩn capture và review | Stage không toolbar; fixture xác định; reset camera/animation/time; cùng font/viewport; cách tạo overlay/diff | R02 |

**Mốc P0:** G0 đạt cho cả bốn màn. Chưa tạo hàng loạt asset trước khi biết chúng nằm ở đâu và che nhau thế nào.

**Bàn giao Stage 0:** bốn sheet với 169 vùng, 104 asset dự kiến và 96 text key; công cụ native capture + overlay/diff được kiểm chứng. G0 có dữ liệu cho sản xuất; font, microcopy, hidden geometry và masks vẫn là task có ghi rõ ở giai đoạn sau. Các bounds là envelope ước lượng, chưa được nghiệm thu ở ngưỡng 2 px; G1/G2 chưa đạt. Prototype coastal v1 tiếp tục giữ vai trò kiểm chứng hành vi.

## P1 — Pipeline art và một mẫu xếp lớp chuẩn

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R05 | Quy định source/master/export | Giữ source chất lượng cao; manifest gồm ID, file, source, kích thước, alpha, pivot, crop, layer, text keys, version, quyền sử dụng | R03 |
| R06 | Tái dựng một mẫu giấy + mực + mép sóng từ ảnh thoại | Texture và mask đúng; contact sheet; kiểm tra cạnh ở native scale và scale khác | R05 |
| R07 | Tái dựng typography và bộ dấu/icon đầu tiên | Font có giấy phép, đủ dấu; mẫu heading/body/handwriting/numbers; logo mark không chứa chữ động; icon cùng nét | R02, R05 |
| R08 | Dựng stage cố định và mẫu 5–7 lớp thực | Background/portrait/paper/text/foreground có tọa độ và vùng che đúng; hit testing scale đúng; không ảnh toàn màn với hitbox giả | R04, R06, R07 |

**Mốc P1:** G1 cho mẫu art và stage chứng minh được xếp lớp thật. Nếu DOM/SVG/Canvas hiện tại có giới hạn cụ thể, làm spike nhỏ với cùng cảnh và profile trước khi chọn thêm renderer. Không quyết định đổi engine từ suy đoán.

**Bàn giao Stage 1:** 15 asset có master/export/hash/provenance, ba font local OFL đủ glyph tiếng Việt, mẫu giấy/mực/mép sóng và icon, stage SVG 7 lớp thực, chữ từ catalog và hitbox scale đồng đều. Preview riêng tại `tools/coastal-replica-preview.html`. Contact sheet sáng/tối, crop 100%/50%, typography, native capture và overlay/diff nằm trong [review Stage 1](ui-reviews/coastal-replica-stage1/README.md). G1 chỉ qua cho mẫu giấy/mực/icon; các PNG nền, chân dung và minh họa là pilot đăng ký lớp, còn sai pose/props/crop và không thay thế R09–R14. Chưa có motion/GPU acceptance, chưa nối gameplay và chưa đổi entry mặc định.

## P2 — Thoại replica tĩnh: màn đầu tiên hoàn chỉnh

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R09 | Phục dựng nền tòa soạn, cửa sổ/cảng và mặt bàn đúng ảnh 01 | Plate sạch, không chữ UI; phần bị actor che được bổ sung; màu và hướng nắng khớp | R03, R05 |
| R10 | Chuẩn bị Khuê và Vân đúng pose ngồi/đạo cụ | Hai silhouette và facial identity đúng; crop/alpha sạch; pose masters và phần cần che khuất | R09 |
| R11 | Tách tiền cảnh: báo, bút, cây/hoa, bàn và các vật che một phần scene/UI | Foreground plates và masks; độ mềm, tỷ lệ và chiều sâu đúng | R09, R10 |
| R12 | Dựng dải giấy thoại theo đường biên thực | Mép sóng, mực, texture, minh họa cảng, speaker ornament và tiếp tục; chữ là lớp riêng | R06, R07, R11 |
| R13 | Dựng choice strips, date seal và thương hiệu | Lựa chọn xếp dọc đúng vị trí, icon/arrow/highlight đúng; date seal và chữ đúng tỷ lệ | R07, R12 |
| R14 | Ghép toàn màn và sửa theo overlay/diff | Capture giống fixture ảnh 01; sửa lần lượt silhouette → anchor → ánh sáng → type → chi tiết | R08–R13 |

**Mốc P2:** G2 đạt cho thoại. Đây là sản phẩm visual đầu tiên để đánh giá tiêu chuẩn toàn dự án. Không nhân rộng mẫu nếu còn khác xa ảnh tham chiếu.

## P3 — Ánh sáng và chiều sâu của màn thoại

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R15 | Chuẩn hóa ánh sáng giữa nền, portrait và props | Hướng nắng, nhiệt độ màu, rim light, bóng tiếp xúc/che khuất và độ đậm đen thống nhất | R14 |
| R16 | Hoàn thiện compositing | Occlusion masks, cạnh tóc/giấy, foreground focus, lớp khí quyển; không halo, viền trắng hoặc double shadow | R15 |
| R17 | Chốt bản tĩnh chuẩn sau lighting | Native capture mới; ảnh đối chiếu; ghi lý do cho mọi sai lệch chủ ý; không áp filter chung làm mất mặt/chữ | R16 |

**Mốc P3:** G2 được xác nhận lại sau lighting. Ánh sáng phải hòa từng asset vào scene; gradient phủ toàn màn không thay thế bước này.

## P4 — Thoại sống: motion và hiệu ứng

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R18 | Viết motion sheet theo từng lớp | Pivot, thứ tự vào/ra, đường đi, duration, easing, biên độ, loop seam, vùng che và trạng thái cuối | R17 |
| R19 | Làm sóng có texture/mực chuyển động | Giữ silhouette cơ sở; chuyển động nhỏ ở mép; texture gắn với hình; loop không lộ nối; text đứng yên | R18 |
| R20 | Làm giấy và lựa chọn có trọng lượng | Choice hover/select/press, paper enter/exit, stagger có nhịp; hit area ổn định; không mọi lớp dùng cùng slide/fade | R18, R19 |
| R21 | Làm chuyển động nhân vật | Expression transitions trước; blink/breath/hair chỉ khi có layer/frames đúng pose; tránh warp cả ảnh và chuyển động lệch identity | R10, R18 |
| R22 | Thêm ánh sáng và môi trường chuyển động | Thử shimmer biển, ánh nắng/bóng lá, bụi rất nhẹ hoặc foreground parallax từng hiệu ứng; kiểm tra lại ánh sáng và vùng đọc sau mỗi lần | R15, R18–R21 |
| R23 | Nghiệm thu chuyển động và interruption | Video đầu/giữa/cuối; mở/đóng nhanh, đổi speaker khi tải asset, lựa chọn liên tiếp, ẩn tab, giảm motion; trạng thái cuối luôn đúng | R19–R22 |

**Mốc P4:** G3 đạt cho thoại. Effect phải tăng chiều sâu và dẫn mắt; bỏ hoặc chỉnh effect gây nhiễu, bloom quá mức, lóe sáng, chữ trôi hoặc nhân vật mất tự nhiên. Số lượng effect không phải tiêu chí chất lượng.

## P5 — Menu replica riêng

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R24 | Dựng plate cảng/menu và Khuê cầm sổ | Đúng camera, pose, notebook, ánh nắng, foreground và crop ảnh 02 | G2 thoại; R03, R05 |
| R25 | Dựng silhouette xanh, navigation và tài nguyên | Mảng xanh hữu cơ có texture, highlight nét cọ, icon, đường kẻ; energy dots/money và controls đúng vị trí | R24, R06, R07 |
| R26 | Dựng hai mẩu hồ sơ | Giấy đục lỗ, số thứ tự, title/teaser/thumbnail, góc/overlap/mask đúng; các phần text dữ liệu riêng | R25 |
| R27 | Ghép, lighting và motion menu | Qua G2 trước; sau đó wave reveal, selection, case focus, portrait/props entry; caption/type không rung | R24–R26; kinh nghiệm R23 |

**Mốc P5:** G1–G3 cho menu. Có capture menu riêng và video riêng; không dùng ảnh hồ sơ để đại diện menu.

## P6 — Hồ sơ replica riêng

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R28 | Dựng nền/pose Vân ngồi và stack giấy | Đúng góc giấy, kẹp, bề dày, bóng tiếp xúc, chiều sâu và crop ảnh 04 | G2 thoại; R03, R05 |
| R29 | Dựng nội dung hồ sơ và props | Step list đánh số, ảnh chứng từ, sổ, note/băng dính, dấu, minh họa cảng, tên cộng tác viên và CTA nét cọ | R28, R06, R07 |
| R30 | Chốt static và motion hồ sơ | Qua G2; thử mở folio, chuyển tab, nhấn CTA và đổi chứng từ; giữ text phẳng/dễ đọc khi giấy nghiêng | R29; R23 |

**Mốc P6:** G1–G3 cho hồ sơ. Menu và dossier có composition riêng; chỉ dùng chung các bộ phận thật sự giống nhau.

## P7 — Environment art và HUD replica

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R31 | Đo world ảnh 03 và xác định cách dựng | Bản bố trí tòa soạn/camera/depth/actor scale; kế hoạch collision, walking lanes và foreground occlusion; spike một bàn + actor | R02, R03, R08 |
| R32 | Xây bộ environment | Sàn/tường/cửa sổ, bàn/kệ/báo/cây/props; các depth layers, light/shadow; actor style hòa với cảnh; seam/scale đúng | R31, R05 |
| R33 | Ghép scene khám phá giống ảnh | Camera fixture, actor positions/poses, layer sorting và masks; capture tĩnh riêng environment trước khi HUD che lên | R32 |
| R34 | Dựng HUD theo các góc của stage | Date trái trên, resources phải trên, objective trái, prompt gần actor, location/controls đáy; không web toolbar | R33, R07 |
| R35 | Làm environment/HUD motion và navigation | Actor walk/idle/talk, interaction tracking, occlusion theo vị trí; light/sea loops, scene cut; UI không che đường đi quan trọng | R34; R23 |

**Mốc P7:** G1–G3 cho world/HUD. Đây là nhánh art và world riêng, không thể đạt chỉ bằng đổi CSS. R31 có thể nghiên cứu sau P1; sản xuất toàn bộ world sau khi đã chốt chất lượng thoại. Không dùng nền phẳng đẹp rồi tuyên bố world đã tương tác đầy đủ.

## P8 — Gameplay, nội dung và các trạng thái đầy đủ

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R36 | Nối thoại và menu với gameplay thật | View models, text keys, callbacks/guards qua GameSession; dialogue graphs, speaker và lịch thật; chuyển màn không reset world | G3 các màn được nối |
| R37 | Nối dossier/HUD với dữ liệu thật | Case status/steps/owner, evidence và resource từ data; quy tắc rõ cho nội dung dài/nhiều mục, không bịa cơ chế để khớp fixture | R30, R35, R36 |
| R38 | Dựng trạng thái phụ cùng tiêu chuẩn | Empty/loading/disabled/error/save/load, feedback trước ngủ, thông báo và confirmation; chữ có catalog; không rơi về modal mặc định giản lược | R36, R37 |
| R39 | Kiểm chứng input, lifecycle và scale | Keyboard/mouse, focus/modal priority, hitboxes sau scale, asset loading/fallback, interruption, dispose và reduced motion; browser suite/baselines | R36–R38 |

**Mốc P8:** G4 đạt. Các màn đội, lịch, nhật ký và thiết lập trong menu cần thiết kế tương ứng khi chức năng được đưa vào; không gọi tên một tab chỉ để giống ảnh khi chưa có hành vi/data. Màn mở rộng phải đạt cùng tiêu chuẩn vật liệu, type, ánh sáng và layering.

## P9 — Hiệu năng, polish và bàn giao visual

| ID | Công việc | Đầu ra / nghiệm thu | Phụ thuộc |
| --- | --- | --- | --- |
| R40 | Đo trên thiết bị/trình duyệt chuẩn có GPU | Ghi máy/browser/resolution; frame times, dropped frames, CPU/GPU, decoded image memory, tải lần đầu, chạy lâu và đổi màn liên tiếp | R23 rồi lặp ở R27/R30/R35/R39 |
| R41 | Tối ưu có đối chiếu art | Export sizes/formats, preload theo màn, cache/layer count, tránh repaint không cần thiết; overlay/diff sau mỗi tối ưu; master không bị mất | R40 |
| R42 | Polish toàn bộ sequence | Xem liên tục thoại → menu → dossier → world: nhịp chung, màu, chữ, độ sắc, ánh sáng, chất giấy và effect intensity thống nhất | R39, R41 |
| R43 | Review ở scale và nội dung khác nhau | Native + full-HD + cửa sổ khác tỷ lệ bằng uniform scaling; nội dung dài, portraits/evidence khác; letterbox và trợ năng giữ art direction | R42 |
| R44 | Chốt release và cập nhật kiến trúc | Reference/capture/video/diff cuối; asset manifest; checklist G0–G5; docs các boundary thật; entry game, phiên bản và commit review được | R43 |
| R45 | Archive phần được thay thế | Kiểm tra nơi dùng CSS/tool/review cũ; inventory + hash + sửa link; giữ originals/source masters và snapshot lịch sử | R44 |

**Mốc P9:** G5 đạt. Mục tiêu ban đầu là 60 fps trên máy chuẩn được ghi trong review. Budget frame/memory/load cụ thể được chốt bằng R08/R40; chưa tuyên bố đạt khi chỉ có headless test. Ưu tiên tối ưu renderer/asset/caching để giữ art direction; thay đổi visual để đáp ứng budget phải ghi tác động và đối chiếu lại.

## Quy tắc production cho layering, lighting và motion

Mỗi screen có layer manifest riêng; không áp một thứ tự z-index chung máy móc. Mẫu để phân tích: background xa → cảnh/props trung → actor → ánh sáng/bóng theo lớp → mặt giấy/UI → chữ và interaction → foreground/occluders → screen transition. Một số props đi giữa actor và UI; order phải theo ảnh. Light overlays phải chỉ ảnh hưởng những lớp phù hợp, không làm mờ chữ hoặc wash out mặt.

Asset nguồn phẳng không cung cấp tự động các vùng bị che. Phải phục dựng và ghi provenance. Mỗi pose/expression có master cùng silhouette; mọi layer tóc/mắt/tay/đạo cụ giữ pivot, lighting và alpha sạch. Không dùng portrait đứng để thay pose ngồi/cầm sổ đã được chỉ định.

Mọi player-facing text, kể cả slogan, ghi chú viết tay, nhãn trên giấy/chứng từ, controls và lời trên bảng, được quản lý qua content/catalog rồi render thành lớp chữ phù hợp. Không bake text vào texture để đạt ảnh giống rồi khóa khả năng phát triển. Dữ liệu màn, text keys, asset IDs, layout coordinates và motion presets được quản lý tập trung, có version; tránh chuỗi/giá trị rải rác trong component.

Motion sheet phân ba mức: ambient chậm, chuyển màn có nhịp, feedback nhanh. Mỗi effect có lý do, lớp đích và trạng thái cuối. Không để mọi lớp cùng lặp hoặc cùng easing. Khi giảm motion, giữ bố cục, texture và trạng thái cuối đẹp như bản tĩnh đã đạt G2. Chuyển động không thay đổi lịch/energy hoặc quyết định outcome.

Nếu thử shader, deformation hay renderer mới, làm spike trên đúng mẫu art và đánh giá seam, readability, quality và GPU cost. Chỉ đưa vào production khi có lợi ích đo/nhìn thấy rõ; không dùng công nghệ mới như bằng chứng chất lượng.

## Nơi lưu và quản lý công việc

- `docs/ui-concepts/coastal-editorial-v1/`: reference gốc bất biến về ảnh/prompt.
- `docs/ui-specs/coastal-replica/`: layout sheets, layer maps, asset inventory, type/light/motion sheets; tạo khi R02 bắt đầu.
- `assets/ui/coastal-replica/`: runtime exports và manifest; source/master có đường lưu riêng được manifest dẫn tới, không ghi đè reference.
- `content/ui/`: screen/layout/motion definitions và fixture có text keys; `content/locales/vi.js`: mọi chữ.
- Component art cụ thể nằm dưới `src/ui/`; screen composition/adapters nằm trong presentation khi có nhu cầu thực. Giữ domain/application độc lập renderer.
- `docs/ui-reviews/coastal-replica/<screen>/<revision>/`: captures, overlay/diff, video, thông số capture và lỗi còn mở; giữ review v1 làm lịch sử đối chiếu.

Mỗi Rxx theo dõi bằng trạng thái: chưa bắt đầu / đang làm / cần sửa visual / qua cổng. Ghi dependencies, đầu ra, kiểm tra đã chạy và tồn đọng. Không đánh dấu hoàn thành chỉ vì code chạy hoặc có một ảnh gen đẹp.

Chia commit theo work package có đầu ra cụ thể, ví dụ `R06 dialogue paper assets`, `R08 fixed stage`, `R14 dialogue static replica`, `R23 dialogue motion review`. Khi thay runtime/content/world: architecture checker, browser suite và baseline comparison bắt buộc theo DEVELOPMENT.md. Kiểm tra visual/animation là bằng chứng riêng, bổ sung cho test hành vi.

## Thứ tự khởi động

Đợt đầu chỉ làm **R01–R04**: khóa chuẩn, đo cả bốn màn, lập inventory và phương pháp đối chiếu. Đợt tiếp theo **R05–R08** kiểm chứng pipeline bằng mẫu nhỏ. Sau đó tập trung **R09–R17** để hoàn thành thoại tĩnh và ánh sáng; qua G2 mới làm **R18–R23**. Menu, dossier và world triển khai dựa trên tiêu chuẩn đã chứng minh ở thoại, không phát triển hàng loạt placeholder song song.

Không đặt deadline giả trước khi đo lượng asset phải phục dựng. Sau P0 có thể ước lượng theo số asset/layer và các rủi ro; sau P2 mới ước lượng đáng tin hơn cho các màn còn lại. Công việc hiện tại chỉ hoàn thiện roadmap, chưa bắt đầu sản xuất replica.
