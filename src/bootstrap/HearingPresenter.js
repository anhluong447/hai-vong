import {element} from '../presentation/ui/uiNodes.js';
import {DefenseView} from '../presentation/ui/DefenseView.js';
import {AttackView} from '../presentation/ui/AttackView.js';
import {HearingMinigameView} from '../presentation/ui/HearingMinigameView.js';
/** Resolves immutable definitions; views emit intents and never calculate outcomes. */
export class HearingPresenter {
 constructor({root,catalog,format,number,focus,dispatch,pause,bindings,separator}){
  Object.assign(this,{root,catalog,format,number,focus,dispatch,pause,bindings,separator});this.owned=false;this.signature=null;this.remembered=null;
  this.title=element(root,'h2');this.stats=element(root,'p',{'data-role':'hearing-stats'});this.mood=element(root,'p');this.body=element(root,'div',{'data-role':'hearing-body'});this.pauseButton=element(root,'button',{'data-hearing-action':'menu'});this.pauseButton.addEventListener('click',pause);root.replaceChildren(this.title,this.stats,this.mood,this.body,this.pauseButton);
 }
 token(){const active=this.root.ownerDocument.activeElement;if(!this.root.contains(active))return this.remembered;return active.dataset.hearingAction?{action:active.dataset.hearingAction,...(active.dataset.id?{id:active.dataset.id}:{})}:active.dataset.role==='hearing-field'?{action:'field'}:this.remembered;}
 release(){if(this.owned){this.remembered=this.token();this.focus.pop();this.owned=false;}}
 sync(state,{paused,locale}){
  const h=state.gameplay.hearing;if(!h){this.release();this.root.hidden=true;this.signature=null;return;}
  const definition=this.catalog.get('hearings',h.definitionId).value,balance=this.catalog.get('hearingBalance',h.balanceId).value,ui=this.catalog.get('config',balance.uiId).value,{format,number}=this;
  this.root.hidden=false;this.root.inert=paused;this.root.setAttribute('aria-hidden',String(paused));this.root.setAttribute('aria-label',format(ui.labels.title,{boss:format(definition.bossKey)}));for(const [key,value]of Object.entries(ui.tokens))this.root.style.setProperty(key,value);
  this.title.textContent=format(ui.labels.title,{boss:format(definition.bossKey)});this.pauseButton.textContent=format(ui.labels.pause);
  const mini=['minigame','miniFailed','finalShot'].includes(h.stage),signature=JSON.stringify([locale,h.phase,h.stage,h.questionIndex,h.roundIndex,h.discardedIds,h.lockedQuestionIds,h.miniMode]);
  const hint=action=>this.bindings().filter(b=>b.action===action).map(b=>b.code).join(this.separator),easy=h.mini?.mode==='easy',model={hearing:h,definition,balance,gameplay:state.gameplay,hint:format(easy?ui.labels.hintEasy:ui.labels.hint,{up:hint('laneUp'),down:hint('laneDown'),...(!easy?{block:hint('deflect')}:{}),menu:hint('menu')})};
  if(signature!==this.signature){
   this.remembered=this.token();this.signature=signature;const View=mini?HearingMinigameView:h.phase==='defense'?DefenseView:AttackView;
   this.view=new View(this.body,{format,number,ui,dispatch:this.dispatch,questName:id=>this.catalog.get('quests',id).value.nameKey});this.view.render(model);
  }
  this.view.update?.(model);
  this.stats.textContent=h.stage==='finalShot'?format(ui.labels.finalStats,{seconds:number(Math.ceil(balance.minigame.finalDuration-h.finalShot.elapsed)),taps:number(h.finalShot.taps)}):mini?format(ui.labels.miniStats,{hp:number(h.mini.hp),seconds:number(Math.ceil(balance.minigame.duration-h.mini.elapsed)),blocks:number(h.mini.blocks)}):h.phase==='defense'?format(ui.labels.defenseStats,{gauge:number(h.gauge)}):format(ui.labels.attackStats,{hearts:number(h.hearts),maxHearts:number(h.maxHearts),hp:number(h.hp),maxHp:number(h.maxHp)});
  this.mood.textContent=format(balance.atmosphere.find(a=>a.id===h.atmosphereId).textKey);
  if(paused)this.release();else{
   if(!this.owned){this.focus.push(this.root);this.owned=true;this.restoreFocus();}
   else if(!this.root.contains(this.root.ownerDocument.activeElement)||this.root.ownerDocument.activeElement.disabled)this.restoreFocus();
  }
 }
 restoreFocus(){const token=this.remembered,node=token?.action==='field'?this.root.querySelector('[data-role=hearing-field]'):[...this.root.querySelectorAll('[data-hearing-action]')].find(node=>node.dataset.hearingAction===token?.action&&node.dataset.id===token?.id&&!node.disabled);(node??this.focus.items(this.body)[0]??this.pauseButton).focus();}
 invalidate(){this.signature=null;}
 dispose(){this.release();this.root.replaceChildren();}
}
