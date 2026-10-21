# Coastal replica — Stage 1 review

> Scope revision 2: đây là review lịch sử của pilot. [Roadmap hiện hành](../../design/ui/UI-REPLICA-ROADMAP.md) replica UI và trang trí gắn UI; scene/portrait matching được hoãn. Full-frame diff và backlog pose/background bên dưới không còn chặn G2 UI; UI masks/review mới vẫn cần thực hiện ở R14.

2026-10-09 · **R05–R08 đã bàn giao pipeline và mẫu 7 lớp thực.** Stage 0 đã commit
ở `7d9a65a`. Mẫu Stage 1 chạy tại
<http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=1> sau khi bật server.
Đây là mẫu kỹ thuật/art cho replica; G2 toàn màn chưa đạt.

## Bằng chứng

| Bản chụp | Mục đích |
| --- | --- |
| [Pilot native v3](pilot-native-v3.png) · [metadata](pilot-native-v3.json) | 1672×941, DPR 1; 7 plane độc lập, 15 asset, chữ live và choice thật |
| [Material sáng v2](material-light-v2.png) · [tối v2](material-dark-v2.png) | Paper/wave alpha, lựa chọn, insignia, print/portrait pilots; crop mép 100% và 50% |
| [Typography v2](typography-v2.png) | Ba face local, heading/body/handwriting/numbers, dấu tiếng Việt và 6 icon |
| [Overlay 50/50](pilot-native-v3-overlay.png) · [diff ×4](pilot-native-v3-difference.png) | Đối chiếu trực tiếp concept thoại, cùng native viewport |
| [Comparison report](pilot-native-v3-comparison.json) | Hash reference/candidate, RGBA metrics toàn màn và từng ROI |

Capture chờ PNG/SVG decode, local fonts và hai frame, reset selection về `verify`,
reset layer inspection, khóa input và giữ motion time/seed bằng 0. Mỗi JSON lưu
font đo thực, text bounds, hashes của asset đã tải, fixture và browser. Bản v1/v2
là lịch sử review: v1 wordmark tràn mép và harbor vector giản lược; v2 đã sửa
wordmark/texture/harbor. V3 sửa scope clip từng stage, hoàn thiện capture/diff.
Contact v1 có label choice bị chạm nhau và typography mark gần wordmark; v2 sửa.

## R05–R08 và các cổng

- **R05:** [asset contract](../../../assets/ui/coastal-replica/v1/README.md),
  editable sources, masters/exports, prompts, version/hash/alpha/crop/pivot/layer,
  instance bounds và associated text keys. PNG native/alpha giữ nguyên bytes.
- **R06:** giấy có grain/wash, contour riêng; mực sóng/foam ở plane riêng. Review
  sáng/tối và crop 100%/50% không thấy nền chữ nhật quanh mép mẫu hay seam.
- **R07:** Source Serif 4, Cormorant Garamond, Dancing Script local OFL, pin nguồn;
  cmap có đủ 109 codepoint đã kiểm tra. Insignia không chứa lettering; 6 icon cùng
  bộ nét. Chữ game/preview ở catalog, không bake vào art.
- **R08:** scene → portraits → wave → paper → print → text → foreground. Stage
  uniform fit/letterbox, choice hit testing và keyboard focus hoạt động khi scale;
  masks có ID riêng từng instance. Capture hook thực, dispose/abort có kiểm chứng.

**G1 qua trong phạm vi mẫu paper/wave/choice material và insignia/icon.** Việc này
chứng minh pipeline, chất liệu và cạnh alpha mẫu. Chưa chứng nhận production PNG,
độ chính xác contour 2 px hay font nguồn. G2/G3/G4/G5 toàn game còn mở. Không có
animation production ở Stage 1; giữ mẫu tĩnh làm chuẩn trước R15–R20.

## Sai lệch còn chặn G2

| Mức | Quan sát từ native và overlay | Công việc tiếp theo |
| --- | --- | --- |
| Chặn | Khuê cúi thấp hơn reference; mắt, tay, silhouette và crop hai portrait khác. Báo Vân thiếu lettering/chi tiết đúng ảnh | R10: pose masters, facial identity, alpha/occlusion và held-paper riêng |
| Chặn | Nền chỉ là clean pilot: props/tỷ lệ/nắng không hoàn toàn trùng; bảng đen và poster chưa có copy live, dấu trên cốc còn thiếu | R09, R11: plate và prop layers chính xác; microcopy từ content |
| Lớn | Desk strip hiện dùng một mask tạm; note/hoa foreground có silhouette/depth khác; note chưa có copy | R11: foreground masters/masks; không nhận mask tạm là production |
| Lớn | Harbor print quá nhỏ/thưa ở đáy; ink wash và white grain khác texture reference; giấy/foam chưa khớp mọi điểm neo | R12: printed illustration placement, contour và blend review native |
| Lớn | Choice copy, date type, speaker ornament/rules và brand mark còn khác nét/kerning/width | R13: chốt type metrics và các ornament theo overlay |
| Lớn | Chưa dựng các chi tiết chữ nhỏ trên báo/cốc/sổ; chưa xử lý text dài bằng dữ liệu gameplay | R12–R14 và bước tích hợp sau; không tự bịa prose trên art |

RGBA MAE của v3 là **25.2556/255**; khoảng **99.95% pixel** có ít nhất một channel
khác reference. Texture/antialias cũng được tính nên đây là phép đo chẩn đoán,
không phải điểm similarity hay điều kiện nghiệm thu. Overlay cho thấy sai pose
rõ ràng; qua browser tests không thay thế được việc sửa những lỗi này.

## Kiểm chứng

Focused suite Stage 1: **12/12**; kiểm tra plane thật, live text/overflow, pointer
targets ở hai scale có letterbox, keyboard/ARIA/focus, isolation, local fonts,
paper alpha, typography, clip IDs, capture rejection/reset/input lock và disposal.
Các kết quả còn lại và hash hiện hành được lưu trong [validation.json](validation.json).
Chrome headless software phù hợp capture tĩnh; chưa đo GPU/motion/performance thật.

Tiếp tục **Stage 2 / R09–R14** theo [roadmap](../../design/ui/UI-REPLICA-ROADMAP.md): ưu tiên
pose/silhouette và environment/occlusion, rồi paper print/type, cuối cùng native
overlay từng vùng. Chưa nhân rộng mẫu sang menu/HUD/dossier khi thoại chưa qua G2.
