import {test,assert,runAll} from './harness.js';
import {decode,digest,compareMasked} from '../tools/reference-comparison.js';
import {dialogueUi,dialogueUiManifest} from '../content/ui/coastal-dialogue-ui.js';

const frame=document.getElementById('pilot'),results=document.getElementById('results');
async function rejects(action,pattern) {
  try {await action();} catch(error) {assert.ok(pattern.test(error.message),error.message);return;}
  throw new Error('Expected rejection');
}
function surface(width=4,height=4,color='#000') {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');context.fillStyle=color;context.fillRect(0,0,width,height);return canvas;
}
try {
  await new Promise(resolve=>{if(frame.contentWindow.replicaPreview)resolve();else frame.addEventListener('load',resolve,{once:true});});
  const win=frame.contentWindow,doc=frame.contentDocument,{stage,ready}=win.replicaPreview;await ready;
  const fixture=await (await fetch('../docs/ui-specs/coastal-replica/fixtures.json')).json();
  const supplement=await (await fetch('../docs/ui-specs/coastal-replica/dialogue-production.json')).json();
  const request={screen:'dialogue',capture:fixture.capture,fixture:fixture.screens.dialogue,catalog:{...fixture.catalog,...supplement.catalog}};
  const actions=[];stage.onAction=action=>actions.push(action);
  const press=(node,key)=>node.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const clickNative=(x,y)=>{
    const point=new win.DOMPoint(x,y).matrixTransform(stage.svg.getScreenCTM());
    const target=doc.elementFromPoint(point.x,point.y);assert.ok(target,'Native target outside iframe');
    target.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));return target;
  };
  test('UI manifest separates fourteen assets from a replaceable context plate',()=>{
    assert.equal(stage.manifest.version,3);assert.equal(stage.manifest.assets.length,14);
    assert.ok(stage.manifest.assets.every(asset=>asset.scope==='ui'));
    assert.equal(stage.manifest.contextAssets.length,1);
    assert.ok(!stage.svg.querySelector('[data-region="khue"], [data-region="van"], [data-region="desk"]'));
    assert.ok([...stage.svg.querySelectorAll('image')].every(node=>!node.href.baseVal.includes('ui-concepts')));
  });
  test('UI exports decode at native dimensions and match their recorded hashes',async()=>{
    for(const asset of stage.assets.values()) {
      assert.equal(await digest(await (await fetch(asset.url)).blob()),asset.sha256);
      assert.equal(asset.image.naturalWidth,asset.size[0]);assert.equal(asset.image.naturalHeight,asset.size[1]);
    }
  });
  test('Component shadows stay local; live type and context never inherit a filter',()=>{
    assert.equal(stage.svg.querySelectorAll('filter').length,5);
    assert.ok(!stage.svg.hasAttribute('filter'));
    assert.ok([...stage.svg.querySelectorAll('text,[data-context]')].every(node=>!node.closest('[filter]')));
    assert.ok([...stage.svg.querySelectorAll('filter')].every(node=>node.getAttribute('color-interpolation-filters')==='sRGB'));
  });
  test('Notebook edge and PNG receive one union shadow; wash follows native alpha',()=>{
    const union=stage.svg.querySelector('[data-ui-component="notebook"][filter]');
    assert.equal(union.querySelectorAll('image').length,2);assert.equal(union.querySelectorAll('[filter]').length,0);
    const wash=stage.svg.querySelector('[data-ui-light="notebook-wash"]');
    assert.ok(wash.getAttribute('mask'));
    const mask=stage.svg.querySelector('mask');assert.equal(mask.style.maskType,'alpha');assert.equal(mask.querySelectorAll('image').length,2);
    assert.ok(stage.svg.querySelector('[data-region="paper-harbor"]').getAttribute('clip-path'));
  });
  test('Lighting A/B preserves selection, copy, native typography and click geometry',()=>{
    stage.choose('draft');const before=JSON.stringify(stage.measureTypography());
    stage.setPresentation({lighting:false});
    assert.equal(stage.selectedChoice,'draft');assert.equal(JSON.stringify(stage.measureTypography()),before);
    assert.equal(stage.svg.querySelectorAll('[filter]').length,0);assert.equal(stage.svg.querySelectorAll('[data-ui-light]').length,0);
    assert.equal(clickNative(607,559).closest('[data-choice-id]').dataset.choiceId,'draft');
    stage.setPresentation({lighting:true});assert.ok(stage.svg.querySelectorAll('[filter]').length>=4);
  });
  test('Bright, dark, patterned and scene contexts preserve the exact UI markup',()=>{
    const signature=()=>[...stage.groups].filter(([id])=>id!=='scene').map(([,node])=>node.outerHTML).join('');
    stage.setView('ui-dark');const ui=signature();
    for(const view of ['ui-light','ui-detail','stage']) {stage.setView(view);assert.equal(signature(),ui);}
    assert.equal(stage.svg.querySelector('[data-context] image').dataset.assetId,'context.newsroom');
    stage.setView('ui-dark');
  });
  test('Logo mark and catalog wordmark remain reusable and explicitly optional',()=>{
    assert.ok(!stage.svg.querySelector('[data-region="brand-mark"]'));
    stage.setPresentation({logo:true});assert.ok(stage.svg.querySelector('[data-region="brand-mark"]'));
    assert.equal(stage.svg.querySelector('text[data-text-key="ui.replica.dialogue.brand.1"]').textContent,request.catalog['ui.replica.dialogue.brand.1']);
    stage.setPresentation({logo:false});assert.ok(!stage.svg.querySelector('text[data-text-key="ui.replica.dialogue.brand.1"]'));
  });
  test('All UI copy stays catalog-backed with loaded fonts and native bounds',()=>{
    for(const copy of [...dialogueUi.text,...dialogueUi.environmentText].filter(item=>!item.optionalLogo)) {
      assert.equal(stage.svg.querySelector(`text[data-region="${copy.id}"]`).textContent,request.catalog[copy.key].replaceAll('\n',''));
    }
    for(const item of stage.measureTypography()) {
      const [x,y,w,h]=item.bounds;assert.ok(x>=0&&y>=0&&x+w<=1672&&y+h<=941,item.key);
    }
    for(const family of ['Source Serif 4','Cormorant Garamond','Dancing Script']) assert.ok([...doc.fonts].some(face=>face.status==='loaded'&&face.family.replaceAll('"','')===family));
  });
  test('Shadows and alpha decorations cannot intercept continue or scaled choices',()=>{
    const before=actions.length;assert.ok(clickNative(1260,889).closest('.continue'));
    assert.equal(actions.length,before+1);assert.equal(actions.at(-1).type,'continue');
    const host=doc.getElementById('pilot');
    for(const [width,height] of [[1000,370],[650,450]]) {
      host.style.width=width+'px';host.style.height=height+'px';
      assert.near(stage.svg.getScreenCTM().a,stage.svg.getScreenCTM().d);
      assert.equal(clickNative(607,626).closest('[data-choice-id]').dataset.choiceId,'listen');
    }
    host.style.width='';host.style.height='';
  });
  test('Keyboard selection retains focus and fires callbacks exactly once',()=>{
    const first=stage.svg.querySelector('[data-choice-id="verify"]');first.focus();press(first,'ArrowDown');press(doc.activeElement,'ArrowDown');
    const before=actions.length;press(doc.activeElement,' ');assert.equal(actions.length,before+1);
    assert.equal(stage.selectedChoice,'listen');assert.equal(doc.activeElement.dataset.choiceId,'listen');
    press(stage.svg.querySelector('.continue'),'Enter');assert.equal(actions.at(-1).type,'continue');
  });
  test('Local clip, shadow, gradient and alpha-mask IDs cannot collide across instances',async()=>{
    const host=doc.createElement('div');doc.body.append(host);
    const other=new stage.constructor(host,{scene:dialogueUi});await other.load(new URL('../'+dialogueUiManifest,location.href));
    const ids=[...doc.querySelectorAll('defs [id]')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length);
    other.dispose();host.remove();
  });
  test('UI mask hash and size are fixed and uncertainty is explicitly recorded',async()=>{
    const record=stage.manifest.comparisonMask,blob=await (await fetch('../'+record.file)).blob();
    assert.equal(await digest(blob),record.sha256);const mask=await decode(blob);
    assert.equal(mask.width,1672);assert.equal(mask.height,941);
    const result=compareMasked(mask,mask,mask,1672,941).report;
    assert.ok(result.coverage>0.2&&result.coverage<0.4);assert.equal(result.changedPixels,0);assert.ok(record.uncertainty);
  });
  test('Masked comparison ignores context pixels and exposes UI changes',()=>{
    const a=surface(),b=surface(),mask=surface(4,4,'transparent');
    mask.getContext('2d').fillStyle='white';mask.getContext('2d').fillRect(0,0,1,1);
    b.getContext('2d').fillStyle='white';b.getContext('2d').fillRect(1,0,3,4);
    assert.equal(compareMasked(a,b,mask,4,4).report.changedPixels,0);
    b.getContext('2d').fillRect(0,0,1,1);const result=compareMasked(a,b,mask,4,4);
    assert.equal(result.report.selectedPixels,1);assert.equal(result.report.meanAbsoluteErrorRGBA,191.25);
    assert.equal(result.difference.getContext('2d').getImageData(1,0,1,1).data[3],0);
  });
  test('Alpha-only UI errors stay visible; empty and wrong-sized masks fail',async()=>{
    const a=surface(),b=surface(),mask=surface(4,4,'white');b.getContext('2d').clearRect(0,0,1,1);
    const result=compareMasked(a,b,mask,4,4);assert.equal(result.report.changedPixels,1);
    assert.equal(result.difference.getContext('2d').getImageData(0,0,1,1).data[0],255);
    await rejects(()=>compareMasked(a,b,surface(4,4,'transparent'),4,4),/empty/);
    await rejects(()=>compareMasked(a,b,surface(3,4),4,4),/size/);
  });
  test('Invalid presentation and capture requests cannot partially mutate state',async()=>{
    await rejects(()=>stage.setPresentation({lighting:false,logo:'invalid'}),/Invalid/);assert.equal(stage.lightingEnabled,true);
    await rejects(()=>win.replicaCapture.prepare({...request,variant:'unknown'}),/Unsupported/);
    await rejects(()=>win.replicaCapture.prepare({...request,lighting:'false'}),/Invalid/);
    await rejects(()=>win.replicaCapture.prepare({...request,catalog:{...request.catalog,'ui.replica.dialogue.foreground_note.1':'invalid'}}),/text differs/);
    assert.equal(stage.captureLocked,false);assert.equal(stage.selectedChoice,'listen');
  });
  test('Static capture resets light/logo/choice/layers and disables all callbacks',async()=>{
    stage.setPresentation({lighting:false,logo:true});stage.setLayer('foreground');
    const state=await win.replicaCapture.prepare({...request,variant:'ui-dark'});
    assert.equal(state.scope,'fixed-ui');assert.equal(state.assets.length,14);assert.equal(state.lighting,true);assert.equal(state.logo,false);
    assert.equal(state.selectedChoice,'verify');assert.equal(stage.layer,'');assert.equal(state.motionTimeMs,0);assert.equal(state.randomSeed,0);
    const before=actions.length;stage.choose('draft');press(stage.svg.querySelector('.continue'),'Enter');assert.equal(actions.length,before);
  });
  test('Inspection and disposal leave no active SVG or late action path',()=>{
    for(const view of ['material-light','material-dark','typography','ui-dark']) {stage.setView(view);assert.ok(stage.svg);}
    const before=actions.length;stage.dispose();stage.setPresentation({lighting:false});stage.choose('draft');
    assert.equal(actions.length,before);assert.equal(doc.querySelectorAll('.replica-stage').length,0);
  });
  const list=await runAll();
  for(const result of list){const node=document.createElement('pre');node.className=result.ok?'ok':'bad';node.textContent=result.name+(result.ok?'':': '+result.error);results.append(node);}
  const summary=document.createElement('p');summary.className=list.every(r=>r.ok)?'ok':'bad';summary.textContent=list.filter(r=>r.ok).length+'/'+list.length+' passed';results.append(summary);
} catch(error) {
  const node=document.createElement('pre');node.className='bad';node.textContent=error.stack;results.append(node);
  const summary=document.createElement('p');summary.className='bad';summary.textContent='0/1 passed';results.append(summary);
}
