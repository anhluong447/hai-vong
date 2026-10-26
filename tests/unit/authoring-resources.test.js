import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
const sources=await projectSource();
test('asset recipe and cue edits must be consumable by the pipeline and actual audio buses',()=>{
 const cases=[
  source=>source.documents.find(doc=>doc.data?.kind==='asset-imports').data.entries[0].source='assets/sources/../outside.png',
  source=>source.documents.find(doc=>doc.data?.kind==='asset-imports').data.entries[0].license='unknown',
  source=>source.documents.find(doc=>doc.data?.kind==='asset-imports').data.atlases[0].members=['audio.fixture.tone'],
  source=>source.documents.find(doc=>doc.data?.kind==='asset-imports').data.entries[4].sampleRate=undefined,
  source=>{const spec=source.documents.find(doc=>doc.data?.kind==='asset-imports').data;spec.entries[0].dependencies=[spec.entries[1].id];spec.entries[1].dependencies=[spec.entries[0].id];},
  source=>source.documents.find(doc=>doc.kind==='audio').data[0].bus='unknown-bus'
 ];
 for(const mutate of cases){const source=structuredClone(sources);mutate(source);assert(!validateProject(source).ok,'unconsumable resource edit was accepted');}
});

test('animation preview sampling is validated before the editor consumes it',()=>{
 for(const sampling of ['pixel','smooth','blurred']){
  const source=structuredClone(sources),doc=source.documents.find(item=>item.data?.kind==='authoring-ui');doc.data.preview.actorSampling=sampling;
  const checked=validateProject(source);
  if(sampling==='blurred')assert(!checked.ok&&checked.errors.some(error=>error.sourceId===doc.sourceId&&error.pointer==='/preview/actorSampling'),'unknown preview sampling was accepted');
  else assert(checked.ok,JSON.stringify(checked));
 }
});

test('image crop resize and padded canvas are shared authoring contracts',()=>{
 const source=structuredClone(sources),spec=source.documents.find(doc=>doc.data?.kind==='asset-imports').data;
 Object.assign(spec.entries[0],{crop:{x:0,y:0,width:20,height:30},resize:{width:12,height:18,sampling:'pixel'},canvas:{width:20,height:24,x:4,y:3}});
 assert(validateProject(source).ok,'valid native image recipe was rejected');
 for(const mutate of [entry=>entry.crop.x=-1,entry=>entry.resize.width=0,entry=>entry.resize.sampling='unknown',entry=>entry.canvas.x=19]){
  const candidate=structuredClone(source);mutate(candidate.documents.find(doc=>doc.data?.kind==='asset-imports').data.entries[0]);
  assert(!validateProject(candidate).ok,'invalid rendition recipe was accepted');
 }
 const audio=structuredClone(source),entries=audio.documents.find(doc=>doc.data?.kind==='asset-imports').data.entries;
 entries.find(entry=>entry.kind==='audio').crop={x:0,y:0,width:1,height:1};
 assert(!validateProject(audio).ok,'image crop must not apply to audio');
});
