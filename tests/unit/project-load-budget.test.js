import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
test('project reads have a bounded in-flight budget and preserve authored order/hashes',async()=>{
 let active=0,peak=0;const definitions=Array.from({length:30},(_,i)=>({kind:'config',path:'doc'+i+'.json'}));
 const fetcher=async url=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,2));const name=new URL(url).pathname.split('/').at(-1),data=name==='project.json'?{packs:['pack.json'],schemas:{}}:name==='pack.json'?{documents:definitions}:{id:name,kind:'test'};return {ok:true,text:async()=>{active--;return JSON.stringify(data);}};};
 const source=await loadProject('https://load.test/project.json',fetcher);assert(peak<=4,'unbounded project fetch burst: '+peak);equal(source.documents.map(d=>d.data.id),definitions.map(d=>d.path));assert(source.documents.every(d=>/^[a-f0-9]{64}$/.test(d.sourceHash)));equal(active,0);
});
test('a transport failure identifies its source URL without claiming a usable partial project',async()=>{
 let error;try{await loadProject('https://load.test/project.json',async()=>{throw new TypeError('network reset');});}catch(e){error=e;}assert(error);assert(String(error).includes('https://load.test/project.json'),'missing source URL');
});
