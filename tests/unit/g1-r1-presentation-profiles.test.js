import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('motion, encounter, camera, atmosphere and gait definitions share bounded validation',async()=>{
 const s=await projectSource(),scene=s.documents.find(d=>d.kind==='scenes').data[0],runtime=s.documents.find(d=>d.kind==='config'&&d.data.kind==='runtime').data;
 const profile={id:'presentation.test',kind:'scene-presentation',camera:{followResponse60:.07,zoomResponse60:.12},atmosphere:{beam:{assetId:scene.layers[0].assetId,x:0,y:0,width:100,height:100,opacity:.2,blend:'screen'},dust:{count:18,seed:7,x:0,y:0,width:100,height:100,color:'#f9d8a1',size:1,speed:.2,amplitude:4}}};
 const motion={id:'locomotion.test',kind:'locomotion',accelSeconds:.09,stopSeconds:.08};
 s.documents.push({sourceId:'profile.json',kind:'config',data:profile},{sourceId:'motion.json',kind:'config',data:motion});scene.presentationId=profile.id;runtime.locomotionConfigId=motion.id;
 assert(validateProject(s).ok,JSON.stringify(validateProject(s)));
 for(const mutate of [()=>profile.camera.followResponse60=2,()=>profile.atmosphere.dust.count=21,()=>profile.atmosphere.beam.assetId='missing',()=>profile.atmosphere.beam.blend='unknown',()=>motion.accelSeconds=0,()=>runtime.locomotionConfigId=profile.id]){
  const old=structuredClone(s);mutate();assert(!validateProject(s).ok,'bad profile accepted');Object.assign(s,old);
  // Restore local handles after cloning so the next mutation targets the source.
  Object.assign(profile,s.documents.find(d=>d.sourceId==='profile.json').data);s.documents.find(d=>d.sourceId==='profile.json').data=profile;
  Object.assign(motion,s.documents.find(d=>d.sourceId==='motion.json').data);s.documents.find(d=>d.sourceId==='motion.json').data=motion;
  Object.assign(runtime,s.documents.find(d=>d.kind==='config'&&d.data.kind==='runtime').data);s.documents.find(d=>d.kind==='config'&&d.data.kind==='runtime').data=runtime;
 }
});
