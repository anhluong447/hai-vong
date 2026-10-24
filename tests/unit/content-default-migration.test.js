import {test,assert,equal} from '/tests/harness.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
test('declared content defaults add new records while preserving old choices receipts and rewards',()=>{
 const before={schemaVersion:3,contentRevision:'0.0.1',formatTag:'hoi-am.side-scroll',gameplay:{flags:{existing:false},quests:{old:{status:'completed'}},audience:12},executionLedger:['quest.complete/old']};
 const registry=new MigrationRegistry({schemaVersion:3,contentVersion:'0.0.2',contentSteps:[{from:'0.0.1',to:'0.0.2',defaults:{gameplay:{flags:{existing:true,new:false},quests:{new:{status:'available'}}}}}]});
 const result=registry.migrate(before,'0.0.1');assert(result.ok);equal(result.value.gameplay.flags,{existing:false,new:false});equal(result.value.gameplay.quests.old,{status:'completed'});equal(result.value.gameplay.quests.new,{status:'available'});equal(result.value.executionLedger,['quest.complete/old']);equal(result.value.gameplay.audience,12);equal(before.gameplay.flags,{existing:false});
});
