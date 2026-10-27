import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {createRunState} from '/src/domain/story/RunState.js';
import {contentStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';

async function fixture(){
 const source=await projectSource(),runtime=source.documents.find(doc=>doc.kind==='config'&&doc.data.id===source.project.runtimeConfigId);runtime.data.migrationConfigId='migration.test';
 source.documents.push({kind:'config',sourceId:'/content/test-migrations.json',data:{id:'migration.test',kind:'save-migrations',steps:[{from:'0.0.1',to:source.project.contentVersion,addFlags:['flag.first3.complete'],addQuests:['quest.first3.room3']}]}});return source;
}
test('runtime resolves declared content additions through catalogs and retains old progress without granting rewards',async()=>{
 const source=await fixture(),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked.errors));const bundle=checked.value,old=createRunState(bundle);old.contentRevision='0.0.1';delete old.gameplay.flags['flag.first3.complete'];delete old.gameplay.quests['quest.first3.room3'];old.gameplay.flags['flag.foundation.visited']=true;old.executionLedger=['effect/previous'];
 const migrated=new MigrationRegistry({schemaVersion:4,contentVersion:bundle.revision,contentSteps:contentStepsFor(bundle)}).migrate(old,'0.0.1');assert(migrated.ok,JSON.stringify(migrated));equal(migrated.value.gameplay.flags['flag.first3.complete'],false);equal(migrated.value.gameplay.flags['flag.foundation.visited'],true);equal(migrated.value.gameplay.quests['quest.first3.room3'].status,'available');equal(migrated.value.gameplay.quests['quest.first3.room3'].materialIds,[]);equal(migrated.value.executionLedger,['effect/previous']);equal(migrated.value.gameplay.wallet,old.gameplay.wallet);equal(migrated.value.gameplay.audience,old.gameplay.audience);
});
test('invalid migration references fail shared source validation before a live save can be replaced',async()=>{
 const source=await fixture();source.documents.at(-1).data.steps[0].addFlags=['flag.missing'];const checked=validateProject(source);assert(!checked.ok);assert(checked.errors.some(error=>error.code==='migration.reference.invalid'&&error.sourceId==='/content/test-migrations.json'&&error.pointer==='/steps/0/addFlags/0'),JSON.stringify(checked.errors));
});
