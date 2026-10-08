// Mock dialogue for art/interaction validation, independent of story and resources.
const line=(speaker,expression,text,next)=>({speaker,expression,text,...(next?{next}:{})});
function club(id,greeting,problem,support,resolve,decline){return {
 start:line('khue','neutral','Chào cậu. Buổi giao lưu hôm nay có gì mới không?','greeting'),
 greeting:line(id,'neutral',greeting,'problem'),
 problem:line(id,'serious',problem,'decision'),
 decision:{...line('khue','serious','Mình hiểu rồi. Cùng chọn cách xử lý nhé.'),choices:[{label:support,next:'support'},{label:'Để mình xem lại tư liệu trước.',next:'review'}]},
 support:line(id,'happy',resolve,'end'),
 review:line('khue','investigate','Mình sẽ ghi lại và đối chiếu từng chi tiết, rồi mới đưa ra kết luận.','followup'),
 followup:line(id,'neutral',decline,'end'),
 end:line('khue','happy','Cảm ơn cậu. Lát nữa mình cùng quay lại chuyện này nhé.')
};}
export const INTERACTION_SCENES={
 van:{title:'Duyệt bản thảo cùng Vân',nodes:club('van','Cứ đặt tư liệu ở đây. Mình đang xem bản thảo của cả nhóm.','Bản này kết luận quá sớm. Chưa có phản hồi của người được nhắc tới.','Bổ sung phản hồi trước khi đăng.','Đúng ý mình đấy. Có đủ nguồn rồi thì số báo này sẽ rất đáng đọc.','Ừ. Mình giữ bản thảo lại, chờ cậu xác minh xong.')},
 long:{title:'Chuyện tác nghiệp của Long',nodes:club('long','Mình vừa nghe bác ở sân bóng kể một câu chuyện hay lắm.','Nhưng có người muốn mình chỉ viết phần có lợi cho họ. Làm thế thì không công bằng.','Lắng nghe đầy đủ cả hai phía.','Ha ha! Vậy mới là đồng đội chứ. Để mình đi hỏi thêm, rồi kể cậu nghe.','Được. Mình sẽ không hứa đăng bài trước khi kiểm chứng.')},
 nhi:{title:'Cùng Nhi kiểm tra số liệu',nodes:club('nhi','À… mình có đối chiếu hai bản kê. Cậu có muốn xem cùng không?','Ơ… hai tổng này khác nhau! Nếu đưa số này vào bài thì sẽ sai mất…','Cùng kiểm tra lại từng dòng với Nhi.','Cậu chịu ngồi xem cùng thật à? Mình… thấy yên tâm hơn rồi.','Ừm… mình sẽ đánh dấu chỗ chưa khớp để cậu dễ kiểm tra.')},
 ngoc:{title:'Chọn ảnh cùng Ngọc',nodes:club('ngoc','Nhìn tấm này này! Mình bắt được khoảnh khắc mọi người đang cùng sửa sân.','Nhưng nếu cắt mất phần bên cạnh thì ảnh sẽ khiến người đọc hiểu sai.','Giữ ảnh đầy đủ và viết chú thích rõ.','Chốt nhé! Một tấm ảnh đẹp còn phải kể đúng chuyện nữa. Nhìn máy ảnh nào!','Được. Mình giữ cả ảnh gốc để cậu kiểm tra bối cảnh.')},
 an:{title:'Tìm quy luật cùng Ân',nodes:club('an','Hai bảng này dùng cùng một tên cột, nhưng cách tính có vẻ khác nhau.','Nếu so trực tiếp, kết luận sẽ lệch. Mình chưa tin con số tổng này.','Thống nhất định nghĩa trước khi so sánh.','Ừm. Như vậy mới khớp. Mình đã tìm được cách giải thích dễ hiểu hơn.','Mình sẽ ghi rõ giả định và phần còn chưa biết, để cậu đối chiếu.')},
 khue:{title:'Khuê xem lại ghi chép',nodes:{
 start:line('khue','neutral','Hôm nay có đủ mọi người ở đây. Mình nên dành thời gian nghe từng người.','listen'),
 listen:line('khue','serious','Có vài chi tiết mình chưa hiểu. Hỏi lại sẽ tốt hơn đoán thay họ.','notes'),
 notes:line('khue','investigate','Lời kể ở sân bóng và bảng kê này… mình cần ghi chúng cạnh nhau.','lead'),
 lead:line('khue','lead_found','Tìm thấy rồi! Hai bản kê đang tính theo hai khoảng thời gian khác nhau.','question'),
 question:line('khue','questioning','Nhưng ai đã đổi mốc thời gian? Mình cần hỏi người lập bảng.','finish'),
 finish:line('khue','happy','Có hướng đi rồi. Mình sẽ nhờ cả nhóm cùng kiểm chứng, rồi nghỉ một chút.')
 }},
 groundskeeper:{title:'Nghe bác bảo vệ kể chuyện',nodes:{
 start:line('khue','neutral','Bác có thể kể cho cháu chuyện sân bóng không ạ?','account'),
 account:line('groundskeeper','neutral','Từ lúc sân đóng cửa, các em phải tập ngoài cổng. Bác lo nhất là xe cộ qua lại.','ask'),
 ask:line('khue','serious','Cháu muốn nghe cả người quản lý sân nữa. Bác chỉ giúp cháu được không?','reply'),
 reply:line('groundskeeper','neutral','Được chứ. Cứ hỏi cho rõ, đừng để một lời kể thành cả câu chuyện.')
 }},
 teacher:{title:'Xin phản hồi từ thầy',nodes:{
 start:line('khue','investigate','Thưa thầy, hai bảng kê dùng mốc thời gian khác nhau phải không ạ?','reply'),
 reply:line('teacher','neutral','Đúng. Một bảng tính cả học kỳ, bảng còn lại chỉ tính tháng này. Các em phải ghi rõ phạm vi.','found'),
 found:line('khue','lead_found','Vậy là có thể giải thích chênh lệch rồi. Em sẽ sửa phần đối chiếu.','end'),
 end:line('teacher','neutral','Hãy gửi bản đã sửa để người phụ trách kiểm tra lại trước khi đăng.')
 }},
 'harbor-source':{title:'Một buổi sáng ở cảng',nodes:{
 start:line('khue','neutral','Cháu muốn viết về buổi sáng làm việc ở cảng. Chú thấy cần kể điều gì nhất?','reply'),
 reply:line('harbor-source','neutral','Lúc mọi người còn ngủ thì chúng tôi đã bắt đầu ca rồi. Đừng chỉ chụp bến cảng khi nó vắng và đẹp.','ask'),
 ask:line('khue','serious','Cháu có thể đến quan sát một ca thật, sau khi xin phép, được không ạ?','end'),
 end:line('harbor-source','neutral','Được. Hỏi người điều phối trước, rồi đứng ở khu an toàn. Muốn viết thật thì phải nhìn việc thật.')
 }}
};
