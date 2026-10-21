# Hướng dẫn sử dụng World Editor và Tileset Editor

Tài liệu này hướng dẫn import tileset, đặt thuộc tính đi lại, vẽ map bốn layer,
đặt object/NPC, chơi thử và lưu kết quả. Tên nút giữ bằng tiếng Anh như giao diện.

Phiên bản hiện tại chỉnh được năm map có sẵn: `home`, `yard`, `newsroom`,
`street`, `interaction`. Autotile và hệ thống tạo event là các mốc tiếp theo;
hiện có thể đặt object/NPC từ prefab đã có.

## 1. Mở editor

Mở terminal tại thư mục gốc dự án và chạy:

```powershell
python tools/authoring_server.py --enable-authoring --port 8097
```

Truy cập **http://127.0.0.1:8097/tools/world-editor.html**. Giữ terminal chạy
trong lúc sử dụng; Ctrl+C trong terminal để dừng server. Nếu server đã chạy,
chỉ cần mở URL. Có thể mở thẳng một map, ví dụ
http://127.0.0.1:8097/tools/world-editor.html?map=yard.

Server này cho phép các nút lưu ghi vào file dự án. Nếu chỉ muốn xem thử bằng
server tĩnh, dùng cách ở [mục 11](#11-dùng-server-tĩnh-và-lưu-thủ-công).
Máy cần có Python và asset của dự án; clone Git mới cần khôi phục asset theo
[hướng dẫn repository](../engineering/REPOSITORY.md).

Quy trình làm một map:

1. Chọn **Map**, rồi chọn **Tiles**.
2. Import ảnh nếu cần, cấu hình thuộc tính tile trong **Tileset Properties**.
3. Chọn layer, chọn tile, dùng công cụ vẽ trên map.
4. Chuyển sang **Entities** nếu cần chỉnh object/NPC.
5. Bấm **Playtest** để kiểm tra; **Edit Map** để tiếp tục sửa.
6. Bấm **Save Tileset Source** nếu tileset còn thay đổi, rồi
   **Save Scene to Source** cho từng map đã sửa.
7. Sau khi các lượt lưu thành công, tải lại trang và kiểm tra kết quả.

## 2. Các vùng trên giao diện

| Vùng | Dùng để làm gì |
| --- | --- |
| Thanh trên cùng | Đổi Edit Map/Playtest, Undo/Redo, Save Scene to Source; nháp và import/export nằm trong Files & drafts |
| Entities / Tiles | Chuyển giữa chỉnh object/NPC và vẽ tile |
| Map ở cột trái | Chọn map đang sửa |
| Layer 1–4 | Chọn lớp vẽ, bật/tắt Show và Lock |
| Tile Palette | Chọn ảnh tileset, tìm tile theo tên/ID, chọn tile để vẽ |
| Canvas ở giữa | Xem map, vẽ tile, di chuyển object và chơi thử |
| Properties / Import PNG ở cột phải | Properties chỉnh tile; Import PNG mở form nhập ảnh và xem lưới |
| Object Inspector trong Entities | Chỉnh vị trí, điểm neo, lệch hình và footprint của object/NPC |
| Dòng trạng thái dưới map/panel | Xem thao tác đã áp dụng, đã lưu hay bị từ chối |

Chờ map tải xong trước khi sửa hoặc import. Trên màn hình hẹp, inspector chuyển
xuống dưới; cuộn trang để tìm các nút trong panel.

Trong **Entities**, ô tìm kiếm lọc object theo tên/ID; mũi tên lên/xuống và
Home/End đổi object đang chọn trong danh sách. Escape trong ô tìm kiếm xóa bộ
lọc. Nhãn **Scene unsaved** và **Tileset unsaved** cho biết loại dữ liệu còn
chưa lưu; khi có thay đổi tileset, editor nhắc lưu tileset trước scene.

## 3. Xác định tile nào là tường, nền hoặc đi dưới được

Editor không tự suy ra va chạm từ hình ảnh. Một hình trông như tường vẫn đi
xuyên được nếu chưa cấu hình **Collision**.

Ba thuộc tính dưới đây độc lập với nhau:

| Thuộc tính | Ý nghĩa |
| --- | --- |
| Collision → Walkable / no blocking | Tile không chặn toàn bộ ô; vẫn có thể bị chặn bởi cạnh, tile khác hoặc object |
| Collision → Blocked / solid | Nhân vật không đứng hoặc đi vào ô có tile này |
| Blocked edges → Up / Right / Down / Left | Chặn đi qua cạnh tương ứng của ô |
| Draw priority → Below characters | Vẽ tile trước nhân vật |
| Draw priority → Above characters | Vẽ tile sau nhân vật; phần ảnh có thể che nhân vật |

Để nhân vật **đi dưới** tán cây hoặc mái, dùng **Walkable / no blocking** và
**Above characters**, đồng thời bỏ các cạnh chặn nếu muốn đi lại tự do.
Chỉ đổi Draw priority không làm một tile solid trở thành đi được.

Cấu hình tham khảo:

| Loại tile | Collision | Draw priority | Blocked edges |
| --- | --- | --- | --- |
| Cỏ, sàn, đường | Walkable / no blocking | Below characters | Bỏ hết |
| Hoa/cỏ trang trí sát đất | Walkable / no blocking | Below characters | Bỏ hết |
| Tường, thân cây, đá lớn | Blocked / solid | Below characters | Có thể bỏ hết vì cả ô đã bị chặn |
| Tán cây, mái nhô ra cho đi dưới | Walkable / no blocking | Above characters | Bỏ hết |
| Ô đi được nhưng có rào ở mép trên | Walkable / no blocking | Below characters | Chọn Up |

Collision được hợp từ **tất cả layer**: một tile solid ở bất kỳ layer nào cũng
chặn ô. Vẽ tile đi được đè lên tường không xóa va chạm của tường. Khi đi qua
một cạnh, cả cạnh ra của ô nguồn và cạnh vào của ô đích đều được kiểm tra;
Blocked edges không phải công cụ tạo đường một chiều.

Thuộc tính thuộc về **tile ID trong catalog**, dùng chung cho mọi vị trí vẽ
tile đó trên mọi map. Đổi một tile thành solid có thể tác động nhiều map.
Object/NPC cũng có thể chặn đường bằng footprint dù nền đang đi được.

## 4. Import ảnh tileset PNG

Trong **Tiles**, chọn tab **Import PNG** ở panel phải:

1. Chọn file ở ô **Choose tileset PNG**.
2. Đặt **Source tile size** đúng với kích thước một ô trong ảnh: 16, 24, 32
   hoặc 48 pixel.
3. Đặt **Margin** là viền ngoài ảnh và **Spacing** là khoảng cách giữa hai ô.
   Ảnh các ô liền nhau, không có viền thì cả hai bằng 0.
4. Quan sát grid preview: mỗi khung phải bao đúng một tile. Nếu bị cắt lệch,
   sửa ba thông số trên trước khi import.
5. Bấm **Import Tileset** và đọc trạng thái lưu.
6. Chọn ảnh mới trong **Tileset image** ở cột trái để xem các tile của ảnh đó.

Ví dụ: ảnh 128×128 px, tile 16×16 px, Margin = 0, Spacing = 0 sẽ có 64 tile.
Tile nguồn 32 hoặc 48 px vẫn được vẽ vừa ô world **16 px**; thông số này không
phóng to kích thước ô map.

Giới hạn hiện tại: PNG tĩnh tối đa **8 MiB**, mỗi chiều tối đa **4096 px**,
Margin/Spacing là số nguyên **0–32**, tổng catalog tối đa **8192 tile**. Lưới
phải chia hết theo kích thước ô và khoảng cách đã chọn. Ảnh động APNG và cách
ghép autotile của sheet RPG Maker MZ A1–A4 chưa được xử lý.

Tile mới mặc định **Walkable / no blocking**, không có cạnh chặn và
**Below characters**. Sau import, cần tự cấu hình tường, nước, thân cây…
Import lại đúng cùng PNG và cùng cách chia lưới dùng lại atlas đã có.

Trên server authoring, import sẽ thử lưu PNG và catalog xuống dự án. Chỉ coi
là đã lưu khi có trạng thái thành công. Nếu thấy **Preview only**, làm theo
[mục 11](#11-dùng-server-tĩnh-và-lưu-thủ-công) trước khi reload.

## 5. Sửa thuộc tính một hoặc nhiều tile

1. Chọn ảnh bằng **Tileset image**; dùng **Search tile name or ID** nếu cần.
2. Bấm một tile trong palette. Nó trở thành tile vẽ và xuất hiện trong danh
   sách **Selected tile IDs** ở panel phải.
3. Để sửa nhiều tile cùng lúc, giữ Ctrl hoặc Shift rồi bấm từng tile để
   thêm/bớt khỏi nhóm chọn. Đối chiếu Selected tile IDs trước khi áp dụng.
4. Sửa **Editor name**, **Collision**, **Blocked edges**, **Draw priority**.
   Có thể bấm **Floor**, **Wall** hoặc **Overhead** trong **Quick setup** để
   điền nhanh collision/priority và bỏ các cạnh chặn. Preset chỉ điền form,
   chưa thay catalog; Editor name vẫn giữ giá trị đang hiển thị.
5. Bấm **Apply Properties**. Việc chỉ đổi giá trị trong ô nhập chưa áp dụng
   vào catalog.
6. Kiểm tra map bằng **Collision** và **Playtest**, rồi **Save Tileset Source**.

Apply Properties ghi các giá trị đang hiển thị lên **toàn bộ nhóm chọn**,
bao gồm cả Editor name và các cạnh chặn. Nếu mỗi tile cần tên riêng, sửa tên
từng tile. Không dùng tên để nhận diện dữ liệu; ID vẫn giữ nguyên.

**Undo Tileset / Redo Tileset** chỉ hoàn tác thuộc tính/catalog. Undo/Redo
trên thanh chính hoàn tác scene: vẽ tile, di chuyển hoặc thêm/xóa entity.
Một lần Apply cho nhiều tile là một bước hoàn tác.

Nếu thay đổi làm điểm xuất hiện hoặc điểm đến portal bị chặn, editor từ chối
thay đổi. Chọn lại tile hoặc cấu hình khác; map hợp lệ trước đó được giữ lại.

## 6. Vẽ map bằng bốn layer

Layer 1 là nền bắt buộc. Layer 2–4 có thể để trống. Cách phân chia dưới đây
là quy ước gợi ý; editor không bắt buộc một loại vật thể vào một layer cụ thể.

| Layer | Gợi ý nội dung |
| --- | --- |
| Layer 1 | Cỏ, sàn, đường, nền nước |
| Layer 2 | Hoa, vết đất, họa tiết và chi tiết nền |
| Layer 3 | Tường, thân cây, đá và kết cấu |
| Layer 4 | Tán cây, mái, chi tiết phủ phía trên |

Chọn **Layer 1/2/3/4**, chọn tile trong palette rồi vẽ. Thứ tự layer không tự
quyết định tile có che nhân vật: **Draw priority** quyết định điều đó. Trong
mỗi nhóm Below/Above, các layer được vẽ theo thứ tự 1 → 4.

| Công cụ | Cách dùng bằng chuột |
| --- | --- |
| Brush | Bấm/kéo để vẽ một nét bằng tile đang chọn |
| Rectangle | Kéo từ góc đầu tới góc đối diện để tô hình chữ nhật, gồm cả hai góc |
| Fill | Bấm một ô để thay vùng liên thông bốn hướng có cùng tile trên layer hiện tại |
| Eyedropper | Bấm lấy mẫu từ layer hiện tại, rồi quay về Brush; lấy mẫu ô trống chuyển sang Eraser |
| Eraser | Layer 1: thay bằng tile trong Erase Tile. Layer 2–4: xóa về ô trống |

Tile **ID 0 vẫn là tile thật**, không phải ô trống. Erase Tile chỉ quyết định
tile thay thế khi xóa Layer 1.

Khi kéo, editor hiển thị preview; thả chuột mới áp dụng cả nét và tạo một bước
Undo. Escape hủy preview. Đổi map, tool, layer, mode, chuyển focus khỏi canvas
hoặc thực hiện import/export/lưu cũng có thể hủy nét chưa hoàn tất.

**Show** chỉ ẩn hình layer trong preview chỉnh sửa. **Lock** chặn vẽ lên layer
đó. Cả hai không thay source, không xóa collision và không được lưu vào scene.
Playtest dùng đầy đủ các layer. Bật **Collision** để xem ô/cạnh bị chặn, kể cả
ở layer đang ẩn; **Grid** bật/tắt lưới ô.

### Ví dụ: làm một cây có thân chặn đường và tán đi dưới được

1. Layer 1: vẽ nền cỏ, cấu hình Walkable / no blocking + Below characters.
2. Chọn tile thân cây: đặt Blocked / solid + Below characters, Apply Properties.
3. Layer 3: đặt thân cây ở ô muốn chặn.
4. Chọn tile tán cây: đặt Walkable / no blocking + Above characters, bỏ hết
   Blocked edges, Apply Properties.
5. Layer 4: vẽ tán quanh thân cây.
6. Bật Collision: ô thân cây bị chặn; ô chỉ có tán vẫn đi được nếu không có
   vật cản khác.
7. Playtest: thử đi dưới tán và đi sát thân cây. Trở về Edit Map để sửa.

Không thể làm cầu đi được chỉ bằng cách đặt tile Walkable lên tile nước solid;
collision của nước vẫn còn. Cơ chế độ cao/override cho cầu thuộc phần mở rộng sau.

## 7. Dùng bàn phím

Tab/Shift+Tab di chuyển focus giữa các nút và ô nhập. Trong palette, phím mũi
tên chọn tile lân cận. Đưa focus vào canvas bằng Tab hoặc bấm canvas trước khi
dùng các phím vẽ dưới đây. Bấm canvas với tool đang chọn cũng có thể vẽ một ô.

| Phím trong canvas Tiles | Thao tác |
| --- | --- |
| Alt+1 / Alt+2 / Alt+3 / Alt+4 | Chọn layer |
| B / R / F / I / E | Brush / Rectangle / Fill / Eyedropper / Eraser |
| Mũi tên | Di chuyển cursor một ô |
| Shift + mũi tên | Di chuyển cursor năm ô |
| Enter | Dùng tool tại cursor |
| R, Enter, mũi tên, Enter | Đặt hai góc rồi xác nhận Rectangle |
| G / C | Bật/tắt Grid / Collision |
| Escape | Hủy nét hoặc thao tác pan đang dở |
| Ctrl+Z | Undo scene |
| Ctrl+Y hoặc Ctrl+Shift+Z | Redo scene |
| Space + kéo chuột | Pan camera editor |

Cursor tự cuộn camera khi đi ra ngoài vùng đang thấy, nên có thể vẽ map chỉ
bằng bàn phím. Không có phím pan riêng được gán cho bốn hướng camera.

Khi focus ở nút trong **Tileset Properties**, Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z dùng
history tileset. Khi đang nhập text hoặc dùng select, các phím được dành cho
control đó. Có thể dùng các nút Undo/Redo để tránh nhầm hai history.

## 8. Đặt object/NPC và chơi thử

Chuyển sang **Entities**:

- Chọn object trên map hoặc trong **Objects**. Kéo để đổi vị trí theo ô.
- Chọn mục trong **Prefab Palette**, bấm **Add Object** để thêm gần nhân vật.
- Bấm **Delete Object** hoặc Delete để xóa object đang chọn.
- Mũi tên di chuyển object một ô; Shift+mũi tên di chuyển năm ô.
- **Grid X/Y** là vị trí trên lưới. **Pivot X/Y** chỉnh điểm neo hình;
  **Visual Offset X/Y** dịch hình mà không đổi vị trí ô.
- **Collision Tiles / dx,dy** là footprint tương đối. Ví dụ `[[0,0],[1,0]]`
  mô tả hai ô cạnh nhau tính từ vị trí object; khả năng chặn còn phụ thuộc
  cấu hình solid của prefab/object.

Khung xanh biểu thị hình, khung vàng biểu thị vùng chọn, các ô đỏ biểu thị
footprint. Đổi Pivot/Visual Offset không thay footprint.

Bấm **Playtest**, dùng WASD hoặc phím mũi tên để đi; cũng có thể bấm map để
tìm đường. Thử đi vào tường, đi dưới mái và đi qua các cạnh đã chặn.
Object interaction trong editor chỉ báo trạng thái, chưa chạy nội dung event
gameplay. Bấm **Edit Map** để tiếp tục chỉnh.

Playtest dùng bản đang sửa trong bộ nhớ và không ghi save người chơi. Đây
không phải thao tác lưu source. Nếu ô nhân vật vừa bị vẽ thành vật cản, editor
chọn vị trí đứng hợp lệ khi bắt đầu chơi thử.

## 9. Lưu đúng loại dữ liệu

| Nút | Lưu gì, ở đâu |
| --- | --- |
| Save Scene Draft | Lưu nháp map hiện tại vào localStorage của trình duyệt |
| Restore Draft | Thử khôi phục nháp của map hiện tại, có kiểm tra source/catalog |
| Export Scene JSON | Tải JSON của map đang sửa xuống máy |
| Import Scene JSON | Đọc JSON vào map hiện tại; ID và dữ liệu phải hợp lệ |
| Save Tileset Source | Lưu catalog/thuộc tính tileset và các ảnh import cần thiết vào dự án |
| Save Scene to Source | Lưu map hiện tại vào source và compile dữ liệu runtime |
| Export Tileset JSON | Tải catalog hiện tại xuống máy |
| Download Selected PNG | Tải ảnh atlas chứa tile đang chọn |

Các nút nháp và import/export scene nằm trong **Files & drafts** trên thanh
trên. **Export Tileset JSON** và **Download Selected PNG** nằm trong mục
**Export & image backup** của tab **Properties**. Undo/Redo bị mờ khi history
tương ứng chưa có bước để hoàn tác/làm lại.

**Thứ tự nên dùng: lưu tileset → lưu từng scene → reload để kiểm tra.** Nếu
tileset còn thay đổi chưa lưu, Save Scene to Source bị từ chối. Việc đổi thuộc
tính tile cần Save Tileset Source dù chưa vẽ thêm tile nào vào map.

Save Scene to Source chỉ lưu **map đang chọn**. Sửa nhiều map thì chọn từng
map và lưu từng lượt. Chờ thông báo thành công; nếu tiếp tục sửa trong lúc
chờ lưu, các chỉnh sửa mới vẫn còn là nháp và cần lưu thêm lượt nữa.

Nháp trình duyệt không chứa PNG import chưa lưu, không tự lưu toàn bộ catalog,
và không thay thế file source. Nháp gắn với origin trình duyệt: `localhost`
khác `127.0.0.1`, cổng 8096 khác 8097. Mở đúng địa chỉ cũ để Restore Draft.
Lưu hoặc tải xuống ảnh/catalog trước khi dựa vào nháp qua một lần reload.

PNG import nằm tại `assets/tilesets/<sha256>.png`; metadata nằm trong
`content/world/tileset.json`. Scene source nằm trong `content/maps/scenes/`.
PNG theo chính sách ignore hiện có: giữ bản sao asset cùng dự án vì chỉ commit
Git không đủ khôi phục ảnh. Xem [cách khôi phục tileset](../../assets/tilesets/README.md).

## 10. Khôi phục nháp và xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| Không vẽ được lên layer | Kiểm tra Edit Map, Tiles và bỏ Lock của layer hiện tại |
| Vẽ rồi không thấy | Kiểm tra Show, layer đang chọn và tile ở các layer khác có phủ lên không |
| Tile trông như tường nhưng đi xuyên | Chọn đúng tile ID, đặt Collision → Blocked / solid và Apply Properties |
| Tán cây chặn đường | Kiểm tra Collision, Blocked edges, tile dưới tán và footprint object; Above characters chỉ đổi thứ tự vẽ |
| Nét vẽ bị từ chối | Tránh chặn spawn/điểm đến portal; kiểm tra tile ID và trạng thái layer |
| Không import được hoặc grid lệch | Kiểm tra PNG tĩnh, giới hạn ảnh và Source tile size/Margin/Spacing chia đúng lưới |
| Preview only | Đang dùng server tĩnh hoặc sai cổng; chuyển sang authoring server hoặc export thủ công trước khi reload |
| Scene không lưu vì tileset unsaved | Save Tileset Source trước, rồi lưu scene lại |
| Source conflict / CONFLICT | Export bản đang sửa để giữ công việc; reload source mới rồi đối chiếu và áp dụng lại |
| Ảnh mất sau reload | Kiểm tra PNG đã lưu đúng imagePath và bytes ảnh khớp hash; khôi phục ảnh gốc, không chỉ đổi tên một ảnh khác |
| Source saved nhưng build failed | Source đã ghi nhưng runtime chưa cập nhật; giữ bản export, xem lỗi và chạy builder để kiểm tra |
| Undo/Redo bị từ chối sau đổi catalog | Snapshot có thể tham chiếu tile đã mất hoặc đổi identity; giữ/export bản hiện tại và khôi phục catalog phù hợp |
| Server không khởi động vì cổng bận | Dùng server đang chạy nếu đúng dự án, hoặc chọn cổng khác và sửa URL tương ứng |

Nếu **Restore Draft** bị từ chối, editor giữ nguyên map hiện tại và hiện vùng
phục hồi:

1. Bấm **Download Rejected Draft** để tải nguyên envelope nháp bị từ chối.
   File này giữ cả metadata phục hồi, khác với Export Scene JSON.
2. Nếu chỉ thay catalog, thử **Revalidate with Current Catalog**. Thao tác này
   vẫn kiểm tra source hash, ID/atlas của tile và tính hợp lệ của map/project.
3. Nếu vẫn bị từ chối, giữ file vừa tải để đối chiếu thủ công. Envelope cũ
   thiếu metadata identity không được tự revalidate khi catalog hash đã đổi.

Trong khi có nháp bị từ chối của map đó chờ phục hồi, Save Scene Draft không
ghi đè bản đang giữ. Revalidate thành công chưa tự lưu source; lưu lại theo
thứ tự ở mục 9.

## 11. Dùng server tĩnh và lưu thủ công

Nếu chạy:

```powershell
python tools/serve.py --port 8096
```

thì mở http://127.0.0.1:8096/tools/world-editor.html. Editor vẫn cho sửa và xem
preview nhưng server này không ghi source qua các nút lưu trực tiếp.

Để áp dụng kết quả thủ công:

1. **Export Tileset JSON**, chép catalog vào `content/world/tileset.json`.
2. Với mỗi atlas mới, chọn tile thuộc atlas rồi **Download Selected PNG**.
   Chép ảnh vào đúng `imagePath` trong catalog, giữ nguyên tên hash và bytes.
3. **Export Scene JSON** cho từng map đã sửa, chép vào file tương ứng trong
   `content/maps/scenes/`, ví dụ `home.json`.
4. Từ thư mục gốc dự án, chạy:

```powershell
python tools/build_world_scenes.py --build
python tools/build_world_scenes.py --check
python tools/check_architecture.py
```

5. Khi builder thành công, reload editor/game để kiểm tra. Không sửa tay
   `content/maps/scenes-data.js`; đây là output được sinh từ source.

Chỉ thay scene thì không cần export lại catalog/ảnh đang giữ nguyên. Giữ các
file export cho tới khi kiểm tra xong sau reload.

Tài liệu liên quan: [quy trình authoring chung](DATA-AUTHORING.md),
[roadmap map/event](../design/world/WORLD-MAP-AUTHORING.md),
[bằng chứng kiểm tra](../ui-reviews/world-map-foundation/README.md).
