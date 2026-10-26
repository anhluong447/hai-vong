import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {contentStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
const policy={sceneIds:['scene.first3.room3'],clipIds:['clip.fixture.idle','clip.fixture.walk']};
const canonical=value=>JSON.parse(JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v));
async function setup(){
 const source=await projectSource();source.project.contentVersion='0.0.3';for(const pack of source.packs??[])pack.version='0.0.3';
 const migration=source.documents.find(d=>d.data?.kind==='save-migrations');migration.data.steps=migration.data.steps.filter(s=>s.from!=='0.0.2');migration.data.steps.push({from:'0.0.2',to:'0.0.3',addFlags:[],addQuests:[],resetActorAnimations:structuredClone(policy)});
 return {source,migration};
}
test('managed animation reset policy validates references and compiles without losing its bounded scope',async()=>{
 const {source,migration}=await setup(),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked.errors));equal(contentStepsFor(checked.value).find(s=>s.from==='0.0.2').resetActorAnimations,policy);
 for(const invalid of [{sceneIds:['missing'],clipIds:policy.clipIds},{sceneIds:policy.sceneIds,clipIds:['missing']},{...policy,extra:true},{sceneIds:[],clipIds:policy.clipIds},{sceneIds:policy.sceneIds,clipIds:['clip.fixture.idle','clip.fixture.idle']}]){
  const changed=structuredClone(source);changed.documents.find(d=>d.sourceId===migration.sourceId).data.steps.at(-1).resetActorAnimations=invalid;assert(!validateProject(changed).ok,'invalid reset accepted');
 }
});
for(const kind of ['exploration','reveal'])test('genuine pre-art '+kind+' retains all save data except declared animation resets',async()=>{
 const {source}=await setup(),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked.errors));const bundle=checked.value,fixture=await(await fetch('/tests/fixtures/g1/'+kind+'.json')).json(),old=fixture.envelope.payload,before=structuredClone(old);
 const registry=new MigrationRegistry({schemaVersion:3,contentVersion:'0.0.3',catalog:bundle.catalog,contentSteps:contentStepsFor(bundle)}),result=registry.migrate(old,'0.0.2');assert(result.ok,JSON.stringify(result));
 const expected=structuredClone(old);expected.contentRevision='0.0.3';for(const id of Object.keys(expected.presentation.view.world.actors))expected.presentation.view.world.actors[id]=null;equal(canonical(result.value),canonical(expected));equal(old,before);
 for(const mutate of [s=>s.presentation.view.world.actors.player.id='clip.unknown',s=>s.presentation.view.world.actors.player.elapsed=-1,s=>s.presentation.view.world.actors.player.paused='yes',s=>s.presentation.view.world.actors.player.status='broken',s=>s.presentation.view.world.actors.player.extra=true,s=>s.presentation.view.world.actors.stranger=null]){
  const corrupt=structuredClone(old);mutate(corrupt);assert(!registry.migrate(corrupt,'0.0.2').ok,'corruption normalized away');
 }
});
