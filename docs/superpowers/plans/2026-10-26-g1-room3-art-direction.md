# Hồi Âm G1 — Room 3 Playable Art Direction Implementation Plan

> **For agentic workers:** Chỉ sau khi người dùng giao triển khai, dùng `superpowers:executing-plans` hoặc `superpowers:subagent-driven-development` theo phương thức đã thống nhất để thực hiện từng task. Checkbox `- [ ]` là việc chưa làm. Plan không cho phép tự triển khai, tự phân công agent hoặc mở rộng sang G2–G8.

**Goal:** Đưa cuộc gặp Khuê–Vân tại Phòng số 3 lên runtime thật với background nhiều lớp, sprite pixel chi tiết, portrait/biểu cảm và UI theo concept; cùng người dùng chọn chuẩn để sản xuất 3 ngày đầu.

**Architecture:** Giữ GameSession/StoryRunner và scene coordinates hiện có. Mở rộng nhỏ các content contracts cho sampling, portrait và NPC visibility; projection người nói được suy từ story cursor, không lưu bản state thứ hai. World2D và một view portrait có resource ownership riêng đọc dữ liệu đã validate; Workspace dùng cùng contracts và renderers.

**Tech Stack:** ES modules/JSDoc, Canvas2D + DOM/CSS, JSON, existing Python `.venv` pipeline (PNG/atlas/bundle), browser harness và IndexedDB hiện có. Không thêm engine, UI framework, shader library hoặc dependency mới.

**Spec:** [Roadmap tổng — mục 1 và các ràng buộc](2026-10-26-first3-art-roadmap.md); [Room 3 concept](../../design/concept/locations/bao-chi-hoang-hon.png), [corridor reference](../../design/concept/locations/Sunset_Corridor.png), [Khuê](../../design/concept/characters/Diệp%20Khuê%20Character%20Design%20Sheet.png), [Vân](../../design/concept/characters/Lục%20Thanh%20Vân%20Character%20Design%20Sheet.png); [First3Days](../../guides/FIRST-THREE-DAYS.md); [coding rules](../../engineering/CODING-RULES.md).

**Status:** Người dùng đã giao commit plan rồi triển khai G1, 2026-10-26. Base `d684512` trên `feat/first3-art-direction`, workspace hiện có `.worktrees/phase-0`. Chín sheet và hai location concept đã được commit; thông số đề xuất bên dưới chưa phải lựa chọn thẩm mỹ của người dùng. Review A/B được giữ; chưa có task nào hoàn thành tại thời điểm commit plan.

## Global Constraints

- G1 chỉ một phòng và cuộc gặp Khuê–Vân; giữ nguyên phạm vi 3 ngày đầu của roadmap.
- Nostalgic Coastal Anime, biển miền Trung, background high-resolution nhiều lớp; sprite nhiều pixel, đọc rõ chất pixel, không chibi hóa quá mức.
- Character sheets cung cấp ngoại hình; không mặc định lấy sprite chibi trong sheet làm tỉ lệ runtime.
- Ánh sáng môi trường tĩnh đủ hòa cảnh; dynamic lighting và bóng đổ thời gian thực để sau.
- Desktop browser, keyboard đầy đủ. Không để thao tác camera, animation hoặc asset load sửa gameplay.
- Không thay protected Bible/GDD/raw First3Days/concept PNG. Nội dung phát sinh có nguồn riêng; không lấy archive làm dependency.
- Mọi file/tool/cache/profile ở trong project; dùng `.venv/Scripts/python.exe -B -X utf8`. Không install thêm chỉ để lập hoặc chạy plan này khi existing setup đã đủ.
- Stable IDs; locale catalog cho mọi chữ/accessible names; asset/clip/timing/layout/đặt NPC qua managed content, không hardcode payload vào JS.
- Reuse shared schema/validation, session, input, text, save và Workspace. New fields có đường edit/preview/round-trip tương ứng.
- Các lệnh bên dưới là lệnh **sẽ chạy lúc triển khai**, không phải kết quả đã chạy khi lập plan. Chỉ commit phạm vi task khi được giao thực thi.

## Review Focus

1. Sprite nhòe ở DPR 1/1.25/2 hoặc camera dịch phân số, trong khi background bị nearest-neighbor ngoài ý muốn — T04.
2. Portrait decode cũ hoàn thành sau câu mới/scene mới, hoặc asset bắt buộc mất — T05.
3. Câu narration vẫn hiện portrait câu trước; NPC Vân xuất hiện thay Long/Khoa ở ngày sau — T03/T06.
4. Save 0.0.2 có clip fixture không còn phù hợp actor mới, hoặc migration che mất snapshot hỏng — T06.
5. Chữ dài/cỡ lớn làm UI che chân nhân vật, editor nhận dữ liệu runtime từ chối, hoặc clone sạch mất master — T05/T07/T08.

---

## 1. Mẫu sẽ làm và hai lần review

### Nội dung cố định

Dùng `chapter.first3.recruit` trong `content/dev/first-three-days/chapters/recruit.json`:
vào phòng, gặp Vân, giới thiệu Khuê/thẻ/sổ tay, nghe cảnh báo, nhận Main và trở lại
khám phá. Tái sử dụng nguyên thứ tự commands, costs, effects, flags và anchors.
Không thêm lựa chọn gameplay để trình diễn hình. G1 kiểm chứng một điểm tương tác
thật; riêng màn xem cận đạo cụ và diễn xuất bắt tay đầy đủ thuộc G4.

**Review A:** board bố cục và so sánh sprite trên cùng nền, rồi chọn một phương án
trước khi làm nhiều frame. Người dùng xem dáng/tỉ lệ/mật độ pixel; chưa cần duyệt
chi tiết ánh sáng. Ghi lựa chọn và lý do, không dùng im lặng làm đồng ý.

**Review B:** chơi đoạn thật, xem ở cửa sổ/fullscreen, thoại và quay lại world.
Chốt palette, tỉ lệ, sampling, layer order, portrait và UI tối thiểu. Nếu chưa đạt,
chỉnh đúng phần chưa đạt; không mở G2 để tránh lặp chi phí.

### Thông số thử nghiệm — đề xuất của người lập plan

| Thuộc tính | Đề xuất để tạo mẫu | Khi nào chốt |
| --- | --- | --- |
| Logical viewport | Giữ `960×540`; phòng `1280×540`, `groundY=420`, bounds/spawns hiện có | Không đổi gameplay geometry trong G1 |
| Background master | Một bộ lớp trên canvas nguồn `2560×1080`, ánh xạ về phòng `1280×540`; cạnh tối đa vẫn dưới giới hạn import `4096` | Review A kiểm tra bố cục, T04 kiểm tra coverage khi camera cuộn |
| Nhóm lớp | `exterior`, `room-shell-floor`, `furniture-back`, `props`, `foreground`; nền ngoài cửa có parallax nhẹ, kiến trúc/sàn giữ world alignment | Review A; có thể gộp lớp vô ích, không giả tách lớp bằng cách nhân ảnh |
| Dáng người | Khoảng 6–7 đầu ở bản thiết kế, giữ nhận diện Khuê/Vân | Review A, không đóng số đo cơ thể thành lore |
| Cỡ hiển thị | Thử chiều cao nhìn thấy `120/136/152` logical units trên cùng phòng | Review A chọn một; dữ liệu scale/pivot ghi theo asset được chọn |
| Mật độ pixel | So sánh chiều cao hình nhân vật nguồn `128/192/256 px` ở **cùng cỡ hiển thị**; dùng 192 px làm mẫu đầu để so sánh | Review A + xác nhận chuyển động T04; không chọn bằng cách chỉ phóng to cùng một ảnh ít pixel |
| Animation | Mỗi người đề xuất idle 2 frame, walk 6 frame; Vân chủ yếu idle trong đoạn này | Làm bộ cuối sau Review A; timing do clip data, kiểm tra bước chân và frame seam |
| Portrait | 3 biểu cảm/người, master `512×512` RGBA cùng crop/eye line | Review A/B; không nhúng cả character sheet vào UI |
| Âm thanh | Dùng settings hiện có để nghe/tắt fixture khi review; chưa sản xuất âm thanh mới ở G1 | Sound direction và bỏ tone thử hoàn toàn thuộc G5 |

Các con số là giả thuyết thử, không phải yêu cầu người dùng đã duyệt. Master high-res
không buộc đổi tọa độ domain hoặc scale pixel toàn bộ canvas. Nếu pixel nhìn chưa
đúng ở kích thước chơi, trở lại bảng so sánh trước khi sản xuất tiếp frame.

## 2. Hợp đồng và file map

Đường dẫn mới dưới đây là **dự kiến tạo khi triển khai**, hiện chưa tồn tại.

| File / nhóm | Vai trò |
| --- | --- |
| `docs/art-direction/G1-VISUAL-SPEC.md` | Bản chọn hình, layer map, bảng scale/pivot/crop/timing, proposal/approved tách rõ |
| `docs/testing/G1-ART-ACCEPTANCE.md` | Checklist manual, lựa chọn người dùng, kết quả thật và link artifact |
| `assets/sources/g1/` | PNG master từng lớp, frame, portrait; brief/input/provenance của các bản mới |
| `assets/bundles/first3-art-g1-v1.zip`, `assets/ASSET-INVENTORY.json` | Bundle mới chứa **toàn bộ nguồn cần cho pack**, gồm fixture đang dùng; giữ bundle foundation cũ nguyên bytes |
| `content/assets/imports.json`, `content/assets/manifest.json` | Source recipe và output tạo tự động; chỉ cập nhật manifest qua generator |
| `content/actors/first3-art.json`, `content/animations/first3-art.json` | Actors Khuê/Vân và clips mới; không sửa actor/clip fixture dùng bởi foundation |
| `src/contracts/schemas/{actors,story,scenes}.json`, `src/contracts/validateWorld.js`, `src/domain/story/validateProject.js` | Optional fields, reference/type/semantic validation; giữ dữ liệu legacy hợp lệ |
| `src/application/DialoguePresentation.js` | Pure projection từ cursor sang speaker/portrait, không persist thêm state |
| `src/presentation/world/{ActorView,World2D}.js` | Sampling riêng, NPC facing/visibility, preload và render layers |
| `src/presentation/ui/DialoguePresentationView.js` | Tên/portrait theo model, lease/cancellation; TextView vẫn sở hữu text reveal |
| `src/bootstrap/{main,RuntimeCheckpoint}.js`, `index.html`, `styles/base.css`, `content/ui/first3-art.json` | Wiring, transactional restore và UI tokens cho First3; shell có cấu trúc, không literal player copy |
| `content/dev/first-three-days/{scenes,runtime}.json`, `chapters/recruit.json` | Room art, đúng nhân vật ở ngày 1, metadata thoại; giữ gameplay anchors |
| `content/packs/foundation-demo.json`, `content/{project,first-three-days.project}.json` | Đăng ký documents, đồng bộ content version khi T06 đổi scene actors/clips |
| `content/gameplay/migrations.json`, `src/contracts/validateSaveMigrations.js`, `src/application/SaveMigrationPolicy.js`, `src/infrastructure/storage/MigrationRegistry.js` | Content migration có giới hạn cho visual animation projection |
| `tools/workspace/editors/{StoryEditor,SceneEditor}.js`, `tools/workspace/{RuntimePreview,EditorHost}.js`, `tools/workspace/resources/ResourcePreview.js`, `content/ui/authoring.json` | Chọn speaker/expression, NPC visibleDays/facing, preview đúng sampling/calendar |

### Interfaces cần giữ nhất quán

**ActorDefinition** giữ các field cũ; thêm optional `sampling: 'smooth'|'pixel'`
(thiếu thì hành vi smooth cũ), `portraits: Record<expressionId, imageAssetId>`.
Khi có portraits phải có key `neutral`; mọi asset là image. Actor mới:
`actor.first3.khue`, `actor.first3.van`; clip IDs `clip.first3.{khue|van}.{idle|walk}`.

**SayCommand** thêm optional `speakerId` (actor ID), `expressionId` (key trong
portraits actor). Expression không có speaker là lỗi; speaker có portraits mà
thiếu expression thì dùng key `neutral` đã validate. Speaker không có portrait
vẫn được hiện tên; narration không có cả hai field và phải xóa portrait cũ.
Không suy speaker từ text. Metadata không hợp lệ trên opcode khác `say` là lỗi.

**SceneActor** thêm optional `facing: -1|1` và `visibleDays: number[]` (ngày nguyên
dương, không trùng, không rỗng; thiếu field thì luôn hiện như cũ). So với calendar
day hiện có, không suy ngày từ story flags: `flag.first3.day2` bị reset ở rest2 nên
`day2=false` không có nghĩa là ngày 1. World preloads clips của mọi actor trong
scene, kể cả actor đang ẩn. Projection không thay interactions hoặc gameplay state.

```js
// File mới, pure read. Model chỉ chứa keys/IDs, không có DOM/Image/URL.
resolveDialoguePresentation(state, bundle)
  // -> Result<null | {speakerId, nameKey, expressionId, portraitAssetId}>
// null cho narration/ngoài say; portraitAssetId có thể null khi actor không có portraits.

// Backward compatible: context optional, actors có visibleDays cần calendar day.
World2D.render(worldState, delta, {day = null} = {})

new DialoguePresentationView({root, format, assets, revision})
view.prepare(model) // -> Promise<Result<PreparedDialogue>>; acquire/decode, chưa đổi view
view.commit(token)  // -> Result<void>; đổi model/lease đồng bộ, không I/O
view.abort(token)   // release candidate chưa commit
view.present(model) // -> Promise<Result<void>>; model lấy từ resolver phía trên
view.dispose()     // abort/release tất cả resource thuộc view
```

`resolveDialoguePresentation` tìm đúng command qua `state.story.cursor`, chỉ đọc
validated catalog. Biểu cảm có thể dựng lại từ cursor sau load; không thêm
`speakerId`/`expressionId` vào RunSnapshot để rồi có hai nguồn sự thật.
`PreparedDialogue` là token nội bộ của view gồm model, generation và lease hoặc
null cho narration/name-only. Save restore chuẩn bị token trước live assignment;
failed prepare/rollback giải phóng candidate và giữ view trước đó. `present` dùng
cùng prepare/commit cho chuyển câu thông thường, có guard generation chống stale.

## 3. Quy trình kiểm chứng dùng trong tasks

Chạy từ active worktree. Dùng các entry hiện có, không giả định CLI có `--filter`:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/check.py architecture
.venv/Scripts/python.exe -B -X utf8 tools/check.py content
.venv/Scripts/python.exe -B -X utf8 tools/check.py unit
.venv/Scripts/python.exe -B -X utf8 tools/check.py browser
.venv/Scripts/python.exe -B -X utf8 tools/check.py authoring
.venv/Scripts/python.exe -B -X utf8 tools/ci.py
```

Suite `unit` gồm JS và Python. Các suite browser/authoring tự cấp server khi không
truyền base URL. Để chạy focused module, dùng `run_browser` hiện có từ project
venv, exit khác 0 nếu JSON `ok` không true; ví dụ sau khi tạo test T03:

```powershell
@'
from pathlib import Path
import json, sys
from tools.pipeline.browser_runner import run_browser
result = run_browser(Path.cwd(), ["/tests/unit/dialogue-presentation.test.js"], timeout=120)
print(json.dumps(result, ensure_ascii=False))
sys.exit(0 if result.get("ok") else 1)
'@ | & .venv/Scripts/python.exe -B -X utf8 -
```

Thay đường module bằng test đúng task; dùng suite nếu shell/runner không hỗ trợ
cách gọi focused. Không tuyên bố suite pass khi mới chạy một module. Các profile,
log, screenshot đi vào `.cache/` project theo harness; không dùng browser profile cá nhân.

## 4. Tasks

### T01 — Chốt bản mẫu bố cục và sprite trước khi làm nhiều frame

**Files:** tạo `docs/art-direction/G1-VISUAL-SPEC.md`,
`docs/testing/G1-ART-ACCEPTANCE.md`; nguồn/board dưới `assets/sources/g1/`.

**Consumes:** concept, Khuê/Vân sheets, room geometry và thông số thử ở mục 1.
**Produces:** bản chọn Review A: layer plan, scale/pivot, sprite density và crop.

- [ ] Ghi source paths/hashes; giữ bản gốc. Dùng copy/reference khi tạo layer sạch; nếu dùng AI thì đọc skill tạo ảnh trước, giữ brief/reference/input và output trong project. Chưa tạo asset trong task lập plan hiện tại.
- [ ] Tạo một composition sạch: không HUD, portrait, nhân vật hoặc chữ lỗi dính vào nền; tái tạo phần bị che cần cho layers. Giữ chất biển miền Trung và phòng báo cũ; không biến cảng thành địa điểm mới trong gameplay.
- [ ] Chuẩn bị board 3 mức pixel density ở cùng cỡ hiển thị và 3 mức cỡ hiển thị với cùng density. Cùng góc nhìn/crop và background; không làm 9 phương án độc lập gây nhiễu.
- [ ] Kiểm tra thủ công feet baseline, silhouette, ba lô/nơ/tóc, vùng UI và cửa; gắn nhãn phương án qua tài liệu, chưa đưa copy thử vào player.
- [ ] Cho người dùng xem Review A, ghi lựa chọn cụ thể. Chờ câu trả lời cho các lựa chọn này trước khi nhân bản frames; có thể tiếp tục các contract/test độc lập với lựa chọn.
- [ ] Commit phạm vi mẫu được chọn và quyết định: `docs: define room-three visual production target`. Không ghi đạt Review A khi mới có board.

### T02 — Sản xuất bộ asset G1 và chứng minh đường phục hồi

**Files:** `assets/sources/g1/`, `content/assets/imports.json`, generated
`content/assets/manifest.json`, `assets/bundles/first3-art-g1-v1.zip`, inventory;
sửa `tests/python/test_asset_pipeline.py` khi cần coverage cho ảnh lớn/alpha.

**Consumes:** lựa chọn Review A, PNG/atlas/bundle pipeline đã có.
**Produces:** source PNG + imported asset IDs sẵn dùng, hash inventory và bundle.

- [ ] Tạo 5 lớp đề xuất ở cùng hệ tọa độ nguồn, transparency đúng, đủ vùng che sau đồ vật. IDs `image.first3.room3.{exterior|shell|furniture|props|foreground}`; room geometry không đổi. Layer kiến trúc/sàn không được trượt tương đối khi camera đi.
- [ ] Làm Khuê/Vân đúng tỉ lệ đã chọn: mỗi người idle 2/walk 6 frame theo đề xuất; chân/pivot cùng gốc, khoảng trống atlas không cắt tóc/túi. Kiểm tra walk cycle bằng preview, không gọi một hàng hình minh họa là cycle hoàn chỉnh.
- [ ] Tạo portrait RGBA riêng: Khuê `neutral/thoughtful/determined`, Vân `neutral/guarded/sad`; IDs `image.first3.{khue|van}.portrait.{expressionId}`; cùng canvas/crop, không viền giấy hoặc tên người nói dính vào ảnh. Biểu cảm chưa xuất hiện trong recruit được xem qua preview, không thêm thoại để dùng hết asset.
- [ ] Đăng ký masters/atlas/import/provenance bằng ID; lưu brief/input mới dưới source root để được bundle. Asset mới dùng license/provenance riêng đúng nguồn; không giả gán `LicenseRef-ProjectFixture` hoặc tự ghi production approved.
- [ ] Nếu mở rộng pipeline, viết case trước: ảnh RGBA lớn giữ alpha, atlas có padding và bounds đúng, bundle giữ đủ master/input; xác nhận fail trước khi sửa. Không viết test chỉ đếm file cho một thay đổi data.
- [ ] Chạy build/audit; build lại cùng input xác nhận hashes không đổi. Thử restore trong bản copy rỗng dưới `.cache/tmp/g1-recovery/`, có private venv/contained tool paths theo setup, không import dependency từ venv khác.
- [ ] Commit source bundle/recipe/inventory/generated manifest cùng nhau: `assets: add recoverable room-three and character art`. Không commit master đang bị ignore mà không có bundle tương ứng.

### T03 — Contracts và projection cho portrait, pixel sprites và NPC

**Files:** schema actors/story/scenes, `validateWorld.js`, `validateProject.js`;
tạo `src/application/DialoguePresentation.js`,
`tests/unit/dialogue-presentation.test.js`; bổ sung `tests/unit/world.test.js`.

**Consumes:** interfaces ở mục 2 và patterns Diagnostic/Result/ContentCatalog.
**Produces:** dữ liệu optional mới validate được; pure resolver dùng chung.

- [ ] Viết RED `presentation metadata rejects invalid references`: unknown speaker/portrait, expression không thuộc actor, expression thiếu speaker, sampling lạ, NPC facing=0 hoặc visibleDays có 0/trùng/sai kiểu đều trả diagnostic có source/pointer; dữ liệu foundation không field mới vẫn hợp lệ.
- [ ] Viết RED resolver: câu Vân guarded → actor Vân/portrait guarded; chuyển narration → null; cursor câu Khuê → actor Khuê. Clone state trước/sau phải bằng nhau; label locale thay đổi không đổi speaker selection.

  Assertions cốt lõi trong test `guarded portrait follows cursor while locale text changes`
  (fixture khai báo actor nameKey `first3.character.van` và metadata theo mục 2):

  ```js
  equal(result.value, {
    speakerId: 'actor.first3.van', nameKey: 'first3.character.van',
    expressionId: 'guarded', portraitAssetId: 'image.first3.van.portrait.guarded'
  });
  equal(resolveDialoguePresentation(narrationState, bundle).value, null);
  equal(state, before);
  ```

- [ ] Thêm optional fields và semantic validation đúng mục 2; `resolveDialoguePresentation(state,bundle)` đọc cursor, trả Result, không thêm mutation hoặc snapshot fields. Dùng `neutral` chỉ theo rule đã validate, không che missing asset bằng inline fallback.
- [ ] Chạy focused tests đến GREEN rồi `architecture`, `content`, `unit`; invalid data không throw ra ngoài validator.
- [ ] Commit: `feat: define managed dialogue and character presentation contracts`.

### T04 — Renderer phối background high-res và sprite pixel

**Files:** `ActorView.js`, `World2D.js`, khi cần `CanvasAdapter.js`;
`tools/workspace/RuntimePreview.js`; tạo `tests/browser/g1-rendering.test.js`.

**Consumes:** Actor sampling/NPC fields T03, master/asset IDs T02.
**Produces:** cùng renderer cho runtime/editor, render đúng filter/calendar/facing.

- [ ] Viết RED trên canvas thật: sprite `sampling=pixel` giữ cạnh pixel, nền smooth vẫn smooth sau actor draw; test context sampling được khôi phục để actor không làm bẩn lớp kế tiếp.
- [ ] Viết RED `NPC day visibility changes only drawing`: days 1/2/3 chọn đúng actors, không đổi interactions, energy hoặc world position; facing -1 render đúng. Context không có day phải chặn/hide actors có visibleDays, không coi là luôn hiện. Prepare/reload vẫn nạp/release tài nguyên cho actors ẩn và chặn late decode.
- [ ] Thực hiện `World2D.render(world,delta,{day}={})`, render NPC theo visibleDays/facing; cập nhật main và RuntimePreview call sites truyền `session.snapshot().gameplay.calendar.day`. ResourcePreview clip không có ActorDefinition: bổ sung sampling theo lựa chọn preview trong authoring config để clip pixel được preview đúng, không dùng smooth mặc định cho mọi clip. Sampling của sprite dùng context save/restore, không pixel hóa canvas toàn cục.
- [ ] Không đổi domain coordinates để sửa jitter. Kiểm tra DPR 1/1.25/2, CSS width 960/1280/1920, camera tại giữa và hai mép, chuyển frame khi đi. Ghi giới hạn ở fractional scale; không hứa pixel-perfect trên mọi zoom.
- [ ] Kiểm tra coverage lớp: không lộ khoảng trống lúc camera chạy hết bounds, chân không trượt và foreground không che mất tương tác. Background tĩnh không bị motion sinusoidal của fixture làm rung cả căn phòng.
- [ ] Chạy focused module + existing `world-lifecycle`/`display` tests; commit `feat: render detailed pixel actors over layered scenery`.

### T05 — Hộp thoại và portrait đúng concept trên UI thật

**Files:** tạo `DialoguePresentationView.js`, `content/ui/first3-art.json`;
sửa `main.js`, `RuntimeCheckpoint.js`, `index.html`, `styles/base.css`, hai locale catalogs khi thêm keys;
tạo `tests/browser/g1-dialogue-view.test.js`.

**Consumes:** model T03, AssetService leases, TextView/FocusRouter và tokens hiện có.
**Produces:** name/portrait đổi đúng câu; DOM text/controls giữ hoạt động cũ.

- [ ] Viết RED: present Vân rồi Khuê khi ảnh Vân decode chậm không được hiện lại Vân; narration xóa tên/portrait; dispose giữa acquire không giữ lease; required portrait mất trả lỗi có đường recovery, không dùng mặt người khác.
- [ ] Viết RED `restore portrait preparation is transactional`: restore có portrait thiếu/decode lỗi không thay session/world/text/name/portrait đang tốt; prepare candidate thành công rồi bước sau fail phải abort đúng lease; commit không await I/O. Nối prepare/commit/abort của view vào RuntimeCheckpoint, giữ rollback/finalize semantics hiện có.
- [ ] Viết RED UI: Tab/Enter/advance, auto/skip/backlog/menu trở lại đúng context; textScale lớn nhất settings cho phép và locale en-XA không cắt câu/lựa chọn, focus không bị portrait chiếm.
- [ ] Implement `DialoguePresentationView.present(model)` theo mục 2; canvas portrait hoặc cách vẽ khác phải dùng acquired resource, không tự fetch raw URL bỏ qua hash/lease. Chỉ request lại khi model thay, không acquire mỗi RAF.
- [ ] Tách UI tokens riêng cho First3: navy/kem, viền vừa đủ cũ, nhãn tên và portrait theo concept; không hardcode palette trong component. Giữ `ui.foundation` cho mechanics pack. Shell chỉ thêm structure/data roles, mọi nhãn qua catalog.
- [ ] Hộp thoại trên màn chơi phải có vùng an toàn cho chân/điểm tương tác; ở chữ lớn cho phép panel tăng/scroll có keyboard, không ép chữ nhỏ để giống ảnh. G1 chỉ cần tên địa điểm/gợi ý tương tác và thoại; full top HUD/menu art thuộc G6.
- [ ] Giữ nguyên text/cost và commands recruit trong G1. Prefix người nói còn trong locale được ghi là copy cleanup cho G4/G6, không regex cắt text hay đoán speaker. Narration/hành động trộn thoại chưa tách được vẫn là narration, không gán nhầm người.
- [ ] Chạy focused module + existing player flow/platform checks; commit `feat: present managed dialogue portraits and room-three UI`.

### T06 — Ghép cuộc gặp thật và migrate save 0.0.2

**Files:** actors/clips first3-art, scene/runtime First3, recruit metadata,
pack/projects version, migration files ở mục 2; bổ sung
`tests/unit/managed-content-migrations.test.js`, `tests/browser/content-migration.test.js`;
tạo fixture save G1 trong `tests/fixtures/g1/` cùng provenance.

**Consumes:** T02–T05; chapter/scene IDs, effects/flags từ Phase 0.
**Produces:** player entry bình thường chơi được đoạn G1; save trước đổi art load được.

- [ ] **Trước khi thay live content**, tạo save thật bằng runtime base `d684512` trong isolated project-local copy: đứng tại Room 3 và giữa câu `van-warning`; giữ envelope/provenance. Không giả gọi snapshot sau thay đổi là save cũ.
- [ ] Viết RED migration: load save 0.0.2 giữ cursor, reveal count, position, camera, UI, calendar, flags, quests, receipts; metadata portrait dựng lại đúng từ cursor; advance không lặp `main-start`/`main-notice`.

  Assertions cốt lõi trong test `old room-three reveal resumes without repeating notice`:

  ```js
  equal(migrated.schemaVersion, 3);
  equal(migrated.contentRevision, '0.0.3');
  equal(migrated.story.cursor, oldSnapshot.story.cursor);
  equal(migrated.presentation.dialogue, oldSnapshot.presentation.dialogue);
  equal(migrated.presentation.view.text, oldSnapshot.presentation.view.text);
  equal(migrated.gameplay, oldSnapshot.gameplay);
  equal(migrated.executionLedger, oldSnapshot.executionLedger);
  equal(migrated.presentation.view.world.actors.player, null);
  ```

- [ ] Viết RED hỏng: actor clip không nằm trong danh sách old clip đã khai báo, actor key lạ, hoặc scene lạ không được migration "sửa cho qua"; session và slot tốt giữ nguyên khi restore bị từ chối.
- [ ] Thêm actors/clips/art UI vào pack. `runtime.first3.playerActorId` dùng Khuê mới; foundation runtime giữ fixture. Room 3 có actor Vân (ID instance `van`, facing -1, visibleDays `[1]`); giữ instance `speaker` generic cho ngày sau với visibleDays `[2,3]` đến G3/G4. Không biến Vân thành người đại diện mọi cuộc gặp; các maps/ngày chưa làm vẫn có nhãn chưa hoàn thiện.
- [ ] Chỉ metadata thoại đơn nghĩa: `van-warning=Vân/guarded`, `van-memory=Vân/neutral`, `van-alone=Vân/sad`, `khue-membership=Khuê/neutral`; các câu mô tả/mixed narration không speaker. `id`, `textKey`, params, effects và flag commands không đổi. Dùng tên nhân vật qua locale keys trong actor definition.
- [ ] Bump cả hai project và pack từ `0.0.2` sang **`0.0.3`**, giữ route `0.0.1→0.0.2`; thêm bước `0.0.2→0.0.3` với `addFlags:[]`, `addQuests:[]`. Không bump RunSnapshot 3 vì không thêm persisted field; nếu triển khai thay cấu trúc thì phải sửa quyết định và migration trước.
- [ ] Mở rộng có giới hạn migration step bằng optional `resetActorAnimations:{sceneIds,clipIds}`. `sceneIds` là bảy First3 scene IDs hiện có; `clipIds` là hai fixture idle/walk cũ. Trong đúng saved scene, chỉ các animation snapshot mang clip đã khai báo và pass `validAnimationState` được thay bằng `null` (giữ actor keys); animation null giữ null. Unknown clip, elapsed/paused/status hỏng hoặc snapshot shape sai phải reject trước khi reset; không xóa dấu vết corruption. Giữ toàn bộ `presentation.view.text/ui`, world camera/elapsed, domain state và audio/sequence; không xóa cả presentation view. World restore đã biết dựng lại actor từ null; không reset story hoặc reward.
- [ ] Cập nhật shared migration validator + `contentStepsFor` để chuyển policy data vào MigrationRegistry. Validating actor keys/range/flags vẫn chạy trước live assignment. Test cả chain 0.0.1→0.0.2→0.0.3 và foundation save không bị reset visual ngoài scope.
- [ ] Chạy content/unit và browser migration; commit `feat: integrate room-three art with explicit save compatibility`.

### T07 — Authoring thực tế và tài nguyên phục hồi được

**Files:** StoryEditor/SceneEditor/EditorHost/authoring config và previews;
tạo `tests/authoring/g1-art-roundtrip.test.js`; cập nhật ASSETS/RESOURCE-WORKFLOW
nếu contract mới cần hướng dẫn. Sửa `ResourceIndex` chỉ nếu test mới chứng minh cần.

**Consumes:** cùng data/validator/projection/renderers từ T03–T06.
**Produces:** tác giả sửa được speaker/expression/NPC visibleDays/sampling bằng tool.

- [ ] RED: chọn speaker trong Story Editor, expression options theo đúng actor; đổi actor/portrait reference có used-by; missing expression/asset bị diagnostic source pointer, giữ working document tốt.
- [ ] RED: sửa layer, NPC facing/visibleDays và clip pivot → preview đúng runtime → undo/redo → save source group → reopen, vẫn giữ các field. Preview không mở/ghi player save database.
- [ ] Thêm field selectors/preview còn thiếu; mở rộng references trong `content/ui/authoring.json` theo schema, không làm một cách diễn giải speaker thứ hai trong editor. Expression selector lọc theo speaker ngay cả khi tạo mới optional metadata; sửa field JSON hiện có không đủ chứng minh đường tạo field. ScenePreview có chọn ngày trong isolated preview theo cùng GameSession/playtest contract, không sửa ngày/flags của player.
- [ ] Với reader thông thường vẫn có export/import/preview; authoring writer cần token/same-origin/allowlist cũ. Source conflict hoặc build lỗi phải giữ source/manifest tốt, không tăng quyền ghi ra project ngoài.
- [ ] Restore lại bundle G1 trong project-local copy sạch, rebuild và audit. So bytes/hashes nguồn và outputs, kiểm tra absence trước restore. Không dựa vào ignored assets của máy chính.
- [ ] Chạy authoring module + suite; commit `feat: author and recover room-three presentation assets`.

### T08 — Chơi, review và đóng G1

**Files:** tạo `tests/browser/g1-room3-journey.test.js`,
`tests/release/g1-room3.test.js`; cập nhật `G1-VISUAL-SPEC.md`,
`G1-ART-ACCEPTANCE.md`, `PROJECT-STATE.md` và guides liên quan.

**Consumes:** đoạn tích hợp T01–T07, existing keyboard/static artifact harness.
**Produces:** kết quả thật, lựa chọn Review B, mẫu đủ dùng cho G2–G6.

- [ ] Native keyboard journey từ New Game đi qua route thật đến Room 3; kiểm tra có Khuê/Vân, hướng nhìn, tương tác, portrait đúng câu/narration, nhận Main/notice đúng một lần rồi trở lại world. Không dùng debug setFlag để gọi đó là route thật.
- [ ] Save/load exploration và giữa reveal; menu/hidden tab/focus return; đổi câu khi asset pending; vào/rời phòng lặp lại và dispose. Theo dõi assets/listeners/loops theo baseline ownership, không chỉ đếm screenshot.
- [ ] Chạy hai tuyến 3 ngày hiện có để phát hiện regression dù G1 chỉ phủ art một đoạn; các phần chưa phủ vẫn được ghi rõ là fixture. Raw First3Days và protected narrative/gameplay/concept hashes giữ nguyên.
- [ ] Full local gate cuối dùng `tools/ci.py`; sau đó chạy bản static export từ `dist/foundation-demo/<fingerprint>/` bằng native keyboard G1 test. Fingerprint lấy từ output thực tế, không viết sẵn đường giả. Không thêm publish hoặc hosted-CI work.
- [ ] Chụp cùng trạng thái ở window/fullscreen và cỡ chữ lớn; đo tải cảnh/decoded assets/frame time trên máy/browser đã ghi. Chưa có đủ bằng chứng thì ghi unverified, không tuyên bố 60 FPS hoặc máy yếu đạt chuẩn.
- [ ] Review B cùng người dùng: cảnh có đúng chất biển miền Trung/hoài niệm, sprite đủ nhiều pixel và không quá chibi, đọc rõ mặt/đồ vật/UI, chuyển động không trượt. Kết quả kỹ thuật pass không thay thế lựa chọn thẩm mỹ.
- [ ] Ghi chuẩn đã chọn, ảnh/video/artifact paths, checks thực chạy, lỗi còn lại và phạm vi fixture. Đóng G1 chỉ khi phần kỹ thuật đạt và người dùng duyệt bản chơi; nếu chưa duyệt thì trạng thái `awaiting visual review`, không tự đóng.
- [ ] Commit `test: verify room-three art-direction slice`; dừng ở bàn giao G1. Chỉ bắt đầu G khác khi người dùng giao việc tiếp.

## 5. Điều kiện nghiệm thu G1

- [ ] Một Room 3 thật có lớp xa/phòng/đồ vật/tiền cảnh; không còn UI/nhân vật in chết trong background.
- [ ] Khuê/Vân đúng sheet và tỉ lệ được chọn, sprite pixel chi tiết; khung đứng/đi cùng baseline, sampling không làm hỏng nền.
- [ ] Speaker/portrait đổi theo metadata, narration xóa model cũ; các biểu cảm còn lại preview được.
- [ ] UI tối thiểu nhất quán concept, text/keyboard/cỡ chữ lớn hoạt động; chưa coi HUD/menu/audio toàn game đã xong.
- [ ] Scene/editor/runtime chung data; nguồn art được bundle và restore thật.
- [ ] Save base 0.0.2 resume đúng, migration không che snapshot hỏng, effects không lặp.
- [ ] Existing route regressions và static G1 journey có evidence; giới hạn máy/browser được ghi.
- [ ] Review A và B có lựa chọn người dùng; tài liệu chuẩn đủ để người khác tạo asset kế tiếp.

## 6. Những việc không kéo vào G1

Full art hành lang hoặc 6 map còn lại, toàn bộ cast/portrait, dàn dựng cả 11 story
documents, real BGM/ambience/SFX pack, toàn bộ HUD/menu, custom-font conversion,
inventory/prop viewer mới, handshake animation, dynamic light/shadow và tuần mới.
Các phần này được phân về roadmap; G1 không dùng chữ "hoàn chỉnh 3 ngày" để mô tả
một phòng mới. Một yêu cầu mới thay phạm vi phải được phản ánh vào plan/checkpoint.

## 7. Handoff sau bước lập plan

Người dùng đã giao commit plan rồi triển khai; thực thi trực tiếp trong cùng
session, chia commit theo task. Tại lúc commit plan chưa chạy task nào, chưa tạo
asset, chưa thay runtime và chưa có Review A. G1 phụ thuộc các interface chung và
phản hồi hình ảnh; không tự bỏ Review A để làm trọn bộ art theo suy đoán. Có thể
làm contracts/tests không phụ thuộc lựa chọn hình trong lúc chờ review.
