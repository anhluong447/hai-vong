# Coastal replica — Stage 1 asset contract

> Scope revision 2: pack giữ cả UI và context đã sinh. [Roadmap hiện hành](../../../../docs/design/ui/UI-REPLICA-ROADMAP.md) chỉ nghiệm thu UI và trang trí gắn UI; background, portrait và scene props làm sau. Tiếp tục paper/wave/print/hoa/notebook/type/date/choices; pose/scene matching trong mô tả lịch sử không còn chặn gate UI. UI-scope classification chưa thay thế production masks hoặc scoped G2 review.

2026-10-09 · R05–R08. Đây là pack mẫu sản xuất và ghép lớp. Inventory 104 asset
trong Stage 0 vẫn là backlog đích; 15 asset của pack này không đồng nghĩa đã hoàn
thành 15 asset production hay toàn bộ màn thoại.

## Nguồn và xuất bản

| Nguồn biên tập | Đầu ra | Cách cập nhật |
| --- | --- | --- |
| `masters/materials.json` + `tools/build_replica_assets.py` | 10 SVG master/export | Sửa paths/palette/seed hoặc generator, rồi `--build` |
| [prompts.json](prompts.json) + 5 PNG trong `masters/` | PNG trong `exports/` | Imagegen builtin; giữ alpha và bytes gốc, tạo phiên bản mới khi sửa |
| [coastal-replica-pilot.json](../../../../content/ui/coastal-replica-pilot.json) | compiled content JS + manifest instances | Sửa JSON rồi `--build`; không sửa generated JS |
| [font manifest](../../../fonts/coastal-replica/manifest.json) | 3 font variable local | Vendor từ Google Fonts revision đã pin; giữ OFL và metadata |

Art raster được tạo bằng skill `imagegen`, chế độ builtin, từ reference thoại
và các reference danh tính ghi trong từng prompt. PNG được copy vào workspace,
không resize hay chỉnh pixel bằng script. SVG là art code-native: paths, masks,
noise có seed cố định, không `<text>`, không bake nội dung người chơi vào ảnh.
`harbor-print.svg` là một phương án vector được giữ làm nguồn thử; pilot hiện
dùng `harbor-print-pilot-v1.png`. Không xóa nguồn chỉ vì chưa được dùng trong stage.

`manifest.json` ghi ID/version, master/source/export, dimensions, alpha,
visible-alpha envelope, native crop, origin pivot, layer/z, từng instance bounds,
placement pivot, text keys, provenance/rights, SHA-256 và phạm vi review. Pivot
`[0,0]` là gốc file; placement pivot là góc trái trên của instance. Pivot chuyển
động cơ thể/đạo cụ còn thuộc R18, không suy ra từ alpha bounds.

Portrait/print instances dùng `visibleBounds` làm viewBox, scale đồng đều và crop
vào envelope đã author. Các paper/path asset dùng đúng khung vật liệu đã author.
Không kéo méo portrait để ép vào silhouette. Desk mask là strip của **plate nền
sạch**, dùng clip ID riêng từng stage; mask final foreground vẫn thuộc R11.

Các display keys trỏ tới `content/locales/vi.js` qua text service. Choice ID,
asset ID và callback `{type:'choose',id}` không phụ thuộc câu chữ. `ReplicaStage`
chỉ phát callback preview; nối GameSession là một bước tích hợp sau.

## Font và kiểm chứng

Source Serif 4 dùng cho body/numbers, Cormorant Garamond cho wordmark/heading,
Dancing Script cho handwriting. Cả ba được vendor từ nguồn Google Fonts chính
thức với OFL, upstream URL/revision và hash từng TTF/license/metadata. Builder
đọc cmap và kiểm tra 109 codepoint tiếng Việt, kể cả combining marks; preview
chờ đúng face được tải rồi mới chụp. Font nguồn trong concept không có metadata:
đây là bộ typeface được chọn để dựng mẫu, chưa được chứng nhận trùng 1:1.

Chạy `python tools/build_replica_assets.py --check` để phát hiện stale exports,
font/source thay bytes, glyph thiếu, text bake vào SVG hoặc bounds ngoài stage.
Builder dùng stdlib và Pillow để đọc alpha PNG; runtime không cần Python. Line
endings của nguồn text được chuẩn hóa LF, PNG/font kiểm tra byte chính xác.
Mọi thay đổi master cần build lại và capture phiên bản mới cùng manifest.

## Phạm vi chất lượng

Giấy/mực/mép sóng, choice material và bộ icon đã có contact sáng/tối cùng crop
100%/50% trong [review Stage 1](../../../../docs/ui-reviews/coastal-replica-stage1/README.md).
Các PNG nền/portrait/foreground/harbor là pilot đăng ký lớp, chưa qua G1 production.
Hair fringes, crop sát khung, ánh sáng và silhouette phải review lại ở R09–R11;
ink wash quanh minh họa cảng cần blend trên giấy ở R12. G2 toàn màn còn mở.
