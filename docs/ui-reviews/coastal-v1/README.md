# Coastal UI — bản chạy v1

> Bản này là prototype kỹ thuật và **chưa đạt chuẩn replica visual**: thiếu composition, scene art, pose, texture và các thành phần của concept. Test hành vi phía dưới không chứng nhận độ giống ảnh. Hướng thay thế đã chốt trong [roadmap replica](../../design/ui/UI-REPLICA-ROADMAP.md); giữ bộ review này làm lịch sử để đối chiếu.

Ngày: 2026-10-09. Đây là ảnh chụp UI dựng bằng DOM/CSS/SVG trên Chrome headless, khác với [ảnh concept gốc](../../ui-concepts/coastal-editorial-v1/README.md).

## Xem và chơi

Chạy `python tools/serve.py --port 8080`, rồi mở:

- [Gallery có chuyển động](http://localhost:8080/tools/coastal-ui-preview.html): thoại, menu, hồ sơ, đổi biểu cảm và mở lại chuyển cảnh.
- [Game với HUD/menu mới](http://localhost:8080/pixel.html).
- [Thoại của 9 nhân vật](http://localhost:8080/interaction.html).

index.html vẫn là sandbox công thức, theo phạm vi đã chốt trong plan.

## Component đã tích hợp

`CoastalShell` giữ Canvas, HUD, controls và location qua update. `DialogueView` giữ chân dung/vùng đọc qua lượt thoại; `MenuView` ghép panel gameplay hiện tại vào bố cục giấy/điều hướng/chân dung. Panel update giữ trường chọn và scroll khi còn hợp lệ. `OverlayHost` giữ một modal, trap/restore focus, làm nền inert và khóa world; feedback bắt buộc duyệt được ưu tiên hơn Esc.

Sóng SVG ba lớp có đường cong lặp liền mạch; chữ nằm ở lớp ổn định. `MotionScope` quản lý animation vào màn, crossfade, phản hồi tài nguyên, hủy khi dispose, pause khi tab ẩn và thay đổi reduced motion. Hiệu ứng không phát command hay làm trôi lịch game. Chữ và dữ liệu minh họa gallery nằm trong content, màu/khoảng cách/chuyển động nằm ở token CSS.

Không dùng ảnh concept chứa chữ làm UI runtime. Portrait và font hiện có được tái sử dụng. Chưa có nền tranh tòa soạn hoặc asset tách tóc/mắt/áo như concept; bản này tập trung component và tương tác chạy thật. Menu hồ sơ dùng nội dung gameplay thật, chưa có bố cục chi tiết riêng cho từng hồ sơ.

## Review và kiểm chứng

- [Thoại desktop](dialogue-desktop.png), [hồ sơ desktop](dossier-desktop.png), [HUD desktop](hud-desktop.png): viewport 1366×900.
- [Thoại mobile](dialogue-mobile.png): viewport nội dung iframe 390×900, chụp trong cửa sổ 540×960 vì Chrome headless giới hạn chiều rộng cửa sổ. Đây không phải ảnh desktop bị crop thành mobile.
- Browser suite: 72/72 ở chế độ thường và 72/72 khi bật reduced motion. Có kiểm tra focus trap/restore, modal priority, identity Canvas/HUD/reading surface, mobile overflow/portrait overlap, thoại dài và disposal, bên cạnh luồng gameplay hiện có.
- Architecture checker: 0 lỗi, 723 catalog entries.
- Baseline: khớp cả 8 chính sách formula và 4 chính sách gameplay; không rebaseline.

Chrome headless ở đây tắt GPU theo runner hiện tại. Các kiểm tra này xác nhận hành vi và bố cục; chưa xác nhận mục tiêu 60 fps trên máy người chơi. Đợt polish tiếp theo cần profile trình duyệt thật có GPU, kiểm tra màn landscape thấp và nội dung dài ở toàn bộ panel, rồi chỉnh số lớp/texture theo kết quả.

Các stylesheet cũ còn phục vụ lab/preview khác nên được giữ nguyên; không có file runtime bị chuyển archive trong đợt này. Bộ concept gốc và prompt vẫn được giữ riêng.
