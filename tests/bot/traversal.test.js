import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
import {PlaytestSession} from '/tools/workspace/PlaytestSession.js';
async function run(source,limits={}){
 const {TraversalBot}=await import('/src/application/TraversalBot.js'),definitions=source.documents.filter(doc=>doc.kind==='assets').flatMap(doc=>doc.data),decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(definitions).value,revision:'bot',decode:(...args)=>decoder.decode(...args)});
 try{return await new TraversalBot({maxStates:100,maxSteps:100,probeAsset:async asset=>{const result=await assets.acquire([asset.id],{revision:'bot'});if(result.ok)result.value.release();return result;},probeFixture:(fixture,bundle)=>new PlaytestSession().startDefinition(bundle,fixture,fixture.id),...limits}).run(source);}finally{assets.dispose();}
}
test('whole-pack bot covers two story branches real required resources and authored gameplay fixtures',async()=>{
 const source=await projectSource(),story=source.documents.find(doc=>doc.kind==='story').data;story.nodes[0].commands[1].choices.push({id:'other',textKey:'foundation.choice',target:'other'});story.nodes.push({id:'other',commands:[{id:'other.end',op:'end'}]});const result=await run(source);assert(result.ok,JSON.stringify(result));equal(result.coverage.nodes,{seen:3,total:3});equal(result.coverage.choices,{seen:2,total:2});equal(result.coverage.terminalPaths,2);equal(result.coverage.fixtures,{seen:2,total:2});equal(result.unexplored,[]);
});
test('missing required rendition is an asset failure rather than fabricated story coverage',async()=>{
 const source=await projectSource();source.documents.find(doc=>doc.kind==='assets').data.find(asset=>asset.id==='image.fixture.scene').path='/assets/exports/absent-required.png';const result=await run(source);assert(!result.ok);assert(result.errors.some(error=>error.code==='bot.asset.required'));assert(result.unexplored.some(item=>item.id==='image.fixture.scene'));
});
test('dead nodes and undeclared flags fail the same source validator as runtime and editor',async()=>{
 for(const change of [story=>story.nodes.push({id:'dead',commands:[{id:'dead.end',op:'end'}]}),story=>story.nodes[1].commands[0].flagId='flag.undeclared']){const source=await projectSource();change(source.documents.find(doc=>doc.kind==='story').data);const result=await run(source);assert(!result.ok);assert(result.errors.some(error=>['story.node.unreachable','flag.undeclared'].includes(error.code)));}
});
test('yielding loops terminate through memoization and explicit budgets report incomplete exploration',async()=>{
 const source=await projectSource(),story=source.documents.find(doc=>doc.kind==='story').data;story.nodes=[{id:'entry',commands:[{id:'greeting',op:'say',textKey:'foundation.begin'},{id:'loop',op:'jump',target:'entry'}]}];const loop=await run(source);assert(!loop.ok);assert(loop.errors.some(error=>error.code==='bot.cycle'));assert(loop.states<10);
 const limited=await run(await projectSource(),{maxStates:1});assert(!limited.ok);assert(limited.errors.some(error=>error.code==='bot.limit'));assert(limited.unexplored.length>0);
});
test('a condition never established by reachable state is reported explicitly as an unexplored branch',async()=>{
 const source=await projectSource();source.documents.find(doc=>doc.kind==='story').data.nodes[0].commands[1].choices[0].condition={flag:'flag.foundation.visited',equals:true};const result=await run(source);assert(!result.ok);equal(result.coverage.choices,{seen:0,total:1});assert(result.unexplored.some(item=>item.reason==='condition'&&item.id.endsWith('/visit')),JSON.stringify(result));
});
test('declared missing optional audio degrades to silence and remains an explicit successful probe',async()=>{
 const {runBot}=await import('/tools/workspace/BotRunner.js'),source=await projectSource();source.documents.find(doc=>doc.kind==='assets').data.push({id:'audio.optional',kind:'audio',path:'/assets/exports/optional-missing.ogg',required:false,missingPolicy:'silence'});const result=await runBot(source,{maxStates:100,maxSteps:100});assert(result.ok,JSON.stringify(result));assert(result.degradedAssets.includes('audio.optional'));
});
