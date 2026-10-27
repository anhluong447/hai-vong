import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('authoring creation templates cannot omit a required default',async()=>{
 for(const key of ['camera','actorShadow','beam','dust','footstepCueIds']){
  const source=await projectSource(),doc=source.documents.find(d=>d.data?.kind==='authoring-ui');delete doc.data.templates[key];const result=validateProject(source);assert(!result.ok,'missing template accepted: '+key);assert(result.errors.some(e=>e.pointer==='/templates/'+key));
 }
});
test('new authoring defaults are checked before controls can create invalid resource payloads',async()=>{
 for(const mutate of [t=>t.camera.followResponse60=2,t=>t.dust.count=21,t=>t.beam.opacity=-1,t=>t.actorShadow.assetId='missing',t=>t.shadow.assetId='missing',t=>t.prop.assetId='missing']){
  const source=await projectSource(),doc=source.documents.find(d=>d.data?.kind==='authoring-ui');mutate(doc.data.templates);const result=validateProject(source);assert(!result.ok,'bad default accepted');assert(result.errors.some(e=>e.sourceId===doc.sourceId&&e.pointer.startsWith('/templates/')));
 }
});
