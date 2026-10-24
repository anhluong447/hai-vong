import {hearingText,hearingButton} from './hearingNodes.js';
export class DefenseView {
 constructor(root,ports){Object.assign(this,{root,...ports});}
 render({hearing:h,definition,gameplay}){
  const {root,format,number,ui,dispatch}=this,d=definition.defense;root.replaceChildren();hearingText(root,format(d.questions[h.questionIndex].textKey));
  if(h.stage==='response')for(const id of h.eligibleEvidenceIds){const card=gameplay.evidence.defense[id];if(card.used)continue;
   hearingButton(root,format(ui.labels.card,{name:format(this.questName(card.sourceQuestId)),quality:format(ui.qualityKeys[card.quality]),type:format(ui.typeKeys[card.type])}),'defense.respond',id,dispatch);
  }
  if(h.stage==='bailout'){hearingText(root,format(d.bailout.questionKey));for(const choice of d.bailout.choices)hearingButton(root,format(choice.textKey),'defense.bailout',choice.id,dispatch);}
  if(h.stage==='result'){const response=h.history.at(-1).response;hearingText(root,format(ui.labels.result,{result:format(ui.resultKeys[response.result]),points:number(response.points)}));hearingButton(root,format(ui.labels.continue),'advance',undefined,dispatch);}
  if(h.status==='defeat')hearingText(root,format(ui.labels.defeat));
 }
}
