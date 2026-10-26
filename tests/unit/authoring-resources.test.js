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
