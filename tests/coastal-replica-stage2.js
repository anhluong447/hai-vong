import {test,assert,runAll} from './harness.js';
import {decode,digest} from '../tools/reference-comparison.js';
import {dialogueReplica,dialogueAssetManifest} from '../content/ui/coastal-dialogue.js';

const frame=document.getElementById('pilot'),results=document.getElementById('results');
async function rejection(action,pattern) {
  try {await action();} catch(error) {assert.ok(pattern.test(error.message),error.message);return;}
  throw new Error('Expected rejection');
}
try {
  await new Promise(resolve=>{if(frame.contentWindow.replicaPreview)resolve();else frame.addEventListener('load',resolve,{once:true});});
  const win=frame.contentWindow,doc=frame.contentDocument;
  const {stage,ready}=win.replicaPreview;await ready;
  const fixture=await (await fetch('../docs/ui-specs/coastal-replica/fixtures.json')).json();
  const supplement=await (await fetch('../docs/ui-specs/coastal-replica/dialogue-production.json')).json();
  const layout=await (await fetch('../docs/ui-specs/coastal-replica/layouts.json')).json();
  const request={screen:'dialogue',capture:fixture.capture,fixture:fixture.screens.dialogue,catalog:{...fixture.catalog,...supplement.catalog}};
  const actions=[];stage.onAction=action=>actions.push(action);
  const press=(node,key)=>node.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const clickNative=(x,y)=>{
    const point=new win.DOMPoint(x,y).matrixTransform(stage.svg.getScreenCTM());
    const target=doc.elementFromPoint(point.x,point.y);
    assert.ok(target,'Native target outside visible iframe');
    target.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));return target;
  };
  test('Stage 2 has independent art, live copy and genuine controls in seven planes',()=>{
    assert.equal([...stage.groups.keys()].join(','),'scene,portraits,wave,paper,print,text,foreground');
    assert.ok(stage.svg.querySelector('[data-region="khue"] image'));
    assert.ok(stage.svg.querySelector('[data-region="van"] image'));
    assert.equal(stage.svg.querySelectorAll('[data-choice-id]').length,3);
    assert.ok([...stage.svg.querySelectorAll('image')].every(node=>!node.href.baseVal.includes('ui-concepts')));
    assert.equal(stage.manifest.version,2);
  });
  test('Rendered art matches native exports and recorded SHA-256, including alpha PNGs',async()=>{
    for(const asset of stage.assets.values()) {
      const response=await fetch(asset.url);assert.ok(response.ok);
      assert.equal(await digest(await response.blob()),asset.sha256);
      assert.equal(asset.image.naturalWidth,asset.size[0]);
      assert.equal(asset.image.naturalHeight,asset.size[1]);
    }
  });
  test('Portrait registration preserves aspect ratio instead of stretching faces',()=>{
    for(const id of ['khue','van']) {
      const item=dialogueReplica.art.find(art=>art.id===id),asset=stage.assets.get(item.asset);
      assert.near(item.bounds[2]/asset.size[0],item.bounds[3]/asset.size[1]);
      assert.equal(stage.svg.querySelector(`[data-region="${id}"] image`).style.filter,'');
    }
  });
  test('Chalkboard/poster, newspaper, cup and foreground handwriting stay catalog-backed',()=>{
    for(const region of dialogueReplica.environmentText) {
      const node=stage.svg.querySelector(`text[data-region="${region.id}"]`);
      assert.ok(node,region.id);
      assert.equal(node.textContent,request.catalog[region.key].replaceAll('\n',''));
      if(region.lineHeight) assert.equal(node.querySelectorAll('tspan').length,request.catalog[region.key].split('\n').length);
    }
  });
  test('Paper alpha follows independently measured native reference anchors within 2 pixels',async()=>{
    const blob=await (await fetch(stage.assets.get('material.dialogue-paper').url)).blob();
    const image=await decode(blob),context=image.getContext('2d');
    const anchors=layout.screens.find(s=>s.id==='dialogue').contours.find(c=>c.id==='paper-top').points;
    for(const [x,y] of anchors) {
      const column=context.getImageData(x,0,1,image.height).data;
      let edge=0;while(edge<image.height&&column[edge*4+3]<128)edge++;
      assert.near(edge+dialogueReplica.paperBounds[1],y,2);
    }
  });
  test('Desk and paper masks are distinct; ink has a separate plane above paper',()=>{
    const masks=[...stage.svg.querySelectorAll('clipPath')];assert.equal(masks.length,2);
    assert.ok(masks.every(mask=>mask.getAttribute('clipPathUnits')==='userSpaceOnUse'));
    assert.ok(stage.svg.querySelector('[data-region="desk"]').getAttribute('clip-path'));
    assert.ok(stage.svg.querySelector('[data-region="paper-harbor"]').getAttribute('clip-path'));
    assert.ok(stage.groups.get('print').querySelector('[data-region="shore-ink"]'));
    assert.ok(stage.groups.get('paper').compareDocumentPosition(stage.groups.get('print'))&win.Node.DOCUMENT_POSITION_FOLLOWING);
  });
  test('All visible copy has native transformed bounds and fully loaded local font faces',()=>{
    const measures=stage.measureTypography();
    for(const item of measures) {
      const [x,y,width,height]=item.bounds;
      assert.ok(x>=0&&y>=0&&x+width<=1672&&y+height<=941,item.key);
    }
    const note=measures.find(item=>item.region==='foreground-note-copy');assert.ok(note.bounds[0]>1400);
    const families=[...doc.fonts].filter(face=>face.status==='loaded').map(face=>face.family.replaceAll('"',''));
    for(const family of ['Source Serif 4','Cormorant Garamond','Dancing Script','Be Vietnam Pro'])assert.ok(families.includes(family));
  });
  test('Transparent foliage and print art never steal pointer input from continue',()=>{
    const before=actions.length;
    const target=clickNative(1260,889);assert.ok(target.closest('.continue'));
    assert.equal(actions.length,before+1);assert.equal(actions.at(-1).type,'continue');
  });
  test('Choice hitboxes and real click targets agree at two letterboxed sizes',()=>{
    const host=doc.getElementById('pilot');
    for(const [width,height] of [[1000,370],[650,450]]) {
      host.style.width=width+'px';host.style.height=height+'px';
      const matrix=stage.svg.getScreenCTM();assert.near(matrix.a,matrix.d);
      const choice=dialogueReplica.choices[1],[x,y]=choice.bounds;
      const point=new win.DOMPoint(x+120,y+25).matrixTransform(matrix);
      assert.equal(stage.hitTest(point.x,point.y),choice.id);
      assert.equal(clickNative(x+120,y+25).closest('[data-choice-id]').dataset.choiceId,choice.id);
      assert.equal(stage.selectedChoice,choice.id);
      const outside=new win.DOMPoint(-1,y).matrixTransform(stage.svg.getScreenCTM());assert.equal(stage.hitTest(outside.x,outside.y),null);
    }
    host.style.width='';host.style.height='';
  });
  test('Keyboard choice/continue actions fire once and restore focus across art re-render',()=>{
    const first=stage.svg.querySelector('[data-choice-id="verify"]');first.focus();press(first,'ArrowDown');press(doc.activeElement,'ArrowDown');
    const before=actions.length;press(doc.activeElement,' ');assert.equal(actions.length,before+1);
    assert.equal(stage.selectedChoice,'listen');assert.equal(doc.activeElement.dataset.choiceId,'listen');
    const next=stage.svg.querySelector('.continue');next.focus();press(next,'Enter');assert.equal(actions.at(-1).type,'continue');
  });
  test('Layer inspection preserves scene and selection; transformed masks do not collide across stages',async()=>{
    stage.setLayer('foreground');assert.equal(stage.selectedChoice,'listen');
    assert.ok([...stage.groups].every(([id,node])=>node.style.display===(id==='foreground'?'':'none')));stage.setLayer('');
    const host=doc.createElement('div');doc.body.append(host);
    const other=new stage.constructor(host,{scene:dialogueReplica});await other.load(new URL('../'+dialogueAssetManifest,location.href));
    const ids=[...doc.querySelectorAll('clipPath')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length);
    other.dispose();host.remove();
  });
  test('Unsupported capture text/view fails before mutating input or selection',async()=>{
    await rejection(()=>win.replicaCapture.prepare({...request,catalog:{...request.catalog,'ui.replica.dialogue.foreground_note.1':'invalid'}}),/text differs/);
    await rejection(()=>win.replicaCapture.prepare({...request,variant:'invalid'}),/Unsupported/);
    assert.equal(stage.selectedChoice,'listen');assert.equal(stage.captureLocked,false);
  });
  test('Native capture resets state, waits on all assets/fonts and blocks action callbacks',async()=>{
    const state=await win.replicaCapture.prepare(request);
    assert.equal(state.kind,'stage2-dialogue-reconstruction');assert.equal(state.selectedChoice,'verify');
    assert.equal(state.assets.length,19);assert.equal(state.motionTimeMs,0);assert.equal(state.randomSeed,0);
    assert.equal(state.typography.find(item=>item.region==='foreground-note-copy').copy,request.catalog['ui.replica.dialogue.foreground_note.1'].replaceAll('\n',''));
    const before=actions.length;stage.choose('draft');press(stage.svg.querySelector('.continue'),'Enter');assert.equal(actions.length,before);
  });
  test('Art/foreground views keep all resources independent; disposal prevents further actions',()=>{
    stage.setView('props');assert.ok(stage.svg.querySelector('[data-asset-id="dialogue.foreground-right"]'));
    stage.setView('stage');const before=actions.length;stage.dispose();stage.choose('draft');assert.equal(actions.length,before);
    assert.equal(doc.querySelectorAll('.replica-stage').length,0);
  });
  const list=await runAll();
  for(const result of list){const node=document.createElement('pre');node.className=result.ok?'ok':'bad';node.textContent=result.name+(result.ok?'':': '+result.error);results.append(node);}
  const summary=document.createElement('p');summary.className=list.every(r=>r.ok)?'ok':'bad';summary.textContent=list.filter(r=>r.ok).length+'/'+list.length+' passed';results.append(summary);
} catch(error) {
  const node=document.createElement('pre');node.className='bad';node.textContent=error.stack;results.append(node);
  const summary=document.createElement('p');summary.className='bad';summary.textContent='0/1 passed';results.append(summary);
}
