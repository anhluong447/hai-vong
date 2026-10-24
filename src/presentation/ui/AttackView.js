import {element} from './uiNodes.js';
import {hearingText,hearingButton} from './hearingNodes.js';
export class AttackView {
 constructor(root,ports){Object.assign(this,{root,...ports});}
 render({hearing:h,definition,balance}){
  const {root,format,ui,dispatch}=this,a=definition.attack,round=a.rounds[h.roundIndex];root.replaceChildren();
  if(h.status==='won'){hearingText(root,format(ui.labels.won));hearingButton(root,format(ui.labels.dismiss),'dismiss',undefined,dispatch);return;}
  if(h.stage==='recap'||h.stage==='question'){
   const recap=element(root,'div',{'data-role':'hearing-recap'});root.append(recap);
   for(const piece of round.recap){if(piece.kind==='word'&&h.stage==='recap')hearingButton(recap,format(piece.textKey),'attack.word',piece.id,dispatch);else{const text=element(root,piece.kind==='word'?'u':'span');text.textContent=format(piece.textKey);recap.append(text);}}
   if(h.stage==='question')for(const question of round.questions)hearingButton(root,format(question.textKey),'attack.question',question.id,dispatch,h.lockedQuestionIds.includes(question.id));return;
  }
  const key=h.stage==='confrontation'?a.confrontationKey:h.stage==='crashout'?a.crashKey:h.stage==='recovery'?ui.labels.recovery:round.narrationKey;hearingText(root,format(key));
  if(h.stage==='crashout')for(const mode of balance.minigame.modes){const node=hearingButton(root,format(ui.modeKeys[mode]),'mini.mode',mode,dispatch);node.setAttribute('aria-pressed',String(mode===h.miniMode));}
  hearingButton(root,format(ui.labels.continue),'advance',undefined,dispatch);
 }
}
