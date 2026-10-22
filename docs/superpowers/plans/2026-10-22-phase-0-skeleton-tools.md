# Hoi Am Phase 0 — Skeleton & Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task after the user approves execution. Steps use checkbox (`- [ ]`) syntax for tracking. This request authorizes the plan, not implementation or automatic delegation.

**Goal:** Tạo nền tảng game 2D không engine và workspace chuyên dụng, đủ để tác giả tạo một chương mẫu, kiểm tra, chơi hoàn toàn bằng bàn phím, lưu/tiếp tục, sửa và phát hành một bản thử có thể phục hồi.

**Architecture:** Clean Architecture với domain thuần, application/session điều phối và các adapter browser nằm ngoài. Nội dung JSON có schema và ID ổn định đi qua catalog/validator dùng chung; editor có working document và preview session độc lập. Runtime, tool và kiểm thử phát triển cùng từng hợp đồng, không khôi phục toàn bộ code cũ hoặc xây framework engine tổng quát.

**Tech Stack:** JavaScript ES modules + JSDoc contracts; JSON; Canvas2D + DOM/CSS; Web Audio; IndexedDB; Python 3.12+ cho dev server, pipeline và test orchestration. Chưa chọn game engine, bundler, DSL parser riêng hay thư viện UI. Thư viện/tool chuyên dụng cho schema, ảnh/audio được đánh giá và pin trong T01/T05 trước khi dùng.

**Spec:** Yêu cầu và quyết định đề xuất trong mục 1–6 của chính tài liệu này; [coding rules](../../engineering/CODING-RULES.md); [project skill](../../../skills/hoi-am-engine-free-development/SKILL.md); [Bible v2](../../design/narrative/game_story_bible_v2.md); [GDD THỦ](../../design/gameplay/GDD-Defense.md); [GDD CÔNG](../../design/gameplay/GDD-Attack.md).

**Status:** Bản kế hoạch để review ngày 2026-10-22. Chưa triển khai task nào; chưa cài dependency, tạo runtime, editor, CI hoặc nội dung game mới. Base commit: `04b24c7`.

## Global Constraints

- Engine-free 2D side-scrolling exploration, hand-drawn/anime layered scenery.
- Desktop browser; every player operation works by keyboard. Mouse is optional.
- Redesign the UI. Exact new palette, typography and composition require a visual design before production UI art.
- Preserve approved files under `docs/design/narrative/` and `docs/design/gameplay/` unless the user explicitly asks to change them.
- Twelve weeks is the eventual product acceptance criterion, not the first milestone.
- All player-facing strings, authored events, resource paths, tuning and layouts use managed content; algorithms and registered typed handlers remain code.
- Domain/application do not depend on DOM, storage, fetch, browser clocks, renderers or a global manager locator.
- Player saves, preferences, editor drafts and preview fixtures are separate; validate a complete replacement before changing a live session.
- Archived payload bytes remain unchanged. Reuse means copying selected sources to new paths with provenance, review and new tests; production never imports `archive/`.
- Existing legacy baselines remain historical evidence; new gameplay expectations must be explicit and tied to the protected design.
- Open/provisional Bible/GDD rules stay explicitly provisional in fixtures and balance data. Implementing a handler does not silently finalize an unresolved story or balance decision.
- Every execution task uses red → green → verification → focused commit. No unrun check or future command is reported as passed.

## Review Focus

1. Save requested during a reward, scene load or timed hearing: resume once from an atomic checkpoint, without double rewards or lost committed state — T03/T07/T09.
2. A content update removes an anchor or changes a flag type: migrate explicitly or keep the old session/save intact with a useful diagnosis — T02/T07/T12.
3. Missing optional art versus missing evidence/story data: optional resources can degrade visibly; required gameplay data cannot be fabricated — T05/T06/T13.
4. Hidden tab, held key, IME composition, modal nesting or lost focus: input ownership stays correct and timed gameplay pauses consistently — T06/T07/T09.
5. Invalid hot reload, concurrent source write or fresh checkout without local art: keep the last valid revision, detect conflict and provide a reproducible recovery path — T04/T12/T13.

---

## 1. Audit 8 nhóm yêu cầu so với dự định trước đó

"Đã có" dưới đây chỉ là định hướng/hợp đồng trong rule và skill, **không có nghĩa runtime mới đã triển khai**. Không có nhóm nào trước đó đã đủ đặc tả để bắt tay làm toàn bộ mà không bổ sung.

| Nhóm | Đã có trong dự định | Phần cần bổ sung/chốt trong giai đoạn 0 | Task |
| --- | --- | --- | --- |
| 1. Cốt truyện thành dữ liệu | Stable ID; event/conditions/effects; dialogue/quest tools; validator cấu trúc, tham chiếu và gameplay | Chọn JSON v1; khai báo flag có type/scope/default; anchor độc lập số dòng; kiểm tra đích nhảy, flag, asset, scene cụt và nhánh không tới được | T01–T04, T11–T12 |
| 2. Save/Load | Tách save/draft; validate trước replace; schema/migration; recovery/export | Snapshot đầy đủ cursor + flags + world/UI/audio; save tại mọi trạng thái chơi được; atomic checkpoint; migration **nội dung**; autosave, nhiều slot, backup và save hỏng | T01, T03, T07, T09 |
| 3. Debug/dev | Fixtures, command replay, guard diagnostics, trace/screenshots | Jump chapter/scene, set flag, skip; hot reload script/asset an toàn; crash package; bot duyệt nội dung và báo nhánh chưa kiểm chứng | T04, T12 |
| 4. Asset pipeline | Catalog, manifest, ID, usage lookup, source/export, group loading và lifecycle | Quy ước tên/thư mục; nén/atlas/audio conversion có thể lặp lại; fallback theo mức thiết yếu; preload/cancel/retry; quyết định kho binary có kiểm tra phục hồi | T01, T05–T06, T10, T13 |
| 5. Nền tảng | Canvas/DOM, keyboard/focus, audio buses, font readiness, Unicode, animation, camera | Browser adapters thay SDL/raylib native; rich text an toàn; viewport/DPI/fullscreen; loop points, voice/BGM/SFX, crossfade; sequencer/tween có pause/save/skip | T03, T05–T07 |
| 6. UI/UX | UI mới, toàn bộ luồng keyboard, localization từ đầu, reduced motion | Main menu/settings/save; backlog, auto và skip đúng ranh giới; remap phím, text size/speed; fixture locale thứ hai. Gamepad/gallery chưa thuộc phạm vi ban đầu | T06–T07, T10–T11 |
| 7. Phát hành/vận hành | Release versions/cache; nguồn asset; logs; reference hardware | CI, web export, máy yếu; inventory giấy phép; crash report cục bộ. Installer/Steam/cloud save và upload crash từ xa là phần sau có điều kiện | T01, T05, T12–T13 |
| 8. Sản xuất | Foundation trước 12 tuần; slice đại diện; tools đi cùng runtime | Một chương mẫu end-to-end; gate đóng từng mốc; format guide, adding-content guide, release/restore guide; kiểm soát mở rộng phạm vi | T04, T10–T14 |

Nguồn đối chiếu hiện có: [foundation reference](../../../skills/hoi-am-engine-free-development/references/foundation.md) và [nguồn nghiên cứu](../../../skills/hoi-am-engine-free-development/references/research-sources.md). Các mục chưa được mô tả trước đó được đưa thành deliverable cụ thể bên dưới.

## 2. Phạm vi P0 và những lựa chọn đề xuất

### P0 phải có

- Hợp đồng dữ liệu, runtime và tool chạy được; không chỉ tạo cây thư mục hoặc class rỗng.
- JSON cho scene/story/flag/event/quest/resource/UI; editor ghi cùng định dạng mà runtime đọc. JSON là định dạng tác giả v1; chưa xây thêm DSL/YAML để tránh ba nguồn cùng tồn tại.
- Một workspace gồm explorer, resource managers, inspectors/editors, diagnostics, history và playtest.
- Một chương fixture tích hợp có đầu–cuối, nhánh lựa chọn, thay đổi flag, chuyển cảnh, quest, General được giao đồng đội, xuất bản, evidence và phiên THỦ/CÔNG mẫu.
- Scene đi ngang, actor/NPC, tương tác, cửa, camera/parallax, animation, chữ/âm thanh/UI và toàn bộ đường chơi bằng bàn phím.
- Save/load được thiết kế từ T01, kiểm chứng đầu tiên ở T03 và tích hợp đầy đủ ở T07; không đợi cuối P0.
- Build/export, checks/CI, license inventory, crash diagnostics và tài liệu đủ để người khác thêm nội dung.

### Ranh giới với bản game đầy đủ

Chương fixture là **chapter kỹ thuật trong development/test pack**, không thêm lore vào Bible, không đưa Boss chính thức về sai tuần. Nội dung fixture được biên tập trong tool như nội dung thật, có locale keys, assets và dependency đầy đủ. Authored source nằm trong `content/dev/foundation/`, pack entry là `content/packs/foundation-demo.json`; `tests/fixtures/` chỉ giữ test inputs/expected states, không được runtime import. Production export mặc định loại test/dev packs; bản acceptance dùng profile riêng `foundation-demo` khai báo công khai và chỉ cho phép dev content đã chỉ định.

P0 xây handler/contract và ví dụ đại diện cho các hệ thống. Nội dung 12 tuần, tất cả tuyến quan hệ, balance cuối và production art toàn game là giai đoạn sau. Khuê/Vân/Long và ba cảnh sân trường–CLB–trọ là bối cảnh tham chiếu; không cần viết lại các doc đã chốt để thử hệ thống.

Gamepad và gallery: ghi rõ trong backlog, chỉ bổ sung khi có nhu cầu đã chốt. Gallery cần mô hình unlock và bộ art tương ứng; không tạo tab rỗng. Steam/achievements/cloud save/installer: chỉ xem xét khi có quyết định phát hành ngoài web. Port persistence/platform tách biệt để sau này có thể thay adapter.

### Nền tảng và dependency

Môi trường hiện kiểm tra được: Windows, Python `3.12.10`, Git `2.45.1`; `node` không có trong PATH. Bộ check/dev/build bắt buộc phải chạy được bằng Python + desktop browser; Node là tùy chọn, không âm thầm trở thành điều kiện chạy dự án.

Browser APIs cung cấp cửa sổ, input, Canvas/DOM và Web Audio; không đưa SDL/raylib native vào bản browser. T01 ghi capability matrix và pin browser/tool trong CI. T05 chọn tool ảnh/audio qua thử nghiệm nhỏ, license và deterministic-output checks; không tự viết codec. Dependency không được là game engine hoặc kéo domain phụ thuộc browser.

## 3. Hợp đồng phải chốt trước khi tăng số lượng nội dung

### 3.1 Nội dung, flag và script

`content/project.json` khai báo pack entry points và versions. Registry dùng stable namespaced ID. `FlagDefinition` có `id`, `type` (`boolean|integer|string|enum`), `default`, `scope` (`run|profile`) và enum/range nếu cần; reference tới flag chưa khai báo là lỗi. Flags gameplay khác preferences và editor state. New Game reset run flags; profile flags không mở đường tiến truyện thay run flags và chỉ thay đổi qua transaction riêng. Import một slot không được ghi đè toàn bộ profile; merge/reset profile phải có policy tường minh và test migration.

Story JSON dùng `chapterId`, `entryNodeId`, các node có `id` và command có `id` riêng. Bộ lệnh v1 giới hạn vào nhu cầu đang có: `say`, `choose`, `jump`, `setFlag`, `setBackdrop`, `showActor`, `playCue`, `transition`, `emitEffect`, `end`. `emitEffect` chỉ gọi effect handler đã đăng ký và validate params; không eval/JS tùy ý. Terminal phải khai báo `end`, không suy ra scene kết thúc do thiếu node.

Validator trả `Diagnostic {code, sourceId, pointer, relatedIds}`: UI dịch code qua TextService. Kiểm tra schema, duplicate IDs, references/assets/flag types, jump/entry/terminal, nhánh tĩnh không tới được, dependencies và quy tắc Main/Boss không phụ thuộc Side. Reachability phụ thuộc state phải kiểm tra tiếp bằng bot/fixtures; validator không tự chứng minh mọi ending đều đạt được.

### 3.2 State, commands và sequencer

`GameSession.execute(command) -> Result<{state, outcomes}>` sở hữu domain state. `StoryRunner.step(intent) -> Result<RunSnapshot>` điều phối script qua session/ports; renderer không cấp thưởng hoặc cập nhật flag trực tiếp. CheckpointService điều phối snapshot tổng hợp tại một revision nhất quán; presentation/audio adapter chỉ giữ projection và trạng thái phát lại, không sở hữu một bản domain state thứ hai.

`RunSnapshot` gồm `contentRevision`, `gameplay`, `story`, `world`, `presentation`, `audio`, `sequence`, `executionLedger`. Cursor lưu `{chapterId,nodeId,commandId,stepId}`, không lưu số dòng hoặc closure. World/presentation lưu ID và giá trị thuần: scene, vị trí/facing, actor state, backdrop, đoạn thoại và tiến độ reveal. Sequence lưu step, elapsed/progress, pause và trạng thái cần để tiếp tục. Audio lưu cue/bus, loop, gain/fade, offset; không serialize AudioNode/DOM/Image.

Mỗi command có execution identity; domain effect và ledger được commit cùng checkpoint. Chỉ đánh dấu completed sau commit thành công. UI/animation callback gửi intent, không làm nguồn sự thật của reward. Scene loads/tweens có owner/cancel token và revision; callback cũ không thể thay scene mới.

### 3.3 Save tại mọi điểm chơi được

Yêu cầu save luôn được tiếp nhận trong exploration, đang hiện chữ, choice, menu, cutscene/tween, THỦ/CÔNG và minigame. Snapshot phải chứa đủ trạng thái tiếp tục đúng logic; không tuyên bố khôi phục cùng frame GPU hoặc audio sample tuyệt đối.

Nếu đang chạy một thao tác nguyên tử hoặc load bất đồng bộ, lưu checkpoint đã commit gần nhất cùng continuation intent; không chụp nửa transaction. Pause clock khi capture/restore. Resume một effect đúng một lần; khi browser chưa cho phát audio, giữ cue/offset và tiếp tục sau thao tác người dùng hợp lệ.

`SaveEnvelope {schemaVersion, contentVersion, buildId, checksum, payload}` có validator, backup, export/import và migration registry. Thay đổi story ID/type cần mapping content migration; xóa anchor không có mapping phải giữ save cũ và báo không tương thích, không reset progress hay đoán vị trí mới. Vẫn cần policy migration cho từng release; không thể hứa mọi sửa truyện tùy ý tự tương thích.

Đề xuất P0: 10 manual slots và 3 autosave luân phiên, số lượng nằm trong config. Autosave tại chapter/scene checkpoint, sau choice/effect transaction và chuyển ngày; không chỉ trông vào sự kiện đóng tab. Preferences/remaps tách khỏi slot. Invalid checksum, schema/content mới hơn, quota/write failure và load hỏng không được phá slot/session đang tốt.

### 3.4 Asset fallback và hot reload

Manifest phân biệt `required` và `optional`, có placeholder/cue thay thế được khai báo bằng ID. Optional decoration/portrait có thể dùng placeholder, ambience có thể im theo policy và hiện diagnostic. Thiếu evidence, story node, flag/schema hoặc asset bắt buộc: chặn publish pack; runtime cho retry/back/recovery rõ ràng, không dựng dữ kiện giả để đi tiếp.

Dev host theo dõi revision của JSON và browser-ready assets. Reload validate toàn revision trước khi đổi: tương thích thì giữ cursor/flags, không tương thích thì giữ revision cũ hoặc tác giả chủ động restart preview từ checkpoint. Asset decode và callbacks cũ bị cancel/release. Không rebuild toàn game cho thay đổi script/PNG/audio; nguồn PSD/âm thanh gốc cần chuyển đổi incremental sang rendition browser đọc được.

### 3.5 Test bot, debug và crash

Debug chỉ có trong dev/workspace: jump chapter/scene với precondition fixture, inspect/set declared flags có type check, skip, command trace và export reproduction. Không ship đường mutate debug vào production.

Bot headless duyệt mọi chapter trong pack, chạy choices/conditions bằng state fixtures, có step/cycle budget và memo theo node + relevant state. Report bao gồm node/edge đã đi, blocked guards, asset đã resolve, lỗi và nhánh chưa đi được. Không gắn nhãn "toàn bộ script đã kiểm chứng" nếu còn nhánh chưa giải hoặc state space bị giới hạn. UI bot riêng chạy keyboard ở browser; headless traversal không chứng minh UI đúng.

Crash report cục bộ có build/content revision, diagnostic/stack, recent commands, state summary và screenshot khi lấy được. Không chứa file nguồn bí mật hay tự upload. P0 có export báo lỗi và CI artifacts; thu thập crash từ xa là tích hợp sau có opt-in và endpoint riêng.

## 4. Layout dự kiến và các interface dùng chung

Các đường dẫn dưới đây là **file sẽ tạo khi thực thi**, hiện chưa tồn tại. Không coi link tới đường dẫn trong code block là bằng chứng đã có implementation.

```text
src/contracts/                 content, command, diagnostic, snapshot contracts
src/domain/{story,gameplay,hearings}/
src/application/               GameSession, StoryRunner, save and preview use cases
src/presentation/{world,ui}/   Canvas world, DOM UI, input/focus and sequencer views
src/infrastructure/{browser,resources,storage}/
src/bootstrap/                 composition and dev/production capabilities
content/{locales,story,flags,events,scenes,gameplay,assets,animations,audio,input,ui}/
assets/{sources,exports}/      masters and browser-ready renditions with provenance
tools/{workspace,pipeline}/    editors, safe source writer, build/import helpers
tests/{unit,browser,authoring,bot,fixtures,python}/
docs/{engineering,guides,testing}/
.github/workflows/             CI only after execution is authorized
```

Shared types: `Id=string`, `Revision=string`, `Result<T>={ok:true,value:T}|{ok:false,errors:Diagnostic[]}`; `ContentBundle` is a validated revision plus typed catalogs. Each persisted structure has its own schema version.

| Interface | Responsibility |
| --- | --- |
| `validateProject(sources): Result<ContentBundle>` | Shared schema/reference/semantic validation |
| `ContentCatalog.get(kind,id): Result<Definition>` | Resolve immutable definitions by ID |
| `GameSession.execute(command): Result<{state,outcomes}>` | Validate and atomically apply gameplay commands |
| `StoryRunner.step(intent): Result<RunSnapshot>` | Advance a declared node/command through application ports |
| `SaveService.capture(runtime): Promise<Result<SaveEnvelope>>` | Quiesce at atomic checkpoint and capture resumable state |
| `SaveService.restore(envelope,runtime): Promise<Result<void>>` | Validate/migrate/prepare and replace all live state atomically |
| `AssetService.acquire(ids,{revision,signal}): Promise<Result<AssetLease>>` | Load, decode, classify failure; lease has `release()` |
| `SequencePlayer.snapshot()/restore(state)/cancel()` | Serializable presentation sequencing with injected clock |
| `Workspace.applyChange(documentId,operation,expectedRevision): Result<WorkingDocument>` | Validated authoring operation with history |
| `SourceWriter.save(documentId,content,expectedHash): Promise<Result<Revision>>` | Allowlisted conflict-aware source write |
| `PreviewSession.start(bundle,fixture)/stop()/snapshot()` | Separate ephemeral play session |
| `ReloadService.apply(candidate,current): Promise<Result<ReloadOutcome>>` | Atomic dev revision replacement or explicit rejection |

Runtime reads exported data without requiring the editor/write server. Composition wires adapters; managers are not a global mutable service locator.

## 5. Milestones và thứ tự phụ thuộc

| Gate | Tasks | Đầu ra phải xem/chạy được |
| --- | --- | --- |
| G0 — Hợp đồng và đường kiểm tra | T01–T02 | Project pack validate được, diagnostics rõ, checker chạy trên môi trường thật |
| G1 — Story/save nền + workspace | T03–T04 | Chơi nhánh text/flag với fake ports; save/resume đúng; tác giả sửa document và preview |
| G2 — Trải nghiệm browser | T05–T07 | Cảnh đi ngang, tài nguyên, chữ/nhạc, keyboard UI, backlog/auto-skip/remap và nhiều slot |
| G3 — Gameplay và bộ tool tương ứng | T08–T11 | Day/quest/publication/evidence/hearing mẫu; chỉnh được bằng editor và export/reload |
| G4 — Vận hành và sản xuất | T12–T13 | Hot reload, bot, diagnostics, CI/export, license audit và fresh-checkout recovery |
| G5 — Chương đại diện hoàn chỉnh | T14 | Một vòng author → validate → play → save → edit/reload → export → restore qua đủ hệ thống |

Thứ tự chính: T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14. T10/T11 dùng common workspace T04 và hợp đồng runtime đã có; không tạo một schema/editor khác cho cùng dữ liệu. Mỗi task là một deliverable có thể review riêng; gate chưa đạt thì sửa trước khi mở rộng content.

## 6. Bộ lệnh kiểm tra sẽ cung cấp trong P0

T01 tạo CLI chung; từng task đăng ký suite của mình. Suite chưa có phải trả trạng thái `not-implemented` và exit khác 0 khi được yêu cầu; `all` không được âm thầm bỏ qua. Mỗi suite trả báo cáo JSON gồm tên test, kết quả, diagnostics/artifact paths; exit 0 chỉ khi mọi test được yêu cầu đã chạy và pass.

Chạy dev server ở terminal riêng trước các lệnh có `--base-url`, rồi dừng khi xong. Suite `unit`/`bot` tự mở static loopback server tạm và browser harness qua Python browser runner; "headless bot" nghĩa là không dựng presentation, không phải phụ thuộc Node. Browser process/server/profile tạm phải được đóng trong teardown kể cả khi test fail. Harness dùng isolated storage và không truy cập player saves hay working documents thật.

```powershell
python tools/dev.py --port 8080
python tools/check.py architecture
python tools/check.py content
python tools/check.py unit
python tools/check.py browser --base-url http://127.0.0.1:8080
python tools/check.py authoring --base-url http://127.0.0.1:8080
python tools/check.py bot --pack foundation-demo
python tools/check.py release --profile foundation-demo
python tools/check.py all --base-url http://127.0.0.1:8080 --profile foundation-demo
python tools/build.py --profile foundation-demo --output dist
```

Ở thời điểm viết plan, **không có lệnh nào ở trên đã được tạo hoặc chạy**. Các lệnh archive maintenance hiện có chỉ kiểm chứng snapshot cũ, không thay thế gate P0.

## 7. Implementation tasks

### T01 — Contracts, preflight và đường test thực thi được

**Files:** Create `src/contracts/{Diagnostic,Content,Commands,RunSnapshot,SaveEnvelope}.js`, `content/project.json`, `content/pipeline/toolchain.json`, `tools/{dev,check}.py`, `tools/pipeline/{preflight,browser_runner,check_architecture}.py`, `tests/{harness.js,index.html}`, `tests/python/test_preflight.py`, `docs/engineering/PHASE-0-CONTRACTS.md`.

**Interfaces:** Consumes protected docs/rules; produces shared types in §4, Python check CLI and a browser ES-module test harness that can return structured results without Node.

- [x] Write preflight/CLI tests: missing browser/tool → diagnostic + failing exit; requested unregistered suite → `not-implemented`; real browser harness runs one failing then one passing assertion.
- [x] Run `python -m unittest discover -s tests/python -p "test_preflight.py"` and harness through `python tools/check.py unit`; confirm red because the new entry points are absent, not because unrelated dependencies are silently skipped.
- [x] Implement contracts and capability detection; freeze ports, schema versions and the initial command/action vocabulary in the contracts document. Pin actual tooling/browser used in CI; record setup instructions without requiring Node.
- [x] Add architecture checker: reject browser APIs/imports in domain/application, production imports of archive/tests, circular cross-boundary dependencies and hardcoded player copy/resource URLs outside catalogs. Include deliberate violation fixtures; lexical checks are only one gate.
- [x] Run `python tools/check.py architecture` and `python tools/check.py unit`; capture actual environment/results. Commit `build: establish phase-zero contracts and executable checks`.

### T02 — Typed catalogs, flags và script validator

**Files:** Create `src/contracts/schemas/{project,story,flags,events,resources}.json`, `src/domain/story/{validateProject,ContentCatalog,FlagStore}.js`, `content/{flags/core,events/foundation,locales/vi}.json`, `content/packs/foundation-demo.json`, `content/dev/foundation/chapter.json`, `tests/unit/content.test.js`, `tests/fixtures/content-invalid/`, `docs/guides/SCRIPT-FORMAT.md`.

**Interfaces:** Consumes §3.1 and T01 contracts; produces `validateProject(sources)`, `ContentCatalog.get(kind,id)` and `FlagStore.validate(definitions,values): Result<FlagValues>`.

- [x] Write failing tests for undeclared/wrong-type flags, duplicate node/command IDs, missing entry/jump/assets/text keys, accidental dead ends and an intentional `end`; assert diagnostic source/pointer, not just `ok=false`.
- [x] Run `python tools/check.py unit` to establish red for each validator behavior.
- [x] Implement the single JSON schema/validator path, typed flag defaults/scopes and immutable catalogs. Register only §3.1 opcodes and known effect capabilities; reject arbitrary executable content.
- [x] Use synthetic minimal asset/gameplay registries in validator tests until T05/T08 add real definitions. Production validation still rejects absent required references; schema fixtures never become runtime fallback data. Register the `content` suite with the CLI and exercise its nonzero diagnostic exit.
- [x] Create the minimal development pack now, containing the validated text/flag branch only; later tasks extend its declared dependencies. T12 bot and T13 release consume this existing pack, before T14 expands it into the final chapter.
- [x] Document exact JSON format with one valid story/choice/effect example and an intentional-terminal example; actual strings live in the locale source.
- [x] Run `python tools/check.py content` and `python tools/check.py unit`; round-trip source JSON and assert no data is lost. Commit `feat: add validated story catalogs and typed flags`.

### T03 — Session, story runner và save checkpoint từ sớm

**Files:** Create `src/application/{GameSession,StoryRunner,CheckpointService}.js`, `src/domain/story/{stepStory,applyEffect,executionLedger}.js`, `src/infrastructure/storage/SaveCodec.js`, `tests/unit/{story-runner,checkpoint}.test.js`.

**Interfaces:** Consumes validated `ContentBundle`; produces `GameSession.execute`, `StoryRunner.step`, `CheckpointService.capture(): Result<RunSnapshot>` and `SaveCodec.encode/decode` for the envelope in §3.3. Browser/save repository is injected later; T03 uses in-memory ports.

- [x] Write red tests: branch → flag → resumed cursor chooses the same node; command/effect commits once after replay; interrupted effect never exposes half-state; capture during pending work resumes from a committed checkpoint.
- [x] Run `python tools/check.py unit`; verify the new invariants fail before implementation.
- [x] Implement runner state machine, bounded registered effects and ledger. Store stable anchors and serializable values; dependencies for clock/audio/scene/effect are explicit ports.
- [x] Capture/decode/restore a mid-line reveal, choice and partially progressed sequence with fake ports; compare meaningful state and remaining effects, not only serialized equality.
- [x] Run content/unit suites; commit `feat: add story execution and atomic resumable checkpoints`.

### T04 — Workspace core, document history và source writer

**Files:** Create `tools/workspace/index.html`, `tools/workspace/{Workspace,WorkingDocument,History,PreviewSession,DiagnosticPanel}.js`, `tools/pipeline/{authoring_server,source_writer}.py`, `tests/authoring/workspace.test.js`, `tests/python/test_source_writer.py`.

**Interfaces:** Consumes T02 validator and T03 runner; produces `Workspace.applyChange`, `SourceWriter.save`, `PreviewSession.start/stop/snapshot` from §4. Dev server binds loopback; runtime static export has no write API.

- [ ] Write red tests for edit/undo/redo, invalid edit preserving the document, dirty draft recovery, two writers with stale expected hash, traversal/outside-root write rejection and preview isolation from player state.
- [ ] Run `python tools/check.py authoring --base-url http://127.0.0.1:8080` and Python writer tests; confirm missing behavior fails.
- [ ] Implement explorer/inspector/diagnostics plus the common operation journal and draft store. Source writes are allowlisted, conflict-aware and atomic; generated outputs are not direct editing targets.
- [ ] Bind the writer to loopback, check Host/Origin and a per-session token, and reject requests from unrelated web pages. Only explicitly enabled authoring sessions expose writes; the regular player server and release never expose this route. Test cross-origin rejection and symlink/path escape alongside normal writes.
- [ ] Let an author edit a story node and declared flag, validate, preview choices, stop and return to the same working document. No player save keys are read/written.
- [ ] Run authoring/unit/content checks and writer tests; commit `feat: add isolated authoring workspace and safe source writes`.

### T05 — Asset/resource pipeline và binary recovery policy

**Files:** Create `src/infrastructure/resources/{AssetCatalog,AssetService,ResourceScope}.js`, `content/{assets/manifest,animations/clips,audio/cues}.json`, `tools/pipeline/{import_assets,build_assets,audit_assets}.py`, `assets/{sources,exports}/README.md`, `assets/ASSET-INVENTORY.json`, `tests/unit/resources.test.js`, `tests/python/test_asset_pipeline.py`.

**Interfaces:** Consumes catalog/resource schemas; produces `AssetService.acquire(ids,{revision,signal})` and `AssetLease.release()`. Manifest entries include kind, source/export, hash, required/optional, dependencies, dimensions/duration and license/provenance.

- [ ] Write red tests: duplicate/missing IDs, invalid atlas bounds, absent required source, optional placeholder policy, async cancellation/stale revision, shared resource leases and deterministic manifest output.
- [ ] Probe image/audio conversion tools using small inputs; select and pin tools with license/source attribution. Record exactly which image/audio inputs and outputs are supported; no custom codec or hidden online conversion service.
- [ ] Implement naming/import validation, image optimization/atlas/pack generation, audio conversion, dimension/duration checks and versioned manifests. Same input/tool versions produce matching content hashes; processing a changed source rebuilds only affected renditions.
- [ ] Decide and demonstrate binary storage: Git LFS or versioned resource bundle with hash inventory and restore command. Repository currently ignores old binaries in archive payload; this is not a recovery solution for new production assets.
- [ ] Run `python tools/check.py content`, resource unit tests and asset pipeline tests. Restore a source pack in an empty temp workspace and verify hashes. Commit `feat: add deterministic resources and asset recovery workflow`.

### T06 — Browser world, keyboard, text/audio và presentation timeline

**Files:** Create `src/presentation/world/{World2D,Camera2D,InteractionResolver,ActorView,AnimationPlayer}.js`, `src/presentation/ui/{FocusRouter,TextView}.js`, `src/infrastructure/browser/{InputAdapter,CanvasAdapter,AudioAdapter,BrowserLifecycle}.js`, `src/application/SequencePlayer.js`, `src/bootstrap/main.js`, `index.html`, `styles/{base,tokens}.css`, `content/{scenes/foundation,input/defaults,ui/foundation}.json`, `tests/browser/platform.test.js`.

**Interfaces:** Consumes resource leases and StoryRunner ports; produces scene load/pause/snapshot/restore/dispose, semantic input intents, TextView reveal state, audio cue state and the `SequencePlayer` contract in §4.

- [ ] Write red browser tests for walk/door/range/camera bounds, resize/DPR coordinate agreement, key repeat, hidden-tab pause, nested-modal focus, IME input and cancellation of an outdated scene load.
- [ ] Add text/audio tests: Vietnamese combining marks stay intact, wrap/reflow after fonts load, safe rich-text tokens only, configurable reveal speed; loop start/end, bus mute/gain/crossfade and autoplay-denied resume retain cue state.
- [ ] Implement Canvas2D scenery/actors/foreground, DOM controls, authored camera/parallax and event-driven effects. No walking cost/calendar tick; pause/restore uses injected clocks and clears held input.
- [ ] Separate input sampling, movement/presentation updates and render scheduling. Clamp catch-up after stalls and test equivalent movement at different frame cadences; world units, actor baseline/pivot, interaction bounds and world-to-screen conversion have one shared coordinate contract.
- [ ] Implement `AnimationPlayer.update(delta)`, `snapshot()` and `restore(state)` against validated clip IDs/frame durations/pivots. Test pause/resume, loop/completion, clip replacement and disposal; frame timing and actor/UI/ambient clips stay in managed definitions.
- [ ] Implement serializable tween/timeline steps with complete/skip/cancel and audio/scene coordination. Choose target viewport/tokens through a reviewable UI mock before production art; do not reinstate coastal layout gates.
- [ ] Run browser/unit checks and repeated scene entry/disposal tests; record real display/DPR results separately from simulated-time tests. Commit `feat: add keyboard-first browser world and presentation adapters`.

### T07 — Player shell, full save/load, backlog, settings và accessibility

**Files:** Create `src/presentation/ui/{MainMenu,SettingsView,SaveSlotsView,BacklogView,DialogueControls}.js`, `src/application/SaveService.js`, `src/infrastructure/storage/{IndexedSaveRepository,PreferencesRepository,MigrationRegistry}.js`, `content/{ui/navigation,input/actions,locales/test-expanded}.json`, `tests/{unit/save-migrations.test.js,browser/player-flows.test.js}`.

**Interfaces:** Consumes checkpoints plus browser adapter snapshots; produces `SaveService.capture/restore`, slot repository, preference/remap state and keyboard navigable player screens. Configuration owns 10 manual/3 autosave proposal values.

- [ ] Write red tests saving/resuming exploration, mid-reveal, choice, menu, tween and pending load; next input advances exactly the expected step and never repeats a committed reward. Hearing-specific snapshots are extended in T09.
- [ ] Add corrupt checksum, future schema/content, explicit anchor/flag migration, unknown ID, quota failure, failed prepared world restore and transactional slot backup tests; both current session and previous valid slot survive failure.
- [ ] Implement IndexedDB transactions, manual/autosave rotation, backup, import/export and content/schema migration registry. Old prototype saves get an explicit legacy policy/export route; never reinterpret them as equivalent new progress.
- [ ] Implement main menu, settings, text size/speed, reduced motion, remap with conflict/restore-default handling, backlog, auto and skip. Skip stops at unread text by policy, choices, irreversible effects and timed hearings; backlog is read-only unless replay semantics are separately designed.
- [ ] Run the entire player flow by keyboard with mouse unused. Swap to expanded-string test locale/font fallback and verify layout/labels; run browser/unit suites. Commit `feat: add complete keyboard player flows and resilient saves`.

### T08 — Gameplay modules đại diện và definitions chỉnh được

**Files:** Create `src/domain/gameplay/{calendar,energy,quests,delegation,publication,evidence,progression}.js`, `content/gameplay/{balance,quests,team,schedules,publication,progression}.json`, `tests/unit/{day-loop,quest-publication,progression}.test.js`, `tests/fixtures/foundation/gameplay.json`.

**Interfaces:** Consumes application command/effect registry; produces pure transitions for the fixture chapter and typed state/outcome definitions extending `RunSnapshot.gameplay`. Definitions, costs and provisional values stay in catalogs.

- [ ] Write red tests for 10/5 next-day energy, zero-energy return/rest, both travel-confirm paths, no calendar advance from walking, weekend delegation pause and feedback without fake progress.
- [ ] Test direct Main/Side and delegated/self General; complete once → archive concrete evidence once → handoff automatically → audience only after publication. Main creates no Defense cards; General quality is not upgraded by performer.
- [ ] Implement required use cases and a small data fixture. Include representative skill/equipment/stat/bond updates and one wallet; preserve explicit cost/guard validation and generic registered effects rather than story-ID branches.
- [ ] Validate quest prerequisites, NPC schedules and required Main routes without Side completion. Record which balance values are provisional; keep the finalized docs byte-identical.
- [ ] Run content/unit suites and save round trips for the new fields; commit `feat: add data-driven gameplay foundation modules`.

### T09 — Hearing foundation, timed minigame và interruption semantics

**Files:** Create `src/domain/hearings/{defense,attack,minigame}.js`, `src/presentation/ui/{DefenseView,AttackView,HearingMinigameView}.js`, `content/gameplay/hearings/{defense-fixture,attack-fixture,balance}.json`, `tests/{unit/hearings.test.js,browser/hearings.test.js}`.

**Interfaces:** Consumes GDD turn rules, evidence catalog, clock/input/save ports; produces immutable hearing state, structured outcomes and resumable `RunSnapshot.sequence/gameplay` extensions.

- [ ] Write red Defense tests for damage before response, clamp, bailout timing/one-use, discard, quality after relevance, mitigation/all-Lose constraints, ending verdict and heart transfer. Pin fixture values to GDD and mark +50/+20 as provisional tuning.
- [ ] Write red Attack tests for word/answer selection, wrong-answer locking/heart changes, recovery checkpoint, scripted progress thresholds, minigame/Final Shot and keyboard-only completion. Use authored findings; required answers do not depend on Side evidence.
- [ ] Implement pure handlers and views with data-driven hearing definitions. Use technical fixture bosses; canonical Khoa/Linh/Huy milestones remain week 3/end 7/12 in production definitions.
- [ ] Save and resume after accusation damage, before/after card use, during word selection and mid-minigame; compare remaining time/projectiles/outcomes. Hidden-tab pause does not drain a timer or replay effects.
- [ ] Run content/unit/browser/hearing save checks; commit `feat: add resumable defense and attack foundation hearings`.

### T10 — Resource managers, Scene Editor và UI/input editor

**Files:** Create `tools/workspace/resources/{StringsPanel,AssetsPanel,AnimationPanel,AudioPanel,EventsPanel}.js`, `tools/workspace/editors/{SceneEditor,LayoutEditor,BindingsEditor}.js`, `tests/authoring/{resources,scene-layout}.test.js`, `docs/guides/RESOURCE-WORKFLOW.md`.

**Interfaces:** Consumes common Workspace operations, content schemas and runtime preview APIs; produces valid authored resource/scene/UI documents. Editors never write generated files or player preferences as source defaults.

- [ ] Write red authoring tests for search/usage, missing translation params, safe ID rename/removal diagnostics, atlas/pivot/clip/audio edits, collision/interaction/camera layout and focus-order/binding validation.
- [ ] Implement dedicated inspectors and previews, source/import/export controls and dependency navigation. Scene editor supports layers, actor baseline, doors, ranges and camera/parallax; UI editor shows focused/selected/disabled/error states.
- [ ] Make gestures and keyboard property edits use the same validated operations; undo/redo and reload reproduce the exported state. Changing a text/clip/cue updates preview from managed data.
- [ ] Export a scene and resource set, reopen in editor and load the same definitions in runtime; assert meaningful rendering/interaction state, not JSON-only equality.
- [ ] Run authoring/content/browser suites; commit `feat: add resource scene and keyboard-layout authoring tools`.

### T11 — Dialogue/Quest, gameplay và Hearing Editor

**Files:** Create `tools/workspace/editors/{StoryEditor,QuestEditor,GameplayEditor,HearingEditor}.js`, `tests/authoring/{story-quest,gameplay-hearing}.test.js`, `docs/guides/ADDING-CONTENT.md`.

**Interfaces:** Consumes T02 schema/diagnostics and T08/T09 pure handlers through isolated previews; produces the same JSON definitions and migration mapping candidates used by runtime.

- [ ] Write red tests adding and connecting story nodes, choices, typed flags, condition/effect targets, quest prerequisites, schedules, evidence mappings and hearing segments; errors select the exact node/property.
- [ ] Implement node/flow editing and inspectors with keyboard paths; gameplay editor handles cost/reward/schedule/progression definitions, Hearing Editor previews a specified accusation/rebuttal or Attack segment.
- [ ] Demonstrate Main-route dependency diagnostics when a mandatory Boss fact is placed exclusively in Side. Intentional terminal nodes are accepted; accidental broken endings are rejected.
- [ ] Add authoring recipe: create NPC → dialogue/flag → quest → evidence/hearing reference → validate → play → save → export; include naming conventions and schema/content migration procedure.
- [ ] Run authoring/content/unit checks; commit `feat: add story gameplay and hearing authoring workflows`.

### T12 — Hot reload, debug workspace, traversal bot và crash packages

**Files:** Create `src/application/{ReloadService,DebugSession}.js`, `src/infrastructure/browser/CrashReporter.js`, `tools/workspace/{DebugPanel,TracePanel}.js`, `tools/pipeline/{watcher,bot}.py`, `tests/{unit/reload.test.js,bot/traversal.test.js,browser/dev-tools.test.js}`.

**Interfaces:** Consumes immutable revisions, migrations/checkpoints and preview ports; produces `ReloadService.apply`, typed debug intents, local crash/reproduction bundles and coverage reports.

- [ ] Write red tests for valid reload preserving cursor, invalid revision retaining last valid runtime, removed anchor requiring restart/mapping, stale asset load cancellation and concurrent writer conflict. Production build must reject/omit mutation debug capabilities.
- [ ] Implement loopback file watch/revision notifications and incremental script/browser-asset reload; changing JSON/PNG/cue requires no full-game build. Author chooses explicit restart if incompatible.
- [ ] Implement jump with fixture/precondition validation, typed set-flag, skip, command/guard logs, trace replay and local crash export with screenshot when available. Failure to capture screenshot must not suppress the error report.
- [ ] Implement bot with branch/state memo, bounded cycles and explicit coverage/unexplored reporting. Test one valid pack, missing asset, dead branch, incorrect flag, loop and an intentionally unresolved condition. Browser bot separately traverses keyboard UI.
- [ ] Run bot/dev browser/unit checks; CI receives artifacts. Commit `feat: add safe hot reload traversal bot and debug diagnostics`.

### T13 — Web release, CI, licenses, performance và recovery

**Files:** Create `tools/{build.py,pipeline/release.py,pipeline/restore_assets.py}`, `content/pipeline/{release,licenses,performance-targets}.json`, `.github/workflows/phase-0.yml`, `tests/python/test_release.py`, `docs/guides/{SETUP,RELEASE-RESTORE}.md`, `docs/testing/PHASE-0-EVIDENCE.md`.

**Interfaces:** Consumes toolchain/asset inventories, checks and pack manifests; produces versioned static web export, third-party notices, content hashes, setup/restore procedure and machine-readable release diagnostics.

- [ ] Write red tests for missing binary master/rendition, unknown license, incompatible content versions, accidental dev/test/debug inclusion, absent required suite and incorrect asset hashes; failed build leaves last good release intact.
- [ ] Implement reproducible export with fingerprint/cache policy, dependency notices and license/provenance audit for all assets/fonts/audio/tools/libraries. Unknown provenance blocks release until resolved or the resource is replaced.
- [ ] Configure CI to provision pinned Python/browser/asset tools and run architecture/content/unit/browser/authoring/bot/release gates. Do not reuse legacy pass logs as evidence; upload current diagnostics/screenshots/crash packages.
- [ ] Choose and record reference and lower-spec desktop profiles. Proposed target is smooth 60 Hz presentation; record frame-time distribution, load latency, memory after repeated transitions, startup bytes, text scaling and fullscreen/resize behavior. Virtual-clock tests do not certify device FPS.
- [ ] Verify Chromium-family full automation plus a documented Firefox compatibility smoke run. A clean checkout restores required resource bundles/LFS bytes, builds and plays without reaching into the local legacy payload. Export runs without authoring server; browser hosting is the P0 deliverable, not an installer or Steam integration.
- [ ] Run `python tools/check.py release --profile foundation-demo` and the full gate set; publish only the local artifact/evidence unless separately authorized. Commit `build: add reproducible web release and production checks`.

### T14 — Chương fixture end-to-end và đóng P0

**Files:** Modify `content/packs/foundation-demo.json` and `content/dev/foundation/chapter.json`; create `content/dev/foundation/branches.json`, `tests/fixtures/foundation/migrations.json`, `tests/browser/foundation-journey.test.js`, `docs/testing/PHASE-0-ACCEPTANCE.md`; update guides and `PROJECT-STATE.md` with actual evidence.

**Interfaces:** Consumes all previous deliverables; produces a tested authored chapter/pack and a gate report. No production story expansion or canonical document edit is part of this task.

- [ ] Write a failing end-to-end acceptance journey before assembling the pack. It must require creation through the tools, branch/flag validation, exploration, dialogue, all quest types, publication/evidence, hearing fixtures, save/reload, authoring edits, hot reload and exported play.
- [ ] Author the chapter via workspace/source contracts with approved reusable art or clearly marked test art and full provenance. The chapter has explicit beginning/ending and at least two tested branches; strings/IDs/events are managed data.
- [ ] Run keyboard-only journey and all supported save positions, including interrupted tween and timed hearing; run bot over the pack and resolve failures/unexplored branches or mark the gate incomplete.
- [ ] Introduce a broken ID, undeclared flag, missing optional/required asset, corrupt save and conflicting write; verify actionable diagnosis, safe fallback/rejection and recovery. Repeat transitions and perform fresh-checkout restore/build.
- [ ] Run the entire command set in §6, record versions/reference machine, screenshots, traces, coverage and limitations. All gates below must pass; unchecked gates remain incomplete.
- [ ] Commit `test: verify phase-zero authoring and gameplay foundation`; hand off P0 evidence and request the next production-content task. Do not automatically start filling 12 weeks.

## 8. Definition of Done cho giai đoạn 0

- [ ] Contracts và JSON script/flag format được tài liệu hóa; unknown opcode/ID/type không lọt vào runtime.
- [ ] Author tạo và sửa được scene/NPC/dialogue/quest/resource/hearing qua workspace, có undo/redo, dirty recovery và diagnostics đúng source.
- [ ] Một chương mẫu hoàn chỉnh đi qua toàn bộ pipeline; ít nhất hai nhánh được kiểm chứng, không chỉ một phòng demo.
- [ ] Mọi đường chơi dùng bàn phím; backlog, auto/skip, settings, remap, text size/speed, locale expansion và reduced motion có kiểm thử.
- [ ] Save/resume ở mọi trạng thái người chơi được hỗ trợ, including timed hearing; transactions/ledger không lặp thưởng. Autosave/slots/backup và content/schema migration có bằng chứng.
- [ ] Resource import/build/atlas/audio/manifest hoạt động, optional fallback và required-failure policy đúng; load/cancel/release không tích lũy tài nguyên.
- [ ] Hot reload script/browser assets giữ revision hợp lệ; node bị xóa, save cũ hoặc writer conflict có đường xử lý rõ.
- [ ] Bot công bố coverage và nhánh chưa kiểm chứng; không còn nhánh chưa kiểm chứng trong acceptance pack. Browser journey kiểm tra UI riêng.
- [ ] Dev/debug/crash exports dùng được; production artifact không chứa mutation debug hoặc tự upload dữ liệu.
- [ ] CI và local checks đều thực thi suite thật, release/notice/license audit pass, reference/lower-spec browser evidence được ghi nhận.
- [ ] Fresh checkout khôi phục được cả binary inputs và artifacts cần thiết; không phụ thuộc archive cục bộ 5 GB hoặc file chỉ có trên máy tác giả.
- [ ] Protected Bible/GDD và archived payload giữ nguyên; không tái tạo engine/roadmap 3D hoặc coi UI coastal cũ là yêu cầu mới.
- [ ] Format script, adding-content, setup/debug và release/restore guides đủ để người khác thêm một quest mà không sửa generic runtime.

## 9. Cách review và thực thi tiếp

Review trước các quyết định trong §2–3, đặc biệt: JSON v1; stable anchors + atomic saves; 10 manual/3 autosave đề xuất; required/optional asset policy; development-only fixture pack; gamepad/gallery/native integrations để sau; toolchain không bắt buộc Node.

Khi bắt đầu thực thi, đọc lại root instructions/checkpoint, chọn phương thức thực thi cùng người dùng và tạo workspace/branch cách ly theo skill phù hợp. Plan này có nhiều hợp đồng nối nhau; thực thi tuần tự và nghiệm thu từng task/gate là mặc định đề xuất. Không tự mở agent song song hoặc chạy tất cả task chỉ vì plan đã có.

Mỗi task kết thúc bằng bằng chứng và commit riêng. Nếu xuất hiện tính năng engine không phục vụ trực tiếp acceptance workflow, đưa ra backlog để quyết định riêng. Nếu implementation cần thay hợp đồng đã được task trước tiêu thụ, cập nhật contract/tests/migration và các task phụ thuộc trước khi tiếp tục.
