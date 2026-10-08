# Sửa animation pilot Khuê/Vân

Ngày: 2026-10-06. Phạm vi: audit, nghiên cứu và các bản thử đã tích hợp. Giữ thiết kế nhân vật đã được duyệt.

Đã chạy thử nhỏ sau nghiên cứu: ba key pose, bốn lần gọi imagegen. Xem [kết quả và giới hạn](../assets/pixel/walk-probe/README.md), preview `/tools/walk-probe.html`. Pose contact/passing khác nhau rõ hơn, nhưng bước đối chân và giữ pixel chưa đạt để thay sheet game.

Theo feedback tiếp theo, đã thử [chu kỳ tám frame thu–mở và đánh tay](../assets/pixel/walk-cycle-probe/README.md), preview `/tools/walk-cycle-probe.html?head`. Tiêu chí chính là silhouette thu dần, đi qua dưới thân rồi mở dần; độ sáng chân gần/xa và quỹ đạo tay hỗ trợ đọc chuyển động. Không chỉ đổi nhãn chân trái/phải. Bản thử có đủ các pha rộng/hẹp, đã sửa một frame trung gian; còn drift thân và shading nên chưa thay asset game.

Sau khi người dùng yêu cầu thay sheet để thử trong game, walk trái đã được gắn vào [pilot-v3](../assets/pixel/pilot-v3/README.md), giữ đầu master như preview. Các hướng/clip còn lại và tốc độ di chuyển giữ nguyên; bộ pilot-v2 vẫn được lưu. Kiểm tra browser sau tích hợp: 56/56 passed.

Sau khi chu kỳ trái được đánh giá tốt hơn, đã mở rộng thành [pilot-v4](../assets/pixel/pilot-v4/README.md): tám pha đi bộ × bốn hướng, giữ đầu master và tăng yêu cầu về khối tay/chân. Hướng lên có guide riêng để chân trụ di chuyển đúng theo chiều tiến; không dùng lại quỹ đạo chân hướng xuống. Preview đồng thời bốn hướng ở `/tools/khue-animation-lab.html`. Idle/talk vẫn là bộ cũ; các biến thiên áo và shading của artwork sinh tự động còn cần đánh giá thị giác.

## 1. Lỗi hiện tại

**Review pilot-v4:** người dùng đánh giá artwork méo hình nghiêm trọng. Đã gỡ pilot-v4 khỏi atlas, khôi phục pilot-v3. Vấn đề không dừng ở độ dày tay/chân: các pose sinh riêng không giữ cùng hình khối cơ thể, tay/túi chồng thành cụm khó đọc, shading đổi giữa frame. Ghép đầu master không giải quyết hình thể phần dưới. Test 56/56 chỉ xác nhận dữ liệu và runtime, không xác nhận art đạt chất lượng. Lần thử tiếp theo phải kiểm tra một chuỗi pose nhỏ có cùng cấu trúc và silhouette trước khi mở rộng; chưa có bộ bốn hướng mới được duyệt.

Đã đối chiếu `assets/pixel/pilot-v2/khue-source.png`, prompt, importer, clip metadata, runtime và test. Số hàng dưới đây tính từ 1 như người dùng; runtime tính từ 0.

| Thành phần | Vấn đề | Cách xử lý |
| --- | --- | --- |
| Walk ngang, hàng 2–3 | Chân gần như giữ cùng thế dạng bước; thiếu pha chân đi qua dưới thân và đổi chân rõ. Khác pixel ở tóc/tay không tạo ra bước mới. | Dựng lại silhouette chân theo storyboard; đổi thứ tự hoặc duration không thể sửa tư thế còn thiếu. |
| Walk trước/sau, hàng 1 và 4 | Các thế bước lặp, pha chưa rõ, cảm giác cadence quá nhanh. | Đảm bảo mỗi vòng chỉ có hai lần đặt chân chính, rồi calibrate cadence và độ trượt chân. |
| Idle | Vị trí chớp mắt trong artwork chưa luôn trùng frame ngắn mà metadata quy định. | Duyệt nội dung từng frame rồi đặt thời lượng theo trạng thái thực, thay vì giả định cột 2 luôn là blink. |
| Talk | Các cử chỉ chưa có chuỗi neutral → gesture → settle → neutral nhất quán; có drift ở chi tiết. | Khóa đầu/thân được duyệt, giảm cử chỉ, tái sử dụng neutral khi phù hợp. |
| Import | Scale chung đã sửa lệch chiều cao, nhưng suy ra grid/gutter từ ảnh lớn vẫn không kiểm soát chính xác từng pose. | Canvas/pivot và tọa độ frame được xác định trước; pack theo manifest đã duyệt. |
| Test | Kiểm tra 8 frame khác pixel toàn ảnh, alpha và palette. Không kiểm tra chân nào trụ, chân nào vung. | Bổ sung review pose và landmark bàn chân; không dùng pixel uniqueness làm bằng chứng chuyển động đúng. |

Không phải mọi sai khác giữa frame đều là lỗi: head bob và tay vung cần có chuyển động có chủ ý. Cần loại bỏ jitter không liên quan đến pha bước, không khóa mọi bộ phận đứng yên.

## 2. Chu kỳ cần vẽ

SLYNYRD mô tả contact/down/pass/up và nửa chu kỳ đổi chân; mannequin giúp kiểm tra chuyển động trước khi thêm chi tiết. Áp dụng vào pilot: tám frame là **một vòng gồm hai bước**, không phải tám biến thể của một dáng bước. [Human Walk Cycle](https://www.slynyrd.com/blog/2024/5/24/pixelblog-50-human-walk-cycle), [Top Down Character Animation](https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation).

| Frame | Pha | Chân trái giải phẫu | Chân phải giải phẫu |
| --- | --- | --- | --- |
| 0 | Contact L | Đặt phía trước | Phía sau, chuẩn bị rời đất |
| 1 | Down L | Nhận trọng lượng, gối chùng | Rời đất, bắt đầu đưa tới |
| 2 | Passing R | Trụ dưới thân | Đi qua dưới thân |
| 3 | Up L | Cuối pha trụ | Vươn tới trước, chưa đặt |
| 4 | Contact R | Phía sau, chuẩn bị rời đất | Đặt phía trước |
| 5 | Down R | Rời đất, bắt đầu đưa tới | Nhận trọng lượng, gối chùng |
| 6 | Passing L | Đi qua dưới thân | Trụ dưới thân |
| 7 | Up R | Vươn tới trước, chưa đặt | Cuối pha trụ |

Đây là sơ đồ pha, không bắt pixel sprite thể hiện giải phẫu thực hoàn toàn. Góc top-down cần biến đổi độ ngắn chân và che khuất theo hướng nhìn. Trái/phải là của nhân vật, không phải trái/phải màn hình. Guide đánh dấu hai chân bằng màu riêng; thành phẩm không giữ các màu đánh dấu. Tay vung đối chân; tóc/túi follow-through nhẹ sau thân.

Dựng hướng ngang trước vì dễ nhìn chân trụ/vung, sau đó trước/sau. So sánh các hướng cùng phase, không chỉ chạy riêng từng hàng. Dùng onion skin để nhìn quỹ đạo chân và drift giữa frame. [Aseprite Onion Skinning](https://www.aseprite.org/docs/onion-skinning/).

## 3. Runtime và tốc độ

`PixelWorld.js` hiện đi tile 16px trong 0,18s: tốc độ lý tưởng khoảng 88,9 world px/s. `atlas.json` đặt `stridePixels=48`; `animation.js` chia đều quãng đường cho tám frame. Do đó:

- Một vòng: 48 / 88,9 ≈ 0,54s; mỗi frame khoảng 67,5ms khi đi liên tục ở tốc độ lý tưởng.
- Nếu sheet đúng hai bước/vòng: khoảng 3,70 bước/s. Nếu artwork lặp thêm động tác đặt chân, cadence nhìn thấy sẽ cao hơn.
- Tăng stride đơn thuần làm nhịp chậm nhưng có thể làm chân trượt hơn. Không thể chốt stride chỉ từ số frame.

Đề xuất thử A/B 48, 64 và 72px/vòng **sau khi pose đúng**. Với 72px, một vòng khoảng 0,81s và 2,47 bước/s; đây là giả thuyết để thử, không phải chuẩn walk phổ quát. Đo lại tốc độ thực vì vòng tick có thể bỏ phần dt dư khi kết thúc tile.

Trong pha trụ, chân đặt trên mặt đất cần tương đối đứng yên trong tọa độ thế giới:

`worldFoot = actorWorldPosition + localFootOffset`

Vì vậy độ dịch root và chân trong sprite phải gần triệt tiêu nhau dọc hướng đi. Sprite Lab đứng tại chỗ chưa đủ để đánh giá điều này; cần nền có mốc đứng yên, root thực sự di chuyển, và overlay quãng đường/phase/contact. Nguyên tắc dùng quãng đường điều khiển pose có tài liệu trong engine khác; cách hiệu chỉnh cho sprite này là đề xuất áp dụng của dự án. [Epic Distance Matching](https://dev.epicgames.com/documentation/unreal-engine/distance-matching-in-unreal-engine?lang=en-US).

Nếu tám pha không nên chiếm quãng đường bằng nhau, thêm các mốc distance cho từng frame thay vì chỉ đổi duration: walk hiện bỏ qua durations khi có stridePixels. Đổi hướng giữ phase chỉ khi cả bốn hướng cùng ý nghĩa contact; bắt đầu lại sau idle cần chính sách khởi động rõ vì hiện distance vẫn được giữ. Idle/talk tiếp tục dùng duration riêng.

## 4. Phối hợp với imagegen

OpenAI hướng dẫn gán vai trò cụ thể cho ảnh tham chiếu, tách phần cần đổi khỏi phần cần giữ và kiểm tra sau mỗi lần sửa. Tài liệu cũng nói nếu cần giữ vùng ảnh pixel-identical thì phải composite phần sửa vào ảnh gốc, không dựa vào prompt. [Image prompting](https://developers.openai.com/api/docs/guides/image-prompting).

Công cụ imagegen đang có hỗ trợ prompt, ảnh tham chiếu và nền trong suốt. Không có tham số mask, seed hoặc bộ điều khiển skeleton được phơi bày ở đây. Pose guide là ảnh tham chiếu để hướng dẫn, **không phải ràng buộc hình học được bảo đảm**. Khả năng giữ nhân vật và bố cục chính xác vẫn có giới hạn. [Image generation — limitations](https://developers.openai.com/api/docs/guides/image-generation).

Quy trình đề xuất:

1. Chọn frame master đã duyệt của Khuê cho từng hướng, lưu bản bất biến. Ghi palette, scale, canvas 32×48 và pivot hiện hành; giữ nguyên thiết kế mặt/tóc/đồ.
2. Tạo storyboard mannequin tám pose theo bảng trên, có vị trí đầu, hông, gối, bàn chân và contact rõ. Đây là guide kỹ thuật, không phải thành phẩm nhân vật.
3. Thử **hai contact đối chân và một passing** hướng ngang trước. Mỗi yêu cầu tạo/sửa một pose; chỉ thử nhóm nhỏ khi kết quả đã ổn. Không yêu cầu cả 64 frame idle/walk/talk trong một lần nữa.
4. Mỗi lần đưa master + guide pose cụ thể + frame lân cận đã duyệt khi cần. Guide quyết định geometry; master quyết định diện mạo. Không dùng riêng output trước làm reference qua một chuỗi dài khiến sai lệch tích lũy.
5. Kiểm tra ở độ phân giải đích ngay. Duyệt chân trụ/vung trước, rồi silhouette, đầu/thân, phụ kiện. Frame sai chỉ sửa frame đó; không sinh lại nguyên sheet đã có các frame tốt.
6. Để giữ pixel chắc chắn, chuẩn bị lớp đầu/thân/tay/chân và ghép phần sửa đã duyệt vào master bằng editor. Bàn tay có thể đổi; đầu và phần thân không cần đổi thì dùng lại pixel gốc. Không ghép cứng mọi bộ phận nếu pose cần xoay/nhún; chuyển lớp theo offset đã duyệt.
7. Pack frame đã duyệt bằng tọa độ cố định; palette/scale chung. Không để imagegen quyết định cell spacing và không tự scale từng frame theo alpha bounds. Kiểm tra đầu ra sau downsample vì pose đúng ở ảnh lớn có thể mất khác biệt ở 32×48.
8. Nếu guide vẫn bị bỏ qua sau các thử nhỏ, chuyển phần motion sang chỉnh pixel thủ công/layer rig trong editor; tiếp tục dùng imagegen cho style hoặc bộ phận còn thiếu. Đây là điểm dừng chất lượng, không tăng prompt vô hạn.

Đối với Vân: giữ master riêng và dùng chung pose guide/phase với Khuê. Không dùng nguyên sheet Khuê làm nguồn duy nhất, vì có thể mang theo motion sai hoặc phụ kiện của Khuê.

### Prompt mẫu cho một pose

```text
Edit one animation pose, not a sprite sheet.
Reference 1: approved Khue sprite; authority for identity, outfit and palette.
Reference 2: side-view mannequin; authority for pose and limb placement only.
Reference 3, if present: approved adjacent frame; continuity reference only.

Target: PASSING R, frame 2 of an eight-frame walking cycle, facing left.
The anatomical left leg supports the body beneath the hip.
The anatomical right leg is lifted and passes beneath the torso.
Follow the guide's foot and knee positions; retain clear leg separation.
Use the guide's colored leg identities, but remove guide colors in the result.
Arms counter-swing as indicated in the guide.

Preserve Khue's face, hairstyle, clothing design, proportions and palette.
Keep the same camera, canvas registration and scale as the approved reference.
Change only the pose-dependent limbs and the specified body offset.
Full body and both feet visible. Transparent background.
No labels, guide lines, extra poses, scenery or grid.
The final sprite will be checked on a 32x48 native canvas.
```

Prompt này là template cần thử, không bảo đảm model tuân theo pixel tuyệt đối. Đổi target và mô tả chân theo từng pose; không copy nguyên mô tả passing sang contact.

## 5. Điều kiện nghiệm thu trước khi nhân rộng

- Mỗi hướng có contact L/R, passing L/R và chuỗi trụ/vung đúng; hai lần đặt chân chính mỗi vòng. Xem frame-by-frame và loop chậm.
- Nối frame 7→0 không giật; silhouette, độ dài chân và diện mạo giữ ổn định. Bob có chủ ý, không recenter riêng mỗi frame để che lỗi.
- Hướng ngang, trước, sau cùng semantic phase; phụ kiện bất đối xứng đúng vị trí.
- Kiểm tra trên map có mốc đất ở tốc độ thật, tốc độ chậm và tăng tốc; trượt chân được đánh giá khi chân đang trụ, không khi đang vung.
- Đi → dừng → đi, đổi hướng, va tường và mở hội thoại không tiếp tục bước khi actor đứng yên hoặc nhảy pose bất hợp lý.
- Idle blink đúng frame/duration; talk trở về neutral và không làm mặt/đầu biến dạng.
- Test tự động kiểm tra manifest, chỉ số, alpha và clock; landmark/contact được ghi sau khi review pose. Không coi hash frame khác nhau là kiểm định walk cycle.

Thứ tự thực hiện: Khuê walk ngang → bốn hướng đồng bộ → nhịp trên map → idle/talk → Vân → roster còn lại. Chỉ mở rộng sau khi pilot vượt qua các kiểm tra trên.
