import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';

const OWNER=Symbol('dialogue.presentation.owner');
const key=model=>model===null?null:JSON.stringify([model.speakerId,model.nameKey,model.expressionId,model.portraitAssetId]);
const bad=code=>failure(diagnostic(code,'dialogue','/presentation'));

/** Prepared portraits own decoded leases; only synchronous commit changes the DOM. */
export class DialoguePresentationView {
 constructor({root,format,assets,revision}){
  Object.assign(this,{root,format,assets,revision});
  this.name=root.querySelector('[data-role=dialogue-name]');
  this.portrait=root.querySelector('[data-role=dialogue-portrait]');
  this.pending=new Set();this.generation=0;this.current=null;this.disposed=false;
 }
 release(token){
  token.lease?.release();token.lease=null;
  if(token.surface){token.surface.width=token.surface.height=0;token.surface=null;}
 }
 abort(token){
  if(token?.owner!==this||!['loading','ready'].includes(token.status))return;
  token.status='aborted';token.controller.abort();this.pending.delete(token);this.release(token);
 }
 async prepare(model){
  if(this.disposed)return bad('dialogue.disposed');
  for(const pending of this.pending)this.abort(pending);
  const token={owner:this,generation:++this.generation,model:structuredClone(model),controller:new AbortController(),lease:null,surface:null,name:'',status:'loading'};
  this.pending.add(token);
  try{
   if(model){
    token.name=this.format(model.nameKey);if(typeof token.name!=='string')throw new Error('dialogue.name.invalid');
    if(model.portraitAssetId){
     const loaded=await this.assets.acquire([model.portraitAssetId],{revision:this.revision,signal:token.controller.signal});
     if(this.disposed||token.status==='aborted'||token.generation!==this.generation){if(loaded.ok)loaded.value.release();return bad('dialogue.load.stale');}
     if(!loaded.ok){this.abort(token);return loaded;}
     token.lease=loaded.value;const image=token.lease.get(model.portraitAssetId);
     if(!image||!(image.width>0)||!(image.height>0))throw new Error('dialogue.portrait.invalid');
     token.surface=this.root.ownerDocument.createElement('canvas');token.surface.width=image.width;token.surface.height=image.height;
     token.surface.getContext('2d').drawImage(image,0,0);
    }
   }
   token.status='ready';return success(token);
  }catch{this.abort(token);return bad('dialogue.prepare.failed');}
 }
 paint(token,name=token?.name??''){
  const model=token?.model??null,surface=token?.surface;
  if(surface){this.portrait.width=surface.width;this.portrait.height=surface.height;this.portrait.getContext('2d').drawImage(surface,0,0);}
  else this.portrait.width=this.portrait.height=0;
  this.portrait.hidden=!surface;this.root.dataset.portrait=String(!!surface);this.name.textContent=name;this.root.hidden=model===null;
  this.root[OWNER]=this;
 }
 commit(token){
  if(this.disposed||token?.owner!==this||token.status!=='ready'||token.generation!==this.generation)return bad('dialogue.load.stale');
  const previousOwner=this.root[OWNER];
  try{this.paint(token);}catch{previousOwner?.renderCurrent();this.abort(token);return bad('dialogue.commit.failed');}
  const previous=this.current;this.current=token;token.status='current';this.pending.delete(token);
  if(previous){previous.status='released';this.release(previous);}
  return success(null);
 }
 renderCurrent(){
  if(this.disposed)return bad('dialogue.disposed');
  try{const name=this.current?.model?this.format(this.current.model.nameKey):'';this.paint(this.current,name);return success(null);}catch{return bad('dialogue.name.invalid');}
 }
 async present(model){
  if(this.disposed)return bad('dialogue.disposed');
  if(this.current&&key(this.current.model)===key(model)&&!this.pending.size)return this.renderCurrent();
  // A new live line must not display the previous speaker during asynchronous load.
  // Explicit prepare() for a transactional restore keeps the live view untouched.
  if(this.root[OWNER]===this)this.root.hidden=true;
  const prepared=await this.prepare(model);return prepared.ok?this.commit(prepared.value):prepared;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.generation++;
  for(const token of this.pending)this.abort(token);
  if(this.current){this.release(this.current);this.current.status='released';this.current=null;}
  if(this.root[OWNER]===this){this.name.textContent='';this.portrait.width=this.portrait.height=0;this.portrait.hidden=true;this.root.hidden=true;delete this.root[OWNER];}
 }
}
