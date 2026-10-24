import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export function archiveEvidence(current,quest){
 const state=structuredClone(current),progress=state.gameplay.quests[quest.id],evidence=state.gameplay.evidence;
 for(const [phase,definitions]of [['defense',quest.defenseEvidence],['attack',quest.attackFindings]])for(const item of definitions){
  if(!progress.materialIds.includes(item.materialId)||Object.hasOwn(evidence[phase],item.id))return failure(diagnostic('evidence.provenance.invalid','gameplay','/evidence'));
  evidence[phase][item.id]={...structuredClone(item),sourceQuestId:quest.id,articleId:quest.article.id,phase,acquiredDay:state.gameplay.calendar.day,used:false};
 }
 return success(state);
}
export function eligibleDefense(state,{fromDay,toDay}){
 return Object.values(state.gameplay.evidence.defense).filter(card=>{const article=state.gameplay.publication.published[card.articleId];return !card.used&&!!article&&article.publishedDay>=fromDay&&article.publishedDay<=toDay;});
}
