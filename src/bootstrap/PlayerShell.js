import {MainMenu} from '../presentation/ui/MainMenu.js';
import {SettingsView} from '../presentation/ui/SettingsView.js';
import {SaveSlotsView} from '../presentation/ui/SaveSlotsView.js';
import {BacklogView} from '../presentation/ui/BacklogView.js';
import {element} from '../presentation/ui/uiNodes.js';
/** Keyboard-native screens share focus ownership and use the same application intents. */
export class PlayerShell {
 constructor({root,format,navigation,actions,focus,saves,repository,getPreferences,changePreferences,remap,defaults,history,start,resume,audio,fullscreen,onPause}){
  Object.assign(this,{root,format,navigation,actions,focus,saves,repository,getPreferences,changePreferences,remap,defaults,history,start,resume,audio,fullscreen,onPause});
  this.content=element(root,'div',{'data-role':'screen-content'});this.message=element(root,'p',{'data-role':'player-message',role:'status'});root.replaceChildren(this.content,this.message);this.screen=null;this.generation=0;
 }
 notify(result,key){this.message.dataset.code=result.ok?key:result.errors[0].code;this.message.textContent=result.ok?this.format(key):this.format('player.error',{code:result.errors[0].code});return result;}
 async open(screen,{returnTo=this.screen??'pause',mode='load'}={}){
  if(this.disposed)return;const generation=++this.generation;this.returnTo=returnTo;this.mode=mode;
  if(this.screen)this.focus.pop();this.screen=screen;this.root.hidden=false;this.onPause();this.message.textContent='';this.message.dataset.code='';this.root.dataset.screen=screen;
  this.root.setAttribute('aria-label',this.format(this.navigation.screenTitles[screen]));
  if(['main','pause'].includes(screen))new MainMenu(this.content,this.format).render(this.navigation[screen],action=>void this.dispatch(action));
  else if(screen==='settings')new SettingsView(this.content,this.format).render(this.getPreferences(),{config:this.navigation,actions:this.actions,
   change:async(key,value)=>{const result=await this.changePreferences(key,value);if(this.disposed||this.screen!=='settings')return;if(!result.ok||key==='locale')await this.open('settings',{returnTo:this.returnTo});this.notify(result,'player.updated');},
   remap:index=>{this.message.dataset.code='player.capture';this.message.textContent=this.format('player.capture');this.remap(index,result=>{if(this.disposed||this.screen!=='settings')return;void this.open('settings',{returnTo:this.returnTo}).then(()=>{this.notify(result,'player.updated');this.content.querySelector(`[data-remap="${index}"]`)?.focus();});});},
   defaults:async()=>{const result=await this.defaults();await this.open('settings',{returnTo:this.returnTo});this.notify(result,'player.updated');},back:()=>void this.back()
  });
  else if(screen==='backlog')new BacklogView(this.content,this.format).render(this.history(),()=>void this.back());
  else if(screen==='slots'){
   const records=await this.repository.list();if(this.disposed||generation!==this.generation)return;
   if(!records.ok){this.notify(records,'player.loaded');this.content.replaceChildren();}else new SaveSlotsView(this.content,this.format).render({config:this.navigation,records:records.value,mode,dispatch:(...args)=>void this.slot(...args),back:()=>void this.back()});
  }
  if(this.disposed||generation!==this.generation)return;this.focus.push(this.root);
 }
 async dispatch(action){
  if(action==='resume'){this.close();this.resume();}
  else if(action==='new'){const result=await this.start();if(result.ok){this.close();this.resume();}else this.notify(result,'player.loaded');}
  else if(action==='continue'){const records=await this.repository.list();if(!records.ok)return this.notify(records,'player.loaded');const latest=records.value[0];if(latest){const result=await this.saves.load(latest.id);if(result.ok){this.close();this.resume();}else this.notify(result,'player.loaded');}}
  else if(action==='load'||action==='save')await this.open('slots',{mode:action,returnTo:this.screen});
  else if(action==='main')await this.open('main');
  else if(action==='settings'||action==='backlog')await this.open(action,{returnTo:this.screen});
  else if(action==='audio')await this.audio();else if(action==='fullscreen')await this.fullscreen();
 }
 async slot(action,id,input){
  if(this.busy)return;this.busy=true;
  try{
   if(action==='export-slot'){const result=await this.saves.export(id);if(this.notify(result,'player.export').ok){input.value=result.value;input.focus();input.select();}return;}
   const result=action==='save-slot'?await this.saves.save(id):action==='load-slot'?await this.saves.load(id):action==='backup-slot'?await this.saves.load(id,{backup:true}):await this.saves.import(id,input.value);
   if(result.ok&&['save-slot','import-slot'].includes(action))await this.open('slots',{mode:this.mode,returnTo:this.returnTo});
   this.notify(result,['save-slot','import-slot'].includes(action)?'player.saved':'player.loaded');
  }finally{this.busy=false;}
 }
 back(){if(this.screen==='main')return;if(this.screen==='pause'){this.close();this.resume();}else void this.open(this.returnTo??'pause');}
 close(){this.generation++;if(this.screen)this.focus.pop();this.screen=null;this.root.hidden=true;}
 snapshot(){return {screen:this.screen,returnTo:this.returnTo,mode:this.mode};}
 restore(state){if(!state?.screen){this.close();return;}void this.open(state.screen,{returnTo:state.returnTo,mode:state.mode});}
 dispose(){this.close();this.disposed=true;}
}
