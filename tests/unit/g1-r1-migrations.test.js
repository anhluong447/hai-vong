import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {schemaStepsFor,contentStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
import {GameSession} from '/src/application/GameSession.js';
for(const kind of ['exploration','moving','reveal','foundation'])test('genuine v3 '+kind+' migrates motion and camera without changing earned progress',async()=>{
 const source=await loadProject(kind==='foundation'?'/content/project.json':'/content/first-three-days.project.json');source.project.contentVersion='0.0.3';source.documents.find(d=>d.data?.kind==='save-migrations').data.steps=source.documents.find(d=>d.data?.kind==='save-migrations').data.steps.filter(s=>s.from!=='0.0.3');const checked=validateProject(source);assert(checked.ok);const bundle=checked.value;
 const old=(await(await fetch('/tests/fixtures/g1-r1/'+kind+'.json')).json()).envelope.payload,before=structuredClone(old);
 const registry=new MigrationRegistry({schemaVersion:4,contentVersion:bundle.revision,schemaSteps:schemaStepsFor(bundle),contentSteps:contentStepsFor(bundle),catalog:bundle.catalog});
 const result=registry.migrate(old,old.contentRevision);assert(result.ok,JSON.stringify(result));const state=result.value;
 equal(state.schemaVersion,4);equal(state.world.velocity,0);equal(state.world.travelled,0);equal(state.world.moving,false);equal(state.presentation.encounter,null);
 equal(state.presentation.view.world.camera,{x:old.presentation.view.world.cameraX,y:0,zoom:1});assert(!Object.hasOwn(state.presentation.view.world,'cameraX'));
 for(const key of ['gameplay','story','executionLedger','audio','sequence'])equal(state[key],old[key]);equal(state.presentation.view.text,old.presentation.view.text);equal(old,before);
 const session=new GameSession({bundle,initialState:state});assert(session.validate(state).ok);
 for(const mutate of [s=>s.audio.extra=true,s=>s.world.moving='yes',s=>s.world.extra=1,s=>s.presentation.view.world.cameraX=-1,s=>s.presentation.view.world.actors.player={id:'clip.missing',elapsed:0,paused:false,status:'playing'},s=>s.presentation.view.world.elapsed=-1,s=>s.audio.tracks.push({cueId:'cue.missing',offset:0})]){
  const corrupt=structuredClone(old);mutate(corrupt);assert(!registry.migrate(corrupt,old.contentRevision).ok,'corrupt old state normalized');
 }
 const moving=structuredClone(state);moving.world.velocity=12;moving.world.moving=true;moving.world.travelled=21;assert(session.replace(moving).ok);equal(session.snapshot().world.velocity,12);
 for(const mutate of [s=>s.world.extra=1,s=>s.presentation.view.world.camera.extra=1,s=>s.world.velocity=NaN,s=>s.world.travelled=-1,s=>s.presentation.encounter={sceneId:'missing',interactionId:'missing'},s=>s.presentation.view.world.camera.zoom=0]){const corrupt=structuredClone(state);mutate(corrupt);assert(!session.replace(corrupt).ok);equal(session.snapshot().world.velocity,12);}
});
