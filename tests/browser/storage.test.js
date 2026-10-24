import {test,assert,equal} from '/tests/harness.js';
import {IndexedSaveRepository} from '/src/infrastructure/storage/IndexedSaveRepository.js';
import {PreferencesRepository} from '/src/infrastructure/storage/PreferencesRepository.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {GameSession} from '/src/application/GameSession.js';
import {runtimeBundle} from '/tests/fixtures/runtime.js';
const validate=envelope=>SaveCodec.decode(envelope);
async function envelope(position){const session=new GameSession({bundle:await runtimeBundle()});const state=structuredClone(session.snapshot());state.world.position=position;return (await SaveCodec.encode(state,{buildId:'test',contentVersion:'0.0.1'})).value;}
test('IndexedDB slot writes and backups remain atomic on corrupt input and quota failure',async()=>{
 const repo=new IndexedSaveRepository({name:'test.slots.atomic',manualSlots:10,autoSlots:3,validate});
 try{
  const first=await envelope(0),second=await envelope(1),third=await envelope(2);assert((await repo.put('manual.0',first)).ok);assert((await repo.put('manual.0',second)).ok);
  let record=(await repo.get('manual.0')).value;equal(record.current.checksum,second.checksum);equal(record.backup.checksum,first.checksum);
  const broken=structuredClone(third);broken.checksum='bad';assert(!(await repo.put('manual.0',broken)).ok);equal((await repo.get('manual.0')).value.current.checksum,second.checksum);
  const db=await repo.ready,transaction=db.transaction.bind(db);db.transaction=()=>{throw new DOMException('full','QuotaExceededError');};assert(!(await repo.put('manual.0',third)).ok);db.transaction=transaction;
  record=(await repo.get('manual.0')).value;equal(record.current.checksum,second.checksum);equal(record.backup.checksum,first.checksum);
  assert(!(await repo.put('manual.10',third)).ok);
 }finally{await repo.close();}
});
test('autosave rotates the configured slots without touching manual saves',async()=>{
 const repo=new IndexedSaveRepository({name:'test.slots.rotation',manualSlots:10,autoSlots:3,validate});
 try{
  const manual=await envelope(9);await repo.put('manual.0',manual);const ids=[];for(let i=0;i<4;i++)ids.push((await repo.putAuto(await envelope(i))).value);equal(ids,['auto.0','auto.1','auto.2','auto.0']);
  equal((await repo.get('manual.0')).value.current.checksum,manual.checksum);assert((await repo.get('auto.0')).value.backup);equal((await repo.list()).value.length,4);
 }finally{await repo.close();}
});
test('preferences and profile data use a separate database and invalid writes preserve the previous value',async()=>{
 const repo=new PreferencesRepository({name:'test.preferences',validate:value=>({ok:value?.schemaVersion===1&&typeof value.preferences?.textSpeed==='number'})});
 try{
  const data={schemaVersion:1,preferences:{textSpeed:36},profile:{flags:{seen:true},readAnchors:['a/b/c']}};assert((await repo.put(data)).ok);assert(!(await repo.put({schemaVersion:99})).ok);equal((await repo.get()).value,data);
 }finally{await repo.close();}
});
