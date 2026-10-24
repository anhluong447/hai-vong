import {validateProject} from '../../src/domain/story/validateProject.js';
import {TraversalBot} from '../../src/application/TraversalBot.js';
import {AssetCatalog} from '../../src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '../../src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '../../src/infrastructure/resources/BrowserResourceDecoder.js';
import {PlaytestSession} from './PlaytestSession.js';
/** Real browser resource probes complement the pure traversal engine. */
export async function runBot(sources,limits){
 const checked=validateProject(sources);if(!checked.ok)return checked;const bundle=checked.value,decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)});
 try{
  return await new TraversalBot({...limits,probeAsset:async asset=>{
   const acquired=await assets.acquire([asset.id],{revision:bundle.revision});if(!acquired.ok)return acquired;
   try{const payload=acquired.value.get(asset.id);if(asset.kind==='audio'&&payload!==null)await new OfflineAudioContext(1,44100,44100).decodeAudioData(payload.slice(0));return {ok:true,value:{degraded:acquired.value.degraded}};}finally{acquired.value.release();}
  },probeFixture:fixture=>{const doc=sources.documents.find(doc=>doc.kind==='playtests'&&doc.data.some(def=>def.id===fixture.id));return new PlaytestSession().startDefinition(bundle,fixture,doc.sourceId,undefined,'/'+doc.data.findIndex(def=>def.id===fixture.id));}}).run(sources);
 }finally{assets.dispose();}
}
