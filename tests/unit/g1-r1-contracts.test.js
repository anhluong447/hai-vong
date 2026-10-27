import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
const shadow=()=>({assetId:'image.fixture.scene',x:0,y:0,width:10,height:3,opacity:.3});
async function fixture(){const source=await projectSource(),doc=source.documents.find(d=>d.kind==='scenes'),scene=doc.data[0];scene.props=[{id:'desk',assetId:'image.fixture.scene',x:350,y:420,width:270,height:64,pivot:{x:0,y:64},sortY:421,order:0,sampling:'pixel',shadows:[shadow()]}];scene.presentationId='presentation.test';source.documents.push({kind:'config',sourceId:'/content/presentation/test.json',data:{id:'presentation.test',kind:'scene-presentation',actorShadow:shadow()}});return {source,doc,scene};}
test('managed furniture and contact shadows accept legacy sources and valid isolated definitions',async()=>{assert(validateProject(await projectSource()).ok);const {source}=await fixture();const result=validateProject(source);assert(result.ok,JSON.stringify(result.errors));});
test('furniture rejects bad image references geometry sampling and colliding instance ownership at source pointers',async()=>{
 for(const change of [s=>s.props[0].assetId='missing',s=>s.props[0].assetId='audio.fixture.tone',s=>s.props[0].width=-1,s=>s.props[0].sortY=NaN,s=>s.props[0].sampling='bilinear',s=>s.props[0].pivot.x=Infinity,s=>s.props[0].order=.5,s=>s.props[0].shadows[0].opacity=2,s=>s.props[0].shadows[0].assetId='missing',s=>s.props.push(structuredClone(s.props[0])),s=>s.props[0].id='player',s=>s.props[0].id=s.actors[0].id]){
  const {source,doc,scene}=await fixture();change(scene);const result=validateProject(source);assert(!result.ok,'invalid prop accepted');assert(result.errors.some(e=>e.sourceId===doc.sourceId&&e.pointer.startsWith('/0/props')),JSON.stringify(result.errors));
 }
});
test('presentation presets reject broken kinds shadows camera zoom and dust contracts before renderer ownership',async()=>{
 for(const change of [p=>p.actorShadow.assetId='missing',p=>p.actorShadow.opacity=-1,p=>p.actorShadow.width=0,p=>p.extra=true,p=>p.camera={followFactor60:0},p=>p.atmosphere={dust:{count:21,seed:1,amplitude:2,speed:.1}},p=>p.atmosphere={beam:{...shadow(),blend:'overlay'}}]){
  const {source}=await fixture();change(source.documents.at(-1).data);const result=validateProject(source);assert(!result.ok,'invalid presentation accepted');assert(result.errors.some(e=>e.sourceId==='/content/presentation/test.json'),JSON.stringify(result.errors));
 }
 const {source,scene}=await fixture();scene.presentationId='ui.foundation';assert(!validateProject(source).ok,'wrong config kind accepted');
});
