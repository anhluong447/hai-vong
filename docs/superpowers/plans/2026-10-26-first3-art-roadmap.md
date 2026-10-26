# Hồi Âm — Three-Day Art & Presentation Implementation Roadmap

> **For agentic workers:** Khi được người dùng giao triển khai, dùng `superpowers:executing-plans` hoặc `superpowers:subagent-driven-development` theo phương thức đã thống nhất. Các checkbox dưới đây là việc tương lai. Roadmap này không tự cho phép thực thi toàn bộ G1–G8 hoặc tự động phân công agent.

**Goal:** Hoàn thiện hình ảnh, nhân vật, âm thanh và tương tác của **3 ngày đầu hiện có**, đủ để chơi, đánh giá và chốt art direction trong game.

**Architecture:** Tiếp tục runtime engine-free và Workspace của Phase 0. Tài nguyên, bố cục và dàn dựng đi qua content/catalog/validator chung; renderer chỉ biểu diễn state và application intents. Làm một đoạn thật tại Phòng số 3 thành mẫu chuẩn, rồi dùng mẫu đó phủ các nội dung đã có.

**Tech Stack:** JavaScript ES modules/JSDoc, Canvas2D cho world/sprite, DOM/CSS cho UI, JSON content, Web Audio, IndexedDB; pipeline Python trong `.venv` cùng portable tools hiện có. Không đề xuất dependency mới ở bước lập plan.

**Spec:** Các quyết định đã chốt tại mục 1 của tài liệu này; [concept phòng CLB](../../design/concept/locations/bao-chi-hoang-hon.png), [hành lang](../../design/concept/locations/Sunset_Corridor.png), [character sheets](../../design/concept/characters/), [First3Days mapping](../../guides/FIRST-THREE-DAYS.md), [Bible mục 16](../../design/narrative/game_story_bible_v2.md#16-tổng-kết-các-quyết-định-thiết-kế-đã-chốt), [coding rules](../../engineering/CODING-RULES.md).

**Status:** Người dùng đã yêu cầu commit plan rồi triển khai G1, ngày 2026-10-26. Nhánh `feat/first3-art-direction`, base init `d684512`. Chỉ G1 có [plan thực thi chi tiết](2026-10-26-g1-room3-art-direction.md); G2–G8 vẫn ở mức roadmap, chưa được giao thực hiện. Các lựa chọn hình ảnh tại Review A/B vẫn cần phản hồi trên mẫu cụ thể.

## Global Constraints

- Giữ phạm vi **3 ngày đầu**; không kéo sang 2 tuần hoặc 12 tuần.
- Engine-free 2D side-scrolling trên desktop browser; mọi thao tác player dùng được bằng bàn phím.
- Background độ phân giải cao, nhiều lớp, theo **Nostalgic Coastal Anime**, hơi thở biển miền Trung, cũ kỹ và hoài niệm.
- Nhân vật dùng sprite pixel chi tiết, còn thấy chất pixel, tỉ lệ không chibi hóa quá mức. Character sheet là nguồn ngoại hình; sprite chibi minh họa trong sheet không thắng quyết định này.
- Ánh sáng xuyên cửa là hướng môi trường; chưa xây hệ thống ánh sáng động ở G1. Màu/ánh sáng tĩnh chỉ cần đủ đánh giá phối cảnh.
- Giữ nguyên bytes nguồn đã duyệt trong `docs/design/narrative/`, `docs/design/gameplay/`, raw `First3Days.md` và 11 PNG concept. Bản làm việc/biến thể nằm ở nguồn mới.
- Mọi file, cache, dependency, tool, profile browser và bản phục hồi nằm trong project. Python dùng `.venv`; không cài global hoặc sửa cấu hình máy.
- Text, asset paths, frames/timing, layout và dàn dựng là managed data; không branch theo tên nhân vật, scene ID hoặc nội dung câu thoại trong renderer.
- Giữ Main/Side/General, energy, lịch, publication và evidence theo hợp đồng hiện hành; không suy gameplay mới từ chữ, giờ hoặc icon trong concept.
- Validate replacement trước khi thay session. Có thay đổi ảnh hưởng save phải có review version/migration và test tương ứng.
- Workspace preview/drafts tách player saves; nguồn được phục hồi từ bundle thực sự, không chỉ inventory hashes.

## Review Focus

1. Sprite bị nhòe hoặc background bị pixel hóa khi resize/DPR: kiểm tra sampling riêng ở G1, tái kiểm tra khi phủ cảnh ở G2/G3.
2. Thay clip/actor khiến save cũ không load: G1 định nghĩa migration có giới hạn; G8 chạy cả tuyến cũ và mới.
3. NPC xuất hiện sai ngày/người nói hoặc pose cấp reward hai lần: G1 chỉ đúng cuộc gặp Khuê–Vân; G4 phủ lịch/dàn dựng ba ngày qua data.
4. PNG concept bị dùng nguyên khối với UI/nhân vật/chữ sai đã dính vào nền: G1 tách asset; G2/G6 rà toàn bộ cảnh và chữ.
5. Chỉ máy tác giả mới có master, hoặc audio/portrait callback cũ thắng scene mới: G7 chạy xuyên các G; G8 phục hồi và kiểm tra lifecycle thật.

## 1. Phạm vi thiết kế đã thống nhất

### Đã có, không thiết kế lại từ đầu

- Hai concept địa điểm: Phòng số 3 và hành lang hoàng hôn.
- Chín sheet: Khuê, Vân, Long, Nhi, Ngọc, Ân, Khoa, Linh, Huy. File `Hồi Âm_ Character Design Sheet.png` là Ân.
- Sheet có nhận diện, turnaround, bảng màu, biểu cảm, đạo cụ và sprite minh họa. Đây chưa phải bộ frame/portrait tách sạch cho runtime.
- Phase 0 có scene layers/parallax, sprite clips, asset leases, audio buses/fades, text reveal, keyboard, save/migration, Workspace và bundle recovery.
- Ba ngày đã có 11 story documents, 7 địa điểm, nhánh nhận/bỏ Side, Main và General. Dùng [acceptance record](../../testing/PHASE-0-ACCEPTANCE.md) làm bằng chứng lịch sử, không coi là kết quả chạy mới.

### Phần còn thiếu

Background riêng và tách lớp; sprite đúng tỉ lệ/mật độ pixel; portrait có biểu cảm;
đạo cụ và feedback; dàn dựng người nói/NPC; UI hoàn chỉnh; BGM/ambience/SFX thật;
workflow từ nguồn đến bản export tái lập được. Hiện 7 map dùng chung nền mẫu,
actor generic có idle 1 frame/walk 2 frame, BGM/SFX cùng âm thử 0,5 giây.

### Cách tiếp cận

Làm đoạn Phòng số 3 trên runtime thật theo trao đổi G1, vì cần đánh giá lúc đi,
nói chuyện và mở UI. Board so sánh giúp chọn trước khi làm nhiều frame, nhưng
không thay thế chơi thử. Làm đồng loạt toàn bộ 3 ngày trước lần review đầu sẽ
nhân chi phí sửa phong cách; vì vậy chỉ mở rộng sau khi mẫu G1 được duyệt.

Các thông số kỹ thuật, số frame và số asset trong plan G1 là **đề xuất có nhãn**;
người dùng đã chốt định hướng nhưng chưa chọn kích thước sprite hoặc palette cụ thể.

## 2. Tám goal và điều kiện đóng mốc

| Goal | Đầu ra | Điều kiện hoàn thành / bằng chứng | Phụ thuộc |
| --- | --- | --- | --- |
| **G1 — Mẫu hình ảnh chơi được** | Một cuộc gặp Khuê–Vân tại Phòng số 3: cảnh tách lớp, đi/đứng/quay, portrait, thoại và UI tối thiểu theo concept | Người dùng duyệt mẫu trong game; ghi chuẩn sprite/layer/palette/portrait/UI; kiểm tra keyboard, save, editor và nguồn phục hồi. Không coi âm thử là sound direction đã duyệt | Phase 0 + concept |
| **G2 — Môi trường 3 ngày** | Hoàn thiện 7 địa điểm: cổng trường, văn phòng, 11A3, hành lang C, phòng CLB, trọ, căng tin; đạo cụ, cửa, mặt sàn và lớp che | Đi đúng mặt sàn, không lộ khoảng trống ở mép camera, điểm tương tác nhận biết được; các buổi có sắc thái hợp cảnh; nguồn lớp được giữ | Chuẩn G1 + G7 |
| **G3 — Nhân vật 3 ngày** | Asset dùng thật cho Khuê, Vân, Long, Khoa, thầy Trần, thầy Nguyên và người nói cần trong Side; NPC nền theo nhu cầu từng cảnh | Mỗi người nhận ra được ở kích thước chơi; frame/portrait/pivot đồng nhất. Nhân vật chưa có sheet phải được thiết kế riêng và review, không lấy khuôn mặt generic làm bản hoàn chỉnh | Chuẩn G1 + G7 |
| **G4 — Dàn dựng và tương tác** | Phủ 11 story documents bằng speaker/expression, hiện/ẩn/hướng nhìn/vị trí NPC, props và phản hồi; camera chỉ thêm thao tác thực sự cần | Cả hai tuyến nhận/bỏ Side đúng diễn biến, NPC và tư liệu đúng thời điểm; narration khác thoại rõ; load/skip không lặp hiệu ứng hoặc reward | G1; tích hợp dần G2/G3 |
| **G5 — Âm thanh** | BGM theo sắc thái, ambience theo địa điểm, SFX hành động/UI; cue sheet, loop points, gain/fade và provenance | Không còn tone thử trong đoạn đã nghiệm thu; đổi cảnh/pause/load đúng, không cắt các SFX cần chồng, âm lượng có kiểm soát; audio vẫn khởi động bằng gesture hợp lệ | Mẫu cảnh G1, mapping G2/G4, G7 |
| **G6 — UI/UX hoàn chỉnh** | Mở rộng UI G1 sang HUD, lựa chọn, menu/settings, backlog, save/load và các thao tác đã tồn tại; font tiếng Việt được chọn | Keyboard đầy đủ, focus rõ, chữ dài/cỡ lớn không cắt; giờ/ngày/energy/tiền lấy từ state, không chép `17:20`, `01/07`, `50.000` từ concept; không thêm màn quản lý xuất bản | Chuẩn G1 + luồng G4 |
| **G7 — Sản xuất và phục hồi tài nguyên** | Quy chuẩn nguồn/export/ID, prompts hoặc input nếu có, licenses, bundle, validation, preview/used-by và tài liệu thêm asset | Sửa asset qua nguồn và pipeline, không patch output; editor và runtime dùng cùng contracts; clone/copy sạch phục hồi được master và build lại | Bắt đầu trong G1, đi cùng G2–G6 |
| **G8 — Nghiệm thu 3 ngày** | Static build cục bộ tích hợp toàn bộ, playtest report, visual decisions và danh sách tồn đọng | Hai route chơi bằng keyboard; save/load/migration, authoring round-trip, bot, lifecycle và phục hồi pass; người dùng duyệt diện mạo sau khi chơi; ghi hạn chế performance đúng thực tế | G2–G7 |

**G1 chốt mẫu để sản xuất; G8 xác nhận mẫu còn nhất quán khi đã thành 3 ngày.**
G7 là luồng công việc đi cùng từng goal, không phải bước cuối để vá việc mất nguồn.

## 3. Thứ tự làm và review cùng người dùng

1. **G1:** review A — bố cục/tỉ lệ/mật độ pixel; review B — đoạn playable và chuẩn art rút ra.
2. **G2/G3:** làm theo từng cụm cảnh/nhân vật phục vụ ba ngày; ưu tiên tài nguyên xuất hiện nhiều. Review một cảnh hoặc một bộ nhân vật đã ghép, rồi mới làm tiếp cụm tương tự.
3. **G4:** dàn dựng từng đoạn đã có asset; giữ một tuyến chơi xuyên suốt hoạt động để thấy lỗi sớm.
4. **G5/G6:** hoàn thiện âm thanh và các màn UI trên những luồng thực tế; không đợi đủ mọi tranh mới bắt đầu.
5. **G8:** chơi và sửa cả ba ngày, review cuối; đóng từng lỗi bằng kết quả chạy thật.

Đây là dependency công việc, không ấn định lịch ngày/tuần hay cho phép tự triển khai
song song. Người dùng quyết định thẩm mỹ tại các điểm review; người thực hiện
chuẩn bị ảnh so sánh và bản chơi, ghi rõ đề xuất của mình và lựa chọn đã được duyệt.

## 4. Asset coverage dự kiến

| Nhóm | G1 | Phần mở rộng sau G1 |
| --- | --- | --- |
| Environment | 1 phòng, đề xuất 5 lớp, ánh sáng tĩnh | 6 địa điểm còn lại; biến thể buổi chỉ khi diễn biến cần |
| World sprite | Khuê/Vân; mẫu rồi bộ frame tối thiểu | Long/Khoa/thầy Trần/thầy Nguyên và NPC thật sự xuất hiện |
| Portrait | Đề xuất 3 biểu cảm/người cho Khuê/Vân | Theo cue sheet từng nhân vật; không làm mọi biểu cảm cho cả 9 người ngay |
| Props | Báo/bàn/tủ/đèn/cửa như phần cảnh; chưa mở hệ thống inventory mới | Sổ tay, thẻ, thông báo, cassette, máy ảnh và tư liệu đã có trong truyện |
| Audio | Không sản xuất bộ nhạc/SFX hoàn chỉnh trong G1 | Đề xuất ban đầu: 4 sắc thái nhạc, 4 nhóm ambience, 12–20 SFX dùng lại; G5 chốt sau cue audit |
| UI | Hộp thoại, tên, portrait, địa điểm, gợi ý tương tác | Các luồng player hiện có; icon/font/layout hoàn chỉnh |

Số lượng trên là dự toán phạm vi để review, không phải quota chất lượng hoặc một
bộ asset đã tồn tại. Hành lang concept ghi tầng 2/lớp 12A3; raw First3Days đặt
Phòng số 3 ở tầng trệt dãy C và lớp của Khuê là 11A3 dãy B. Giữ concept làm
chuẩn thẩm mỹ; lúc dựng map phải theo bối cảnh truyện, không đổi lore theo biển chữ.

## 5. Hợp đồng kỹ thuật xuyên các goal

- Tách ảnh concept tham chiếu và master sản xuất. Không cắt một ảnh có sẵn UI/nhân vật thành nhiều miếng rồi gọi đó là background tách lớp; phải có nội dung sạch ở vùng bị che.
- World units/camera/interaction độc lập độ phân giải ảnh. Sprite pixel và background smooth có sampling riêng. Không áp `image-rendering: pixelated` lên toàn bộ cảnh/UI.
- Dữ liệu người nói/biểu cảm dùng ID; không đoán qua prefix `Vân:` trong câu thoại. Text vẫn qua locale catalog; biên tập copy thuộc content và cần rà nghĩa, không regex trong renderer.
- NPC xuất hiện theo state/định nghĩa đã validate; pose, camera và audio không tự cấp vật phẩm, bằng chứng hoặc tiến ngày.
- Review content version, clip/actor references và saved projection khi đổi bộ art. Bằng chứng migration phải gồm save được tạo bằng runtime trước thay đổi.
- Cùng một schema/reference validator được dùng khi edit, build và load. Có field mới phải sửa đường inspector/preview tương ứng, không để tác giả chỉ sửa raw JSON mãi.
- Assets phải có nơi lưu nguồn và quy trình restore. Chỉ dùng existing local tools hoặc công cụ tạo ảnh phù hợp; khi dùng AI, giữ reference/input/provenance và kiểm tra continuity, không coi output tự động là animation đạt chuẩn.

## 6. Giới hạn của mốc này

Chưa mở tuần mới, Boss canonical, ending, gallery, voice acting, nền tảng phát hành
mới hoặc engine. Không xây dynamic lighting/shadow system, physics tổng quát hay
framework animation mới để làm một phòng. Hosted CI và public publication vẫn
chưa nằm trong yêu cầu; nghiệm thu bằng local checks/static artifact và review.

## 7. Checklist bàn giao chung

- [ ] G1 đã có quyết định hình ảnh và bản chơi được duyệt.
- [ ] G2–G6 có coverage gắn với từng cảnh/nhân vật/luồng của 3 ngày, không còn placeholder ở phần công bố hoàn chỉnh.
- [ ] G7 có asset sources, provenance, bundles và round-trip thật cho các contracts mới.
- [ ] G8 có kết quả hai route, save cũ/mới, keyboard, lifecycle, restore và static build.
- [ ] Các phép đo có máy/browser/viewport rõ; không dùng test thời gian giả để khẳng định FPS.
- [ ] Các điểm chưa duyệt hoặc chưa kiểm chứng được ghi đúng trạng thái, không tự chuyển thành quyết định đã chốt.

**Bước tiếp theo sau review plan:** giao thực hiện G1 theo plan liên kết; các G
khác chỉ có roadmap. Không có task triển khai nào được đánh dấu hoàn thành ở đây.
