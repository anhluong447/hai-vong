# Coastal replica — Stage 2 dialogue art

> Scope revision 2: pack giữ cả UI và context đã sinh. [Roadmap hiện hành](../../../../docs/design/ui/UI-REPLICA-ROADMAP.md) chỉ nghiệm thu UI và trang trí gắn UI; background, portrait và scene props làm sau. Tiếp tục paper/wave/print/hoa/notebook/type/date/choices; pose/scene matching trong mô tả lịch sử không còn chặn gate UI. UI-scope classification chưa thay thế production masks hoặc scoped G2 review.

2026-10-09 · R09–R14 · bản tĩnh đang review, **G2 chưa qua**.
Pack này có **19 asset: 6 PNG và 13 SVG**, với 29 instance khai báo trong
[manifest](manifest.json). Stage 1 vẫn giữ nguyên ở `../v1/`.

## Nguồn biên tập

| Nguồn | Đầu ra | Cách cập nhật |
| --- | --- | --- |
| [prompts.json](prompts.json), 6 PNG trong `masters/` | PNG byte-identical trong `exports/` | Imagegen builtin, chế độ edit với reference thoại; giữ alpha, tạo version mới khi sửa |
| [masters/materials.json](masters/materials.json) | 13 SVG master/export | Sửa paths/material/seed hoặc builder rồi build |
| [coastal-dialogue.json](../../../../content/ui/coastal-dialogue.json) | compiled content JS và manifest instances | Sửa composition, mask, type hoặc registration trong JSON |
| [font manifest](../../../fonts/coastal-replica/manifest.json) và font project cũ | 4 family local | Kiểm tra hash/license/cmap; không tải mạng trong build thường lệ |

Raster gồm newsroom sạch, Khuê ngồi, Vân ngồi cầm báo trắng, hoa tiền cảnh trái,
sổ/lá tiền cảnh phải và minh họa cảng in mực. Sáu prompt, reference, transparency
và đường dẫn output được lưu trong pack. PNG được copy nguyên bytes; Python
chỉ đọc kích thước/alpha. Không chỉnh pixel, resize hay xóa nền bằng script.
SVG là code-native, không chứa `<text>`.

## Placement và che khuất

Stage giữ khung **1672×941**, bảy plane: scene → portraits → wave → paper →
print → text → foreground. Portrait giữ canvas gốc và scale đồng đều (.66 Khuê,
.65 Vân); face anchors/translation riêng, không kéo méo để ép silhouette.
Alpha envelope có thể chứa pixel rất mờ ngoài hình chính, nên contact sheet
dùng sourceRect thủ công với `meet`; không suy ra pose từ full alpha bbox.

Desk là instance của **plate sạch**, dùng contour che sách, cốc/bút và mặt bàn;
không lấy bàn có UI/nhân vật từ ảnh reference. Paper clip dùng chính path của
material. Đường giấy nội suy qua các anchor Stage 0; test phát hiện drift trên
2 px tại các điểm được đo, không chứng nhận mọi pixel giữa các điểm.
Shore ink ở plane print nằm trên giấy, wave dưới giấy. Minh họa cảng là hình in
được author vào rectangle riêng để giữ cả phố; không áp cách đó lên portrait.

Sổ PNG bị cắt ở biên phải khi sinh ảnh. `note-edge.svg` bổ sung phần giấy dưới
instance sau phép xoay/shear; đây là phục dựng hình học cục bộ, cần tiếp tục
review texture/bóng tiếp xúc. Transform và crop nằm trong composition/manifest.
Motion pivots và hidden geometry hoàn chỉnh vẫn thuộc các stage sau.

## Chữ và tương tác

Toàn bộ chữ đọc được trên UI, bảng, poster, báo, cốc và sổ lấy từ
`content/locales/vi.js` qua text service. Fixture bổ sung chỉ nằm trong docs,
không được import vào runtime/domain/save. Các hàng nhỏ trên báo là **rule trang
trí**, chưa phải microcopy đã phục dựng; không đánh dấu phần này đạt 1:1.

Source Serif 4, Cormorant Garamond và Dancing Script dùng pack OFL Stage 1;
Be Vietnam Pro tái sử dụng 5 subset/font OFL của project. Builder kiểm tra hash,
109 codepoint tiếng Việt cho từng family (union subset với Be Vietnam Pro).
Hash license Be Vietnam Pro dùng UTF-8/LF để không phụ thuộc CRLF của checkout;
PNG và TTF luôn kiểm tra bytes nguyên gốc.
Font gốc trong concept chưa có metadata, typeface vẫn cần review bằng mắt.

Art không nhận pointer events. Choice/continue có target riêng, callback chỉ
phát ID kỹ thuật; preview không nối GameSession hay thay entry gameplay.

```powershell
python tools/build_dialogue_replica.py --build
python tools/build_dialogue_replica.py --check
```

Xem [review và backlog G2](../../../../docs/ui-reviews/coastal-replica-stage2/README.md)
trước khi tiếp tục lighting/motion hoặc nhân rộng sang màn khác. Giữ master,
prompts, exported versions và capture lịch sử để đối chiếu.
