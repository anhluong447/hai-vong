import {test,assert,runAll} from './harness.js';
import {decode} from '../tools/reference-comparison.js';
import {ReplicaStage} from '../src/ui/replica/ReplicaStage.js';
import {dialoguePilot,replicaAssetManifest} from '../content/ui/coastal-replica.js';

const frame = document.getElementById('pilot');
const results = document.getElementById('results');
const reject = async (action,pattern) => {
  try { await action(); } catch(error) { assert.ok(pattern.test(error.message),error.message); return; }
  throw new Error('Expected rejection');
};
try {
  await new Promise(resolve => {
    if (frame.contentWindow.replicaPreview) resolve();
    else frame.addEventListener('load',resolve,{once:true});
  });
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  const {stage,ready} = win.replicaPreview;
  await ready;
  const fixtures = await (await fetch('../docs/ui-specs/coastal-replica/fixtures.json')).json();
  const request = {screen:'dialogue',capture:fixtures.capture,fixture:fixtures.screens.dialogue,catalog:fixtures.catalog};
  const key = (node,value) => node.dispatchEvent(new win.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));

  test('Seven art planes remain independently inspectable; full-screen plate has no choices/text',() => {
    assert.equal([...stage.svg.querySelectorAll(':scope > g[data-layer]')].map(g=>g.dataset.layer).join(','),'scene,portraits,wave,paper,print,text,foreground');
    assert.equal(stage.groups.get('scene').querySelectorAll('[role="button"],text').length,0);
    assert.equal(stage.groups.get('portraits').querySelectorAll('[data-asset-id^="pilot."]').length,3);
    assert.ok([...stage.svg.querySelectorAll('image')].every(node=>!node.href.baseVal.includes('ui-concepts')));
  });
  test('Text is live catalog content and fits native reading/choice regions',() => {
    for (const node of stage.svg.querySelectorAll('[data-text-key]')) assert.equal(node.textContent,fixtures.catalog[node.dataset.textKey]);
    for (const measurement of stage.measureTypography()) {
      const [x,y,w,h] = measurement.bounds;
      assert.ok(x>=0 && y>=0 && x+w<=1672 && y+h<=941,measurement.key);
      const choice = dialoguePilot.choices.find(item=>item.id===measurement.region);
      if (choice) assert.ok(x+w<choice.bounds[0]+choice.bounds[2]-35,'Choice overlaps arrow');
    }
  });
  test('Uniform hit testing and actual pointer targets agree at two letterboxed scales',() => {
    const host = doc.getElementById('pilot');
    for (const [width,height] of [[950,320],[610,420]]) {
      host.style.width=width+'px'; host.style.height=height+'px';
      const matrix = stage.svg.getScreenCTM();
      assert.near(matrix.a,matrix.d);
      const choice = dialoguePilot.choices[1];
      const point = new win.DOMPoint(choice.bounds[0]+120,choice.bounds[1]+30).matrixTransform(matrix);
      assert.equal(stage.hitTest(point.x,point.y),choice.id);
      const target = doc.elementFromPoint(point.x,point.y);
      assert.equal(target?.closest('[data-choice-id]')?.dataset.choiceId,choice.id);
      target.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));
      assert.equal(stage.selectedChoice,choice.id);
      const outside = new win.DOMPoint(-2,550).matrixTransform(stage.svg.getScreenCTM());
      assert.equal(stage.hitTest(outside.x,outside.y),null);
    }
    host.style.width='';host.style.height='';
  });
  test('Keyboard navigation, activation, ARIA and focus survive rendering',() => {
    const first = stage.svg.querySelector('[data-choice-id="verify"]'); first.focus();key(first,'ArrowDown');
    assert.equal(doc.activeElement.dataset.choiceId,'draft');key(doc.activeElement,'ArrowDown');
    assert.equal(doc.activeElement.dataset.choiceId,'listen');key(doc.activeElement,'Enter');
    assert.equal(stage.selectedChoice,'listen');assert.equal(doc.activeElement.dataset.choiceId,'listen');
    assert.equal(doc.activeElement.getAttribute('aria-pressed'),'true');
    key(doc.activeElement,'ArrowDown');key(doc.activeElement,' ');assert.equal(stage.selectedChoice,'verify');
  });
  test('Layer isolation preserves text, native placement and selection',() => {
    const before = JSON.stringify(stage.measureTypography());stage.setLayer('text');
    assert.ok([...stage.groups].every(([id,g])=>g.style.display===(id==='text'?'':'none')));
    stage.setLayer('');assert.equal(JSON.stringify(stage.measureTypography()),before);
    assert.equal(stage.selectedChoice,'verify');
  });
  test('All three local licensed font faces are loaded without missing Vietnamese coverage',() => {
    const families = [...doc.fonts].filter(face=>face.status==='loaded').map(face=>face.family.replaceAll('"',''));
    for (const family of ['Source Serif 4','Cormorant Garamond','Dancing Script']) assert.ok(families.includes(family));
    assert.ok(stage.manifest.fonts.every(font=>font.missing.length===0 && font.vietnameseCodepointsChecked>=100));
  });
  test('Paper alpha leaves the scene visible above its authored edge',async () => {
    const asset = stage.assets.get('material.dialogue-paper');
    const image = await decode(await (await fetch(asset.url)).blob());
    const context = image.getContext('2d');
    assert.equal(context.getImageData(20,0,1,1).data[3],0);
    assert.equal(context.getImageData(20,330,1,1).data[3],255);
  });
  test('Typography board uses the same catalog/local faces and preserves Vietnamese glyph lines',() => {
    stage.setView('typography');
    assert.equal(stage.svg.querySelectorAll('[data-glyph-probe]').length,4);
    assert.ok([...stage.svg.querySelectorAll('[data-glyph-probe]')].every(n=>win.getComputedStyle(n).fontFamily.includes('Source Serif')));
    assert.ok(stage.measureTypography().every(m=>m.bounds[0]+m.bounds[2]<=1672));stage.setView('stage');
  });
  test('Separate stage instances never share clipping IDs',async () => {
    // A second instance uses the iframe owner document's loaded fonts.
    const host = doc.createElement('div');doc.body.append(host);
    const other = new stage.constructor(host);await other.load(new URL('../'+replicaAssetManifest,location.href));
    assert.ok(other.deskClipId!==stage.deskClipId);
    const ids = [...doc.querySelectorAll('clipPath')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
    other.dispose();host.remove();
  });
  test('Capture rejects inconsistent text and unsupported animation states',async () => {
    await reject(()=>win.replicaCapture.prepare({...request,catalog:{...request.catalog,[dialoguePilot.text[0].key]:'invalid'}}),/text differs/);
    await reject(()=>win.replicaCapture.prepare({...request,capture:{...request.capture,motionTimeMs:10}}),/Unsupported/);
  });
  test('Capture resets inspection/choice state, awaits resources and freezes interaction',async () => {
    stage.choose('draft');stage.setLayer('wave');
    const state = await win.replicaCapture.prepare(request);
    assert.equal(state.ready,true);assert.equal(state.selectedChoice,'verify');assert.equal(stage.layer,'');
    assert.equal(state.assets.length,15);assert.equal(doc.documentElement.dataset.captureReady,'true');
    stage.svg.querySelector('[data-choice-id="draft"]').dispatchEvent(new win.MouseEvent('click',{bubbles:true}));
    assert.equal(stage.selectedChoice,'verify');
    assert.ok([...stage.svg.querySelectorAll('[role="button"]')].every(n=>n.getAttribute('aria-disabled')==='true'));
  });
  test('Disposal aborts an in-flight load and prevents rendering or action callbacks',async () => {
    let actions=0;
    const unloaded = new ReplicaStage(document.createElement('div'),{onAction:()=>actions++});
    const pending = unloaded.load(new URL('../'+replicaAssetManifest,location.href));
    unloaded.dispose();unloaded.choose('verify');assert.equal(actions,0);
    await reject(()=>pending,/abort/i);
    assert.equal(unloaded.host.children.length,0);assert.equal(unloaded.assets.size,0);
    stage.dispose();assert.equal(doc.querySelectorAll('.replica-stage').length,0);
  });
  const list = await runAll();
  for (const result of list) {
    const node = document.createElement('pre');node.className=result.ok?'ok':'bad';
    node.textContent=result.name+(result.ok?'':': '+result.error);results.append(node);
  }
  const summary = document.createElement('p');summary.className=list.every(r=>r.ok)?'ok':'bad';
  summary.textContent=list.filter(r=>r.ok).length+'/'+list.length+' passed';results.append(summary);
} catch(error) {
  const node=document.createElement('pre');node.className='bad';node.textContent=error.stack;results.append(node);
  const summary=document.createElement('p');summary.className='bad';summary.textContent='0/1 passed';results.append(summary);
}
