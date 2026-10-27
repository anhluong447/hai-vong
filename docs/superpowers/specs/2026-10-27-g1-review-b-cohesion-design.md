# G1 Review B — chỉnh chiều sâu, đồng bộ nét và cảm giác điều khiển

Ngày: 2026-10-27. **Trạng thái: bản đề xuất để người dùng review; chưa triển khai.**
Nguồn yêu cầu: Director Feedback “Visual Cohesion & Game Feel” ngày 2026-10-27.
Baseline kỹ thuật: `db7bea8`, nhánh `feat/first3-art-direction`.
[Plan thực hiện](../plans/2026-10-27-g1-review-b-cohesion.md).

## 1. Quyết định của director và phạm vi sửa

Review B hiện tại cần làm lại. Gate kỹ thuật của bản cũ không chứng minh đã đạt
mỹ thuật/game feel. Bốn nhóm bắt buộc: đồ đạc tách lớp/che khuất/bóng tiếp xúc;
đồng bộ nét và ergonomic; gia tốc/ma sát/foley/nhịp chân; camera/zoom/ánh nắng/bụi.

Giữ Nostalgic Coastal Anime ven biển miền Trung, nhân vật pixel chi tiết không
chibi. Review A **192 px nhìn thấy / 152 logical units**, Vân ×0.92 vẫn có hiệu lực.
Giữ viewport960×540, phòng1280×540, walking baseline420 và lối đi A/D. Không thêm
điều khiển lên/xuống, engine 3D hay nhiệm vụ mới. Story anchors/text/cost/effects,
calendar, energy và receipts giữ nguyên. Protected Bible/GDD/concept/raw nguồn
giữ byte; mọi tranh sửa là master mới.

Feedback mới **thay thế** quyền gộp furniture vào shell và việc để toàn bộ foley/
ánh sáng sang G5: G1 lần sửa này có bước chân thật, contact shadows, nắng/bụi và
camera thoại. Nhạc/ambience/full SFX pack, toàn bộ cast/maps/HUD vẫn ở roadmap sau.
Di chuyển mới dùng chung `runtime.first3` để không đổi cảm giác khi qua cửa;
foundation mechanics giữ profile cũ. Art/camera/foley bề mặt mới chỉ phủ Room3.
Loại cue tone thử khỏi toàn bộ tuyến First3, không mở dự án sản xuất nhạc ở đây.

## 2. Đánh giá baseline và hướng đề xuất

- `World2D` chỉ có background → actors → foreground; furniture đã vẽ chết trong
  shell. Cắt thêm cùng hình không tạo được tường/sàn sạch phía sau.
- `world.move` hiện lấy axis×delta×240, chưa có velocity; `Camera2D.follow` gán x
  tức thời. `AnimationPlayer.update` chạy clip theo giây, chưa bám quãng đường.
- Hai cue fixture cùng dùng tone0.5s; bíp đến từ BGM/sequence vào cảnh, **không phải**
  một hệ thống footstep hiện có. `AudioAdapter.play` thay track cùng bus nên không
  thể gọi nó mỗi bước mà không định nghĩa ownership/polyphony.
- Ảnh hiện có sàn dạng gạch, props xa và lớn so với sprite. Chỉ thêm bóng không
  sửa được tỷ lệ, hướng mặt bàn và vật liệu sàn gỗ director yêu cầu.

Ba cách đã cân nhắc:

| Cách | Đánh đổi | Đề xuất |
| --- | --- | --- |
| Giữ shell, thêm overlay/bóng | Nhanh nhưng furniture vẫn dính nền, dễ nhân đôi đồ; không đạt feedback | Loại |
| Vẽ lại shell sạch, props pixel riêng, depth sort có authoring; giữ side-scroll | Sửa trực tiếp vấn đề, dùng tiếp Canvas2D và resource pipeline | **Chọn làm cơ sở bản plan để review** |
| Chuyển sang world đi hai trục/3D thật | Phải thiết kế lại collision, interaction và save; không cần cho đoạn này | Loại khỏi G1 |

Đây là lựa chọn kỹ thuật đề xuất của người lập plan, chưa ghi là người dùng đã
duyệt. Không cần quay lại chọn mật độ nhân vật; cần review mẫu phối cảnh mới.

## 3. Bố cục, lớp và tỷ lệ

### Tài nguyên phải làm thật

Tạo shell tường sạch và **sàn gỗ cũ** riêng, ngoại cảnh xa; bỏ hình bàn/ghế/báo/tủ
cũ khỏi cả shell lẫn foreground khi thay bằng prop. Door leaf/frame, khung cửa sổ, bàn biên tập,
ghế gỗ, chồng báo, tủ sắt là các PNG RGBA độc lập có pivot. Bảng treo là asset
riêng để chỉnh eye line. Phần tường/sàn bị vật che phải được vẽ lại, không clone
tranh phẳng nhiều lần và không chỉ lấy bounding-box của món đồ từ shell cũ.

Props gần người dùng outline/palette và lưới native tương thích với sprite:
`192/152` source px cho mỗi logical unit, render nearest; chỉnh nét thủ công hoặc
vẽ lại theo grid, không áp nearest lên toàn bộ nền high-res. Giữ bản đồ pixel
native, alpha sạch và không có bóng đen bake sai hướng. Nền xa vẫn smooth.

| Thước đo | Yêu cầu / mẫu đề xuất |
| --- | --- |
| Nhân vật | Khuê152 units, Vân139.84; không scale người để cứu tỷ lệ đồ |
| Mặt bàn | Cao60–68 units từ điểm tiếp đất của chính bàn; mẫu64, tương đương42.1% Khuê |
| Cửa | Lintel cao ít nhất197.6–212.8 units từ sàn tại cửa (1.3–1.4×Khuê); mẫu205 |
| Cửa sổ | Đỉnh khung ít nhất cùng khoảng clearance trên đầu; sill/chiều cao ô riêng, không đo nhầm từ sill |
| Bảng đen/ghim | Tâm vùng đọc quanh eye line, mẫu y283 với baseline420; kiểm bằng overlay trên sprite |
| Phối cảnh | Nhìn thấy mặt trên bàn; bốn chân/ghế có điểm tiếp đất nhất quán với sàn gỗ, không ép chiều sâu bằng kéo giãn ảnh |

Bố cục thử: giữ Vân x550, interaction recruit x430/radius70; bàn phủ khoảng
x350–620 để còn che đúng người khi Khuê tương tác ở các mép range. Những tọa độ
art này là đề xuất; checkpoint composition phải cố định bản được duyệt trước khi
sản xuất nhiều rendition. Cửa/home ởx80, cabinet interactionx720 vẫn với tới được.
Không tự động kéo/teleport Khuê đến một pose để che lỗi bố cục.

### Depth và bóng

`scene.props[]` chứa ID, image ID, vị trí/pivot/size/sampling, `sortY` và thứ tự
tie-break. Actor dùng baseline làm depth key. Danh sách vẽ sort ổn định theo
`sortY`, tie order và stable ID; renderer không nhận biết tên Vân/Room3.
Đây là depth tác giả đặt cho một lane đi ngang, không hứa có trục Y điều khiển.
Bàn đứng trước hai người trong staging thoại; ghế/tủ có key riêng. Player vẫn đi
sau tiền cảnh theo thiết kế; không thêm collider vô hình lên đường đi hiện có.

Alpha thật của mặt bàn/apron/chân bàn che phần người ở sau; khoảng trống dưới
bàn vẫn trong suốt. Phải thấy lower-body occlusion đúng hình đồ gỗ, không dùng
rectangle đen để giấu chân. Khi đi ra khỏi silhouette bàn, toàn thân/điểm tiếp đất
hiện lại. Kiểm cả exploration và thoại, cả hai hướng nhìn.

Bóng tiếp xúc là texture mềm alpha được quản lý: bốn anchor ở chân bàn, các chân
ghế, đáy tủ/chồng báo và shadow theo chân actor. Vẽ ở floor pass trước vật/người,
không làm bóng ở tọa độ màn hình. Màu/opacity/kích thước/anchor là data. Không dùng
shadow động toàn cảnh hoặc blur mọi sprite mỗi frame. Bóng không thay interaction.

**Checkpoint C1:** một composition thật bằng renderer, overlay số đo và tắt/bật
từng prop/shadow, camera hai mép. Chờ người dùng review bố cục/tỷ lệ trước bộ art
hoàn chỉnh. Mẫu này chưa được gọi là Review B đạt.

## 4. Điều khiển, cycle và foley

Các giá trị sau là **tuning đề xuất**, cần thử tay, không phải số director đã chốt:

| Tham số | Mẫu đầu |
| --- | --- |
| Max speed First3 | 160 units/s (baseline240); đi nhanh vừa với stride mới |
| Đạt max speed từ đứng | 0.09s, trong khoảng director0.08–0.10s |
| Nhả từ max về0 | 0.08s; coast lý thuyết6.4units trên đường trống |
| Full gait cycle | 96units/cycle; hai tiếp đất cách48units; tại160 là0.6s/cycle |
| Camera follow | factor0.07 tại60Hz, quy đổi delta-time |

Hạ speed là quyết định đề xuất để chỉnh cadence, **không mặc định bắt buộc** bởi
feedback. C1 kiểm frame/foot markers; C2 thử tay mới chốt160/stride96 hoặc bản
calibrate khác. Giữ giới hạn gia tốc director, không retime cho vừa âm thanh có sẵn.

`integrateMotion` là pure function: ramp velocity về axis×maxSpeed, tích phân phần
gia tốc/ma sát và phần cruise riêng khi chạm target giữa tick. Clamp bounds bằng
quãng đường thực; đụng mép phải velocity0, không tiếp tục cycle/foley. Đổi hướng
hãm qua0 rồi tăng hướng mới; facing theo vận tốc thực. A+D cho target0. Đi bộ
không tiêu energy hoặc advance ngày.

Thêm `world.velocity` và `world.travelled` (tổng absolute distance trong scene).
Gait phase suy từ travelled/cycleDistance; không lưu một phase domain thứ hai.
Chuyển cảnh/spawn reset motion; story interaction thành công chặn vận tốc trước
chuyển dialogue. Menu/lost focus/hidden có stop boundary rõ ràng, không để inertia
chạy ngầm. Pause để **capture save** chỉ freeze, không sửa momentum trước capture.
Load save đang đi khôi phục momentum, axis đã clear nên tick kế giảm tốc tự nhiên;
không phát bước chân lúc restore hoặc replay những bước của thời gian bị pause.

Cycle6 frame phải được inspect/vẽ sửa nếu plant phase hiện tại trượt. Annotate hai
foot contacts và foot markers trong clip data; time-based animation khác giữ API
cũ. Pose/foley theo cùng quãng đường actual, không tính theo held key, raw delta
hoặc khoảng cách camera. Chân trụ trong cửa sổ plant không drift quá2logical units
trên sàn ở kích thước chơi; đổi nếu cần frame mới, không chỉ giảm tốc video demo.

Foley: 3–4 biến thể giày trên gỗ cũ, tiếng cộp ngắn/trầm, master có provenance/license
thật. Có thể thu mới hoặc lấy bản ghi được phép dùng; chưa chọn nguồn hay claim
đã có asset. Không lấy sine/tone/tiếng gõ tổng hợp thay “foley thật”. Mọi nguồn mới
qua pipeline/bundle; nguồn thiếu quyền hoặc thiếu file phải hiện blocker.

Chuẩn bị/decode foley cùng scene, không acquire/decode mỗi bước. One-shot pool tối
đa4 voices dùng busSFX/gain/mute hiện có, không retire nhạc/track khác. Lease và
buffer thuộc scene/adapter; stop/release khi pause/hidden/load/dispose. Không lưu
tail một tiếng giày vào save và không queue bù sau autoplay denial. Vào cảnh hoặc
đứng yên không phát bước chân. Trước user gesture yên lặng; gesture sau chỉ cho
các bước **tương lai** phát. Tắt tone ở First3 BGM, entry sequence và pressure cue;
foundation fixture vẫn dùng cue riêng của nó. Không giả silence là có BGM thật.

Quyết định cụ thể để tránh sửa nhầm fixture dùng chung: tạo `sequence.first3.enter`
giữ hai step IDs `curtain`/`arrival`; steparrival là `wait` duration0 thay cue. Chỉ
First3scenes chuyển sang sequence này và bỏ scene.cueIdBGMtone; definitionfixture
cũ nguyên vẹn cho foundation. Giữ anchor playCue của pressure, đổi cueId thành
`cue.first3.silent`, trỏ asset riêng0.05s mẫu toànzero được build/provenance đầy đủ.
Đây là thay thế im lặng có chủ đích, không ghi là SFX mới hoặc foley thật. Không
cần thêm opcode/no-op tùy ý hay thay schema cue để hỗ trợ silence.

## 5. Camera và môi trường

Camera follow: `alpha(dt)=1-(1-0.07)^(dt*60)`, khác `0.07` cố định mỗi frame.
Clamp theo viewport **sau zoom**, không lộ mép phòng ởx48/x1232. New scene/restore
snap vào camera hợp lệ của scene đó, không lerp xuyên hai phòng. Camera chỉ đổi
view, không đổi world.position, hit range, flags hoặc keyboard context.

Thêm metadata `interaction.presentationId` tham chiếu managed preset. Khi start
story từ tương tác thành công, lưu **context trình diễn** (source scene/interaction),
không lưu tên người nói hay đoán từ locale/chapter ID. Context vẫn có hiệu lực qua
narration/choice của cùng cuộc gặp, xóa khi end/transition. Preset focus player và
instance van, zoom target1.07, giới hạn1.05–1.10; actor context thiếu/không đúngscene
phải reject. Pure resolver dựng target từ snapshot+catalog. Không branch Room3
trong renderer. Context này là persisted field mới, cần migration ở mục6.

Zoom dùng response0.12 tại60Hz (mẫu đạt gần target sau khoảng0.4s); state view chỉ
cần x/y/zoom hiện tại, target suy từ context. Follow/zoom interpolation cùng dt;
view inverse transform dùng cả zoom cho pointer authoring. DOM text/portrait/HUD
không zoom/blur. Focus hình học theo actual actor positions, không khóa ngầm Khuê.

Blur nhẹ chỉ exterior/tường xa. Đề xuất renditions blur sẵn bằng pipeline có recipe
và hash, runtime crossfade clear/blur theo zoom; tránh full-frame filter mỗi RAF.
Không blur actor, đồ tương tác, sàn, contact shadow hoặc UI. Giới hạn thêm decoded
image memory phải đo, không chấp nhận preload toàn bộ đồ của mọi scene.

Nắng hổ phách RGBA overlay khớp cửa sổ, blend `screen`, opacity managed; tối đa một
overlay cho Room3. Dust18 (trong15–20), seed cố định, vị trí nằm trong vùng beam,
sin chậm theo elapsed presentation. Không `Math.random()` mỗi RAF. Save elapsed
đủ dựng lại bụi; không serialize18particle objects. Pause/hidden không catch-up.
Reduced-motion: không camera lag/zoom tự động, blur0, dust0; nắng tĩnh dịu vẫn có.
Mặt/tay/chữ không bị cháy sáng hoặc glow đè lên sprite pixel.

**Checkpoint C2:** playable A/B ngắn tăng/giảm tốc, đổi hướng, nhả phím, hai mép
camera, thoại/narration/end, có nghe foley. Chốt tuning bằng cảm giác tay và video
frame-by-frame; sau đó mới đóng assets/cues để chạy acceptance cuối.

## 6. Save, source và phạm vi tương thích

Đề xuất bump **RunSnapshot3→4**, content hai projects/pack **0.0.3→0.0.4**.
SaveEnvelope vẫn1: envelope checksum/container không đổi. `content/pipeline/release.json`
saveSchemaVersion theo RunSnapshot4; validator/tests phải phân biệt hai version này.

Trước đổi runtime, bắt save thật từ `db7bea8`: exploration Room3, partial Van warning,
đang đi và foundation mechanics. Lưu capture module/commit/hash/provenance, không
fabricate old save bằng constructor mới.

Schema migration3→4 thêm velocity/travelled0 và contextnull; reset `moving` cũ vềfalse
chỉ sau validate known old world shape/boolean. View cameraX cũ ánh xạ sang
camera{x:cameraX,y:0,zoom:1}; giữ elapsed, text/reveal/UI, audio/sequence hợp lệ.
Old4 mới giữ chính xác velocity/travelled/camera/context; unknown/NaN/field/context
không hợp lệ reject trước assign. Existing1→2→3/content.1→.2→.3 vẫn chain được.

Content.3→.4 migration chỉ trong First3: validate cue fixture records trước khi bỏ
known tone tracks; không bỏ unknown track để che corruption. Giữ bus gain/mute,
sequence progress và mọi gameplay. Remap explicit `sequence.fixture.enter` sang
`sequence.first3.enter` trong First3, validate đủ snapshot cũ rồi giữ index/elapsed/
values/status/paused; hai step IDs và số step giữ nguyên. Snapshot bị hỏng reject,
không xóa command rồi normalize cursor. Definitionfixture vẫn có để validate nguồn cũ.
Pressure cue đổi resource metadata, không đổi outcomes. Khi cycle format thay đổi,
validate known actor/clip snapshots rồi reset **chỉ** locomotion projection đã khai
báo; idle/khác không tự bị xóa. Foundation ngoài scope giữ audio và constant move.

Save cũ ở giữa recruit: chỉ với đúng scene+validated cursor thuộc cuộc gặp và một
interaction match duy nhất mới suy context trong **migration explicit**; ambiguous
thì trả contextnull (không zoom) và diagnostic cho author, không đoán trong renderer.
Không advance/restart story để lấy context; Main/notice không lặp. Contextnull là
hợp lệ cho save legacy, không phải cái cớ cho new interaction quên context.

## 7. Authoring và acceptance

Scene Editor tạo/edit prop, pivot/depth/shadow anchors, ergonomic guides và preview
zoom/day; Resource Browser preview pixel/full prop, contacts/cue nghe được. Config
camera/locomotion/atmosphere và interaction preset validate cùng runtime, có đường
tạo optional fields, undo/redo, drafts, grouped source save/reopen và conflict path.
Sửa luôn minor cũ: restart Scene Preview phải giữ ngày đã chọn hoặc reset cả field
và session đồng bộ. Source writer không mở rộng allowlist ra ngoài project.

Asset V2 bundle phải phục hồi vào checkout sạch với private venv riêng, chứng minh
nguồn/outputs absent trước restore và hash khớp sau build. Giữ V1 bundle nguyên byte.

Nghiệm thu cuối phải có đủ5 tiêu chí director, cộng kiểm chứng:

1. Tắt prop bàn làm người hiện lại đúng silhouette; shell không còn bàn trùng.
2. Overlay số đo60–68, contact shadows đúng sàn; chân không lơ lửng khi đi khỏi bàn.
3. Motion và camera tương đương30/60/120Hz; không drift/click/foley khi pause, đứng
   ở mép, load hoặc focus return; dialogue zoom/blur chỉ đúng context.
4. Không request/play asset tone qua NewGame/cửa/pressure trên cả hai tuyến3ngày;
   foley thật có quyền sử dụng, đếm đúng hai contact/cycle và không cắt track khác.
5. Native keyboard, saves3/4, authoring round-trip, clean recovery, static artifact
   và người dùng chơi Review B lại. Test pass không thay approval mỹ thuật.

Performance: baseline CPU4x p95 đã miss33.34ms (33.4ms); đo lại **ngay Room3** với
props+blur variants+nắng/bụi, cả profile thường/CPU4x; báo riêng load, decoded RAM,
realRAF p95 và retained resources. Không nới budget hoặc dùng CPU step timings
để tuyên bố60FPS; chưa đạt thì giữ trạng thái chưa đạt.

## 8. Thứ tự và dừng

Baseline capture/art draft + contracts/depth → C1 composition → movement/cadence →
foley → camera/atmosphere → authoring/save integration → native/static/performance
và Review B lại. Contract/
save design được chốt trong plan trước khi code; mỗi phần cần GREEN riêng.
Tại handoff hiện tại chỉ có tài liệu. Chờ review plan/design trước triển khai;
giữ phương thức inline trước đây, không tự mở G2 hoặc coi feedback là duyệt mẫu cũ.

Builder check độc lập đã chỉ ra hai khoảng trống và đã được giải quyết trong plan:
R03 chỉ nhận codec/validation/default restore, các browser acceptance mới chuyển
về task motion/foley/camera sở hữu chúng; sequence/cue im lặng First3 được xác định
cụ thể ở§4 và scoped migration§6. Builder không chạy test hay sửa runtime.
