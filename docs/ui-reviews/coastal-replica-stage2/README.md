# Coastal replica — Stage 2 dialogue review

2026-10-09 · triển khai từ commit `1519393`. Bản thoại tĩnh Stage 2 đã có art,
composition, live text và kiểm thử; **chưa nghiệm thu G2**. Preview mặc định:
<http://127.0.0.1:8080/tools/coastal-replica-preview.html>.
Stage 1 vẫn mở bằng `?version=1`.

## Bản dựng hiện tại

![Thoại native Stage 2](dialogue-native-v4.png)

| Task | Đã triển khai | Phạm vi còn review |
| --- | --- | --- |
| R09 | Newsroom/window/desk plate sạch; chữ bảng và poster là live text | Geometry/props/nét nền chưa trùng source |
| R10 | Hai PNG alpha pose ngồi; Vân cầm báo; scale đồng đều và face registration | Tóc, áo, vai, tay và báo còn sai silhouette |
| R11 | Desk clip theo từng chồng sách/đạo cụ; hoa, sổ và lá là foreground riêng | Hình hoa/lá, crop sổ, edge restoration và overlap cục bộ |
| R12 | Paper contour theo anchor, wave/shore ink, harbor print, speaker rules, continue | Hạt mực/foam, hình minh họa, độ rộng chữ và marks |
| R13 | Ba choice có trạng thái, date seal, wordmark/brand mark, copy riêng | Viền giấy, glyph/icon, nét dấu ngày và spacing chưa khớp |
| R14 | Native, overlay, difference, contact sheets và danh sách sai lệch | G2 mở; phải sửa các lỗi lớn bên dưới trước R15 |

Pack [v2](../../../assets/ui/coastal-replica/v2/README.md) có **19 asset / 29
instance**: 6 PNG sinh bằng skill imagegen builtin ở chế độ edit từ concept
thoại, 13 SVG code-native. [Prompts](../../../assets/ui/coastal-replica/v2/prompts.json)
được lưu đầy đủ. Các ảnh gốc, pack Stage 1 và baseline giữ nguyên.

Chữ trên bảng/poster/báo/cốc/sổ không nằm trong bitmap. Các hàng nhỏ trên báo
hiện là rule đồ họa; ảnh minh họa báo là biến thể grayscale của cảng. Microcopy
khó đọc chưa được phục dựng và được ghi trong
[fixture bổ sung](../../ui-specs/coastal-replica/dialogue-production.json).

## Bằng chứng và cách đọc

- Hiện tại: [native v4](dialogue-native-v4.png), [capture contract](dialogue-native-v4.json),
  [overlay 50/50](dialogue-native-v4-overlay.png), [difference ×4](dialogue-native-v4-difference.png),
  [ROI report](dialogue-native-v4-comparison.json).
- Asset: [nền sáng](material-light-v3.png), [nền tối](material-dark-v3.png),
  [sáu master PNG](props-v3.png). Contact gồm portrait alpha, paper/ink,
  choice/mark/print và crop mép 100%/50%; đây chưa thay được full native edge review.
- [Validation](validation.json) ghi suite, source/evidence hashes, font coverage,
  phạm vi visual gate và environment. Metadata capture ghi native type bounds
  sau transform, font faces, manifest và từng decoded asset.

Viewport nội dung 1672×941, DPR 1, vi-VN, Asia/Bangkok, clock/seed/motion khóa
theo fixture; capture chờ local fonts và decode từng SVG image. Chrome headless
software xác nhận bản tĩnh, chưa nghiệm thu GPU, realtime lighting hay motion.

MAE RGBA trung bình của v4 là **16.5845**, so với **25.2556** của pilot Stage 1.
Đây là đo chẩn đoán trên toàn frame, không phải phần trăm giống ảnh. Bản v2 có
MAE thấp hơn (16.3749) nhưng crop mất phố trong harbor print, nên **không được
chọn làm bản chuẩn**. V3 sửa crop; v4 phục dựng khoảng giấy sổ bên phải. Giữ
v1–v4 và contact cũ để thấy lịch sử, không dùng chúng chứng nhận manifest mới.

## Sai lệch chặn G2 và lượt sửa tiếp theo

| Mức | Vùng | Sai lệch và việc cần làm |
| --- | --- | --- |
| Lớn | Khuê / Vân | Overlay còn double contour tóc, vai và áo; mắt/hoa đã gần anchor nhưng hình tay/báo và nếp áo khác. Sửa shape cục bộ từ source, không scale lệch trục hoặc blur để giấu sai |
| Lớn | Báo Vân cầm | Headline/columns/illustration khác reference; rule đồ họa chưa thay được microcopy. Cần artwork báo và nội dung xác định, giữ chữ riêng khỏi sprite |
| Lớn | Date / brand / speaker / body | Font nguồn chưa xác định; độ rộng, stroke seal/mark và baseline vẫn hiện bóng đôi ở overlay. Review từng type bound/glyph, không chỉ khớp envelope |
| Lớn | Wave / paper / harbor print | Contour đã bám các anchor được đo nhưng foam/grain còn đều, print chưa đúng hình/độ đậm. Cần chi tiết mực và crop native theo từng đoạn |
| Lớn | Sổ / hoa / lá tiền cảnh | Silhouette khác, sổ sinh ảnh bị cắt cần edge phục dựng; tiếp tục sửa crop/nét và hòa chất liệu ở phần nối |
| Lớn | Newsroom / desk | Một số sách/ghế/cốc/khung cửa là phục dựng, vị trí/độ nét/nắng chưa giống source. Căn lại landmarks và desk overlap trước lighting chung |

G1 production alpha còn cần kiểm tra mép native từng asset, nhất là tóc và sổ.
R14 đã giao công cụ/bằng chứng nhưng còn vòng sửa visual. **R15–R17 chưa bắt đầu**;
chưa nhân rộng menu/HUD/dossier hay thêm animation vào bản chưa qua G2.

## Kiểm chứng hành vi

Main **72/72**, Stage 2 **14/14**, regression Stage 1 **12/12**, reference tooling
**13/13**. Architecture **0 issue / 780 text entries**; 8 policy sandbox và 4
policy gameplay khớp baseline. Hai builder và source lock Stage 0 đều qua check;
Python compile và whitespace check qua.

Suite Stage 2 kiểm tra decoded asset/hash, portrait uniform scale, live multiline
copy, paper anchors ≤2 px, clip IDs độc lập, input xuyên alpha foreground, targets
choice ở hai scale, bàn phím/focus, callback một lần, capture reset/lock, lỗi
catalog/view không làm đổi state và disposal. Các test này xác nhận renderer và
hành vi; chất lượng nét vẽ/compositing vẫn cần review ảnh phía trên.
