import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {immutableCopy} from '../../contracts/Content.js';
import {STORY_OPCODES} from '../../contracts/Commands.js';
import {validateSchema} from '../../contracts/validateSchema.js';
import {validateResources} from '../../contracts/validateResources.js';
import {FlagStore} from './FlagStore.js';
import {ContentCatalog} from './ContentCatalog.js';

export function validateProject({project,schemas,documents,capabilities=[]}) {
 const errors=[]; const entries=Object.create(null); const locations=new Map(); const locales=Object.create(null);
 const add=(code,doc,pointer,ids=[])=>errors.push(diagnostic(code,doc.sourceId,pointer,ids));
 if(!schemas?.project) return failure(diagnostic('schema.missing','project','/schemas/project'));
 errors.push(...validateSchema(schemas.project,project,'project',''));
 for(const doc of documents??[]) {
  if(!doc||typeof doc.sourceId!=='string'||typeof doc.kind!=='string') {errors.push(diagnostic('content.document.invalid','project','/documents'));continue;}
  if(doc.kind==='locale') {
   if(!doc.data||typeof doc.data!=='object'||Array.isArray(doc.data)) {add('text.catalog.invalid',doc,'/');continue;}
   if(Object.hasOwn(locales,doc.locale)) {add('content.id.duplicate',doc,'/locale',[doc.locale]);continue;}
   locales[doc.locale]=doc.data;
   for(const [key,item] of Object.entries(doc.data)) {
    const tokens=typeof item?.value==='string'?[...item.value.matchAll(/\{([\w.]+)\}/g)].map(m=>m[1]):[];
    if(typeof item?.value!=='string'||!Array.isArray(item.params)||item.params.some(k=>typeof k!=='string')||new Set(item.params).size!==item.params.length||tokens.some(k=>!item.params.includes(k))||item.params.some(k=>!tokens.includes(k))) add('text.params.invalid',doc,'/'+key,[key]);
   }
   continue;
  }
  const schemaKey=doc.kind==='assets'?'resources':doc.kind;
  const schema=Object.hasOwn(schemas,schemaKey)?schemas[schemaKey]:null;
  if(schema) {const found=validateSchema(schema,doc.data,doc.sourceId,'');errors.push(...found);if(found.length)continue;}
  else if(!['scenes','animations','audio','quests','config','actors','hearing'].includes(doc.kind)) {add('content.kind.unknown',doc,'/kind');continue;}
  const defs=Array.isArray(doc.data)?doc.data:[doc.data];entries[doc.kind]??=[];
  for(const [i,def] of defs.entries()) {
   const key=`${doc.kind}:${def?.id}`;
   if(locations.has(key)) add('content.id.duplicate',doc,Array.isArray(doc.data)?`/${i}/id`:'/id',[def?.id]);
   locations.set(key,doc);entries[doc.kind].push(def);
  }
 }
 // Structural errors stop semantic traversal; malformed shapes must never crash validation.
 if(errors.length) return failure(errors);
 const flags=entries.flags??[];const flagMap=new Map(flags.map(d=>[d.id,d]));
 for(const flag of flags) if(!FlagStore.accepts(flag,flag.default)) add('flag.default.invalid',locations.get(`flags:${flag.id}`),'/default',[flag.id]);
 const catalog=new ContentCatalog(entries);
 for(const error of validateResources(entries.assets??[])){
  const id=error.relatedIds[0],doc=locations.get(`assets:${id}`);
  if(doc){error.sourceId=doc.sourceId;error.pointer='/'+doc.data.findIndex(d=>d.id===id);}
  errors.push(error);
 }
 for(const clip of entries.animations??[]){
  const doc=locations.get(`animations:${clip.id}`);
  for(const [i,frame]of clip.frames.entries()){
   const asset=catalog.get('assets',frame.assetId);
   if(!asset.ok||asset.value.kind!=='image'||frame.frameId&&!asset.value.frames?.some(f=>f.id===frame.frameId))add('animation.frame.invalid',doc,`/${clip.id}/frames/${i}`,[frame.assetId]);
  }
 }
 for(const cue of entries.audio??[]){
  const asset=catalog.get('assets',cue.assetId);
  if(!asset.ok||asset.value.kind!=='audio'||cue.loop&&!(cue.loopEnd>cue.loopStart&&cue.loopEnd<=asset.value.duration))add('audio.cue.invalid',locations.get(`audio:${cue.id}`),'/'+cue.id,[cue.assetId]);
 }

 const ref=(kind,id,doc,pointer)=>{ if(!id||!catalog.get(kind,id).ok)add('content.reference.missing',doc,pointer,[id]); };
 const checkFlag=(id,value,doc,pointer)=>{
  const def=flagMap.get(id);
  if(!def) add('flag.undeclared',doc,pointer,[id]);
  else if(!FlagStore.accepts(def,value)) add('flag.value.invalid',doc,pointer,[id]);
 };
 const text=(key,params,doc,pointer)=>{
  const item=locales[project.defaultLocale]?.[key];
  if(!item||typeof item.value!=='string'||!Array.isArray(item.params)) {add('text.key.missing',doc,pointer,[key]);return;}
  const names=Object.keys(params??{}).sort();
  if(JSON.stringify(names)!==JSON.stringify([...item.params].sort())) add('text.params.invalid',doc,pointer,[key]);
  const tokens=[...item.value.matchAll(/\{([\w.]+)\}/g)].map(m=>m[1]);
  if(tokens.some(k=>!item.params.includes(k))||item.params.some(k=>!tokens.includes(k))) add('text.params.invalid',doc,pointer,[key]);
 };
 for(const event of entries.events??[]) if(!capabilities.includes(event.handlerId)) add('event.handler.unknown',locations.get(`events:${event.id}`),'/handlerId',[event.handlerId]);
 for(const story of entries.story??[]) {
  const doc=locations.get(`story:${story.id}`), nodes=new Map(),ids=new Set(),edges=new Map();
  story.nodes.forEach((node,i)=>{
   if(nodes.has(node.id)) add('content.id.duplicate',doc,`/nodes/${i}/id`,[node.id]);
   nodes.set(node.id,node);edges.set(node.id,[]);
  });
  if(!nodes.has(story.entryNodeId)) add('story.entry.missing',doc,'/entryNodeId',[story.entryNodeId]);
  story.nodes.forEach((node,i)=>node.commands.forEach((command,j)=>{
   const p=`/nodes/${i}/commands/${j}`;
   if(ids.has(command.id)) add('content.id.duplicate',doc,p+'/id',[command.id]);ids.add(command.id);
   if(!STORY_OPCODES.includes(command.op)) add('story.opcode.unknown',doc,p+'/op',[command.op]);
   if(['end','jump','choose'].includes(command.op)&&j!==node.commands.length-1) add('story.command.unreachable',doc,p);
   const target=(id,ptr)=>{ if(!nodes.has(id)) add('story.target.missing',doc,ptr,[id]);else edges.get(node.id).push(id); };
   if(command.op==='say') text(command.textKey,command.params,doc,p+'/textKey');
   if(command.op==='jump') target(command.target,p+'/target');
   if(command.op==='setFlag') checkFlag(command.flagId,command.value,doc,p+'/flagId');
   if(command.op==='choose') {
    if(!command.choices?.length) add('story.choice.empty',doc,p+'/choices');
    const choices=new Set();
    (command.choices??[]).forEach((choice,k)=>{
     const cp=`${p}/choices/${k}`;if(choices.has(choice.id))add('content.id.duplicate',doc,cp+'/id',[choice.id]);choices.add(choice.id);
     text(choice.textKey,{},doc,cp+'/textKey');target(choice.target,cp+'/target');
     if(choice.condition) checkFlag(choice.condition.flag,choice.condition.equals,doc,cp+'/condition/flag');
    });
   }
   if(command.op==='setBackdrop') ref('assets',command.assetId,doc,p+'/assetId');
   if(command.op==='showActor') ref('actors',command.actorId,doc,p+'/actorId');
   if(command.op==='playCue') ref('audio',command.cueId,doc,p+'/cueId');
   if(command.op==='transition') ref('scenes',command.sceneId,doc,p+'/sceneId');
   if(command.op==='emitEffect') {
    const event=catalog.get('events',command.effectId);
    if(!event.ok) add('event.effect.unknown',doc,p+'/effectId',[command.effectId]);
    else errors.push(...validateSchema(event.value.paramsSchema,command.params??{},doc.sourceId,p+'/params'));
   }
   if(j===node.commands.length-1&&!['end','jump','choose'].includes(command.op)) add('story.terminal.missing',doc,p);
  }));
  const seen=new Set();const visit=id=>{ if(seen.has(id)||!nodes.has(id))return;seen.add(id);(edges.get(id)??[]).forEach(visit); };visit(story.entryNodeId);
  story.nodes.forEach((node,i)=>{if(!seen.has(node.id))add('story.node.unreachable',doc,`/nodes/${i}/id`,[node.id]);});
 }
 return errors.length?failure(errors):success(Object.freeze({revision:project.contentVersion,project:immutableCopy(project),catalog,locales:immutableCopy(locales)}));
}
