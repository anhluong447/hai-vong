import {diagnostic} from './Diagnostic.js';
/** Authoring-only chapter entry fixtures must be explicit and unambiguous. */
export function validateTraversalSeeds({catalog,sourceFor}){
 const errors=[],chapters=new Set();
 for(const config of catalog.list('config').filter(config=>config.kind==='traversal-seeds')){
  const add=(code,pointer,ids=[])=>errors.push(diagnostic(code,sourceFor('config',config.id),pointer,ids));
  if(!Array.isArray(config.chapters)){add('bot.seed.invalid','/chapters');continue;}
  config.chapters.forEach((entry,index)=>{
   const pointer='/chapters/'+index;if(!entry||typeof entry!=='object'||Array.isArray(entry)||!catalog.get('story',entry.chapterId).ok||chapters.has(entry.chapterId)){add('bot.seed.invalid',pointer);return;}chapters.add(entry.chapterId);
   if(!Array.isArray(entry.fixtureIds)||!entry.fixtureIds.length||new Set(entry.fixtureIds).size!==entry.fixtureIds.length){add('bot.seed.invalid',pointer+'/fixtureIds');return;}
   entry.fixtureIds.forEach((id,i)=>{if(typeof id!=='string'||!catalog.get('playtests',id).ok)add('bot.seed.reference',pointer+'/fixtureIds/'+i,[id]);});
  });
 }
 return errors;
}
