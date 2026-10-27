import {test,assert,equal} from '/tests/harness.js';
import {press} from '/tests/driver.js';
const wait=async check=>{for(let i=0;i<300;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('c1.page.timeout');};
test('C1 uses validated sources real depth renderer and native toggles without player persistence',async()=>{
 const response=await fetch('/docs/art-direction/review-b-r1/index.html');assert(response.ok,'C1 review page missing');
 const before=await indexedDB.databases(),frame=document.createElement('iframe');frame.style.cssText='width:1100px;height:900px';frame.src='/docs/art-direction/review-b-r1/index.html?capture';document.body.append(frame);let app;
 try{
  await wait(()=>{if(frame.contentDocument?.documentElement?.dataset.ready==='error')throw new Error(frame.contentDocument.querySelector('[data-role=status]').textContent);return frame.contentDocument?.documentElement?.dataset.ready==='true';});app=frame.contentWindow.c1Review;assert(app);const doc=frame.contentDocument;equal(app.world.current.scene.props.length,7);equal(app.session.bundle.catalog.get('actors','actor.first3.khue').value.scale,152/192);equal(app.world.current.scene.props.find(p=>p.id==='desk').height,64);
  const state=app.session.snapshot(),baseline=app.assets.stats(),canvas=doc.querySelector('canvas');
  const crop=()=>{const point=app.view.toCSS({x:430-app.world.camera.x,y:356});return [...app.view.context.getImageData(Math.round(point.x*app.view.dpr),Math.round(point.y*app.view.dpr),24,28).data];};
  const desk=doc.querySelector('[data-prop-id=desk]'),beforePixels=crop();desk.focus();await press({key:' ',code:'Space',virtualKey:32});assert(!desk.checked);assert(JSON.stringify(crop())!==JSON.stringify(beforePixels),'toggling desk did not expose the actor/background');equal(app.session.snapshot().gameplay,state.gameplay);
  desk.focus();await press({key:' ',code:'Space',virtualKey:32});assert(desk.checked);equal(crop(),beforePixels);
  const position=doc.querySelector('[data-role=position]');position.focus();await press({key:'End',code:'End',virtualKey:35});equal(app.session.snapshot().world.position,1232);equal(app.world.camera.x,320);position.focus();await press({key:'Home',code:'Home',virtualKey:36});equal(app.session.snapshot().world.position,48);equal(app.world.camera.x,0);
  doc.querySelector('[data-position="430"]').focus();await press({key:'Enter',code:'Enter',virtualKey:13});equal(app.session.snapshot().world.position,430);equal(app.assets.stats(),baseline);equal((await indexedDB.databases()).map(x=>x.name).sort(),before.map(x=>x.name).sort());
  app.dispose();equal(app.assets.stats(),{resources:0,references:0,pending:0});equal(canvas.width,0);
 }finally{app?.dispose();frame.remove();}
});
