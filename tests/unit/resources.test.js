import {test,assert,equal} from '/tests/harness.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {ResourceScope} from '/src/infrastructure/resources/ResourceScope.js';
const image=(id,extra={})=>({id,kind:'image',path:`/${id}.png`,required:true,width:16,height:16,...extra});
const catalog=defs=>{const r=AssetCatalog.create(defs);assert(r.ok,JSON.stringify(r));return r.value;};
test('asset catalog rejects duplicate IDs missing dependencies cycles and invalid atlas bounds',()=>{
 for(const definitions of [[image('x'),image('x')],[image('x',{dependencies:['missing']})],[image('x',{dependencies:['y']}),image('y',{dependencies:['x']})],[image('x',{frames:[{id:'frame',x:15,y:0,width:2,height:16}]})]])assert(!AssetCatalog.create(definitions).ok);
});
test('shared leases decode once and release the resource only after the final owner',async()=>{
 let decoded=0,disposed=0;const service=new AssetService({catalog:catalog([image('x')]),revision:'r1',decode:async()=>{decoded++;return {payload:{width:16},dispose:()=>disposed++};}});
 const a=await service.acquire(['x'],{revision:'r1'}),b=await service.acquire(['x'],{revision:'r1'});assert(a.ok&&b.ok);equal(decoded,1);equal(a.value.get('x').width,16);
 a.value.release();a.value.release();equal(disposed,0);b.value.release();equal(disposed,1);equal(service.stats().resources,0);
});
test('cancelled scene cannot claim a late load or abort another owners shared load',async()=>{
 let resolve,disposed=0;const service=new AssetService({catalog:catalog([image('x')]),revision:'r',decode:()=>new Promise(r=>resolve=()=>r({payload:'bitmap',dispose:()=>disposed++}))});
 const controller=new AbortController();const a=service.acquire(['x'],{revision:'r',signal:controller.signal}),b=service.acquire(['x'],{revision:'r'});
 await Promise.resolve();controller.abort();resolve();const first=await a,second=await b;assert(!first.ok);assert(second.ok);equal(second.value.get('x'),'bitmap');equal(disposed,0);second.value.release();equal(disposed,1);
});
test('optional image uses declared placeholder while required load failure rejects the group',async()=>{
 const defs=[image('placeholder'),image('optional',{required:false,fallbackId:'placeholder'}),image('required')];let disposed=0;
 const service=new AssetService({catalog:catalog(defs),revision:'r',decode:async def=>{if(def.id!=='placeholder')throw new Error('missing');return {payload:'placeholder',dispose:()=>disposed++};}});
 const optional=await service.acquire(['optional'],{revision:'r'});assert(optional.ok);equal(optional.value.get('optional'),'placeholder');equal(optional.value.degraded,['optional']);optional.value.release();equal(disposed,1);
 const required=await service.acquire(['required'],{revision:'r'});assert(!required.ok);equal(service.stats().resources,0);
});
test('stale revision missing IDs and disposed scopes cannot leak newly decoded handles',async()=>{
 let count=0;const service=new AssetService({catalog:catalog([image('x')]),revision:'r',decode:async()=>({payload:'x',dispose:()=>count++})});
 assert(!(await service.acquire(['x'],{revision:'old'})).ok);assert(!(await service.acquire(['missing'],{revision:'r'})).ok);
 const scope=new ResourceScope(service,'r');assert((await scope.acquire(['x'])).ok);scope.dispose();equal(count,1);assert(!(await scope.acquire(['x'])).ok);equal(service.stats().resources,0);
});
