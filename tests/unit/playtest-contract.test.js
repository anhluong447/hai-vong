import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('authoring fixtures and reference controls reject malformed input at its source before editor startup',async()=>{
 const original=await projectSource();
 for(const mutate of [source=>source.documents.find(doc=>doc.kind==='playtests').data[0].initial.energy=999,source=>source.documents.find(doc=>doc.kind==='playtests').data[1].checkpoints[0].after=999,source=>source.documents.find(doc=>doc.kind==='playtests').data[0].initial.spawnId='absent',source=>delete source.documents.find(doc=>doc.data?.id==='ui.authoring').data.templates,source=>source.documents.find(doc=>doc.data?.id==='ui.authoring').data.references[0].kind='absent',source=>delete source.documents.find(doc=>doc.kind==='playtests').authoringOnly]){
  const source=structuredClone(original);mutate(source);const result=validateProject(source);assert(!result.ok,'malformed authoring source accepted');assert(result.errors.every(error=>error.sourceId&&error.pointer));
 }
});
