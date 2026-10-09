import {t} from '../shared/text.js';
const registryURL=new URL('../../assets/dialogue/manifest.json',import.meta.url);
export async function loadDialogueRegistry(){
 const response=await fetch(registryURL);if(!response.ok)throw new Error(t('error.dialogue_manifest',{status:response.status}));
 return response.json();
}
export function portraitURL(file){return new URL(`../../assets/dialogue/${file}`,import.meta.url).href;}

/** One reusable visual layer, independent of the map sprite clocks. */
export class DialogueSprite{
 constructor(registry,{load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(src);image.onerror=reject;image.src=src;})}={}){
  this.registry=registry;this.load=load;this.cache=new Map();this.token=0;this.key=null;this.ready=Promise.resolve();
  this.node=document.createElement('div');this.node.className='dialogue-sprite';this.node.setAttribute('aria-hidden','true');
  this.backing=document.createElement('div');this.backing.className='dialogue-sprite-backing';
  this.image=document.createElement('img');this.image.className='dialogue-sprite-image';this.image.alt='';
  this.previous=document.createElement('img');this.previous.className='dialogue-sprite-image previous';this.previous.alt='';
  this.fallback=document.createElement('span');this.fallback.className='dialogue-sprite-fallback';
  this.node.append(this.backing,this.previous,this.image,this.fallback);
 }
 get(id){return this.registry.characters[id];}
 fetchImage(file){const url=portraitURL(file);if(!this.cache.has(url))this.cache.set(url,this.load(url).catch(error=>{this.cache.delete(url);throw error;}));return this.cache.get(url);}
 preload(ids){return Promise.allSettled(ids.map(id=>this.get(id)?.expressions.neutral).filter(Boolean).map(file=>this.fetchImage(file)));}
 set(id,expression='neutral'){
  const character=this.get(id),selected=character?.expressions[expression]?expression:'neutral',key=`${id}/${selected}`;
  if(this.key===key)return this.ready;
  const changedSpeaker=this.id!==id,token=++this.token;this.id=id;this.key=key;
  this.node.dataset.speaker=id;this.node.dataset.expression=selected;this.node.dataset.status='loading';
  this.node.style.setProperty('--speaker',character?.color||'#ddb966');
  this.fallback.textContent=character?.name?.charAt(0)||'?';
  this.previous.removeAttribute('src');
  if(!changedSpeaker&&this.image.getAttribute('src'))this.previous.src=this.image.src;
  this.image.removeAttribute('src');
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:180;
  if(changedSpeaker)this.node.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration?220:0,easing:'ease-out'});
  const resolve=async()=>{
   for(const file of [...new Set([character?.expressions[selected],character?.expressions.neutral].filter(Boolean))]){
    try{const url=await this.fetchImage(file);if(token!==this.token)return;this.image.src=url;this.node.dataset.status='ready';this.node.dataset.expression=file===character.expressions.neutral?'neutral':selected;this.image.animate([{opacity:0},{opacity:1}],{duration});if(this.previous.getAttribute('src'))this.previous.animate([{opacity:1},{opacity:0}],{duration,fill:'forwards'}).finished.then(()=>{if(token===this.token)this.previous.removeAttribute('src');}).catch(()=>{});return;}catch{}
   }
   if(token===this.token){this.previous.removeAttribute('src');this.node.dataset.status='fallback';}
  };
  this.ready=resolve();return this.ready;
 }
 clear(){++this.token;this.key=null;this.id=null;this.image.removeAttribute('src');this.previous.removeAttribute('src');}
}
