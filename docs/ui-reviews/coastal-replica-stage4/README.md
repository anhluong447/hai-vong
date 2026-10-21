# Coastal replica — Stage 4: chuyển động theo lớp UI

2026-10-09 · R18–R23 authoring implementation · **G2/G3 visual vẫn mở**.
Theo yêu cầu tiếp tục Stage 4, motion được phát triển trên UI v3 đã có; các sửa
shape/type/decoration trong [Stage 3](../coastal-replica-stage3/README.md) còn áp
dụng. Chưa coi motion prototype là visual đã nghiệm thu hoặc gameplay integration.

Mở [preview Stage 4](http://127.0.0.1:8080/tools/coastal-replica-preview.html).
Controls có chuyển động, pause, xem chậm ×0,25, phát lại, ẩn/hiện thanh thoại;
lighting, logo và các nền review vẫn dùng được. `?version=3` giữ bản tĩnh.
Card ngày/logo giữ vị trí khi ẩn thanh thoại.

## Đã triển khai

| Task | Đầu ra |
| --- | --- |
| R18 | [Motion sheet](../../ui-specs/coastal-replica/dialogue-motion.md) và [source JSON](../../../content/ui/coastal-dialogue-motion.json): pivots, periods, amplitudes, stagger, response, reduced/hidden/end-state policies |
| R19 | Mép mực có contour chuyển động, wave texture dịch nhẹ theo chiều dọc; period khép kín, không dịch ngang làm hở biên trái |
| R20 | Paper lift/reveal, choice stagger, hover/focus/press/select; hitboxes và chữ chính không translate; vào/ra ngắt được từ progress hiện tại |
| R21 | Hoa sway lệch pha, notebook pivot riêng; edge + PNG + wash + handwriting cùng transform; một shadow cho notebook union |
| R22 | Sheen hẹp, nhẹ, clip trong giấy; highlight choices; reduced motion về settled, input phản hồi ngay |
| R23 | Pause/slow/replay, tab hidden không catch-up; đổi nội dung/view/selection, nhiều instance, capture freeze và disposal; clips native + tests |

Dùng lại **14 UI asset v3**, không sinh background/portrait hoặc duplicate pack v4.
Thông số nằm trong content; chữ/controls trong catalog. Presentation clock không
liên quan gameplay clock và không dispatch action khi animation kết thúc.
Controller chỉ animate SVG art/copy opacity; renderer sở hữu resources và input.

## Evidence

- [Loop hiện hành](loop-review-v3.webm) / [timeline và encoder report](loop-review-v3-motion.json).
- [Thao tác vào/ra, hover/chọn/ngắt transition](interaction-review-v3.webm)
  / [report](interaction-review-v3-motion.json).
- [Xem chậm trên nền sáng](slow-review-v3.webm) / [report](slow-review-v3-motion.json).
- [Settled native](settled-v3.png), [UI overlay](settled-v3-ui-overlay.png),
  [masked report](settled-v3-ui-comparison.json), [static regression](static-regression.json).
- [Phase 2.400 ms](ambient-2400-v3.png), [phase 6.000 ms / nền chi tiết](ambient-6000-v1.png).
- [Live RAF 18 s, ??i media khi ?ang m? v? decode video](runtime-review.json).
- [Validation](validation.json), [motion tests](stage4-browser.log),
  [OS reduced motion](reduced-browser.log), [main](main-browser.log),
  [Stage 3](stage3-browser.log), [Stage 2](stage2-browser.log),
  [Stage 1](stage1-browser.log), [reference](reference-browser.log).

Các PNG là 1672×941/DPR 1, fonts/art decoded, fixture/clock/seed giữ nguyên.
**Settled so với Stage 3 nền tối: 0 pixel khác / MAE RGBA 0**, chứng minh không
làm mất registration/opacity khi thêm motion; không chứng minh concept parity.
Sampled ambient time ghi riêng, gameplay/fixture motion time vẫn 0.

WebM dùng CDP frames native/JPEG 95 và browser Canvas/MediaRecorder, không sửa
art masters. Loop lấy mẫu toàn chu kỳ 16.000 ms; interaction/slow lấy mẫu 6.000 ms,
slow nhân presentation time ×0,25. Requested cadence 12 fps; headless encode có
thể kéo dài wall time và playback. Đọc timestamp/report; **không dùng video này
chứng nhận FPS hoặc đúng nhịp realtime trên thiết bị**. Xem preview live cho nhịp
thật, controls slow để kiểm tra transition. Clip v1/phase v1–v2 giữ lịch sử các lỗi
opacity/registration/biên trước khi sửa; dùng các version hiện hành trên.

Kiểm tra live cuối chạy **539 lượt cập nhật trong 18 giây** trên Chrome headless
software; media preference đổi reduce → full khi đang mở qua DevTools đều đúng,
ba WebM hiện hành decode được native 1672×941. Đây là smoke review trên máy này,
không phải benchmark/device acceptance. Cache có thể khác SVG vài mức alpha/color
do browser raster rounding khi motion chạy; capture settled/reduced dùng SVG gốc.

## Kiểm chứng và phần tiếp tục

Motion **17/17**, reduced motion OS **4/4**, main **72/72**, Stage 3 **17/17**,
Stage 2 **14/14**, Stage 1 **12/12**, reference **13/13**. Architecture
**0 issue / 798 keys**; 8 sandbox + 4 gameplay policies khớp baseline.
Builders/locked references giữ nguyên; nguồn motion biên dịch offline.

G2 giữ backlog UI shape/type/foam/icon/flower/notebook của Stage 3. G3 cần review
nhịp/overlap/alpha/độ đọc trên trình duyệt và thiết bị thật sau các sửa G2;
tests/clip không tự nâng gate thành đạt. Hiện sway hoa là cả cụm alpha, notebook
cũng còn foliage gắn trong PNG; motion từng lá/hoa riêng cần thêm art layers
nếu muốn biên độ lớn hơn. Chưa tạo camera parallax hoặc chuyển động scene/actors.
Tiếp theo sửa/chốt visual thoại, rồi menu UI R24–R27; performance thiết bị và
integration theo các stage sau trong [roadmap](../../design/ui/UI-REPLICA-ROADMAP.md).
