import {dialogueLayoutContract as contract} from '../../../content/ui/coastal-dialogue-layout-data.js';

const namespace='http://www.w3.org/2000/svg';
const dateMembers=new Set(['date-paper','date-ornament','date','phase']);
function wrap(node,id,targets){
 const group=document.createElementNS(namespace,'g');group.dataset.dialogueLayout=id;
 node.before(group);group.append(node);targets.get(id).push(group);return group;
}

/** Keep layer order, clip coordinates and animation transforms inside wrappers. */
export function attachDialogueLayout(stage){
 const targets=new Map(contract.regions.map(region=>[region.id,[]]));
 for(const [id,layer]of stage.groups){
  if(id==='scene'||id==='portraits')continue;
  for(const node of [...layer.children]){
   const region=node.dataset.region;
   if(region==='brand'||region==='brand-mark')continue;
   const date=dateMembers.has(region)||node.dataset.uiComponent==='date-card';
   wrap(node,date?'dialogue-date':'dialogue-panel',targets);
   if(node.hasAttribute('data-choice-id')||node.hasAttribute('data-choice-copy'))wrap(node,'dialogue-choices',targets);
  }
 }
 // Specific objects sit inside their existing semantic group wrappers. Each
 // selector may span layers without moving artwork across the paint order.
 for(const region of contract.regions){
  if(!region.selectors)continue;
  const matches=[...stage.svg.querySelectorAll(region.selectors.join(','))];
  // A union and its art can share component metadata. Only wrap the outer
  // match, so each paint node receives an object's transform exactly once.
  for(const node of matches.filter(node=>!matches.some(other=>other!==node&&other.contains(node))))wrap(node,region.id,targets);
 }
 stage.layoutTargets=targets;applyDialogueLayout(stage);
}

export function applyDialogueLayout(stage){
 for(const region of contract.regions){
  const values=stage.scene.layout?.[region.id]??Object.fromEntries(Object.entries(contract.fields).map(([key,field])=>[key,field.default]));
  const [x,y]=region.origin,neutral=Object.entries(contract.fields).every(([key,field])=>values[key]===field.default);
  for(const group of stage.layoutTargets?.get(region.id)??[]){
   if(neutral)group.removeAttribute('transform');
   else group.setAttribute('transform',`translate(${values.x} ${values.y}) translate(${x} ${y}) scale(${values.scaleX} ${values.scaleY}) translate(${-x} ${-y})`);
  }
 }
}
