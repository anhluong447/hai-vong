# C2 — bản thử chuyển động, âm thanh và camera

Mở **http://127.0.0.1:8765/docs/art-direction/review-b-r1/c2/** rồi chọn **Chơi mới**.
A/D đi, E gặp Vân, Enter đọc tiếp, Escape mở menu lưu/tải. Focus khung cảnh nếu
vừa dùng nút/menu. Nút âm thanh trong menu hỗ trợ mở lại audio sau autoplay denial.

Đây là bản xem riêng dùng **createGame / GameSession / World2D / AudioAdapter /
SaveService thật**. Project ID `hoi-am.c2-review` giữ save/preferences tách khỏi game
chính. Bản thử bắt đầu chiều ngày 1 tại Phòng số 3, x430, mở sẵn điều kiện gặp Vân;
không chèn vật liệu/phần thưởng. Hội thoại và đầu ra vẫn qua commands/effects thật.
Normal player entry và hai production project vẫn content0.0.3; bật chung, authoring
controls và nghiệm thu toàn tuyến thuộc R07/R08 sau C2.

Thông số để thử tay, **chưa chốt qua review**:

| Phần | Giá trị hiện tại |
| --- | --- |
| Khuê / Vân | Giữ 192px nguồn / 152 và 139,84 logical units |
| Tốc độ tối đa | 160 units/s |
| Lấy đà / dừng | 0,09s / 0,08s; coast lý thuyết 6,4 units |
| Cadence | 96 units/cycle, 6 poses, contact tại phase0 và0,5 |
| Camera follow | Response0,07 tại60Hz, đổi theo dt |
| Zoom thoại | 1,07; response0,12 tại60Hz |
| Blur | Rendition tường xa, crossfade theo zoom; người/props/UI giữ sắc |
| Nắng / bụi | RGBA beam cache screen;18 hạt, seeded/sin, không RAF riêng |
| Foley |4 biến thể0,28s, chuẩn bị một lần theo scene, tối đa4 voices |

Nắng dùng polygon/color được author trong `content/presentation/room3.json`, dựng
một RGBA canvas lúc chuẩn bị scene. Không vẽ lại texture mỗi frame. Cache hiện
2.764.800 bytes; reduced motion giữ nắng tĩnh, bỏ bụi, camera snap/zoom1/blur0.

Foley từ bản thu **[Steps on a wooden floor #4 — Joseph SARDIN / BigSoundBank](https://bigsoundbank.com/steps-on-a-wooden-floor-4-s1518.html)**,
CC0. Master, provenance, hash, script cắt và bốn WAV nằm trong bundleV2 dưới
`assets/sources/g1-cohesion/foley/`. Các tiếng chưa được người dùng duyệt cảm giác
nghe. Zero-sample0,05s cho pressure cue được ghi riêng là silence, không gọi là foley.
Trong project C2, entry/pressure không còn dùng tone; foundation fixture giữ cue cũ.

Save schema4 thêm velocity/travelled/context và camera{x,y,zoom}; envelope vẫn1.
Guarded3→4 giữ tiến trình/reveal; patch content.3→.4 chỉ xử lý First3, giữ foundation.
Capture freeze giữ momentum; menu/focus/hidden dừng chuyển động và voices. Foley
thiếu khi restore không được thay session/world hiện hành.

**Khoảng trống còn lại: chân trụ.** Distance cadence và số contact đã có kiểm tra,
nhưng chưa chứng minh ngưỡng drift≤2units của plan. Sheet thử
`khue-gait-c2-v1.png` bị loại khỏi runtime vì chưa chứng minh stance continuity;
six-frame art cũ được giữ. Không đánh dấu hết foot sliding hoặc đạt toàn bộ R04.
C2 cần review cảm giác tay/cadence và một lượt chỉnh art chân trước nghiệm thu cuối.

[Exploration desktop](exploration-desktop.png) và [dialogue desktop](dialogue-desktop.png)
được chụp từ renderer thật: logical960×540, canvas1248×702, zoom thoại≈1,06997.
Actual ownership:19 resources/19 references/0pending,4 prepared foley,1 beam cache,
18 particles; dispose về0. Đây không phải số đo retained heap hoặc chứng nhận FPS.

Focused checks: motion/camera/contracts RED→GREEN; genuine four v3 saves, native
momentum capture/restore/coast, dialogue zoom, missing-required-foley rollback,
reduced motion, audio stale-prepare/dispose và deterministic dust đã pass.
Kết quả full regression sẽ được ghi khi các gates kết thúc; chưa claim final CI,
static artifact, V2 fresh recovery, R07/R08 hay user approval.

Kết quả handoff thực tế:

- Architecture/content trên source cuối PASS; toàn bộ JS unit **171/171** PASS.
- Full unit trước hai guard fix JS: **169 JS + 64 Python** PASS. Python/pipeline/deps
  không đổi ở hai fix; chưa chạy lại full unit gate và không nhận receipt cũ là receipt
  source cuối. Hai regression mới đã RED2→GREEN2 và nằm trong171 tests trên.
- Full browser trước guard fix **76/76** PASS. Hai lượt trên source cuối **75 pass,
  1 fetch failure** ở legacy-import; chạy trực tiếp nhóm lỗi trên source cuối **9/9** PASS.
- Full authoring có instrumentation mạng trên source cuối **47/47** PASS,0network failures.
  Các lượt gate thường có lỗi module fetch/bootstrap; đã giữ raw failures, không đổi
  loader/server theo phỏng đoán. Browser instrumentation timeout120s, không được coi là pass.
- Audit49 assets và đối chiếu bytes bundle PASS;20 protected files và V1 giữ nguyên.

Chưa có một full CI xanh liên tục hoặc đủ năm receipts current-source. Báo cáo raw
ở ledger riêng của plan `2026-10-27-g1-review-b-cohesion`. Code C2 vẫn là thay đổi
đang review; commit user yêu cầu trước khi làm C2 là C1 `af2b30c`.
