import {test,assert,runAll} from './harness.js';
const frame=document.getElementById('pilot'),results=document.getElementById('results');
try {
  await new Promise(resolve=>{if(frame.contentWindow.replicaPreview)resolve();else frame.addEventListener('load',resolve,{once:true});});
  const win=frame.contentWindow,{stage,ready}=win.replicaPreview;await ready;
  const motion=stage.motion,actions=[];stage.onAction=action=>actions.push(action);
  test('OS reduced-motion preference is applied automatically with no animation frame',()=>{
    assert.equal(win.matchMedia('(prefers-reduced-motion: reduce)').matches,true);
    assert.equal(motion.reduced,true);assert.equal(motion.handle,null);assert.equal(motion.progress,1);
    assert.equal(stage.svg.dataset.motion,'reduced');
  });
  test('Replay and exit settle instantly without ambient or sheen motion',()=>{
    motion.setVisible(false);assert.equal(motion.progress,0);motion.setVisible(true,{replay:true});assert.equal(motion.progress,1);
    assert.equal(stage.svg.querySelector('[data-motion-wave]').getAttribute('transform'),'translate(0 0)');
    assert.equal(stage.svg.querySelector('[data-motion-flow]').style.opacity,'0');assert.equal(stage.svg.querySelector('[data-motion-sheen]').style.opacity,'0');
    const time=motion.timeMs;motion.advance(1000);assert.equal(motion.timeMs,time);
  });
  test('Choice and continue still activate immediately using keyboard',()=>{
    const press=node=>node.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    press(stage.svg.querySelector('[data-choice-id="draft"]'));assert.equal(stage.selectedChoice,'draft');
    assert.equal(actions.length,1);press(stage.svg.querySelector('.continue'));assert.equal(actions.length,2);assert.equal(actions.at(-1).type,'continue');
  });
  test('Re-render, presentation toggles and cleanup never restart motion',()=>{
    stage.setPresentation({lighting:false,logo:true});stage.setView('ui-light');assert.equal(motion.handle,null);assert.equal(motion.reduced,true);
    motion.setEnabled(false);motion.setEnabled(true);assert.equal(motion.handle,null);stage.dispose();assert.equal(motion.handle,null);
  });
  const list=await runAll();
  for(const result of list){const n=document.createElement('pre');n.className=result.ok?'ok':'bad';n.textContent=result.name+(result.ok?'':': '+result.error);results.append(n);}
  const summary=document.createElement('p');summary.className=list.every(r=>r.ok)?'ok':'bad';summary.textContent=list.filter(r=>r.ok).length+'/'+list.length+' passed';results.append(summary);
} catch(error){const n=document.createElement('p');n.className='bad';n.textContent='0/1 passed';results.append(n);const detail=document.createElement('pre');detail.textContent=error.stack;results.append(detail);}
