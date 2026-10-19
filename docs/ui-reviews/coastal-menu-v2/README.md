# Menu v2 — bản triển khai đầu tiên

Màn Hồ sơ đã được nâng tiếp theo concept: xem [review mới, ảnh từng giai đoạn và giới hạn](../dossier-polish/README.md).
Các kết quả 86 test và screenshot bên dưới là mốc trước đợt nâng này.

Ngày 2026-10-15. Đã nối vào `pixel.html` mặc định. Mở game rồi nhấn **Esc** để vào
Hồ sơ; **M** vào tab Bản đồ. Bản cũ phục vụ regression vẫn chạy tại
`pixel.html?legacy=1`; source và asset trước thay đổi được giữ trong
[snapshot có inventory](../../../archive/menus/coastal-menu-legacy-2026-10-15/README.md).

Preview riêng: `tools/coastal-menu-v2-preview.html`. Nó dùng state thật của session
thử nghiệm ngày 1 buổi chiều; save preview nằm trong bộ nhớ và travel chỉ báo điểm
đang chọn. Dùng `pixel.html` để kiểm tra world teleport, chuyển buổi và lưu bền vững.

## Phần đã triển khai

- Sáu tab, bỏ màn tổng; mở lại luôn vào Hồ sơ. Nền cảnh cảng không có hero Khuê.
  Tab Đồng đội dùng portrait đã có vì đó là nội dung của hồ sơ nhân vật.
- Hồ sơ có ba nhóm Main/Side/General, dấu `!`, description, diễn biến và hint.
  Main thu thập tư liệu tại NPC/đồ vật trong world; không hoàn thành bằng nút trên menu.
  General nghe ngóng → chọn người → xác nhận, hiện phí/ngày dự kiến; có thể tự làm.
- Cây sáu nhánh, năm bậc mỗi nhánh; chọn node để xem chi tiết, học có điều kiện.
  Scroll ngang hoặc dùng arrows trong cây; không giật về đầu khi chọn node xa.
- Sáu slot trang bị, bộ chọn item, so sánh chỉ số, tháo/đeo và bonus tác dụng thật.
- Đồng đội có tên, biệt danh, bond, quest phụ trách, stats và vùng tiểu sử.
- Bản đồ sạch chữ bake; pin/tên/marker là UI. Mouse hoặc arrows/WASD chọn điểm,
  Enter/click teleport đến vị trí walkable. Về trọ bằng map hoặc portal đi bộ dùng
  cùng xác nhận; hủy giữ nguyên vị trí/buổi/energy.
- Cài đặt cơ bản placeholder; giảm chuyển động hoạt động; lưu/tải có xác nhận và
  validate trước thay state. Save coastal có key riêng, có thể đọc/migrate save pixel cũ.
- Sóng xanh/xanh nhạt đổi đường cong; hoa và lá tách lớp đung đưa; bụi nắng,
  glint và wash ánh sáng. Một clock, pause khi ẩn/đóng, reduced motion, dispose.

## Tuning và dữ liệu thử nghiệm

Luật đã chốt: energy tối đa 10 dùng chung trong ngày; ngủ đặt ngày sau 10/10;
thức học/game đặt đúng 5/10 bất kể số dư. Chiều/tối tự chọn về trọ để chuyển buổi.
Đủ tư liệu tự chuyển sang xuất bản; không cần viết/chọn bài thủ công hay duyệt
feedback bắt buộc trước ngủ. General có feedback mỗi ngày và bonus stat cho người làm.

Các con số còn thử nghiệm nằm trong `content/gameplay/coastal-v2.js` và
`coastal-progression.js`: Main step 2 E, General tự làm 1 E, nghe ngóng/phân công
1 E mỗi bước; train 2 E, hangout/job 3 E; General 2 ngày; thành viên xuất hiện sau
phí 50 đ; bắt đầu 2 skill point, node +0.5 stat, gear +1 stat. Hoàn thành quest được
1 skill point. Một item hiếm được thêm sau mỗi ba General hoàn tất nếu chưa có.
Đây là giá trị để chơi thử UI, chưa phải balance cuối đã chốt với người dùng.

Revision gameplay này giữ trong state v3 (`coastal`: learned/points/inventory/slots).
Default `GameSession()` và `gameplay.html` tiếp tục luật v2 cũ. Các browser test
phụ thuộc layout/luật pixel cũ chạy `?legacy=1`; test mới kiểm tra mặc định v3.
Baseline cũ không được regenerate. Save cũ được clone/validate rồi mới thêm field;
phase personal/weekend/investigation cũ quy về chiều chung, energy giữ số dư và cap 10,
feedback cũ không còn chặn ngủ; draft đang chờ được chuyển tự động ở lần kết ngày sau.

Nội dung vẫn lấy từ mock hiện có: Side chưa có story được author riêng; tiểu sử
và phần lớn biệt danh còn placeholder. Ba nhóm có state rỗng. Cây hiện là tăng
chỉ số theo bậc; skill có tác dụng riêng và nội dung story cần author tiếp.

## Evidence và giới hạn

Chạy server local ở port 8088, sau đó:

```powershell
python tools/check_architecture.py
python tools/check_menu_v2_assets.py
python tools/review_menu_v2.py
python tools/run_browser_tests.py --url http://127.0.0.1:8088/tests/index.html --real-time --timeout 240
python tools/check_baselines.py
```

Native capture nằm ở `drafts/menu-v2/01-cases.png` đến `06-settings.png`, mỗi ảnh
kèm metadata. Các phase motion `motion-00000/03000/06000/09000.png` và
`motion-review.json` kiểm tra đường cong thay đổi nhưng header/paper không di chuyển,
100 vòng chuyển/mở/đóng vẫn một root/pool cố định, pause khi tháo và reduced motion.
Artifacts sinh ra được ignore, source/công cụ/prompt/inventory vẫn giữ trong Git.

Browser suite đã có 86 test, gồm energy 10/5, automatic transfer, feedback, stat
bonus, migration/invalid save, teleport/home cancel và portal confirmation boundary.
Overlay gửi tín hiệu visibility trực tiếp để clock dừng ngay khi đóng hoặc mở modal
khác; IntersectionObserver chỉ hỗ trợ thêm cho preview và phần tử ra khỏi viewport.
Kết quả xác minh cuối được ghi trong plan. Node không có trên môi trường này.

Lượt cuối **86/86 passed**, architecture 0 lỗi, cả 8 formula policy và 4 gameplay
v2 policy khớp baseline. Motion/lifecycle review pass. Headless tắt GPU ghi frame
trung bình 48.98 ms, JS paint 0.57 ms; chưa có bằng chứng đạt 60 fps. Filter blur
trên toàn SVG đã được bỏ; cần đo và tối ưu tiếp trên thiết bị mục tiêu.

Capture/headless timing không chứng nhận pixel parity hoặc 60 fps trên GPU thực.
Review G2/G3 và profile trên thiết bị mục tiêu vẫn mở. Cần tinh chỉnh mép giấy/nét
cọ, minh họa item, hiệu ứng chuyển tab, và nội dung kể chuyện trước production.
