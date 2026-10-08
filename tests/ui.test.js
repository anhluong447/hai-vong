import { test, assert as a } from './harness.js';
function waitFor(fn,timeout=8000) { return new Promise((resolve,reject) => { const start=Date.now(); const poll=()=>{try { const value=fn(); if(value) return resolve(value); if(Date.now()-start>timeout) return reject(new Error('UI timed out')); setTimeout(poll,20); } catch(error){reject(error);} }; poll(); }); }
async function frame(path) { const f=document.createElement('iframe'); f.src=path; document.body.append(f); await waitFor(()=>f.contentWindow.pressClub); f.contentWindow.confirm=()=>true; return f; }
function click(doc,label) { const b=[...doc.querySelectorAll('button')].find(b=>b.textContent===label); a.ok(b,`Missing button: ${label}`); a.ok(!b.disabled,`Disabled button: ${label}`); b.click(); }
test('real map UI: assign, interview, edit, publish, save/load and map station',async()=>{
  const f=await frame('../index.html'); const w=f.contentWindow; const d=w.document;
  try {
    a.equal(w.pressClub.mode,'map'); a.equal(w.pressClub.state.day,1);
    click(d,'Phân công →'); a.ok(d.querySelector('select[name=reporter]')); click(d,'Chốt phỏng vấn');
    a.equal(w.pressClub.state.weekArticles.length,1); a.equal(w.pressClub.state.energy,2);
    w.pressClub.navigate('editor'); const slider=d.querySelector('input[type=range]'); slider.value=80; slider.dispatchEvent(new w.Event('change',{bubbles:true})); a.equal(w.pressClub.state.weekArticles[0].grit,0.8);
    click(d,'Lưu'); click(d,'Kết thúc ngày'); a.equal(w.pressClub.state.day,2); click(d,'Tải'); a.equal(w.pressClub.state.day,1); a.equal(w.pressClub.state.workedToday.length,2);
    const canvas=d.querySelector('canvas'); const bounds=canvas.getBoundingClientRect(); canvas.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:bounds.left+bounds.width*0.76,clientY:bounds.top+bounds.height*0.68,bubbles:true}));
    a.ok(d.querySelector('.tabs button.active').textContent==='Báo cáo'); a.ok(w.pressClub.mapPosition.x>0.7);
    for(let i=0;i<4;i++) click(d,'Kết thúc ngày'); click(d,'Phát hành & sang tuần');
    a.equal(w.pressClub.state.day,6); a.equal(w.pressClub.state.reports.length,1); a.ok(w.pressClub.state.reports[0].score>0);
    a.ok(!d.querySelector('.lab-controls').children.length); a.equal(d.querySelector('.status').classList.contains('error'),false);
  } finally { w.dispatchEvent(new w.Event('blur')); f.remove(); }
});
test('real sandbox UI: patch state, tune roster, auto week, compare and change config',async()=>{
  const f=await frame('../sandbox.html'); const w=f.contentWindow; const d=w.document;
  try {
    a.equal(w.pressClub.mode,'sandbox'); d.querySelector('[name=pressure]').value=120; click(d,'Áp dụng trạng thái'); a.equal(w.pressClub.state.pressure,120);
    d.querySelector('[name=join-nhi]').value=1; click(d,'Áp dụng nhân sự'); a.equal(w.pressClub.state.staff[3].joinWeek,1);
    click(d,'Tự chơi hết tuần'); a.equal(w.pressClub.state.day,6); a.equal(w.pressClub.state.reports.length,1);
    click(d,'So sánh 8 chiến thuật'); a.equal(d.querySelectorAll('.lab-controls table tbody tr').length,8);
    const textarea=d.querySelector('textarea'); const cfg=JSON.parse(textarea.value); cfg.evidenceRequired=180; textarea.value=JSON.stringify(cfg); click(d,'Áp dụng & tạo lượt mới'); a.equal(w.pressClub.state.day,1); a.equal(w.pressClub.state.config.evidenceRequired,180);
    click(d,'Ví dụ S04'); a.equal(w.pressClub.state.day,2); click(d,'Chốt phỏng vấn');
    const sample=w.pressClub.state.weekArticles[0]; a.near(sample.q,1.08); a.near(sample.score,69120); a.near(sample.pressure,18); a.near(sample.evidence,12.96);
    const policy=d.querySelector('.simulation-bar select'); policy.value='grit80'; policy.dispatchEvent(new w.Event('change')); click(d,'Tự chơi 1 ngày'); a.equal(d.querySelector('.simulation-bar select').value,'grit80');
    click(d,'Tự chơi hết học kỳ'); a.ok(w.pressClub.state.outcome); a.equal(w.pressClub.state.day,61); a.equal(w.pressClub.state.reports.length,12);
    a.equal(d.querySelector('.status').classList.contains('error'),false);
  } finally { f.remove(); }
});
