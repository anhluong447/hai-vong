# Menu — layout & kiến trúc Stage 5 (R24–R27)

> Bản thiết kế viết tay lịch sử theo concept menu năm tab. Được tách khỏi file
> output của Stage 0 generator để giữ nội dung nguồn. Menu hiện tại theo
> [thiết kế sáu tab](../../design/ui/MENU-V2-IMPLEMENTATION.md).

> Tham chiếu reference: `docs/ui-concepts/coastal-editorial-v1/02-menu.png` (1672 × 941).
> Quy chuẩn: Scope revision 2 theo [UI-REPLICA-ROADMAP.md](../../design/ui/UI-REPLICA-ROADMAP.md) và [ui-scope.json](../../ui-specs/coastal-replica/ui-scope.json).

---

## 1. Mục tiêu và ranh giới Stage 5

Stage 5 tập trung xây dựng toàn bộ **giao diện Menu biên tập ven biển** cố định và các trang trí gắn liền với UI, kế thừa các tiêu chuẩn chất lượng đã thiết lập ở màn Thoại (P1–P4).

### Ranh giới UI vs Context (theo Scope Revision 2)

- **UI bắt buộc (Replica 1:1, điều kiện qua cổng G1–G3):**
  1. **Mảng mực xanh hữu cơ (`teal-mass`):** Hình khối bất đối xứng, mép sóng loang, bề mặt chất liệu giấy/mực.
  2. **Branding & Tagline:** Wordmark "HỒI ÂM" live text, mark cánh buồm/sóng, tagline viết tay 3 dòng "Câu chuyện / Từ Hải Vọng / Đến mọi người", nhãn tuần "Hải Vọng · Tuần 02".
  3. **Navigation Spine:** Trục điều hướng dọc x=59, 5 tab (HỒ SƠ, ĐỒNG ĐỘI, LỊCH, NHẬT KÝ, THIẾT LẬP) với icon, bullet dots và vệt cọ vàng highlight (`nav-highlight`).
  4. **Section Header & Description:** Tiêu đề mục "Hồ sơ đang mở", đường kẻ teal, lời giới thiệu 2 dòng.
  5. **Hai Case Cards (`case-one`, `case-two`):** Thẻ giấy đục lỗ (punched paper), góc nghiêng tự nhiên, số thứ tự cyan italic (01, 02), tiêu đề ("Khoản thu câu lạc bộ", "Sân bóng đóng cửa"), teaser tóm tắt, khung ảnh thumbnail với băng dính dán góc và nhãn cổng "TẠM ĐÓNG CỬA".
  6. **Resource Strip & Lời trích:** Dải hiển thị Năng lượng (tia sét + 4 chấm trạng thái [3/4]), Ngân quỹ ("450đ"), câu trích dẫn viết tay 3 dòng màu ngọc nhạt.
  7. **Viền sóng/giấy đáy & Điều khiển:** Sóng mực và mép giấy đáy (`bottom-wave`), phím tắt điều khiển (`[↵] Chọn`, `[Esc] Trở lại`), hoa/lá và mép báo tiền cảnh (`foreground-paper`, `foreground-flowers`).

- **Context thay thế (ngoài cổng UI, không chặn nghiệm thu):**
  - Cảnh cảng, cửa sổ, cây cối tòa soạn phía sau (`harbor-room`).
  - Nhân vật Khuê cầm sổ satchel (`khue-notebook`).
  - Poster tường và chữ trên poster (`wall-poster`, `wall-poster-copy`).
  - *Chính sách:* Dùng plate màu trung tính hoặc placeholder cảnh hiện có để preview UI; không bắt buộc clone camera/pose của concept.

---

## 2. R24 — Component Map & Kiến trúc 7 Layer Planes

Stage 5 tổ chức bố cục thành **7 plane** độc lập, nhất quán với `ReplicaStage`:

| Layer | ID | Thành phần hiển thị | Quy cách kỹ thuật |
| --- | --- | --- | --- |
| 1 | `scene` | Context plate (cảng/tòa soạn/Khuê placeholder) | Slot thay thế, opacity 1.0, không chặn hit-test |
| 2 | `teal-surface` | Mảng mực xanh hữu cơ (`material.teal-mass`) | SVG vector mask, gradient pigment `#0d4955` → `#103b45`, turbulence grain |
| 3 | `wave-bottom` | Viền sóng và mép giấy đáy (`material.bottom-wave`) | SVG vector contour, dải bọt foam, grain wash |
| 4 | `cards` | Hai thẻ hồ sơ (`case-one-paper`, `case-two-paper`) | Thẻ giấy đục lỗ quad nghiêng (-2.5° đến -3°), contact shadow riêng |
| 5 | `print` | Spine, rules, icons, thumbnail slots, tape, seal | Vector line art, stroke-width 1.2–1.4, không baked text |
| 6 | `text` | Reading copy live từ `content/locales/vi.js` | Font OFL local: Source Serif 4, Cormorant Garamond, Dancing Script |
| 7 | `foreground` | Mép báo tiền cảnh (`foreground-paper`), hoa viền (`foreground-flowers`) | Alpha PNG/SVG trang trí gắn mép viền, filter drop shadow nhẹ |

---

## 3. R25 — Nền xanh hữu cơ, Navigation Spine, Branding & Resource Strip

### 3.1. Mảng xanh hữu cơ (`teal-mass`)
- **Tọa độ bao:** `[0, 0, 1060, 875]`.
- **Mép đường cong phía phải:** Polyline mẫu qua 13 điểm native anchor:
  `(480, 0) → (580, 104) → (660, 181) → (796, 256) → (928, 302) → (1040, 357) → (1058, 390) → (1012, 488) → (1028, 592) → (922, 696) → (870, 761) → (760, 810) → (663, 864)`.
- **Chất liệu:** Pigment wash `#085362` loang sang `#0e3e4a`, grain opacity `0.14`, feather edge mềm mại.

### 3.2. Branding & Tagline
- **Wordmark "HỒI ÂM":** `Cormorant Garamond`, font size 92, weight 500, fill `#f6f0e3`, baseline y=126 tại x=52.
- **Mark cánh buồm/sóng:** `shared.brand-mark` kích thước 83×59 tại (362, 79).
- **Brand rule:** Kẻ ngang mảnh dưới thương hiệu (52, 133, 334, 7), stroke `#2d7986`.
- **Nhãn thành phố / tuần:** "Hải Vọng · Tuần 02", `Source Serif 4`, 22px, tracking rộng 0.15em.
- **Tagline viết tay:** `Dancing Script`, 25px, fill `#b8e2e6`, 3 dòng nghiêng nhẹ:
  `"Câu chuyện / Từ Hải Vọng / Đến mọi người"`.

### 3.3. Navigation Spine & 5 Tab
- **Trục dọc:** x=59, từ y=243 đến y=628, stroke `#1f6d7a`, width 1.2, kết thúc bằng các bullet dots tại mỗi vị trí mục.
- **Vệt cọ vàng highlight (`nav-highlight`):** Tọa độ `[35, 235, 319, 75]`, gradient vàng ấm `#f7d47a` → `#eed068`, grain vệt cọ loang tự nhiên.
- **Danh sách 5 Tab:**
  1. `nav-cases`: **HỒ SƠ** (tab active mặc định, y=254, icon folder/dossier).
  2. `nav-team`: **ĐỒNG ĐỘI** (y=337, icon two figures).
  3. `nav-calendar`: **LỊCH** (y=422, icon calendar grid).
  4. `nav-journal`: **NHẬT KÝ** (y=508, icon quill/journal).
  5. `nav-settings`: **THIẾT LẬP** (y=594, icon gear/compass).
- **Typography Tab:** `Source Serif 4`, uppercase, font size 30px (khi active: weight 600, fill `#15182f` trên vệt vàng; khi inactive: weight 400, fill `#e4edf0`).

### 3.4. Resource Strip & Điều khiển
- **Năng lượng (`energy-copy`, `energy-icon-dots`):**
  - Icon tia sét vàng tại (82, 707).
  - 4 chấm trạng thái: 3 chấm tròn filled `#f7d47a`, 1 chấm viền stroke `#3a6972`.
  - Nhãn "Năng lượng" (18px) và giá trị "3/4" (22px).
- **Ngân quỹ (`money-icon`, `money-copy`):**
  - Icon đồng tiền vàng tại (86, 794).
  - Giá trị "450đ": 30px editorial serif `#f6f0e3`.
- **Quote viết tay:**
  - `Dancing Script`, 25px, màu ngọc nhạt `#89c3c7`, 3 dòng trích dẫn:
    *“Có những chuyện / chỉ thật sự bắt đầu / khi ta chịu lắng nghe.”*
- **Key hints:** `[↵] Chọn` và `[Esc] Trở lại` tại (1366, 872), phím bấm viền mảnh bo góc 4px.

---

## 4. R26 — Hai Case Cards (Hồ sơ 01 & 02)

### 4.1. Hình học thẻ giấy đục lỗ (Punched Paper Quads)
- **Thẻ 01 (`case-one-paper`):**
  - Tọa độ bao: `[368, 391, 685, 162]`.
  - Góc quad: `[(368, 416), (1027, 391), (1052, 528), (369, 550)]` (~-2.2°).
  - Lỗ đục tròn ghim hồ sơ ở mép trái (x=382, y=470, r=4.5).
- **Thẻ 02 (`case-two-paper`):**
  - Tọa độ bao: `[369, 532, 676, 164]`.
  - Góc quad: `[(369, 566), (1028, 532), (1045, 665), (370, 695)]` (~-2.8°).
  - Lỗ đục tròn ghim hồ sơ ở mép trái (x=382, y=612, r=4.5).
- **Chất liệu:** Nền giấy màu be ngà `#fbf6ec` → `#efe3ce`, grain opacity 0.10, viền mép rách nhẹ.

### 4.2. Bố cục nội dung trong thẻ
- **Số hồ sơ:** "01", "02" — Italic serif, font size 38px, màu xanh biển cyan `#176e7d`, baseline lần lượt y=451 và y=599.
- **Đường phân cách đứng:** Stroke `#8caab0`, width 1.1 px, height ~95 px.
- **Tiêu đề hồ sơ:**
  - Thẻ 01: "Khoản thu câu lạc bộ" (`Source Serif 4`, 28px, weight 600, `#15182f`).
  - Thẻ 02: "Sân bóng đóng cửa" (`Source Serif 4`, 29px, weight 600, `#15182f`).
- **Teaser tóm tắt:** Font size 18px, weight 400, `#3b4e56`, line-height 24px:
  - Thẻ 01: "Những con số, những câu hỏi, / và một buổi họp còn nhiều điều bỏ ngỏ."
  - Thẻ 02: "Vì sao sân bóng của trường / bất ngờ tạm ngừng hoạt động?"

### 4.3. Thumbnail Slots & Đạo cụ đính kèm
- **Thẻ 01 Thumbnail:** Kích thước slot 250×135 tại (797, 396). Ảnh tư liệu bài báo, có góc băng dính mờ dán chéo phía trên bên phải.
- **Thẻ 02 Thumbnail:** Kích thước slot 255×146 tại (791, 540). Ảnh cổng sân bóng trường học.
- **Nhãn cổng "TẠM ĐÓNG CỬA":** Lớp chữ live overlay, font condensed sans 20px, uppercase, fill `#e63946` / viền trắng, nghiêng theo góc phối cảnh biển treo cổng (transform matrix góc ~6°).

---

## 5. R27 — Kế hoạch Cổng nghiệm thu (G1–G3 Menu)

| Cổng | Đầu ra & Tiêu chí nghiệm thu | Phương pháp kiểm chứng |
| --- | --- | --- |
| **G1 — Asset UI** | - Toàn bộ SVG masters/exports cho mảng teal, case card paper, spine, icons, highlight.<br>- Khám xét alpha, palette, texture grain; không chứa baked text trong vector masters. | `python tools/build_replica_assets.py`<br>Hash manifest & SVG XML inspection |
| **G2 — UI Tĩnh** | - Viewport native 1672×941 DPR 1.<br>- UI-isolated capture trên 4 nền: sáng, tối, chi tiết, scene context.<br>- Conservative interior mask cho menu: vùng đo mảng teal, case cards, nav spine, branding.<br>- Sai lệch anchor ≤ 2px ở native scale. | `tools/capture_replica.py --screen menu --compare-ui`<br>Masked diff & overlay diagnostics |
| **G3 — Motion UI** | - Tái sử dụng engine `DialogueMotion` với motion sheet riêng của Menu:<br>  * Entry: Tab stagger, teal wash reveal.<br>  * Navigation: Vệt cọ vàng lướt mượt mà giữa các tab (spring/cubic-bezier).<br>  * Card interaction: Hover card lift nhẹ (dy = -2.5px), scale 1.01, highlight shadow.<br>  * Ambient: Viền sóng đáy chuyển động chu kỳ khép kín 16s, chữ đứng yên. | `tools/verify_dialogue_motion.py`<br>WebM headless recording & CDP RAF loop |

---

## 6. Bảng đo đạc chi tiết 49 vùng Stage 0 (Historical Reference)

| # | ID / role | x, y, w, h | z | Method | Asset / planned text group | Occlusion / production note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | harbor-room / Cảng, cửa sổ, cây và tòa soạn | 0, 0, 1672, 941 | 10 | reconstruct | menu.harbor-room | Plate đầy đủ sau nhân vật và xanh mực. |
| 2 | wall-poster / Poster bên phải và mark | 1530, 91, 142, 251 | 12 | reconstruct | menu.wall-poster | Nền giấy không chữ; các chữ dựng riêng. |
| 3 | wall-poster-copy / Chữ poster | 1572, 207, 96, 119 | 13 | text | menu.scene-signs | Theo perspective bề mặt. |
| 4 | teal-mass / Mảng mực xanh toàn trái | 0, 0, 1060, 875 | 20 | vector-mask | menu.teal-mass | Silhouette hữu cơ và texture, không panel chữ nhật. |
| 5 | brand-mark / Mark title | 362, 79, 83, 59 | 25 | vector-mask | shared.brand-mark | Vector master có variant. |
| 6 | brand-title / HỒI ÂM | 52, 43, 282, 102 | 26 | text | menu.brand | Serif sáng; baseline khoảng 126. |
| 7 | brand-rule / Kẻ dưới thương hiệu | 52, 133, 334, 7 | 25 | vector-mask | menu.brand-rule | Đường kẻ ngang phân cách. |
| 8 | week-label / Thành phố / tuần | 54, 149, 255, 23 | 26 | text | menu.week | Tracking rộng. |
| 9 | brand-tagline / Câu viết tay ở phía trên | 470, 118, 224, 128 | 26 | text | menu.tagline | Chữ viết tay ba dòng; theo góc giấy/mực. |
| 10 | nav-spine / Trục dọc và chấm navigation | 51, 243, 17, 385 | 30 | vector-mask | menu.nav-spine | Đường trục chính cho menu tab. |
| 11 | nav-highlight / Vệt cọ vàng mục chọn | 35, 235, 319, 75 | 31 | vector-mask | menu.nav-highlight | Sơn vàng có grain và đầu xước. |
| 12 | nav-cases-icon / Hồ sơ: icon | 80, 255, 49, 44 | 32 | vector-mask | menu.nav-cases-icon | Icon folder hồ sơ. |
| 13 | nav-cases-copy / Hồ sơ: nhãn | 145, 254, 197, 48 | 33 | text | menu.nav-cases | Chữ uppercase serif. |
| 14 | nav-team-icon / Đồng đội: icon | 80, 338, 49, 44 | 32 | vector-mask | menu.nav-team-icon | Icon nhân vật đồng đội. |
| 15 | nav-team-copy / Đồng đội: nhãn | 145, 337, 197, 48 | 33 | text | menu.nav-team | Chữ uppercase serif. |
| 16 | nav-calendar-icon / Lịch: icon | 80, 423, 49, 44 | 32 | vector-mask | menu.nav-calendar-icon | Icon lịch bàn. |
| 17 | nav-calendar-copy / Lịch: nhãn | 145, 422, 197, 48 | 33 | text | menu.nav-calendar | Chữ uppercase serif. |
| 18 | nav-journal-icon / Nhật ký: icon | 80, 509, 49, 44 | 32 | vector-mask | menu.nav-journal-icon | Icon cuốn sổ nhật ký. |
| 19 | nav-journal-copy / Nhật ký: nhãn | 145, 508, 197, 48 | 33 | text | menu.nav-journal | Chữ uppercase serif. |
| 20 | nav-settings-icon / Thiết lập: icon | 80, 595, 49, 44 | 32 | vector-mask | menu.nav-settings-icon | Icon bánh răng/la bàn. |
| 21 | nav-settings-copy / Thiết lập: nhãn | 145, 594, 197, 48 | 33 | text | menu.nav-settings | Chữ uppercase serif. |
| 22 | section-heading / Hồ sơ đang mở | 405, 260, 386, 57 | 35 | text | menu.heading | Title riêng giữa screen. |
| 23 | section-rule / Kẻ dưới section | 405, 327, 394, 7 | 34 | vector-mask | menu.section-rule | Đường kẻ ngang dưới header. |
| 24 | section-intro / Mô tả section | 405, 342, 369, 47 | 35 | text | menu.intro | Lời giới thiệu hai dòng. |
| 25 | case-one-paper / Mẩu hồ sơ 01 | 368, 391, 685, 162 | 40 | vector-mask | menu.case-one-paper | Góc giấy theo quad; đục lỗ; không bake thumbnail/chữ. |
| 26 | case-one-number / Số 01 | 397, 451, 42, 42 | 42 | text | menu.case-one-number | Số italic cyan. |
| 27 | case-one-rule / Rule bên số 01 | 459, 428, 7, 97 | 41 | vector-mask | menu.case-one-rule | Kẻ đứng phân tách số và title. |
| 28 | case-one-title / Title hồ sơ 01 | 490, 430, 302, 35 | 42 | text | menu.case-one-title | Upper/lower case theo ref. |
| 29 | case-one-teaser / Teaser hồ sơ 01 | 490, 478, 281, 45 | 42 | text | menu.case-one-teaser | Hai dòng mô tả. |
| 30 | case-one-thumb / Ảnh báo/tư liệu | 797, 396, 250, 135 | 41 | reconstruct | menu.case-one-thumb | Băng dính và phần text trong ảnh phải tách slot. |
| 31 | case-two-paper / Mẩu hồ sơ 02 | 369, 532, 676, 164 | 40 | vector-mask | menu.case-two-paper | Góc giấy theo quad; đục lỗ. |
| 32 | case-two-number / Số 02 | 397, 599, 43, 39 | 42 | text | menu.case-two-number | Số italic cyan. |
| 33 | case-two-rule / Rule bên số 02 | 461, 576, 6, 95 | 41 | vector-mask | menu.case-two-rule | Kẻ đứng phân tách. |
| 34 | case-two-title / Title hồ sơ 02 | 491, 576, 277, 40 | 42 | text | menu.case-two-title | Theo góc strip. |
| 35 | case-two-teaser / Teaser hồ sơ 02 | 490, 625, 280, 47 | 42 | text | menu.case-two-teaser | Hai dòng mô tả. |
| 36 | case-two-thumb / Ảnh cổng sân bóng | 791, 540, 255, 146 | 41 | reconstruct | menu.case-two-thumb | Slot ảnh cổng sân bóng. |
| 37 | case-two-sign / Nhãn tạm đóng cửa | 877, 607, 148, 45 | 42 | text | menu.case-two-sign | Text trong thumbnail; transform theo phối cảnh. |
| 38 | lower-quote / Lời trích viết tay | 405, 716, 294, 110 | 43 | text | menu.quote | Ba dòng và quotation marks. |
| 39 | resources-rules / Đường kẻ resource | 55, 678, 254, 107 | 45 | vector-mask | menu.resources-rules | Viền phân tách năng lượng/ngân quỹ. |
| 40 | energy-icon-dots / Lightning và energy dots | 82, 707, 194, 56 | 46 | vector-mask | menu.energy-icon-dots | 4 chấm: ba filled, một empty; fixture. |
| 41 | energy-copy / Label và số năng lượng | 134, 708, 166, 60 | 47 | text | menu.energy | Label nhỏ, số lớn. |
| 42 | money-icon / Icon tiền | 86, 794, 32, 39 | 46 | vector-mask | menu.money-icon | Biểu tượng đồng xu. |
| 43 | money-copy / 450đ | 134, 796, 118, 34 | 47 | text | menu.money | Giá trị tài nguyên hiện tại. |
| 44 | khue-notebook / Khuê cầm sổ, satchel | 1009, 28, 663, 832 | 50 | new-pose | menu.khue-notebook | Context portrait slot; deferred. |
| 45 | notebook-lettering / Chữ/mark trên sổ | 1342, 575, 215, 145 | 51 | text | menu.notebook | Chữ nghiêng trên sổ; deferred. |
| 46 | bottom-wave / Viền sóng/mực và giấy đáy | 0, 763, 1672, 178 | 65 | vector-mask | menu.bottom-wave | Sóng mực viền chân giao diện. |
| 47 | foreground-paper / Báo tiền cảnh đáy giữa | 439, 761, 836, 180 | 70 | reconstruct | menu.foreground-paper | Blur tiền cảnh mép footer. |
| 48 | foreground-flowers / Hoa/lá hai góc | 0, 700, 408, 241 | 71 | reconstruct | menu.foreground-flowers | Tiền cảnh hoa lá viền góc trái. |
| 49 | key-hints / Chọn / Esc trở lại | 1366, 872, 284, 43 | 75 | text | menu.controls | Phím điều khiển chân trang. |

---

## 7. Anchors, Contours và Typography Fixtures

```json
{
  "anchors": [
    {
      "id": "khue-eye",
      "point": [1238, 266],
      "note": "Left visible iris in screen coordinates; context seed"
    },
    {
      "id": "nav-selected",
      "point": [191, 273]
    },
    {
      "id": "case-one-title-baseline",
      "point": [490, 457]
    },
    {
      "id": "case-two-title-baseline",
      "point": [491, 607]
    }
  ],
  "contours": [
    {
      "id": "teal-right-edge",
      "layer": "teal-mass",
      "kind": "visible-sampled-polyline",
      "points": [
        [480, 0], [580, 104], [660, 181], [796, 256], [928, 302],
        [1040, 357], [1058, 390], [1012, 488], [1028, 592], [922, 696],
        [870, 761], [760, 810], [663, 864]
      ],
      "note": "Mép mảng xanh hữu cơ nhìn thấy; vùng giao cắt với thẻ hồ sơ."
    },
    {
      "id": "case-one-quad",
      "layer": "case-one-paper",
      "kind": "quad",
      "points": [
        [368, 416], [1027, 391], [1052, 528], [369, 550]
      ]
    },
    {
      "id": "case-two-quad",
      "layer": "case-two-paper",
      "kind": "quad",
      "points": [
        [369, 566], [1028, 532], [1045, 665], [370, 695]
      ]
    }
  ]
}
```

### Catalog Text Keys quy hoạch cho Menu

| Nhóm | Key catalog | Chuỗi hiển thị | Font & Size dự kiến |
| --- | --- | --- | --- |
| `menu.brand` | `ui.replica.menu.brand.1` | HỒI ÂM | Cormorant Garamond 92px |
| `menu.week` | `ui.replica.menu.week.1` | Hải Vọng · Tuần 02 | Source Serif 4 22px |
| `menu.tagline` | `ui.replica.menu.tagline.1` | Câu chuyện\nTừ Hải Vọng\nĐến mọi người | Dancing Script 25px |
| `menu.nav` | `ui.replica.menu.nav_cases.1` | HỒ SƠ | Source Serif 4 30px (active) |
| `menu.nav` | `ui.replica.menu.nav_team.1` | ĐỒNG ĐỘI | Source Serif 4 30px |
| `menu.nav` | `ui.replica.menu.nav_calendar.1` | LỊCH | Source Serif 4 30px |
| `menu.nav` | `ui.replica.menu.nav_journal.1` | NHẬT KÝ | Source Serif 4 30px |
| `menu.nav` | `ui.replica.menu.nav_settings.1` | THIẾT LẬP | Source Serif 4 30px |
| `menu.heading` | `ui.replica.menu.heading.1` | Hồ sơ đang mở | Source Serif 4 54px |
| `menu.intro` | `ui.replica.menu.intro.1` | Những manh mối, con người và câu chuyện\nđang chờ được viết tiếp. | Source Serif 4 19px |
| `menu.case1` | `ui.replica.menu.case_one_number.1` | 01 | Italic Serif 38px |
| `menu.case1` | `ui.replica.menu.case_one_title.1` | Khoản thu câu lạc bộ | Source Serif 4 28px |
| `menu.case1` | `ui.replica.menu.case_one_teaser.1` | Những con số, những câu hỏi,\nvà một buổi họp còn nhiều điều bỏ ngỏ. | Source Serif 4 18px |
| `menu.case2` | `ui.replica.menu.case_two_number.1` | 02 | Italic Serif 38px |
| `menu.case2` | `ui.replica.menu.case_two_title.1` | Sân bóng đóng cửa | Source Serif 4 29px |
| `menu.case2` | `ui.replica.menu.case_two_teaser.1` | Vì sao sân bóng của trường\nbất ngờ tạm ngừng hoạt động? | Source Serif 4 18px |
| `menu.case2` | `ui.replica.menu.case_two_sign.1` | TẠM ĐÓNG CỬA | Condensed Sans 20px |
| `menu.quote` | `ui.replica.menu.quote.1` | “Có những chuyện\nchỉ thật sự bắt đầu\nkhi ta chịu lắng nghe.” | Dancing Script 25px |
| `menu.energy` | `ui.replica.menu.energy.1` | Năng lượng | Source Serif 4 18px |
| `menu.energy` | `ui.replica.menu.energy.2` | 3/4 | Source Serif 4 22px |
| `menu.money` | `ui.replica.menu.money.1` | 450đ | Source Serif 4 30px |
| `menu.controls` | `ui.replica.menu.controls.1` | ↵ | Keycap Glyph |
| `menu.controls` | `ui.replica.menu.controls.2` | Chọn | Source Serif 4 21px |
| `menu.controls` | `ui.replica.menu.controls.3` | Esc | Keycap Glyph |
| `menu.controls` | `ui.replica.menu.controls.4` | Trở lại | Source Serif 4 21px |
