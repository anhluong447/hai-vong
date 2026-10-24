import {element} from './uiNodes.js';
import {hearingText,hearingButton} from './hearingNodes.js';
export class HearingMinigameView {
 constructor(root,ports){Object.assign(this,{root,...ports});}
 render(model){
  const {root,format,ui,dispatch}=this,{hearing:h,balance,definition}=model;root.replaceChildren();this.projectiles=new Map();this.field=null;
  if(h.stage==='miniFailed'){hearingText(root,format(ui.labels.retry));for(const mode of balance.minigame.modes){const node=hearingButton(root,format(ui.modeKeys[mode]),'mini.mode',mode,dispatch);node.setAttribute('aria-pressed',String(mode===h.miniMode));}hearingButton(root,format(ui.labels.retry),'mini.retry',undefined,dispatch);return;}
  if(h.stage==='finalShot'){hearingText(root,format(definition.attack.finalKey));hearingButton(root,format(ui.labels.tap),'final.tap',undefined,dispatch);return;}
  const field=element(root,'div',{'data-role':'hearing-field',tabindex:'0',role:'group','aria-label':format(ui.labels.field)});root.append(field);this.field=field;
  for(const lane of balance.minigame.lanes){const node=element(root,'span',{'data-role':'hearing-lane'});node.textContent=format(ui.laneKeys[lane]);node.style.top=ui.field.laneY[lane]*100+'%';field.append(node);}
  this.player=element(root,'span',{'data-role':'hearing-player'});this.player.textContent=format(ui.labels.player);this.player.style.left=ui.field.targetX*100+'%';field.append(this.player);
  for(const lane of balance.minigame.lanes)hearingButton(root,format(ui.laneKeys[lane]),'mini.move',lane,dispatch);
  if(h.mini.mode==='normal')hearingButton(root,format(ui.labels.block),'mini.block',undefined,dispatch);
  this.hint=hearingText(root,'');this.update(model);
 }
 update({hearing:h,definition,balance,hint}){
  if(!this.field||h.stage!=='minigame')return;const {field,ui,format}=this;this.hint.textContent=hint;this.player.style.top=ui.field.laneY[h.mini.laneId]*100+'%';
  for(const [id,node]of this.projectiles)if(!h.mini.projectiles.some(p=>p.id===id)){node.remove();this.projectiles.delete(id);}
  for(const projectile of h.mini.projectiles){const source=definition.attack.projectiles.find(p=>p.id===projectile.id);let node=this.projectiles.get(projectile.id);
   if(!node){node=element(field,'span',{'data-role':'hearing-projectile'});node.dataset.id=projectile.id;node.textContent=format(source.textKey);field.append(node);this.projectiles.set(projectile.id,node);}
   node.style.top=ui.field.laneY[projectile.laneId]*100+'%';node.style.left=(ui.field.sourceX+(ui.field.targetX-ui.field.sourceX)*Math.min(1,projectile.age/source.travel))*100+'%';
  }
 }
}
