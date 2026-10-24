import {test,assert,equal} from '/tests/harness.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {FlagStore} from '/src/domain/story/FlagStore.js';
const schemas=Object.fromEntries(await Promise.all(['project','story','flags','events','resources'].map(async k=>[k,await(await fetch(`/src/contracts/schemas/${k}.json`)).json()])));
function fixture() {
 return {schemas,project:{schemaVersion:1,id:'test',contentVersion:'1',packs:[],defaultLocale:'vi'},documents:[
  {sourceId:'flags.json',kind:'flags',data:[{id:'flag.ready',type:'boolean',default:false,scope:'run'}]},
  {sourceId:'vi.json',kind:'locale',locale:'vi',data:{'line.hello':{value:'Ch?o {name}',params:['name']},'choice.go':{value:'?i',params:[]}}},
  {sourceId:'chapter.json',kind:'story',data:{id:'chapter.one',entryNodeId:'start',nodes:[{id:'start',commands:[{id:'line',op:'say',textKey:'line.hello',params:{name:'Khu?'}},{id:'choose',op:'choose',choices:[{id:'yes',textKey:'choice.go',target:'finish',condition:{flag:'flag.ready',equals:false}}]}]},{id:'finish',commands:[{id:'flag',op:'setFlag',flagId:'flag.ready',value:true},{id:'end',op:'end'}]}]}}
 ]};
}
const chapter=s=>s.documents[2].data;
test('validator yields immutable definitions and stable diagnostic lookup',()=>{
 const source=fixture(), r=validateProject(source); assert(r.ok,JSON.stringify(r));
 const def=r.value.catalog.get('story','chapter.one');assert(def.ok);source.documents[2].data.nodes[0].id='changed';equal(def.value.nodes[0].id,'start');
 assert(Object.isFrozen(def.value.nodes[0]));equal(r.value.catalog.get('story','missing').errors[0].code,'content.reference.missing');
});
const invalid=[
 ['missing entry',s=>chapter(s).entryNodeId='missing','story.entry.missing'],
 ['missing jump',s=>chapter(s).nodes[0].commands=[{id:'j',op:'jump',target:'missing'}],'story.target.missing'],
 ['duplicate nodes',s=>chapter(s).nodes[1].id='start','content.id.duplicate'],
 ['duplicate commands',s=>chapter(s).nodes[1].commands[1].id='line','content.id.duplicate'],
 ['undeclared flag',s=>chapter(s).nodes[1].commands[0].flagId='absent','flag.undeclared'],
 ['wrong flag type',s=>chapter(s).nodes[1].commands[0].value='true','flag.value.invalid'],
 ['missing text',s=>chapter(s).nodes[0].commands[0].textKey='missing','text.key.missing'],
 ['missing parameter',s=>chapter(s).nodes[0].commands[0].params={},'text.params.invalid'],
 ['missing asset',s=>chapter(s).nodes[0].commands.unshift({id:'bg',op:'setBackdrop',assetId:'absent'}),'content.reference.missing'],
 ['dead end',s=>chapter(s).nodes[1].commands.pop(),'story.terminal.missing'],
 ['unknown opcode',s=>chapter(s).nodes[0].commands[0].op='eval','story.opcode.unknown'],
 ['flag guard undeclared',s=>chapter(s).nodes[0].commands[1].choices[0].condition.flag='absent','flag.undeclared'],
 ['empty choices',s=>chapter(s).nodes[0].commands[1].choices=[],'story.choice.empty'],
 ['unreachable node',s=>chapter(s).nodes.push({id:'orphan',commands:[{id:'orphan.end',op:'end'}]}),'story.node.unreachable'],
 ['unknown effect',s=>chapter(s).nodes[1].commands.unshift({id:'effect',op:'emitEffect',effectId:'absent',params:{}}),'event.effect.unknown'],
 ['schema mismatch',s=>chapter(s).nodes[0].commands[0].id=15,'schema.type'],
];
for(const [name,change,code] of invalid) test('validator rejects '+name+' at source property',()=>{
 const source=fixture();change(source);const r=validateProject(source);assert(!r.ok,'accepted '+name);
 const diagnostic=r.errors.find(e=>e.code===code);assert(diagnostic,JSON.stringify(r));equal(diagnostic.sourceId,'chapter.json');assert(diagnostic.pointer.startsWith('/'));
});
test('flag store defaults are scoped and invalid unknown values never replace state',()=>{
 const defs=[{id:'flag.ready',type:'boolean',default:false,scope:'run'},{id:'flag.seen',type:'enum',values:['new','seen'],default:'new',scope:'profile'}];
 equal(FlagStore.validate(defs,{}).value,{'flag.ready':false,'flag.seen':'new'});
 assert(!FlagStore.validate(defs,{'flag.ready':1}).ok);assert(!FlagStore.validate(defs,{absent:true}).ok);
 equal(FlagStore.defaults(defs,'run'),{'flag.ready':false});
});
test('intentional terminal and source JSON roundtrip stay valid',()=>{
 const source=fixture();const r=validateProject(JSON.parse(JSON.stringify(source)));assert(r.ok,JSON.stringify(r));
 equal(r.value.catalog.get('story','chapter.one').value,source.documents[2].data);
});

test('malformed and unknown documents return diagnostics instead of throwing',()=>{
 for(const doc of [null,{sourceId:'bad',kind:'__proto__',data:{}},{sourceId:'bad',kind:'story',data:null}]) {
  const source=fixture();source.documents.push(doc);const result=validateProject(source);assert(!result.ok);assert(result.errors.length>0);
 }
});
test('locales reject inconsistent parameter declarations even in unused lines',()=>{
 const source=fixture();source.documents[1].data['unused']={value:'Hi {person}',params:[]};
 const result=validateProject(source);assert(!result.ok);assert(result.errors.some(e=>e.code==='text.params.invalid'&&e.sourceId==='vi.json'));
});
