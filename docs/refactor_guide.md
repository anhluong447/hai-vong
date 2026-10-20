# 🤖 AI AGENT MASTER INSTRUCTION: Refactor 2D RPG sang Data-Driven Architecture & In-Game Visual Editor

> **Vai trò của bạn (AI Agent):** Bạn là Principal Game Architect. Nhiệm vụ của bạn là đọc hiểu codebase hiện tại của dự án game 2D Top-down RPG này (vốn đã được chia theo Clean Architecture) và **refactor triệt để từ "Hardcoded Logic/Coordinates" sang "100% Data-Driven Engine + In-Game WYSIWYG Editor"**.
>
> **Mục tiêu tối thượng:** Giúp nhà phát triển không bao giờ phải mò vào từng dòng code để sửa tọa độ `x, y`, kích thước hitbox, đường dẫn sprite, hay căn chỉnh từng nút UI nữa. Mọi thứ phải đồng bộ (consistent) thông qua **Assets Registry, Prefabs, Scene JSON, Design Tokens** và có thể **kéo thả/chỉnh sửa trực tiếp ngay trong game (Dev Mode)**.

---

## PHẦN 1: NGUYÊN TẮC BẤT DI BẤT DỊCH (CRITICAL GUARDRAILS)

Khi thực hiện refactor, bạn **BẮT BUỘC** phải tuân thủ 5 nguyên tắc sau:

1. **KHÔNG đập bỏ Clean Architecture hiện có:** Giữ nguyên sự phân tách tầng hiện tại của dự án (Domain/State, UseCases/Systems, Presentation/Renderer). Bạn chỉ đang **rút trích (extract) toàn bộ con số/chuỗi gán cứng (hardcoded)** ra thành tầng Data/Config và lắp thêm công cụ chỉnh sửa.
2. **CẤM Hardcode trong Code Logic:**
   - Không được phép có đường dẫn file (`"assets/sprites/hero.png"`) trong code logic. Phải gọi qua `AssetRegistry`.
   - Không được phép khởi tạo thực thể (NPC, Chest, Tree, Trigger) bằng cách truyền thông số rời rạc trong code. Phải khởi tạo từ **Prefab ID** + **Scene JSON**.
   - Không được phép gán cứng tọa độ/kích thước UI rải rác. Phải dùng **UI Theme / CSS Design Tokens** và **UI Layout Config**.
3. **100% Serializable State & Scene:** Toàn bộ một màn chơi (Map, vị trí NPC, vật cản, sự kiện, BGM) phải được định nghĩa hoàn toàn bằng một file JSON duy nhất và có thể xuất ngược (Export) từ bộ nhớ đang chạy ra lại file JSON đó.
4. **Đơn vị đo lường chuẩn hóa (Grid & Pixel Synchronization):**
   - Vì đây là game 2D góc nhìn Top-Down (kiểu RPG Maker), hãy thiết lập một hằng số chuẩn `TILE_SIZE` (ví dụ: `32` hoặc `48` hoặc `64` tùy theo sprite hiện tại của dự án).
   - Mọi vị trí object trong Scene JSON nên hỗ trợ cả hệ tọa độ lưới (`gridX, gridY`) lẫn tọa độ pixel/offset tinh chỉnh (`offsetX, offsetY`) để đảm bảo tính đồng bộ tuyệt đối.
5. **Làm theo từng Phase (Incremental Refactoring):** Không sửa tất cả các file cùng một lúc gây vỡ dự án. Hãy thực hiện lần lượt từ Phase 1 đến Phase 5 ở dưới và đảm bảo game luôn chạy được sau mỗi Phase.

---

## PHẦN 2: CẤU TRÚC THƯ MỤC ĐÍCH (TARGET ARCHITECTURE)

Hãy kiểm tra cấu trúc thư mục hiện tại của dự án và quy hoạch/bổ sung thêm phần `data/` và `devtools/` như sau (điều chỉnh tên thư mục gốc cho khớp với ngôn ngữ/bundler hiện tại của dự án):

```text
src/
├── core/                        # [GIỮ NGUYÊN & NÂNG CẤP] Lõi Micro-Engine
│   ├── AssetRegistry.ts         # Quản lý & preload toàn bộ Sprite, Spritesheet, Audio, Font
│   ├── PrefabFactory.ts         # Đọc prefabs.json + scene.json -> Khởi tạo Entity đồng bộ
│   └── SceneSerializer.ts       # Load màn chơi từ JSON & Export màn chơi hiện tại ra JSON
│
├── data/                        # [TẠO MỚI] Nguồn dữ liệu duy nhất (Single Source of Truth)
│   ├── assets.manifest.json     # Khai báo mọi đường dẫn file và cấu hình cắt frame (Atlas/Spritesheet)
│   ├── prefabs.catalog.json     # Khuôn mẫu chuẩn cho NPC, Prop, Monster, Trigger, UI Component
│   ├── ui.layout.json           # Cấu hình vị trí, neo (anchor), scale của các thành phần UI
│   └── scenes/                  # Chứa dữ liệu các màn chơi (Maps)
│       ├── town_01.scene.json
│       └── house_interior.scene.json
│
├── devtools/                    # [TẠO MỚI] In-Game Visual Editor (Bật/Tắt bằng phím F1 hoặc `~`)
│   ├── EditorOverlay.ts         # Quản lý trạng thái Edit Mode (Pause game logic, bật Gizmo)
│   ├── CanvasGizmo2D.ts         # Vẽ khung chọn, lưới (Grid), kéo thả Object/Collider bằng chuột
│   ├── InspectorPanel.ts        # Bảng chỉnh thông số trực tiếp (X, Y, Scale, Layer, Prefab Spawner)
│   └── UIEditorMode.ts          # Cho phép kéo thả các khung UI (HUD, Dialogue Box, Buttons)
│
├── domain/ (hoặc state/)        # [GIỮ NGUYÊN] Clean Architecture State & Entities
├── systems/ (hoặc usecases/)    # [GIỮ NGUYÊN] Logic di chuyển, va chạm, hội thoại, sự kiện
└── presentation/ (hoặc view/)   # [CẬP NHẬT]
    ├── SpriteRenderer2D.ts      # Y-Sorting (vẽ theo chiều sâu Y), vẽ Sprite từ AssetRegistry
    └── UIManager.ts             # Render UI dựa trên Design Tokens & ui.layout.json
```

---

## PHẦN 3: ĐẶC TẢ CHI TIẾT CÁC HỆ THỐNG CẦN XÂY DỰNG (SPECIFICATIONS)

### 1. Hệ thống Quản lý Tài nguyên Tập trung (`AssetRegistry` & `assets.manifest.json`)

**Vấn đề cần giải quyết:** Xóa bỏ tình trạng load ảnh/âm thanh rải rác, kích thước frame sprite không đồng nhất, điểm neo (anchor/pivot) bị lệch.

**Yêu cầu thực thi:**
- Quét toàn bộ dự án hiện tại, gom tất cả các đường dẫn ảnh (`.png`, `.webp`), âm thanh (`.mp3`, `.ogg`, `.wav`), font chữ vào file `src/data/assets.manifest.json`.
- Quy định rõ `pivot` (điểm gốc của sprite). Với game 2D RPG Maker, **mặc định mọi nhân vật và vật thể đứng trên mặt đất phải có `pivot: { "x": 0.5, "y": 1.0 }` (giữa-dưới chân)** để khi đặt tọa độ hoặc sắp xếp chiều sâu (Y-Sorting) không bao giờ bị lệch.

**Mẫu `assets.manifest.json`:**
```json
{
  "config": {
    "baseTileSize": 48
  },
  "spritesheets": {
    "CHAR_HERO": {
      "url": "/assets/sprites/hero_sheet.png",
      "frameWidth": 48,
      "frameHeight": 64,
      "pivot": { "x": 0.5, "y": 1.0 },
      "animations": {
        "idle_down": { "frames": [0, 1], "fps": 4, "loop": true },
        "walk_down": { "frames": [0, 1, 2, 3], "fps": 8, "loop": true },
        "walk_up":   { "frames": [4, 5, 6, 7], "fps": 8, "loop": true }
      }
    },
    "PROP_TREES": {
      "url": "/assets/sprites/trees_atlas.png",
      "regions": {
        "OAK_TREE":  { "x": 0, "y": 0, "w": 96, "h": 128, "pivot": { "x": 0.5, "y": 0.92 } },
        "PINE_TREE": { "x": 96, "y": 0, "w": 96, "h": 128, "pivot": { "x": 0.5, "y": 0.92 } }
      }
    }
  },
  "audio": {
    "BGM_TOWN": { "url": "/assets/audio/bgm_town.ogg", "volume": 0.7, "loop": true },
    "SFX_CLICK": { "url": "/assets/audio/sfx_click.wav", "volume": 0.9, "loop": false }
  }
}
```

---

### 2. Hệ thống Khuôn mẫu Đồng bộ (`PrefabFactory` & `prefabs.catalog.json`)

**Vấn đề cần giải quyết:** Tránh việc mỗi NPC, mỗi cái rương, hay mỗi cái cây lại có kích thước va chạm (Hitbox/Collider), bóng đổ (Shadow) hoặc vùng tương tác khác nhau do code tay.

**Yêu cầu thực thi:**
- Tạo file `src/data/prefabs.catalog.json` chứa các khuôn mẫu chuẩn.
- Khi tạo một Entity trong màn chơi, `PrefabFactory` sẽ lấy thông số gốc từ Prefab, sau đó mới ghi đè (override) những thông số riêng của Entity đó (như `id`, `x`, `y`, `dialogueId`).

**Mẫu `prefabs.catalog.json`:**
```json
{
  "NPC_BASE": {
    "layer": "ENTITIES",
    "spriteSheet": "CHAR_HERO",
    "defaultAnim": "idle_down",
    "shadow": { "enabled": true, "width": 32, "height": 12, "offsetY": -2 },
    "collider": { "type": "box", "width": 32, "height": 20, "offsetX": 0, "offsetY": -10, "solid": true },
    "interaction": { "radius": 48, "indicatorOffsetY": -70 }
  },
  "PROP_OAK_TREE": {
    "layer": "ENTITIES",
    "atlas": "PROP_TREES",
    "region": "OAK_TREE",
    "shadow": { "enabled": true, "width": 64, "height": 24, "offsetY": -4 },
    "collider": { "type": "box", "width": 40, "height": 24, "offsetX": 0, "offsetY": -12, "solid": true }
  },
  "TRIGGER_DOOR": {
    "layer": "TRIGGERS",
    "collider": { "type": "box", "width": 48, "height": 48, "offsetX": 0, "offsetY": 0, "solid": false }
  }
}
```

---

### 3. Hệ thống Dữ liệu Màn chơi & Y-Sorting (`SceneSerializer` & `*.scene.json`)

**Vấn đề cần giải quyết:** Toàn bộ bố cục màn chơi phải nằm trong file JSON. Đồ họa 2D RPG Maker yêu cầu nhân vật khi đi ra phía sau cái cây/NPC thì bị che khuất, khi đi ra phía trước thì đè lên trên (Y-Sorting).

**Yêu cầu thực thi:**
- Chuyển toàn bộ code khởi tạo màn chơi hiện tại sang `src/data/scenes/<ten_map>.scene.json`.
- Trong `SpriteRenderer2D.ts`, ở mỗi frame, mọi thực thể thuộc layer `ENTITIES` phải được sắp xếp thứ tự vẽ theo tọa độ chân: `sortOrder = entity.y + entity.zOffset`.

**Mẫu `town_01.scene.json`:**
```json
{
  "sceneId": "town_01",
  "name": "Làng Khởi Đầu",
  "tileSize": 48,
  "mapDimensions": { "cols": 30, "rows": 20 },
  "bgm": "BGM_TOWN",
  "playerSpawn": { "x": 480, "y": 384, "direction": "down" },
  "entities": [
    {
      "id": "npc_elder",
      "prefab": "NPC_BASE",
      "x": 528,
      "y": 336,
      "overrides": {
        "spriteSheet": "CHAR_ELDER",
        "dialogueId": "dlg_elder_welcome"
      }
    },
    {
      "id": "tree_01",
      "prefab": "PROP_OAK_TREE",
      "x": 624,
      "y": 288
    }
  ],
  "colliders": [
    { "id": "wall_top", "x": 0, "y": 0, "w": 1440, "h": 96 }
  ]
}
```

---

### 4. Hệ thống Đồng bộ Giao diện Đẹp (`UIManager`, Design Tokens & `ui.layout.json`)

**Vấn đề cần giải quyết:** Game có UI đẹp nhưng hiện tại chỉnh một cái nút hay khung hội thoại phải mò vào code sửa từng pixel, dẫn đến lệch lạc giữa các màn hình.

**Yêu cầu thực thi:**
1. **Tách Design Tokens (CSS Variables / Theme Config):** Tạo một file `ui-theme.css` (nếu UI bằng DOM/HTML đè lên Canvas) hoặc `ui.theme.json` (nếu UI vẽ bằng Canvas). Định nghĩa toàn bộ bảng màu, viền 9-slice (Nine-patch window skin kiểu RPG Maker), font-size, khoảng cách chuẩn (`--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px`, `--space-lg: 24px`).
2. **Hệ thống Neo (Anchor & Offset):** Không bao giờ đặt vị trí UI bằng tọa độ tuyệt đối cứng nhắc. Mọi khung UI cấp cao (HUD máu/mana, Minimap, Dialogue Box, Action Buttons) phải đọc vị trí từ `src/data/ui.layout.json` theo cơ chế `anchor` (`top-left`, `top-right`, `bottom-center`, `center`...) cộng với `offsetX, offsetY` và `scale`.

**Mẫu `ui.layout.json`:**
```json
{
  "hud_player_status": {
    "anchor": "top-left",
    "offsetX": 24,
    "offsetY": 24,
    "scale": 1.0,
    "visible": true
  },
  "dialogue_box": {
    "anchor": "bottom-center",
    "offsetX": 0,
    "offsetY": -24,
    "width": 800,
    "height": 180,
    "scale": 1.0
  },
  "action_buttons_group": {
    "anchor": "bottom-right",
    "offsetX": -32,
    "offsetY": -32,
    "gap": 12,
    "scale": 1.0
  }
}
```

---

### 5. Xây dựng In-Game Visual Editor (`src/devtools/` — Tính năng quan trọng nhất)

**Vấn đề cần giải quyết:** Cung cấp khả năng kéo thả, căn chỉnh trực quan như RPG Maker / Godot ngay bên trong cửa sổ trình duyệt của game mà không cần cài phần mềm nặng.

**Yêu cầu thực thi:**
Hãy xây dựng module `EditorOverlay` được kích hoạt khi bấm phím **`F1`** (hoặc nút bật/tắt góc màn hình ở môi trường Dev). Khi `Edit Mode = ON`:

1. **Tạm dừng Gameplay Logic, giữ nguyên Render Loop:** Nhân vật và NPC dừng di chuyển tự động, nhưng画面 (Canvas & UI) vẫn vẽ bình thường.
2. **Visual Debugging trên Canvas (`CanvasGizmo2D.ts`):**
   - Vẽ lưới mờ (Grid Overlay) theo `tileSize` (có nút bật/tắt **Snap to Grid** khi giữ phím `Shift` hoặc tick chọn).
   - Vẽ khung viền màu xanh lá quanh Sprite của các Entity, chấm tròn màu vàng tại điểm gốc (`Pivot`), và khung màu đỏ bán trong suốt cho các vùng va chạm (`Collider` / `Hitbox`).
3. **Kéo thả trực tiếp bằng Chuột (Drag & Drop):**
   - **Chế độ Scene Edit:** Click chuột trái vào bất kỳ Entity hoặc khối Collider nào trên màn hình để chọn (Selected). Giữ chuột và kéo để di chuyển vị trí `x, y` của nó theo thời gian thực.
   - **Chế độ UI Edit:** Khi chuyển sang tab "UI Layout", cho phép cầm chuột kéo trực tiếp các khung `hud_player_status`, `dialogue_box`, `action_buttons_group` trên màn hình; tự động tính toán lại `offsetX, offsetY` so với `anchor`.
4. **Thanh Inspector & Spawner bên phải màn hình (`InspectorPanel.ts`):**
   - Tạo một panel HTML/CSS gọn đẹp nằm bên phải màn hình khi bật `F1`.
   - Khi đang chọn một Entity hoặc UI Widget: Hiển thị các ô input số / thanh trượt (slider) cho `id`, `x`, `y`, `scale`, `collider.width`, `collider.height`, `collider.offsetY`, `dialogueId`. Sửa số tới đâu, hình trên màn hình cập nhật ngay lập tức tới đó.
   - **Prefab Palette (Thêm/Xóa nhanh):** Có danh sách các Prefab từ `prefabs.catalog.json`. Click chọn 1 Prefab rồi click lên bản đồ là tạo ngay object mới tại vị trí chuột. Bấm phím `Delete` để xóa object đang chọn.
5. **Nút "💾 Export / Save JSON":**
   - Có 2 nút rõ ràng trên thanh công cụ Editor: **`Export Scene JSON`** và **`Export UI Layout JSON`**.
   - Khi bấm vào:
     - Tự động copy toàn bộ JSON đã chỉnh sửa vào Clipboard, **ĐỒNG THỜI** tải file `.json` mới về máy (hoặc nếu dự án đang chạy dev server như Vite/Node, hãy viết thêm một Vite Plugin / API endpoint nhỏ chỉ 20 dòng để ghi đè trực tiếp vào file `src/data/scenes/*.scene.json` và `src/data/ui.layout.json` trên ổ cứng!).

---

## PHẦN 4: QUY TRÌNH THỰC THI TỪNG BƯỚC CHO AGENT (EXECUTION PLAN)

Hãy thực hiện công việc theo đúng 5 bước tuần tự dưới đây. Sau mỗi bước, hãy báo cáo ngắn gọn những file đã tạo/sửa:

- [ ] **Bước 1 — Khảo sát & Trích xuất Dữ liệu (Audit & Extract):**
  - Đọc cấu trúc codebase hiện tại. Liệt kê các nơi đang hardcode đường dẫn assets, thông số NPC/Map/Prop, và tọa độ UI.
  - Tạo thư mục `src/data/` cùng 4 file chuẩn: `assets.manifest.json`, `prefabs.catalog.json`, `ui.layout.json`, và file scene JSON đầu tiên dựa trên màn chơi hiện có của dự án.

- [ ] **Bước 2 — Xây dựng Lõi Data-Driven (`core/`):**
  - Viết `AssetRegistry.ts`, `PrefabFactory.ts`, và `SceneSerializer.ts`.
  - Đảm bảo hỗ trợ TypeScript Interfaces / Types chặt chẽ cho mọi file JSON để có gợi ý code (Autocomplete) và kiểm tra lỗi (Validation).

- [ ] **Bước 3 — Refactor Tầng Khởi tạo & Render (Không làm hỏng Gameplay):**
  - Thay thế các đoạn code tạo object thủ công trong dự án bằng lệnh gọi `SceneSerializer.loadScene('...')`.
  - Cập nhật `SpriteRenderer2D` để đọc pivot từ manifest và áp dụng **Y-Sorting** chuẩn RPG Maker.
  - Cập nhật phần UI để đọc biến CSS Design Tokens và căn vị trí theo `ui.layout.json`.

- [ ] **Bước 4 — Lắp đặt In-Game Visual Editor (`devtools/`):**
  - Viết `EditorOverlay.ts`, `CanvasGizmo2D.ts`, `InspectorPanel.ts`, và `UIEditorMode.ts`.
  - Gắn phím tắt `F1` để bật/tắt chế độ chỉnh sửa trực quan. Đảm bảo kéo thả được Entity, chỉnh được Hitbox/Pivot, kéo thả được khung UI.

- [ ] **Bước 5 — Tích hợp Live Save (Lưu trực tiếp từ trình duyệt vào Codebase):**
  - Nếu dự án dùng Vite/Webpack/Node dev server: Thêm một middleware nhỏ (ví dụ trong `vite.config.ts`) lắng nghe endpoint `POST /__dev/save-json` để khi bấm nút **"Save"** trên In-Game Editor (F1), dữ liệu tọa độ mới sẽ được ghi thẳng vào file `.json` trong thư mục `src/data/` mà không cần copy-paste thủ công!

---
*Hãy bắt đầu ngay từ **Bước 1**: Quét toàn bộ dự án hiện tại, tóm tắt cấu trúc bạn tìm thấy và tiến hành tạo các file dữ liệu nền tảng.*