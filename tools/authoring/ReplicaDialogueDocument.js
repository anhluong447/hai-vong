import {dialogueUi} from '../../content/ui/coastal-dialogue-ui.js';
import {dialogueLayoutContract as contract} from '../../content/ui/coastal-dialogue-layout-data.js';
import {validateDialogueLayout} from '../../src/shared/validateDialogueLayout.js';
import {LayoutDocument} from './LayoutDocument.js';

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const metadata=value=>JSON.stringify(stable(Object.fromEntries(Object.entries(value).filter(([key])=>key!=='layout'))));
const validate=candidate=>{
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))throw new TypeError('Invalid dialogue composition');
 const normalized=structuredClone(candidate);
 if(normalized.layout&&Object.keys(normalized.layout).length===contract.legacyRegions.length&&contract.legacyRegions.every(id=>Object.hasOwn(normalized.layout,id))){
  for(let index=0;index<3;index++)if(normalized.rules?.[index]&&!Object.hasOwn(normalized.rules[index],'component'))normalized.rules[index].component=dialogueUi.rules[index].component;
 }
 if(metadata(normalized)!==metadata(dialogueUi))throw new TypeError('Invalid dialogue composition; artwork and content must match the source');
 return {...structuredClone(dialogueUi),layout:validateDialogueLayout(candidate.layout)};
};
export const replicaDialogueRegions=contract.regions.map(region=>({...region,scope:'dialogue',fields:contract.fields}));

/** Export the actual replica source, preserving artwork, masks and motion inputs. */
export class ReplicaDialogueDocument extends LayoutDocument{
 constructor(){super(dialogueUi,{validate});}
 get draft(){return this.value;}
 set(region,field,value){const next=structuredClone(this.value);if(!Object.hasOwn(next.layout,region)||!Object.hasOwn(next.layout[region],field))throw new RangeError('Unknown dialogue layout field');next.layout[region][field]=value;this.replace(next);}
 reset(region,field){const next=structuredClone(this.value);if(!region)return this.replace(this.source);if(field)next.layout[region][field]=this.source.layout[region][field];else next.layout[region]=structuredClone(this.source.layout[region]);this.replace(next);}
 export(){const next=structuredClone(this.value);for(const fields of Object.values(next.layout))for(const key of Object.keys(fields))fields[key]=Math.round(fields[key]*100)/100;return JSON.stringify(stable(next),null,2)+'\n';}
}
