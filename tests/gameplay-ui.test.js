import {test,assert as a} from './harness.js';
function waitFor(fn){return new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{if(fn())return resolve();if(Date.now()-start>8000)return reject(new Error('Gameplay UI timed out'));setTimeout(poll,20);};poll();});}
function click(d,label){const b=[...d.querySelectorAll('button')].find(b=>b.textContent===label);a.ok(b,`Missing ${label}`);a.ok(!b.disabled,`Disabled ${label}`);b.click();}
test('gameplay real UI: map activity, feedback modal, free approval, sleep and isolated save',async()=>{
 const f=document.createElement('iframe');f.src='../gameplay.html';document.body.append(f);await waitFor(()=>f.contentWindow.pressGameplay);const w=f.contentWindow,d=w.document;w.confirm=()=>true;
 try{
  click(d,'Đi học → buổi CLB');click(d,'Phỏng vấn mở hồ sơ · 1 E');const who=d.querySelector('[name="assign-W1-community"]');who.value='long';click(d,'Giao trọn hồ sơ · 1 E');a.equal(w.pressGameplay.state.energy,2);
  click(d,'Kết thúc buổi CLB');const home=[...d.querySelectorAll('.place')].find(b=>b.textContent.includes('Nhà Khuê'));home.click();click(d,'Nghỉ ngơi · giảm mệt');
  const job=[...d.querySelectorAll('.place')].find(b=>b.textContent.includes('Phố ăn uống'));job.click();click(d,'Làm thêm · +150đ');a.equal(w.pressGameplay.state.money,450);
  click(d,'Nhấn giường · đi ngủ');a.ok(d.querySelector('[role=dialog]'));a.equal(w.pressGameplay.state.day,1);a.equal(w.pressGameplay.state.energy,0);
  f.style.width='390px';await new Promise(resolve=>setTimeout(resolve,30));a.ok(d.documentElement.scrollWidth<=w.innerWidth+1,'Mobile page overflows horizontally');a.ok(d.querySelector('[role=dialog]').getBoundingClientRect().width<=390,'Mobile feedback overflows');
  click(d,'Lưu');click(d,'Approve · tiếp tục');a.equal(w.pressGameplay.state.energy,0);a.ok(!d.querySelector('[role=dialog]'));click(d,'Nhấn giường · đi ngủ');a.equal(w.pressGameplay.state.day,2);
  click(d,'Tải');a.equal(w.pressGameplay.state.day,1);a.ok(d.querySelector('[role=dialog]'));click(d,'Approve · tiếp tục');click(d,'Nhấn giường · đi ngủ');a.equal(w.pressGameplay.state.day,2);
  const body=d.body.innerText;a.ok(!body.includes('undefined'));a.ok(!body.includes('NaN'));a.ok(!d.querySelector('.status.error'));
 }finally{f.remove();}
});
