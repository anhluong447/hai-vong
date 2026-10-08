# Dialogue sprite v2: cá tính và design pivot

2026-10-08. Yêu cầu mới: `assets/pixel/characters-anime-source.png` là nguồn thiết kế chuẩn. Mỗi nhân vật có prompt riêng; pose, góc nhìn và khuôn mặt phải khác nhau, biểu cảm dễ đọc trên UI thật.

Đã triển khai 24 ảnh / 9 nhân vật vào registry dùng chung cho game/lab. Khuê có thêm bộ đứng thường ngày (bình thường, cười nhẹ, lắng nghe); bộ cầm sổ giữ riêng cho điều tra. Long cười sảng khoái và Ngọc nháy mắt đã bỏ kính bị thêm nhầm. Xem [bộ v2 và prompt riêng](../assets/dialogue/v2/README.md), [pose toàn cast](../tools/dialogue-v2-pose-review.png), [biểu cảm](../tools/dialogue-v2-expression-review.png).

## Vì sao cần làm lại

V1 lấy Khuê làm cả reference phong cách lẫn hình người cho phần lớn cast, khiến generator lặp lại một khuôn mặt và cùng góc ba phần tư. Các edit còn yêu cầu thay đổi nét mặt rất nhỏ. Bộ v1 cũng diễn giải sai vài dấu hiệu từ ảnh pixel: Vân tóc xõa với hoa vàng/nơ teal, Nhi và Ân có kính, Long mặc áo len vàng, Ân mặc áo khoác xanh mở.

## Pipeline mới

1. Đọc trực tiếp ảnh source và crop cơ học đúng hàng nhân vật, không lấy ảnh dialogue v1 làm reference. `tools/prepare_dialogue_design_refs.ps1` giữ nguyên pixel, chỉ cắt ba ô đầu mỗi hàng để cô lập người cần vẽ. File gốc không thay đổi.
2. Viết prompt riêng cho từng người: identity theo source, cấu trúc mặt, anatomy, pose, camera, nét mặt và silhouette. Dùng chung mô tả linework/cel shading bằng chữ, không dùng master của một người làm hình mẫu cơ thể cho người khác.
3. Tạo master riêng, kiểm tra cả cast cạnh nhau. Vẽ anime tỉ lệ bình thường từ ảnh chibi; giữ kiểu tóc, kính, nơ, vest, cardigan, túi/máy ảnh đặc trưng.
4. Biểu cảm chỉnh từ master của chính người đó, giữ registration/cơ thể. Thay đổi đủ lớn ở lông mày, mắt và miệng: cười mở miệng, nháy mắt, hoảng hốt, chất vấn… tùy người. Không khóa khuôn mặt vào những thay đổi gần như vô hình.
5. Lưu v2 riêng, giữ v1 để đối chiếu. Registry đổi sang v2 sau khi kiểm tra art; renderer vẫn độc lập với animation pixel trên map.

## Thiết kế từng người

| Nhân vật | Nhận diện từ pivot | Pose / camera riêng | Ba trạng thái |
| --- | --- | --- | --- |
| Khuê | Tóc tối rối, áo trắng/cà vạt teal, túi phóng viên | Mặc định đứng thư giãn, tay buông; bộ điều tra riêng cầm sổ/bút | Bình thường / cười nhẹ / lắng nghe; điều tra: tập trung / vui bất ngờ / chất vấn |
| Vân | Tóc nâu xõa, kẹp hoa vàng, nơ teal, váy teal | Khoanh tay, nâng cằm; gần chính diện, góc thấp; mắt sắc, vẻ ngầu | Bản lĩnh / cười đắc ý / quyết liệt |
| Long | Tóc nâu, vest len vàng, áo trắng | Vai rộng, mặt tròn vuông; nhìn ngang tầm; giơ tay kể chuyện | Thân thiện / cười sảng khoái / bực bội |
| Nhi | Bob xanh tối, kính tròn, cardigan xanh | Ôm sách, thu vai; hơi nhìn từ trên; né ánh mắt, má đỏ | Ngại ngùng / vui bẽn lẽn / hoảng hốt |
| Ngọc | Tóc buộc với nơ đỏ, cardigan coral, máy ảnh | Nghiêng người, cầm máy ảnh, tay chống hông; góc ba phần tư đối lập | Hào hứng / nháy mắt / bất bình |
| Ân | Tóc nâu gọn, kính, áo khoác olive mở | Góc nghiêng sâu; một tay chỉnh kính, tay kia giữ hồ sơ; dáng cao, thẳng | Trầm tư / hài lòng / nghi hoặc |

Hàng nguồn tin của pivot chỉ có một archetype người lớn. Bác bảo vệ giữ mũ khaki và áo beige/olive từ hàng này. Thầy giáo và người làm cảng được phát triển riêng từ archetype người lớn cho đúng nghề nghiệp; source không chứa sẵn hai thiết kế đó. Prompt của họ ghi rõ sự diễn giải này và không sao chép khuôn mặt học sinh.

## Tiêu chí xem lại

- Nhìn silhouette và pose đã phân biệt được người; không chỉ đổi màu tóc/áo.
- Kính chỉ có ở Nhi/Ân trong nhóm thành viên; Long/Ngọc không đeo kính. Hoa/nơ Vân, vest Long và camera Ngọc phải rõ. Không dùng câu giữ kính chung cho mọi nhân vật.
- Khi thu nhỏ vào khung thoại, biểu cảm happy/serious khác neutral bằng mắt và miệng rõ ràng.
- Các biểu cảm trong cùng pose không đổi chiều cao đầu, tỉ lệ thân hoặc vị trí tay/props. `expressionMasters` phân biệt hai bộ pose của Khuê; facial edit dùng riêng ảnh của đúng người thay vì tham chiếu toàn cast.
- So trên nền sáng/tối, trong map thật và mobile. Test alpha/registration hỗ trợ việc xem ảnh, không chứng minh được cá tính hay chất lượng art.

Lời thoại trong lab là mock để làm rõ nét mặt; cơ chế và cốt truyện chính không đổi.
