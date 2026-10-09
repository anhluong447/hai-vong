import {test,assert,runAll} from './harness.js';
import {dialogueMotion,dialogueMotionManifest} from '../content/ui/coastal-dialogue-motion.js';

const frame=document.getElementById('pilot'),results=document.getElementById('results');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try {
  await new Promise(resolve=>{if(frame.contentWindow.replicaPreview)resolve();else frame.addEventListener('load',resolve,{once:true});});
  const win=frame.contentWindow,doc=frame.contentDocument,{stage,ready}=win.replicaPreview;await ready;
  const motion=stage.motion;motion.setPaused(true);motion.setVisible(true);motion.advance(1000);
  const fixture=await (await fetch('../docs/ui-specs/coastal-replica/fixtures.json')).json();
  const supplement=await (await fetch('../docs/ui-specs/coastal-replica/dialogue-production.json')).json();
  const request={screen:'dialogue',capture:fixture.capture,fixture:fixture.screens.dialogue,catalog:{...fixture.catalog,...supplement.catalog},variant:'ui-dark'};
  const actions=[];stage.onAction=action=>actions.push(action);
  const press=(node,key)=>node.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const pointer=(id,type)=>stage.svg.querySelector(`[data-choice-id="${id}"]`).dispatchEvent(new win.PointerEvent(type,{bubbles:true}));
  const fixedBounds=()=>JSON.stringify(stage.measureTypography().filter(item=>item.region!=='foreground-note-copy'));
  const fingerprint=()=>[...stage.svg.querySelectorAll('[data-motion-paper],[data-motion-wave],[data-motion-flow],[data-motion-notebook],[data-region="foreground-left"],[data-motion-sheen]')].map(n=>[n.getAttribute('transform'),n.getAttribute('d'),n.style.opacity]);
  test('Stage 4 reuses the static UI pack and owns one independent presentation clock',()=>{
    assert.equal(stage.manifest.version,3);assert.equal(stage.manifest.assets.length,14);
    assert.ok(stage.scene.motion);assert.ok(motion);
    assert.equal(motion.config.scope,'presentation-only UI; G2 remains open');
    assert.ok(stage.svg.querySelector('[data-motion-flow]'));assert.ok(!stage.svg.querySelector('[data-context] [data-motion-flow]'));
    assert.equal(stage.rasterUrls.size,3);
    assert.ok(stage.svg.querySelector('[data-motion-wave] image').href.baseVal.startsWith('blob:'));
  });
  test('Loop endpoints match exactly, including wave path, decoration pivots and sheen',()=>{
    motion.freeze(0);const first=JSON.stringify(fingerprint());motion.freeze(16000);
    assert.equal(JSON.stringify(fingerprint()),first);motion.freeze(8000);
    assert.equal(stage.svg.querySelector('[data-motion-wave]').getAttribute('transform'),'translate(0 0)');
  });
  test('Main reading baselines and hitbox transforms never drift across loop phases',()=>{
    motion.freeze(0);const original=fixedBounds();
    for(const time of [700,2400,6000,13000]) {
      motion.freeze(time);assert.equal(fixedBounds(),original);
      assert.ok([...stage.svg.querySelectorAll('[data-choice-id]')].every(node=>!node.hasAttribute('transform')));
      assert.ok(!stage.svg.querySelector('.continue').hasAttribute('transform'));
    }
  });
  test('Printed harbor retains authored opacity, independent of animation progress',()=>{
    const item=stage.scene.art.find(a=>a.id==='paper-harbor');
    motion.freeze(null);assert.near(Number(stage.svg.querySelector('[data-region="paper-harbor"]').style.opacity),item.opacity??1);
    assert.ok(stage.svg.querySelector('[data-region="paper-harbor"]').getAttribute('transform').endsWith(item.transform));
  });
  test('Notebook edge, wash and handwriting share sway without filtering glyphs',()=>{
    motion.freeze(4000);const root=stage.svg.querySelector('[data-motion-notebook]');
    assert.ok(root.getAttribute('transform').includes('0.35'));
    assert.ok(root.querySelector('[data-region="note-bleed-restoration"]'));
    assert.ok(root.querySelector('[data-ui-light="notebook-wash"]'));
    assert.ok(root.querySelector('text[data-region="foreground-note-copy"]'));
    assert.ok(!root.querySelector('text').closest('[filter]'));
    assert.ok(stage.svg.querySelector('[data-region="foreground-left"]').getAttribute('transform').includes('rotate'));
  });
  test('Hover, focus and press animate only the choice art, while actions stay immediate',()=>{
    motion.setEnabled(true);motion.setPaused(true);pointer('draft','pointerover');motion.advance(140);
    const target=stage.svg.querySelector('[data-choice-id="draft"]');
    assert.ok(target.querySelector('[data-choice-art]').getAttribute('transform').includes('-2.2'));
    pointer('draft','pointerdown');motion.advance(16);assert.ok(target.querySelector('[data-choice-art]').getAttribute('transform').includes('-1.2'));
    pointer('draft','pointercancel');motion.advance(16);
    const before=actions.length;press(target,'Enter');assert.equal(actions.length,before+1);assert.equal(stage.selectedChoice,'draft');
    assert.equal(actions.at(-1).type,'choose');
  });
  test('Entry staggers choices and reveals copy without translating text',()=>{
    motion.setVisible(true,{replay:true});motion.advance(80);
    const first=stage.svg.querySelector('[data-choice-id="verify"] [data-choice-art]');
    const last=stage.svg.querySelector('[data-choice-id="listen"] [data-choice-art]');
    assert.ok(Number(first.style.opacity)>Number(last.style.opacity));
    assert.ok([...stage.svg.querySelectorAll('text[data-motion-copy]')].every(n=>!n.hasAttribute('transform')));
    motion.advance(1000);assert.equal(motion.progress,1);assert.equal(motion.transition,null);
  });
  test('Exiting immediately disables callbacks; interruption starts at the current visual state',()=>{
    motion.setVisible(false);const before=actions.length;stage.choose('listen');press(stage.svg.querySelector('.continue'),'Enter');
    assert.equal(actions.length,before);assert.equal(stage.svg.querySelector('[data-choice-id]').getAttribute('aria-disabled'),'true');
    motion.advance(80);const halfway=motion.progress;assert.ok(halfway>0&&halfway<1);
    motion.setVisible(true);assert.equal(motion.progress,halfway);motion.advance(1000);assert.equal(motion.progress,1);
    stage.choose('listen');assert.equal(actions.length,before+1);
    motion.setVisible(false);motion.advance(1000);
    assert.ok([...stage.svg.querySelectorAll('[data-motion-copy]')].every(node=>node.style.opacity==='0'));
    assert.equal(stage.svg.querySelector('[data-choice-id]').getAttribute('aria-hidden'),'true');
    assert.ok(!stage.svg.querySelector('[data-region="date"]').style.opacity);
    motion.setVisible(true);motion.advance(1000);
  });
  test('Repeated transitions, selections and view replacement do not accumulate old SVG listeners',()=>{
    for(let i=0;i<15;i++) {motion.setVisible(false);motion.advance(20);motion.setVisible(true);motion.advance(1000);stage.choose(i%2?'verify':'draft');}
    const before=actions.length;press(stage.svg.querySelector('.continue'),'Enter');assert.equal(actions.length,before+1);
    const time=motion.timeMs;stage.setView('ui-light');assert.equal(motion.timeMs,time);
    assert.equal(doc.querySelectorAll('.replica-stage').length,1);stage.setView('ui-dark');
  });
  test('Hidden tab stops the scheduler, freezes time and resumes without catch-up',async()=>{
    motion.setPaused(false);motion.setHidden(true);const time=motion.timeMs;
    assert.equal(motion.handle,null);await sleep(100);motion.advance(1000);assert.equal(motion.timeMs,time);
    motion.setHidden(false);assert.equal(motion.timeMs,time);assert.ok(motion.handle!==null);
    motion.setPaused(true);
  });
  test('Pause and slow playback control actual presentation time',async()=>{
    motion.setPaused(true);const time=motion.timeMs;await sleep(80);assert.equal(motion.timeMs,time);
    motion.setRate(0.25);assert.equal(motion.rate,0.25);assert.throws(()=>motion.setRate(2),/Unsupported/);
    motion.setRate(1);motion.setPaused(false);await sleep(150);assert.ok(motion.timeMs!==time);
    motion.setPaused(true);
  });
  test('Reduced motion settles transitions, removes decorative effects and keeps keyboard actions',()=>{
    motion.reduced=true;motion.setVisible(true,{replay:true});assert.equal(motion.progress,1);assert.equal(motion.handle,null);
    assert.equal(stage.svg.querySelector('[data-motion-flow]').style.opacity,'0');assert.equal(stage.svg.querySelector('[data-motion-sheen]').style.opacity,'0');
    const before=actions.length;press(stage.svg.querySelector('[data-choice-id="verify"]'),'Enter');assert.equal(actions.length,before+1);
    assert.equal(stage.svg.dataset.motion,'reduced');motion.reduced=motion.media.matches;motion.sync();motion.setPaused(true);
  });
  test('Changing live display copy mid-transition preserves the active clock and fixed anchors',()=>{
    motion.setVisible(true,{replay:true});motion.advance(100);
    const before=motion.progress,key=stage.scene.text.find(t=>t.id==='line').key;
    stage.scene={...stage.scene,text:stage.scene.text.map(t=>t.id==='line'?{...t,key:'ui.replica.preview.typeBody'}:t)};
    stage.render();assert.equal(motion.progress,before);assert.equal(stage.svg.querySelector('[data-region="line"]').dataset.textKey,'ui.replica.preview.typeBody');
    stage.scene=dialogueMotion;stage.render();motion.advance(1000);
    assert.equal(stage.svg.querySelector('[data-region="line"]').dataset.textKey,key);
  });
  test('Multiple stages isolate moving masks, clocks and disposal',async()=>{
    const host=doc.createElement('div');doc.body.append(host);
    const other=new stage.constructor(host,{scene:dialogueMotion});await other.load(new URL('../'+dialogueMotionManifest,location.href));
    other.motion.setPaused(true);other.motion.freeze(2000);const ids=[...doc.querySelectorAll('defs [id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length);assert.ok(other.motion!==motion);other.dispose();assert.equal(other.motion.handle,null);host.remove();
  });
  test('Invalid sample fails before capture lock; settled capture removes all loops',async()=>{
    try {await win.replicaCapture.prepare({...request,motionSampleMs:-1});throw new Error('accepted');}catch(e){assert.ok(/Invalid motion/.test(e.message));}
    assert.equal(stage.captureLocked,false);const state=await win.replicaCapture.prepare(request);
    assert.equal(state.kind,'stage4-ui-motion');assert.equal(state.motion.pendingFrame,false);assert.equal(state.motion.frozen,true);
    assert.equal(stage.svg.querySelector('[data-motion-flow]').style.opacity,'0');assert.equal(state.motionSampleMs,null);
    assert.ok(!stage.svg.querySelector('[data-motion-wave] image').href.baseVal.startsWith('blob:'));
  });
  test('Sampled capture is repeatable and cannot issue callbacks or advance gameplay time',async()=>{
    const first=await win.replicaCapture.prepare({...request,motionSampleMs:2400}),pixels=JSON.stringify(fingerprint());
    const second=await win.replicaCapture.prepare({...request,motionSampleMs:2400});assert.equal(JSON.stringify(fingerprint()),pixels);
    assert.equal(first.motion.timeMs,second.motion.timeMs);assert.equal(second.clock,fixture.capture.clock);assert.equal(second.motionTimeMs,0);
    const before=actions.length;stage.choose('draft');press(stage.svg.querySelector('.continue'),'Enter');assert.equal(actions.length,before);
  });
  test('Inspection and disposal cancel animation resources, including after repeated cleanup',()=>{
    stage.setView('typography');assert.equal(motion.handle,null);stage.setView('ui-dark');
    const time=motion.timeMs,before=actions.length;stage.dispose();stage.dispose();motion.advance(1000);motion.setHidden(false);
    assert.equal(motion.timeMs,time);assert.equal(motion.handle,null);assert.equal(actions.length,before);assert.equal(doc.querySelectorAll('.replica-stage').length,0);
    assert.equal(stage.rasterUrls.size,0);
  });
  const list=await runAll();
  for(const result of list){const n=document.createElement('pre');n.className=result.ok?'ok':'bad';n.textContent=result.name+(result.ok?'':': '+result.error);results.append(n);}
  const summary=document.createElement('p');summary.className=list.every(r=>r.ok)?'ok':'bad';summary.textContent=list.filter(r=>r.ok).length+'/'+list.length+' passed';results.append(summary);
} catch(error) {
  const n=document.createElement('pre');n.className='bad';n.textContent=error.stack;results.append(n);
  const summary=document.createElement('p');summary.className='bad';summary.textContent='0/1 passed';results.append(summary);
}
