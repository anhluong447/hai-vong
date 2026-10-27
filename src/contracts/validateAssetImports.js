import {diagnostic} from './Diagnostic.js';
export function validateAssetImports({catalog,sourceFor}){
 const errors=[],localSource=(name,root)=>typeof name==='string'&&name.startsWith(root+'/')&&!name.includes('\\')&&!name.split('/').some(part=>!part||part==='.'||part==='..');
 for(const spec of catalog.list('config').filter(config=>config.kind==='asset-imports')){
  const add=pointer=>errors.push(diagnostic('asset.imports.invalid',sourceFor('config',spec.id),pointer,[spec.id]));
  const map=new Map(spec.entries.map(entry=>[entry.id,entry]));if(new Set([...spec.entries,...spec.atlases].map(entry=>entry.id)).size!==spec.entries.length+spec.atlases.length)add('/entries');
  for(const [id,license]of Object.entries(spec.licenses))if(!license||typeof license!=='object'||typeof license.provenance!=='string'||!license.provenance||typeof license.usage!=='string'||!license.usage||typeof license.productionApproved!=='boolean')add('/licenses/'+id);
  for(const [i,entry]of spec.entries.entries()){
   if(!localSource(entry.source,spec.sourceRoot))add(`/entries/${i}/source`);if(!Object.hasOwn(spec.licenses,entry.license))add(`/entries/${i}/license`);
   if(entry.kind==='audio'&&[entry.quality,entry.sampleRate,entry.channels].some(value=>!Number.isFinite(value)))add(`/entries/${i}`);
   if(entry.kind!=='image'&&['crop','resize','canvas','blur'].some(key=>Object.hasOwn(entry,key)))add(`/entries/${i}`);
   if(entry.blur!==undefined&&(!entry.blur||typeof entry.blur.radius!=='number'||!Number.isFinite(entry.blur.radius)||entry.blur.radius<0||entry.blur.radius>16))add(`/entries/${i}/blur`);
   for(const key of ['crop','resize','canvas'])if(entry[key]&&Math.max(entry[key].width,entry[key].height)>spec.maxImageDimension)add(`/entries/${i}/${key}`);
   if(entry.canvas){const size=entry.resize??entry.crop;if(size&&(entry.canvas.x+size.width>entry.canvas.width||entry.canvas.y+size.height>entry.canvas.height))add(`/entries/${i}/canvas`);}
   if(!entry.required&&!entry.fallbackId&&!(entry.kind==='audio'&&entry.missingPolicy==='silence'))add(`/entries/${i}/required`);
   for(const id of [...(entry.dependencies??[]),...(entry.fallbackId?[entry.fallbackId]:[])])if(!map.has(id)&&!spec.atlases.some(atlas=>atlas.id===id))add(`/entries/${i}/dependencies`);
   if(entry.fallbackId&&map.get(entry.fallbackId)?.kind!==entry.kind)add(`/entries/${i}/fallbackId`);
  }
  for(const [i,atlas]of spec.atlases.entries())if(new Set(atlas.members).size!==atlas.members.length||atlas.members.some(id=>map.get(id)?.kind!=='image')||new Set(atlas.members.map(id=>map.get(id)?.license)).size!==1||atlas.maxSize>spec.maxImageDimension)add(`/atlases/${i}`);
  if(spec.generationInputs.some(name=>!localSource(name,spec.sourceRoot)))add('/generationInputs');
  const seen=new Set(),active=new Set(),visit=id=>{if(active.has(id)){add('/entries');return;}if(seen.has(id))return;active.add(id);const entry=map.get(id);for(const child of [...(entry?.dependencies??[]),...(entry?.fallbackId?[entry.fallbackId]:[])])visit(child);active.delete(id);seen.add(id);};for(const id of map.keys())visit(id);
 }
 return errors;
}
