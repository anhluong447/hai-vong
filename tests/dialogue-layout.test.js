import {test,assert as a} from './harness.js';
import {dialogueUi} from '../content/ui/coastal-dialogue-ui.js';
import {validateDialogueLayout} from '../src/shared/validateDialogueLayout.js';
import {ReplicaDialogueDocument} from '../tools/authoring/ReplicaDialogueDocument.js';
import {dialogueLayoutContract} from '../content/ui/coastal-dialogue-layout-data.js';

test('replica authoring: object hierarchy is complete and preserves three-group imports',()=>{
 const ids=new Set(dialogueLayoutContract.regions.map(region=>region.id));a.ok(ids.size>=28);
 for(const region of dialogueLayoutContract.regions){
  const chain=new Set([region.id]);let parent=region.parent;
  while(parent){a.ok(ids.has(parent));a.ok(!chain.has(parent),'Layout hierarchy must be acyclic');chain.add(parent);parent=dialogueLayoutContract.regions.find(item=>item.id===parent).parent;}
 }
 const legacy=Object.fromEntries(['dialogue-panel','dialogue-date','dialogue-choices'].map(id=>[id,structuredClone(dialogueUi.layout[id])]));legacy['dialogue-panel'].x=27;
 const normalized=validateDialogueLayout(legacy);a.equal(normalized['dialogue-panel'].x,27);a.equal(Object.keys(normalized).length,ids.size);a.equal(normalized['dialogue-flowers'].scaleX,1);
 a.throws(()=>validateDialogueLayout({...legacy,'dialogue-date':null}));
 const doc=new ReplicaDialogueDocument(),old=structuredClone(dialogueUi);old.layout=legacy;for(const rule of old.rules.slice(0,3))delete rule.component;
 doc.import(JSON.stringify(old));a.equal(doc.draft.layout['dialogue-panel'].x,27);
 const broken=structuredClone(dialogueUi.layout);delete broken['dialogue-line'];a.throws(()=>validateDialogueLayout(broken));
});

test('replica authoring: SVG group validation rejects invalid imports before replacement',async()=>{
 const cases=await fetch('fixtures/dialogue-layout-validation.json').then(response=>response.json());
 for(const fixture of cases){
  let candidate=structuredClone(dialogueUi.layout);
  if(fixture.path.length===0)candidate=fixture.value;
  else if(fixture.path.length===1)candidate[fixture.path[0]]=fixture.value;
  else candidate[fixture.path[0]][fixture.path[1]]=fixture.value;
  if(fixture.valid)a.ok(validateDialogueLayout(candidate));else a.throws(()=>validateDialogueLayout(candidate));
 }
 for(const value of [NaN,Infinity,-Infinity]){const candidate=structuredClone(dialogueUi.layout);candidate['dialogue-panel'].x=value;a.throws(()=>validateDialogueLayout(candidate));}
 const candidate=structuredClone(dialogueUi.layout),validated=validateDialogueLayout(candidate);validated['dialogue-panel'].x=12;a.equal(candidate['dialogue-panel'].x,0);
});

test('replica authoring: full composition export preserves source metadata and groups drag history',()=>{
 const doc=new ReplicaDialogueDocument();doc.begin();for(let x=1;x<=100;x++)doc.set('dialogue-panel','x',x);doc.commit();a.equal(doc.history.length,1);
 doc.undo();a.equal(doc.draft.layout['dialogue-panel'].x,0);doc.redo();a.equal(doc.draft.layout['dialogue-panel'].x,100);
 doc.begin();doc.set('dialogue-panel','y',17);doc.cancel();a.equal(doc.draft.layout['dialogue-panel'].y,0);
 doc.set('dialogue-date','x',12.125);const restored=new ReplicaDialogueDocument();restored.import(doc.export());a.equal(restored.draft.layout['dialogue-date'].x,12.13);
 for(const key of Object.keys(dialogueUi).filter(key=>key!=='layout'))a.equal(JSON.stringify(restored.draft[key]),JSON.stringify(dialogueUi[key]),key);
 const before=restored.export();a.throws(()=>restored.import(JSON.stringify({...restored.draft,layerOrder:[]})));a.equal(restored.export(),before);
 restored.reset('dialogue-panel');a.equal(restored.draft.layout['dialogue-panel'].x,0);restored.undo();a.equal(restored.draft.layout['dialogue-panel'].x,100);
});
