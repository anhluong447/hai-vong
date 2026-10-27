# G1 Review B R1 — visual cohesion & game feel implementation plan

> **For agentic workers:** Chỉ triển khai sau khi người dùng review/giao thực hiện
> bản re-plan này. Giữ phương thức inline `superpowers:executing-plans` đã chọn;
> không tự phân công implementation agents hoặc mở G2–G8. Checkbox chưa làm.

**Goal:** Làm lại Room3 để nhân vật thuộc về căn phòng: đồ đạc đúng tỉ lệ, che khuất
và bóng tiếp xúc thật; bước chân có trọng lượng, camera mềm và không còn bíp thử.

**Architecture:** Giữ một lane side-scroll. Scene props/depth/shadows và các preset
locomotion/camera/encounter/atmosphere là managed data chung runtime–Workspace.
Motion tích phân thuần qua GameSession; renderer/foley dùng quãng đường thực, còn
calendar/energy/story outcomes độc lập. Save mới có migration trước live replacement.

**Tech Stack:** ES modules, Canvas2D/DOM, Web Audio, JSON/shared validators, pipeline
Python trong private `.venv` hiện có. Không engine/dependency mới.

**Spec:** [Director feedback design](../specs/2026-10-27-g1-review-b-cohesion-design.md).
Baseline `db7bea8`, `feat/first3-art-direction`, active `.worktrees/phase-0`.
Status2026-10-27: planning only; không phải continuation tự động của plan cũ.

## Global Constraints

- 192px visible native/152logical Khuê; Vân×0.92; viewport960×540, room1280×540,
  baseline420. Art mới ở nguồn riêng, protected originals/Bible/GDD/raw nguyên byte.
- Một lane A/D; depth là art-authored. Không thêm top-down movement/collider chặn
  route, auto-teleport player, quest/flag/effect/text/cost hoặc lịch mới.
- Bàn60–68units; cửa clearance1.3–1.4×Khuê; outline props gần người cùng grid,
  background xa smooth. Floor gỗ mới; tường phía sau props phải thật sự sạch.
- Time-to-max0.08–0.10s. Tuning đề xuất speed160, ramp0.09s, stop0.08s,
  cycle96units/6frames; C2 chốt lại bằng chơi, không claim director đã duyệt các số đó.
- Follow0.07 tại60Hz phải chuyển theo dt; dialogue zoom1.07 trong giới hạn1.05–1.10;
  dust18 trong15–20; camera/foley không tạo gameplay outcomes.
- Lấy foley thật có provenance; silence khi chưa có nhạc thật, không tone giả làm
  âm thanh hoàn thiện. Không cài tool global hoặc tải nguồn không rõ quyền sử dụng.
- RunSnapshot4/content0.0.4 dự kiến; SaveEnvelope1 không đổi. Validate toàn bộ save
  trước assignment, rollback/abort toàn bộ resource owners khi prepare fail.
- Tất cả palette/timing/asset IDs/labels/placement qua content; không if Room3/Van
  trong generic renderer. New properties cần đường tạo/edit/preview/save dùng chung.
- C1/C2 và Review B cuối là feedback thật; không suy approval từ test hoặc im lặng.

## Review Focus

1. Khuê tương tác ở hai mép radius, quay trái hoặc load giữa narration: bàn vẫn
   che đúng lower body, focus đủ hai người, không teleport — R02/R06/R08.
2. Nhả/đảo phím, A+D, đụng bounds, hidden/pause trong giảm tốc: không drift âm thầm,
   không fake footsteps, không bắt kịp thời gian đã pause — R04/R05/R08.
3. Save/load hoặc stale hot reload giữa zoom/foley decode: không ghost voice,
   nhảy camera sang scene trước hoặc đổi reward/line reveal — R03/R05/R06/R07.
4. Prop/blur rendition/shadow thiếu hoặc alpha/pivot sai: fail đúng pointer và
   giữ owner tốt, không fallback PNG cũ có đồ bake trùng — R01/R02/R07.
5. DPR/fractional zoom/long text, reduced motion và CPU4x: pixel sprite/props còn
   rõ; editor picking đúng transform; đo/báo budget miss, không nới ngưỡng — R06/R08.

## File map và interfaces dùng xuyên tasks

| File mới/sửa | Trách nhiệm |
| --- | --- |
| `assets/sources/g1-cohesion/`, bundle `assets/bundles/first3-art-g1-v2.zip` | Masters sạch, props, bóng, beam, foley, prompts/provenance; V1 giữ bytes |
| `content/assets/{imports,manifest}.json`, inventory | Recipe/exports có hash; manifest chỉ qua generator |
| `src/contracts/schemas/{scenes,actors,animations,asset-imports}.json` | Props/shadows/preset refs/cadence; blur rendition có bounds |
| `src/contracts/validateScenePresentation.js`, `validateWorld.js`, `domain/story/validateProject.js` | Config kind mới, cross-ref, semantic validation và source pointers |
| `content/presentation/{room3,van-desk}.json` | `config` kinds `scene-presentation` và `encounter-presentation` |
| `content/gameplay/locomotion.json`, `content/dev/first-three-days/runtime.json` | `locomotion.first3`: ramp/stop; speed chỉ ở runtime, không duplicate maxSpeed |
| `src/domain/world/{Motion,worldCommands,worldState}.js`, `src/domain/story/stepStory.js`, `src/application/GameSession.js` | Pure velocity/distance/stop, command routing và encounter lifetime |
| `application/{WorldPresentation,EncounterPresentation}.js` | Pure visual focus/facing/targets từ context, không DOM/audio |
| `presentation/world/{World2D,ActorView,AnimationPlayer,Camera2D}.js` | Draw passes, cadence, world/screen transform |
| `presentation/world/{PropView,AtmosphereView}.js` | Vẽ prop/shadow/nắng/bụi, own cache/dispose |
| `presentation/audio/FootstepConductor.js`, `infrastructure/browser/AudioAdapter.js` | Contact crossings và one-shot pool có lifecycle |
| `bootstrap/{main,RuntimeCheckpoint}.js`, `application/ReloadService.js` | Wiring, freeze/restore và transactional owners |
| `contracts/{RunSnapshot,PresentationSnapshot}.js`, `application/SaveMigrationPolicy.js`, `infrastructure/storage/MigrationRegistry.js` | Snapshot4, guard/migration, camera/context/motion restore |
| `tools/workspace/{RuntimePreview,EditorHost}.js`, editors/panels | Cùng renderer và metadata, inspector creation controls |
| `content/{project,first-three-days.project}.json`, pack, `content/pipeline/release.json` | Đăng ký source/schema/version, release snapshot version |

Các file/path không có ở baseline là file **sẽ tạo**, không giả định đã tồn tại.

- Tất cả đường runtime trong bảng là tương đối từ `src/` nếu không ghi prefix;
  `application`, `bootstrap`, `contracts`, `presentation`, `infrastructure` đều thuộc `src/`.
- `scene.props[] = {id,assetId,x,y,width,height,pivot:{x,y},sortY,order,sampling,
  shadows:[{assetId,x,y,width,height,opacity}]}`. Vị trí/pivot là logical units;
  shadow x/y local từ anchor prop; widths/heights positive, opacity0..1. SortY
  độc lập art anchor, ties theo order rồi ID; depth key actor là groundY/order0.
  Props bàn sortY trước/sau actors phải chứng minh bằng C1, không theo array index.
- `scene.presentationId` → config scene-presentation chứa camera, actorShadow,
  atmosphere, footstep cue variants; `interaction.presentationId` → config
  encounter-presentation `{sceneId,focusActorIds,facePartners,zoom,zoomResponse60}`.
- `runtime.locomotionConfigId` → config `{id,kind:'locomotion',accelSeconds,
  stopSeconds}`; movementSpeed chỉ từ runtime. Thiếu profile giữ constant mode cũ.
- `integrateMotion({position,velocity,travelled}, {axis,delta}, {speed,accelSeconds,
  stopSeconds,bounds}) -> {position,velocity,travelled,actualDistance}`: pure;
  duration >0, delta capped upstream; clamped displacement là nguồn cadence.
- `world.velocity`, `world.travelled`; generic `world.stop` zero velocity/moving,
  giữ position/travelled. `world.move` outcomes thêm actual displacement và
  travelled before/after; không emit một quest/energy/calendar mutation.
- `presentation.encounter: null|{sceneId,interactionId}`: chỉ set khi interaction
  story thành công, giữ say/narration/choose, clear end/transition; preset/actors
  resolve qua catalog. `resolveEncounterPresentation(state,bundle)` trả Result
  target focus/zoom và facing overrides, không đổi world.facing/position.
- `clip.locomotion = {cycleDistance,contacts:[{phase,foot}]}`; phases trong[0,1),
  unique, sorted, foot enumleft/right. G1 hai contacts0/.5; annotate foot marker
  QA trong `docs/art-direction/review-b-r1/foot-contact-measurements.json`.
- `AnimationPlayer.seekDistance(travelled,cycleDistance)` chọn phase clip; các
  clip không locomotion vẫn update(delta). ActorView chỉ dùng distance cho walk.
- `FootstepConductor.consume(moveOutcome,{clip,scenePresentation})` tạo các contact
  crossings, không phát lúc reset/restore; deterministic variant theo ordinal.
  `AudioAdapter.prepareOneShots(cueIds)`, `playOneShot(cueId)`; max4 ephemeral voices,
  per-cue prepared buffers/leases, không ghi one-shots vào audio snapshot.
- `Camera2D.update({focusX,focusY,zoom},delta,{sceneWidth,sceneHeight,profile})`;
  snapshot `{x,y,zoom}`, `restore` validate trước adopt; `toWorld/fromWorld` inverse.
  World2D render context nhận day + encounter model + reducedMotion; snapshot view
  chuyển cameraX cũ thành camera object, không giữ hai nguồn camera hiện hành.
- `AtmosphereView` dùng scene elapsed/seed; không tạo own RAF. Props/blur/shadows/
  foley chuẩn bị trong scene lease, cancellation/stale token theo World2D hiện có.
- Content migration step.3→.4 thêm bounded `presentationPatch:{sceneIds,
  dropAudioCueIds,sequenceMap:[{from,to}],legacyEncounterRules:[{sceneId,chapterId,
  interactionId}]}`. IDs resolve đúng kinds; scene/rule không trùng/ambiguous.
  `validateSaveMigrations` validate shape/refs, `contentStepsFor` chuyển nguyên policy
  vào Registry; chỉ patch records hợp lệ sau guard, không chạy script từ content.

### Thứ tự checkpoint và green trung gian

R01capture/draft → R02renderer bằng fixtures và draft → C1 → hoàn thiện/commit
R01assets rồi R02renderer. Đây là một vòng art–renderer có chủ đích, không đợi
asset production đã duyệt để bắt đầu renderer cần cho chính C1. Sau đó R03 data/
migration codec → R04motion → R05foley → R06camera → C2 → R07live integration → R08.
R03 không claim browser restore của feature chưa có owner: các test momentum đang
đi, zoom1.07 và requiredfoley rollback thuộc R04/R06/R05 tương ứng, chạy lại ởR07/R08.
Live content.3→.4 route/policy và các preset refs chỉ đăng ký/bật ởR07, khi R05/R06
đã tạo target definitions. R03 test migration.4 bằng isolated validated fixtures
(new cue/sequence definitions đủ refs), không đăng ký future refs vào player pack
đang.3. Schema4 codec có thể dùng ở intermediate commit với content.3 và camera1;
đó không phải bản giao cho người chơi hay claim toàn revision đã hoàn thành.

## R01 — Lấy baseline và làm mẫu C1 đúng tỷ lệ

**Files:** tạo `tests/fixtures/g1-r1/` capture/provenance, `docs/art-direction/review-b-r1/`;
masters/asset recipes/bundle trên file map. Sửa pipeline blur trong
`tools/pipeline/build_assets.py` và schema nếu dùng rendition blur offline.

- [ ] Trước đổi runtime/content, capture save thật từdb7bea8: Room3 exploration,
  giữa van-warning, đang giữD và foundation. Hash/provenance/capture module đầy đủ.
- [ ] Tạo shell/floor gỗ sạch, props bàn/ghế/báo/tủ/cửa/bảng, shadow và beam. Không
  sửa nguồn concept hoặc tái dùng archive chưa inventory/hash. Foley sourcing có
  provenance riêng ở R05; không block C1 để sản xuất toàn bộ âm thanh trước.
- [ ] Dùng skill imagegen cho vẽ/sửa raster khi triển khai; exception output staging
  đã được user cho phép vẫn giữ. Exact prompts/references và outputs project-bound
  vào source bundle; không gọi generation ở bước lập plan hiện tại.
- [ ] RED Python rendition: blur giữ alpha, kích thước đồng nhất clear/blur, hash
  thay theo radius, invalid radius reject nguồn; GREEN generic recipe rồi build.
- [ ] Mẫu đo scale64unitstable/205door/eyeY283, props isolation và shell absence.
  Dùng renderer R02 khi sẵn sàng để C1 thành mẫu live, không tự approve ảnh tĩnh.
- [ ] BundleV2 mới, restore sạch privatevenv trước asset acceptance, so hashes;
  V1 nguyên byte. Commit asset/provenance/recipes cùng nhau sau C1 được review.

## R02 — Shared contracts và depth/shadow thật

**Files:** schemas/file map; tạo `PropView.js`, `validateScenePresentation.js`;
tests `tests/unit/g1-r1-contracts.test.js`, `tests/browser/g1-r1-depth.test.js`.
**Consumes:** R01 assets/C1 geometry; **Produces:** props/shadows được prepare/vẽ/edit
bằng cùng schema, chưa bật mới trên player khi C1 chưa duyệt.

- [ ] RED missing/wrong-kind asset, duplicate instance IDs, NaN/negative dimensions,
  unknown sampling/blend/preset, invalid shadows/dustcount/zoom/contactphase với
  source/pointer. Data cũ thiếu fields mới vẫn validate.
- [ ] Implement contracts và bounded config validator. Add source registration;
  dùng catalog refs, không nhúng art/tuning vào renderer.
- [ ] RED canvas thật: desk occludes actor ở overlap opaque, alpha hole không che;
  reverse input array không đổi sort; phía ngoài silhouette hiện lại người;
  shadow4feet theo world/camera, không bị đổi sampling leak.
- [ ] Implement draw passes: distant background → floor → contact shadows → stable
  sorted props/actors → near foreground → atmosphere. World prepare nạp cả assets
  mới/blur variants, dispose stale/missing candidate không đụng scene tốt.
- [ ] Capture C1 tại playerx360/430/500 và bounds, views props on/off + guides.
  Chờ review C1 rồi mới chốt source production. Chạy content/architecture và focused
  depth/lifecycle; commit `feat: render authored furniture depth and contact shadows`.

## R03 — Snapshot4, encounter context và migrations

**Files:** RunSnapshot/RunState/PresentationSnapshot, SaveMigrationPolicy,
MigrationRegistry, validateSaveMigrations, world/story command paths, RuntimeCheckpoint;
tests `tests/unit/g1-r1-migrations.test.js`, `tests/browser/g1-r1-save-restore.test.js`.
**Consumes:** R01 genuine fixtures/R02 presets; **Produces:** validated velocity,
distance/context/camera fields mà R04–R06 dùng, all prior routes remain loadable.

- [ ] RED fixtures3→4 giữ gameplay/ledger/cursor/reveal/UI/elapsed; add0velocity/
  travelled, convertcameraX, recover unambiguous legacy encounter. Test full chain
  schema1→2→3→4, content.1→.2→.3→.4; foundation tone/mode không bị First3 policy xóa.
  World.moving cũ được phép vắng như constructor baseline; có mặt thì phải boolean,
  không cho sai kiểu lọt qua giá trị defaultfalse.
- [ ] RED invalid old shape/clip/actor/elapsed/audio, unknown encounter/scene,
  out-of-range camera/NaN velocity, duplicate field hoặc unrecognized version phải
  reject, slot/session/resource owner tốt giữ nguyên. Không normalize corruption.
- [ ] Implement schema/content migration theo design§6; SaveEnvelope1 giữ nguyên;
  chuyển release.saveSchemaVersion4. Phân biệt schema trước/content sau: old.3 camera
  clamp theo bounds zoom1, không diễn giải bằng field mới chưa migrate.
  Code policy/validators nhận config qua fixture trước; bản live content.4 chỉ bật
  ởR07, không thêm step.from==current content.3 làm hỏng route validation hiện tại.
- [ ] Set/clear encounter qua successful interaction và story transitions, including
  narration/choice/end. Camera targets/facing suy từ context, không text/locale.
- [ ] Đưa minimal camera snapshot/restore codec vào Camera2D/World2D ởtask này:
  camera{x,y,zoom}, oldfollow vẫn snap, live defaulty0/zoom1. Migration và restore
  default state cần GREEN; smooth/zoom render/inverse transform doR06 hoàn thiện.
  Chỉ test freeze và rollback owners đã có (world/text/portrait/audio/context).
- [ ] Chạy unit migration/old-save browser(defaultmotion0/camera1); không gọi đó
  là đã verify new moving/zoom/foley. Commit
  `feat: version motion and encounter presentation snapshots`.

## R04 — Gia tốc, friction và cadence theo quãng đường

**Files:** tạo `src/domain/world/Motion.js`; worldCommands/worldState, main,
WorldPresentation, ActorView/AnimationPlayer, animation catalog, RuntimePreview;
tests `tests/unit/g1-r1-motion.test.js`, `tests/browser/g1-r1-locomotion.test.js`.
**Consumes:** R03 motion fields/R02 validated profile; **Produces:** actualDistance
outcomes và distance phase dùng chung foley R05.

- [ ] RED analytic displacement tại30/60/120Hz bằng nhau trong0.1unit; đạt160 tại
  .09s; release stop.08s/coast6.4±0.1; clamp không tích thêm travelled; A+D target0;
  đảo hướng qua0; zero/invalid dt và pause guard; gameplay/ledger unchanged.
- [ ] Implement piecewise exact integration, actual-distance movement outcome,
  scene/spawn reset và world.stop. Update input stepping cho inertia khi axis0;
  stop ở menu/focus/hidden/interaction, không sửa state từ animation callback.
- [ ] RED held-but-blocked không đổi phase; actual movement mộtcycle96units ->
  sáu pha/2contacts; delta khác nhau cùngdistance cho cùngpose. Idle/time-based clip
  cũ còn hoạt động; preview có tạo/edit cycleDistance/contactfields.
- [ ] Inspect/redraw cycle nếu plant thiếu; record world foot markers và tolerances
  ≤2logical units trong cửa sổ plant. Không chấp nhận chỉ 6ảnh tồn tại trong atlas.
- [ ] Native tap/hold/reverse/stop qua door/timebudgets cũ, đứng nói idle đúng.
  Browser new4 save giữa chuyển động phải giữ velocity/travelled; tickaxis0 coast
  tự nhiên, menu/focusstop không ảnh hưởng SaveService capture freeze.
  Chốt speed/stride cùngC2 sau R05/R06, commit `feat: add distance-based walking feel`.

## R05 — Foley thật và loại tone khỏi First3

**Files:** tạo `content/audio/first3-foley.json`, `FootstepConductor.js`; AudioAdapter,
schema/validateResources/PresentationSnapshot, First3 scenes/entry sequence/pressure
cue; tests `tests/browser/g1-r1-foley.test.js`, asset-pipeline Python focused.
**Consumes:** R04 actual displacement/contacts; **Produces:** prepared one-shots
không thay snapshot track hoặc track khác trênbus.

- [ ] Chọn3–4 wood-shoe recordings có source/license được kiểm, waveform preview;
  nếu nguồn chưa đủ, báo blocker thay vì synth tone. Register/import/bundle/rebuild.
- [ ] RED2contacts/cycle từactualdistance, không key-repeat; no sound blocked,
  still, load, hidden hoặc beforegesture; không dồn tiếng sau resume. Decodecount
  đứng yên/từngbước không tăng, >4voices retire theo policy deterministic.
- [ ] Implement prepared buffer cache/one-shot bounded pool và conductor. Missing
  required foley chặn prepare scene với diagnostic; owner dispose/stale decode
  release đúng. Gesture/mute/SFXgain và onended cleanup dùng AudioAdapter hiện có.
- [ ] Tạo `content/sequences/first3.json`: `sequence.first3.enter`, giữ stepIDs
  curtain/arrival nhưng arrival=`wait` duration0. First3 dùng sequence mới/bỏ BGMtone;
  fixture definition giữ nguyên. Pressure playCue giữ anchor, dùng cue.first3.silent
  với master0.05s sampleszero riêng (không phải foley); không cần opcode mới.
- [ ] RED normal+importoldsave First3 không request/play audio.fixture.tone, kể cả
  entry BGM/sequence và pressure. Migration explicit scoped remap giữ sequence
  index/elapsed/values/status/paused sau validate; drop known tone tracks/intents
  hợp lệ, reject unknowncorrupt; foundation isolated fixture vẫn nghe tone cũ.
- [ ] Browser requiredfoley missing/decodefailure hoặc late reload phải rollback
  cả session/world/text/portrait/audio/context. Test autoplaydenied không replaytail.
- [ ] Native nghe *cộp* theo plant trên gỗ; pause/menu/reload/restore không ghost
  voice, song track/oneshot khác không bị footstep cắt. Commit foley+data+code.

## R06 — Camera mềm, zoom gặp Vân và nắng/bụi

**Files:** Camera2D, World2D, EncounterPresentation.js, AtmosphereView.js, main/
RuntimeCheckpoint/RuntimePreview/CanvasAdapter; managed presets/layer variants;
tests `tests/unit/g1-r1-camera.test.js`, `tests/browser/g1-r1-atmosphere.test.js`.
**Consumes:** R02 profiles/R03 context+camera/R04 distance; **Produces:** view target
và inverse transform giống editor/runtime; same scene lease ownership.

- [ ] RED factor60Hz.07 đạt cùngpath30/60/120Hz; zoom1→1.07 theo response.12;
  clamp visiblewidth/height tại mỗizoom; sceneenter/restore không cross-room lerp.
- [ ] Implement camera update/snapshot/restore, generic encounter projection và
  optional partner-facing; actualplayerposition không đổi. Narration giữtarget,
  end trả1; UI khôngzoom. Missing focusactor/wrongscene reject beforeliveassignment.
- [ ] Browser new4 save giữa zoom giữ x/y/zoom và motion; failed/stale camera/blur
  prepare không đổi good view. Các migrated3→4 save vẫn load từ defaultcamera1.
- [ ] RED inverse pointer transform DPR1/1.25/2 và fractional zoom; reducedmotion
  follow snap/zoom1/blur0/dust0; pause/hidden elapsed không advance/catch-up.
- [ ] Implement preblurred distant layer crossfade, pre-owned cached buffers;
  floor/props/actors/shadows/DOM sắc nét. Test canvas filter/blend reset mỗi pass.
- [ ] Implement beamoverlay screen +18dust deterministicseed/sin insidebeammask;
  no RAF riêng/Math.random-per-frame. Repeatedentry/reload/dispose không tăngnodes/
  caches/listeners, counts vàbitmapmemory đo trênscene thực.
- [ ] C2 playable: tap/hold/reverse/release, bàn/facefocus/camera/foley. Người dùng
  chốt tuning; lưu actual numbers/provenance thay proposals rồi commit.

## R07 — Authoring thực, bật data mới và nguồn phục hồi

**Files:** SceneEditor/AnimationPanel/ResourcePreview/EditorHost, tạo
`tools/workspace/editors/PresentationEditor.js`, ui.authoring/shared label validator,
locale catalogs, First3scene/runtime/pack/project migrations; tests
`tests/authoring/g1-r1-roundtrip.test.js`, `tests/python/test_g1_r1_authoring.py`.
**Consumes:** R01–R06 validated sources/renderers; **Produces:** authoring creation,
preview, transactional save/reopen và playerentry0.0.4.

- [ ] RED tạo prop mới/pivot/sort/shadowanchor và optional presetref, clone/delete
  used-by; tạo locomotion/contacts/beam/dust/camera settings bằng control cólabel
  locale. Invalid type/ref/value giữ workingdoc tốt với pointer chính xác.
- [ ] Implement PresentationEditor và scene/clip controls còn thiếu; không coi
  sửa rawJSON field sẵn có là đã có đường tạo property. Resource preview giữpixel,
  sprite/prop đủ bounds; picking theo transformR06. Sửa đồng bộ day khi restart.
- [ ] RED groupedundo/redo, realdraft recovery, authenticated grouped source save,
  stalehash và invalidref không ghi nửa nhóm; reopen giữsort/shadows/cadence/presets.
  Preserve-reload zoom/foley pending abort đúng, restart dùng fixture riêng.
- [ ] Bật assets/presets/First3runtime trên normalplayerentry; giữ interaction IDs,
  costs/effects/story order. Sync hai project/pack.4, no fixture rewards injected.
- [ ] Restore bundleV2 vào project-local clean copy cóprivatevenv riêng; absent
  before restore, hashes/source/output equality vàrepeat deterministic build/audit.
- [ ] Fullauthoring/sharedcontent+architecture PASS; commit resourceworkflow docs.

## R08 — Review B lại trên normal entry và artifact

**Files:** tests `tests/browser/g1-r1-journey.test.js`, `tests/release/g1-r1.test.js`,
`docs/testing/G1-R1-ACCEPTANCE.md`, visualspec/roadmap/checkpoints cập nhật khi thực hiện.

- [ ] NativeNewGame đếnRoom3, bàncheđúng/đoergonomic/contactshadow; fullgait/foley,
  cameraedges, narration/choices/end, pause/hidden/focusreturn, both3dayroutes.
  Save/load đangđi, giữa reveal/zoom, slot old.3/new.4 và effect notice đúngmộtlần.
- [ ] Capture cùngstate ởwindow/fullscreen/chữlớn với metrics thực; không gọi
  viewportemulation là fullscreen. Footplant video/markers +audio/contacttimestamps.
- [ ] Đo Room3 liveRAF180frames, load/decodedbytes/retainedheap, loops/resources
  sau nhiều lầnentry/restore. Reference vàCPU4x; so budget33.34ms đangmiss trước đây,
  không thaythreshold hoặc chefailedtarget sau report.ok=true.
- [ ] Dùng `.venv/Scripts/python.exe -B -X utf8 tools/ci.py`; khi gatefail giữrawreport,
  điều tra trướcfix, rerunfailedgate trênnguồncốđịnh; receiptsphải đúngfingerprint.
  ChạyG1R1native journey trênactual `dist/foundation-demo/<fingerprint>/`.
- [ ] Một whole-change review độc lập cuối theo inline workflow; Important/Critical
  córeproRED→GREEN vàsuitecurrentpass, minorsghi rõ. Không dispatch reviewmỗi task.
- [ ] User chơi và duyệt lại đủ5directorcriteria+cảmgiáctay. Chưa duyệt hoặc budget
  chưa đạt thì ghiđúng pending/failed, không đóngG1 hay điG2. Commit evidence/handoff.

## Lệnh kiểm và handoff

Focused JS dùng `tools.pipeline.browser_runner.run_browser` như existingplan G1;
timeout120, rawreports trong workspace riêng của **plan mới**, process exit!=0 nếu
`ok!=true`. Pythonfocused dùng `-m unittest discover -s tests/python -p <file>`;
suite dùng `tools/check.py {architecture,content,unit,browser,authoring,bot}`.
Đườngtest trên là file sẽ viết trước implementation tương ứng. Không ghi những
check này đã pass tại thời điểm chỉ lập plan.

Tự review coverage4nhóm/5criteria, interface names, migrationorder vàlifecycle
trước handoff. Bảnplan này cần review cùngdesign; chưa tự chạy imagegen, tạo audio,
sửa runtime, migrate saves, install dependency, commit sản xuất hoặc mởgoal sau.
