import {test,assert} from '/tests/harness.js';
const until=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,40));}throw new Error('workspace bootstrap did not become ready');};
test('real workspace page boots catalog labels theme controls and independent preview',async()=>{
 const frame=document.createElement('iframe');frame.src='/tools/workspace/index.html';document.body.append(frame);
 try{
  await until(()=>frame.contentDocument?.querySelector('[data-action=preview]')?.textContent.length>0);
  const doc=frame.contentDocument;assert(doc.title.includes('H?i ?m'));assert(doc.querySelector('textarea').value.includes('flag.foundation.visited'));
  assert(doc.defaultView.getComputedStyle(doc.body).backgroundColor!=='rgba(0, 0, 0, 0)');
  doc.querySelector('[data-action=preview]').click();assert(doc.querySelector('[data-role=dialogue]').textContent.includes('Ch??ng th? nghi?m'));
  doc.querySelector('[data-action=advance]').click();assert(doc.querySelector('[data-role=choices] button'));
  doc.querySelector('[data-action=stop]').click();assert(doc.querySelector('[data-action=advance]').disabled);
 }finally{frame.remove();}
});
