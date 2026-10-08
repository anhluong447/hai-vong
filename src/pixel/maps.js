const terrainBlocked = new Set([5,6,7,8,12,13,15]);
function room(id,title,w,h,floor=0){return {id,title,width:w,height:h,tiles:Array.from({length:h},()=>Array(w).fill(floor)),objects:[],npcs:[],portals:[],spawn:{x:Math.floor(w/2),y:h-6}};}
function fill(m,x,y,w,h,tile){for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)if(m.tiles[py]?.[px]!==undefined)m.tiles[py][px]=tile;}
function border(m,tile){fill(m,0,0,m.width,1,tile);fill(m,0,m.height-1,m.width,1,tile);fill(m,0,0,1,m.height,tile);fill(m,m.width-1,0,1,m.height,tile);}
function prop(m,id,asset,x,y,kind,label,extra={}){m.objects.push({id,asset,x,y,kind,label,solid:true,footprint:asset==='bed'||asset==='bookcase'?[[0,0],[0,-1]]:[[0,0]],...extra});}
function npc(m,id,sprite,x,y,kind,label,extra={}){m.npcs.push({id,sprite,portraitId:id,x,y,kind,label,solid:true,...extra});}
function door(m,x,y,to,tx,ty,label){m.tiles[y][x]=9;m.portals.push({x,y,to,spawn:{x:tx,y:ty},label});}
function building(m,x,y,w,h){fill(m,x,y,w,h,6);fill(m,x,y,w,3,7);for(let i=x+2;i<x+w-1;i+=3)fill(m,i,y+h-2,1,1,13);}
const yard=room('yard','Tĩnh Tâm · sân trường',40,28);border(yard,12);fill(yard,17,7,6,20,2);fill(yard,6,11,28,4,2);fill(yard,4,16,30,4,2);
building(yard,13,2,16,6);building(yard,7,6,7,5);fill(yard,15,20,12,3,1);
prop(yard,'classroom','board',20,8,'school','Cửa lớp học');
prop(yard,'photo-point','camera',28,17,'questStep','Hiện trường căng tin',{step:'photo'});
prop(yard,'yard-bench','bench',10,18,'rest','Ghế sân trường');
npc(yard,'groundskeeper','source',31,12,'source','Bác bảo vệ',{caseKey:'community',step:'interview',line:'Sân bóng đóng cửa nên các em phải tập ngoài cổng. Có chuyện cần ngồi xuống nghe cho rõ.'});
npc(yard,'teacher','source',5,17,'source','Thầy phụ trách',{caseKey:'documents',step:'courage',line:'Bảng kê có thể khiến người đọc hiểu nhầm. Nếu làm báo, các em cần đối chiếu giấy tờ và lấy phản hồi chính thức.'});
for(const [x,y]of[[3,4],[35,5],[3,11],[36,18],[6,24],[31,24]])prop(yard,`tree-${x}`,'tree',x,y,null,'Cây');
door(yard,10,10,'newsroom',12,16,'CLB Hồi Âm');door(yard,20,26,'street',18,3,'Ra phố');yard.spawn={x:20,y:11};
const newsroom=room('newsroom','Hồi Âm · phòng câu lạc bộ',26,20,3);border(newsroom,8);fill(newsroom,1,1,24,2,8);fill(newsroom,9,11,7,4,14);
for(const x of[4,10,16,22])newsroom.tiles[1][x]=13;
prop(newsroom,'assignment-board','board',3,5,'board','Bảng phân công');
prop(newsroom,'archive','bookcase',6,4,'questStep','Tủ hồ sơ',{step:'documents'});
prop(newsroom,'writing-desk','desk',12,8,'write','Bàn làm việc Khuê');
prop(newsroom,'printer','printer',21,5,'editor','Máy in · đội soạn');
prop(newsroom,'club-clock','clock',3,15,'schedule','Đồng hồ CLB');
prop(newsroom,'van-desk','desk',18,7,null,'Bàn biên tập');
prop(newsroom,'plant','planter',23,17,null,'Chậu cây');
for(const [id,x,y,line]of[['van',18,9,'Tư liệu tốt thì mình mới biên tập thành bài tốt được. Đừng quên chốt công việc trước khi rời CLB nhé.'],['long',7,11,'Chuyện cộng đồng thì cứ để mình nghe thử. Còn số liệu nhiều quá, mình sẽ báo lại ngay nếu không ổn.'],['nhi',7,6,'Một con số sai có thể đổi nghĩa cả bài báo. Mình hợp việc đối chiếu tài liệu hơn.'],['ngoc',22,12,'Nếu cần một bức ảnh kể được câu chuyện, mình muốn có mặt đúng lúc.'],['an',21,15,'Đừng chỉ nhìn số lớn nhất. Có khi hai bảng số liệu đang kể hai chuyện khác nhau.']])npc(newsroom,id,id,x,y,'teammate',id,{person:id,line,schedule:'club'});
door(newsroom,12,18,'yard',10,12,'Sân trường');newsroom.spawn={x:12,y:16};
const street=room('street','Hải Vọng · phố ven biển',40,28);border(street,12);fill(street,34,1,5,26,5);fill(street,1,16,33,8,10);fill(street,17,1,4,15,2);fill(street,2,9,30,6,2);fill(street,30,9,4,15,11);
building(street,3,3,10,6);building(street,23,3,9,6);
prop(street,'shop','shop',8,10,'shop','Tiệm công cụ');prop(street,'cafe','bench',25,10,'cafe','Cà phê Đối Thoại');prop(street,'food-job','shop',12,19,'job','Quầy ăn · làm thêm');prop(street,'library','bookcase',25,14,'training','Góc đọc sách');
for(const[x,y]of[[3,13],[32,5],[3,25]])prop(street,`tree-${x}-${y}`,'tree',x,y,null,'Cây');
for(const[x,y]of[[17,17],[29,23]])prop(street,`lamp-${x}`,'lamp',x,y,null,'Đèn đường');
npc(street,'harbor-source','source',32,21,'source','Người làm cảng',{caseKey:'photo',line:'Buổi sáng ở bến cảng không giống những gì người ta thấy lúc đi chơi. Nếu viết về chúng tôi, nhớ ghi lại khoảnh khắc thật.'});
for(const[id,x,y,line]of[['van',23,11,'Ra ngoài rồi thì mình có thể tạm gác tòa soạn một chút.'],['nhi',24,15,'Mình vừa tìm thấy một cuốn sách thú vị ở đây.'],['long',11,21,'Hôm nay mình có chút thời gian rảnh. Đi dạo không?'],['ngoc',30,17,'Ánh sáng ở bờ kè đang đẹp lắm.'],['an',26,22,'Đôi khi cần ra ngoài để nghĩ rõ hơn.']])npc(street,id,id,x,y,'teammate',id,{person:id,line,schedule:'leisure',expression:id==='van'?'happy':'neutral'});
prop(street,'home-sign','board',4,20,null,'Nhà Khuê');door(street,18,1,'yard',20,25,'Về trường');door(street,6,21,'home',9,12,'Nhà Khuê');street.spawn={x:18,y:3};
const home=room('home','Nhà Khuê · phòng nghỉ',20,17,3);border(home,8);fill(home,1,1,18,2,8);home.tiles[1][5]=13;home.tiles[1][14]=13;fill(home,7,9,6,4,14);
prop(home,'bed','bed',15,6,'bed','Giường ngủ');prop(home,'home-desk','desk',5,6,'write','Bàn viết');prop(home,'home-shelf','bookcase',3,4,'reports','Sổ ghi chép');prop(home,'home-plant','planter',17,13,null,'Chậu cây');prop(home,'home-rest','bench',11,11,'rest','Ghế nghỉ');
door(home,9,15,'street',6,22,'Ra phố');home.spawn={x:9,y:12};
const interaction=room('interaction','Hồi Âm · buổi giao lưu thử nghiệm',26,20,3);border(interaction,8);
fill(interaction,1,1,24,2,8);for(const x of[4,10,16,22])interaction.tiles[1][x]=13;
fill(interaction,2,4,10,4,14);fill(interaction,14,4,10,4,14);fill(interaction,2,10,10,4,14);fill(interaction,14,10,10,4,14);
interaction.spawn={x:12,y:10};interaction.signs=[[7,4,'ĐỘI PHÓNG VIÊN'],[19,4,'ĐỐI CHIẾU TƯ LIỆU'],[7,9,'GIAO LƯU'],[19,9,'NGUỒN TIN']];
for(const[id,sprite,x,y,label]of[['van','van',4,6,'Lục Thanh Vân'],['long','long',9,6,'Đoàn Bảo Long'],['nhi','nhi',16,6,'Hạ Tuyết Nhi'],['an','an',21,6,'Ngô Thiên Ân'],['ngoc','ngoc',4,12,'Tạ Như Ngọc'],['groundskeeper','source',15,12,'Bác bảo vệ'],['teacher','source',19,12,'Thầy phụ trách'],['harbor-source','source',23,12,'Người làm cảng']])npc(interaction,id,sprite,x,y,'dialogueTest',label,{scene:id});
prop(interaction,'khue-notebook','desk',9,12,'dialogueTest','Khuê · xem lại ghi chép',{scene:'khue'});
prop(interaction,'test-printer','printer',23,17,null,'Máy in');prop(interaction,'test-archive','bookcase',2,17,null,'Tủ tư liệu');
export const MAPS={yard,newsroom,street,home,interaction};
export function visibleNPCs(map,state){return map.npcs.filter(n=>{
 if(!n.person)return true;const p=state?.people.find(p=>p.id===n.person);if(!p||p.joinDay>state.day)return false;
 const off=(state.day-1)%7>=5;const club=!off&&['morning','club'].includes(state.phase);
 return n.schedule==='club'?club:!club;
});}
export function walkable(map,x,y,npcs=[]){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<map.width&&y<map.height&&!terrainBlocked.has(map.tiles[y][x])&&!map.objects.some(o=>o.solid&&o.footprint.some(([dx,dy])=>o.x+dx===x&&o.y+dy===y))&&!npcs.some(n=>n.solid&&n.x===x&&n.y===y);}
export function findPath(map,start,goal,npcs=[]){
 if(!walkable(map,goal.x,goal.y,npcs))return null;const key=p=>`${p.x},${p.y}`;const queue=[{...start}],parent=new Map([[key(start),null]]);let end=null;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===goal.x&&p.y===goal.y){end=p;break;}for(const [dx,dy]of[[0,1],[-1,0],[1,0],[0,-1]]){const n={x:p.x+dx,y:p.y+dy};if(walkable(map,n.x,n.y,npcs)&&!parent.has(key(n))){parent.set(key(n),p);queue.push(n);}}}
 if(!end)return null;const path=[];for(let p=end;parent.get(key(p));p=parent.get(key(p)))path.unshift(p);return path;
}
export function pathToObject(map,start,target,npcs=[]){const edges=target.sprite?[[-1,0],[1,0],[0,1],[0,-1]]:[[0,1],[-1,0],[1,0],[0,-1]];const paths=edges.map(([dx,dy])=>findPath(map,start,{x:target.x+dx,y:target.y+dy},npcs)).filter(Boolean);paths.sort((a,b)=>a.length-b.length);return paths[0]??null;}
export function safePosition(map,value,npcs=[]){if(value&&walkable(map,value.x,value.y,npcs))return{x:value.x,y:value.y};if(walkable(map,map.spawn.x,map.spawn.y,npcs))return{...map.spawn};for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++)if(walkable(map,x,y,npcs))return{x,y};throw new Error('Map không có ô spawn khả dụng.');}
