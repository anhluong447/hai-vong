import {immutableCopy} from '../contracts/Content.js';
import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
import {defaultPreferences,validatePreferences,extendPreferences} from '../contracts/PlayerPreferences.js';
import {FlagStore} from '../domain/story/FlagStore.js';
export function validateProfile(value,contract){
 const {bundle}=contract,flags=bundle.catalog.list('flags').filter(f=>f.scope==='profile');
 if(value?.schemaVersion!==1||!value.profile||!Array.isArray(value.profile.readAnchors)||new Set(value.profile.readAnchors).size!==value.profile.readAnchors.length||value.profile.readAnchors.some(anchor=>!storyAnchor(bundle,anchor)))return failure(diagnostic('profile.invalid','profile','/'));
 const checked=FlagStore.validate(flags,value.profile.flags??{});if(!checked.ok)return checked;
 if(flags.some(f=>!Object.hasOwn(value.profile.flags,f.id)))return failure(diagnostic('profile.flag.missing','profile','/flags'));
 return validatePreferences(value.preferences,contract);
}
const storyAnchor=(bundle,anchor)=>typeof anchor==='string'&&bundle.catalog.list('story').some(chapter=>chapter.nodes.some(node=>node.commands.some(command=>command.op==='say'&&`${chapter.id}/${node.id}/${command.id}`===anchor)));
/** Profile progress/preferences have their own transaction and lifetime, outside slots. */
export class PlayerProfile {
 constructor({repository,...contract}){
  Object.assign(this,{repository,contract});this.value=immutableCopy({schemaVersion:1,preferences:defaultPreferences(contract.config,contract.input,contract.bundle.project.defaultLocale),profile:{flags:FlagStore.defaults(contract.bundle.catalog.list('flags').filter(f=>f.scope==='profile')),readAnchors:[]}});this.queue=Promise.resolve();
 }
 async load(){
  const read=await this.repository.get();if(!read.ok)return read;if(!read.value)return success(this.value);
  const next={...read.value,preferences:extendPreferences(read.value.preferences,this.contract)},checked=validateProfile(next,this.contract);if(!checked.ok)return checked;
  if(JSON.stringify(next)!==JSON.stringify(read.value)){const written=await this.repository.put(next);if(!written.ok)return written;}
  this.value=immutableCopy(next);return success(this.value);
 }
 update(change){const operation=this.queue.then(async()=>{
  const next=change(structuredClone(this.value)),checked=validateProfile(next,this.contract);if(!checked.ok)return checked;if(JSON.stringify(next)===JSON.stringify(this.value))return success(this.value);
  const written=await this.repository.put(next);if(!written.ok)return written;this.value=immutableCopy(next);return success(this.value);
 });this.queue=operation.catch(()=>{});return operation;}
 preferences(value){return this.update(current=>({...current,preferences:value}));}
 remember(state){return this.update(current=>{
  for(const flag of this.contract.bundle.catalog.list('flags'))if(flag.scope==='profile')current.profile.flags[flag.id]=state.gameplay.flags[flag.id];
  current.profile.readAnchors=[...new Set([...current.profile.readAnchors,...(state.story.readAnchors??[])])];return current;
 });}
 async close(){await this.queue;this.repository.close();}
}
