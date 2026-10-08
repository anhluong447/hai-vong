# Plan: sprite anime cho tương tác trên map test

Ngày 2026-10-08. Trạng thái: đã triển khai bản test với 21 ảnh / 9 nhân vật, registry, renderer hội thoại và lab. **61/61 browser checks passed**. Xem [art và kết quả](../assets/dialogue/v1/README.md). Các mục dưới giữ lại kế hoạch và tiêu chí thiết kế ban đầu.

## Mục tiêu

Khi nói chuyện với NPC, hiện sprite minh họa anime bán thân lớn, nền trong suốt, tên người nói và lời thoại. Nhân vật di chuyển trên map vẫn dùng bộ pixel hiện tại. Tạo bộ art mới riêng cho dự án CLB báo chí, có nhận diện tương ứng với nhân vật đang có trên map.

## Những gì đã kiểm tra

- `archive/clb-hoi/src/ui/DialogueView.js` nạp `content/portraits/<characterId>.png`, có tên người nói, màu nhận diện, hiệu ứng xuất hiện và fallback khi thiếu ảnh. Đây là lớp chân dung hội thoại, khác với sheet di chuyển trong `content/sprites/anime/`.
- `archive/clb-hoi/styles/main.css` cho bán thân nhô khỏi khung thoại, ảnh `object-fit: contain` neo dưới, khung tên nghiêng và nền họa tiết. Đã xem trực tiếp ảnh Vân và screenshot game cũ. Ảnh Vân trong archive còn nền xanh; asset mới cần alpha thật.
- `src/gameplay/main.js`, hàm `renderPixelInteraction()`, đang lấy frame từ atlas pixel để làm portrait. `styles/press-ui.css` phóng nó thành 96×144 và bật `image-rendering: pixelated`.
- `PixelWorld.bindPortrait()` cập nhật frame talk cho portrait theo vòng render. Portrait minh họa mới cần renderer riêng; map vẫn tiếp tục animation talk/idle của NPC.
- UI tương tác hiện chứa cả lời chào lẫn nút nghiệp vụ. Mở hồ sơ, hangout, tặng quà và chuyển phase phải giữ nguyên hành vi và chi phí.
- Bác bảo vệ, thầy phụ trách và người làm cảng có object ID khác nhau nhưng cùng sprite map `source`. Không thể dùng sprite map làm khóa chân dung.
- Bible hiện có sáu nhân vật CLB: Khuê, Vân, Long, Nhi, Ngọc, Ân. Lịch gia nhập trong sandbox đang mock khác lịch truyện; gallery cần xem được các nhân vật chưa xuất hiện trong lượt chơi mà không sửa lịch.

## 1. Khóa thiết kế và làm cặp thử Khuê / Vân

Lấy ảnh idle pixel hiện tại làm chuẩn nhận diện tóc, màu, đồng phục và phụ kiện. Archive là tham khảo bố cục/chất lượng minh họa. Vẽ anime nét sạch, cel shading, góc ba phần tư, từ đầu tới khoảng hông, không cắt tóc hoặc tay, nền trong suốt.

Tạo một master trung tính cho mỗi người bằng imagegen. Chuẩn hóa canvas xuất bản dự kiến 1024×1536, lưu vùng an toàn và điểm neo; chỉ đóng gói cơ học khi cần. Dùng cùng phong cách ánh sáng và nét, giữ tỉ lệ cơ thể riêng của từng người. Lưu source, prompt, reference và bản dùng trong game vào `assets/dialogue/v1/`.

Sau khi xem hai master cạnh nhau, tạo thêm hai biểu cảm bằng chỉnh sửa từ đúng master: vui và nghiêm túc/lo lắng. Khóa mặt, tóc, trang phục, tỉ lệ, vị trí và tư thế; không sinh lại cả người độc lập cho mỗi biểu cảm. Cặp thử có sáu ảnh. Kiểm tra bằng ảnh chồng và đổi biểu cảm trực tiếp để phát hiện đầu/thân nhảy vị trí.

## 2. Dựng renderer hội thoại với cặp thử

Thêm registry minh họa trong `assets/dialogue/manifest.json`: character ID, tên, màu nhận diện, đường dẫn biểu cảm, kích thước và điểm neo. Tách `portraitId` khỏi `sprite` của map; NPC nguồn tin dùng khóa riêng như `groundskeeper`, `teacher`, `harbor-source`.

Tách component trình bày tại `src/ui/DialogueSprite.js`, nhận speaker ID + expression + text. Dùng ảnh PNG alpha và `image-rendering: auto`. Lớp sprite nằm ngoài vùng cuộn nội dung, để bán thân nhô lên mà không bị `overflow: auto` của dialog cắt mất. Có tên người nói rõ ràng, text và các lựa chọn bên cạnh/bên dưới.

Thay portrait pixel trong `renderPixelInteraction()` bằng component này. Renderer map không điều khiển frame của ảnh hội thoại. Giữ chuyển talk/idle trên map, khóa di chuyển khi modal mở, Esc đóng, trả focus và các nút nghiệp vụ hiện tại.

Desktop: bán thân khoảng 280–380px rộng, khung thoại neo dưới, map còn nhìn thấy phía sau. Mobile 390px: thu portrait và chuyển bố cục để tên, lời thoại và nút luôn đọc/bấm được; vùng nội dung cuộn độc lập. Giữ cỡ chữ hiện tại khoảng 18–20px.

Animation thử gồm xuất hiện nhẹ 180–250ms và crossfade biểu cảm. Chỉ kích hoạt khi người nói/biểu cảm thay đổi; tránh chạy lại mỗi lần state render. Có `prefers-reduced-motion`. Chưa làm animation miệng/chớp mắt trong vòng này vì cần art chuyên biệt và kiểm tra consistency riêng.

Nếu thiếu biểu cảm, dùng neutral cùng người; nếu thiếu cả neutral, dùng thẻ tên/biểu tượng chữ. Không quay lại ảnh pixel trong khung hội thoại. Nạp trước ảnh cần dùng và bỏ kết quả load cũ khi đổi người nhanh.

## 3. Mở rộng đủ nhân vật đang có trong test

Khi cặp thử hiển thị ổn trong map, tạo master + hai biểu cảm cho Long, Nhi, Ngọc và Ân cùng chuẩn đã khóa. Sáu nhân vật CLB tổng cộng 18 ảnh. Ba nguồn tin hiện tại mỗi người một neutral riêng: tổng scope dự kiến 21 ảnh. Không nhập thêm nhân vật hoặc cốt truyện chỉ vì archive có sẵn.

Đặc trưng tính cách theo bible: Khuê quan sát và tập trung; Vân điềm tĩnh, hơi mệt nhưng bền bỉ; Long cởi mở; Nhi cẩn trọng; Ngọc năng động, có nhận diện nhiếp ảnh; Ân thiên về phân tích. Tính cách không được làm mất nhận diện tóc/đồng phục đã có trên map.

Neutral là mặc định. Biểu cảm chỉ được gắn khi lời thoại có chủ đích hoặc trong cảnh mock; không tự suy biểu cảm từ stats/Bond. Khuê dùng trong các câu đáp/cảnh thử có đánh dấu mock, chưa viết tuyến truyện thật.

Thêm `tools/dialogue-sprite-lab.html` để chọn người, biểu cảm, kiểm tra nền sáng/tối, anchor, đổi người liên tục và mô phỏng viewport mobile. Preview có thể xem toàn bộ nhân vật không phụ thuộc ngày gia nhập.

## 4. Kiểm chứng và bàn giao

Kiểm tra ảnh thật ở kích thước sử dụng: mặt, bàn tay, alpha quanh tóc, đồng phục/phụ kiện, không đổi tỉ lệ khi chuyển biểu cảm. Bounds chỉ hỗ trợ, không thay việc nhìn art.

Browser checks cần xác nhận đúng chân dung cho Vân và từng nguồn tin; fallback/load race; đóng/mở và trả focus; không restart entrance khi rerender cùng speaker; không che nút trên 390px; thao tác mở hồ sơ, hangout, feedback và sleep vẫn đúng chi phí/state. Chạy suite hiện có, bổ sung các kiểm tra renderer cần thiết.

Chụp cảnh hội thoại thực tế trong CLB, với nguồn tin ngoài sân/phố và trên mobile; kiểm tra chuyển neutral ↔ biểu cảm. Bàn giao art, registry, lab, map đã tích hợp và mô tả kết quả. Giữ nguyên archive và bộ pixel di chuyển.

Thứ tự triển khai: cặp master → biểu cảm cặp thử → tích hợp map/lab → mở rộng bộ art → kiểm tra toàn bộ. Mốc đầu tiên phải xem được Khuê/Vân trong UI thật trước khi tạo hàng loạt các nhân vật còn lại.
