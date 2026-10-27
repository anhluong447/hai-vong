import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
import {schemaStepsFor,contentStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {GameSession} from '/src/application/GameSession.js';
const canonical=v=>JSON.parse(JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x));
test('C2 scoped content policy drops known tone, remaps sequence and recovers encounter without advancing story',async()=>{
 const source=await loadProject('/docs/art-direction/review-b-r1/c2/project.json'),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked));const bundle=checked.value,foundation=validateProject({...source,project:{...source.project,runtimeConfigId:'runtime.foundation'}}).value;
 const registry=new MigrationRegistry({schemaVersion:4,contentVersion:bundle.revision,catalog:bundle.catalog,schemaSteps:schemaStepsFor(bundle),contentSteps:contentStepsFor(bundle)});
 for(const kind of ['exploration','moving','reveal','foundation']){
  const old=(await(await fetch('/tests/fixtures/g1-r1/'+kind+'.json')).json()).envelope.payload,result=registry.migrate(old,old.contentRevision);assert(result.ok,JSON.stringify(result));const state=result.value;
  equal(canonical(state.gameplay),canonical(old.gameplay));equal(state.story,old.story);equal(state.executionLedger,old.executionLedger);
  equal(state.audio.tracks,kind==='foundation'?old.audio.tracks:[]);equal(state.sequence.id,kind==='foundation'?old.sequence.id:'sequence.first3.enter');
  equal(state.presentation.encounter,kind==='reveal'?{sceneId:'scene.first3.room3',interactionId:'van-recruit'}:null);assert(new GameSession({bundle:kind==='foundation'?foundation:bundle}).validate(state).ok,kind);
 }
 const migration=source.documents.find(d=>d.data?.kind==='save-migrations');migration.data.steps.at(-1).presentationPatch.dropAudioCueIds=['missing'];const invalid=validateProject(source);assert(!invalid.ok);assert(invalid.errors.some(e=>e.sourceId===migration.sourceId));
});
