# UI map test

UI trong `pixel.html` dùng Be Vietnam Pro (400–800), đóng gói tại `assets/fonts` kèm giấy phép SIL OFL. Không cần kết nối Google Fonts lúc chơi.

- Nội dung 18px, lời nhân vật 20px; nút 16px, HUD 17–20px. Màn hình nhỏ giữ nội dung 17–18px.
- Khung hội thoại tối, texture chấm, bảng tên vàng nghiêng, màu nhấn teal và animation chân dung/lựa chọn được chuyển thể từ `archive/clb-hoi/styles/main.css`. Bản backup giữ nguyên.
- Chân dung sử dụng sprite của nhân vật hiện tại. Hội thoại NPC ở đáy màn hình; bảng quản lý ở giữa.
- Animation gồm mở bảng, chân dung xuất hiện, lựa chọn trượt vào theo thứ tự, hover/nhấn nút, gợi ý tương tác nổi nhẹ, chuyển map và nháy tài nguyên khi thay đổi. Tôn trọng `prefers-reduced-motion`; không trì hoãn xử lý gameplay.
- Biển địa điểm dùng chữ DOM để dấu tiếng Việt rõ ở mọi mức phóng pixel.

File giao diện: `styles/press-ui.css`, `styles/pixel.css`. Font có thể tải lại bằng `tools/vendor_ui_font.py`. Xem hội thoại mẫu bằng `tools/pixel-ui-preview.html` hoặc thêm `?mobile`.
