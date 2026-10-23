import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {executeOnce} from '../story/executionLedger.js';
import {spendEnergy} from './energy.js';
import {dayOfWeek} from './calendar.js';
import {archiveEvidence} from './evidence.js';
import {handoffArticle} from './publication.js';
import {grantQuestRewards,actionEnergyCost} from './progression.js';
const bad=code=>failure(diagnostic(code,'gameplay','/quest'));
export function questAvailable(state,quest){const {day}=state.gameplay.calendar;return day>=quest.firstDay&&day<=quest.lastDay&&quest.prerequisites.every(id=>state.gameplay.quests[id]?.status==='completed');}
export function completeQuest(current,quest,definitions){
 if(current.gameplay.quests[quest.id].status==='completed')return success({state:current,outcomes:[]});
 return executeOnce(current,'quest.complete/'+quest.id,()=>{
  let state=structuredClone(current),progress=state.gameplay.quests[quest.id];if(!quest.steps.every(step=>progress.materialIds.includes(step.materialId)))return bad('quest.materials.incomplete');
  progress.status='completed';progress.completedDay=state.gameplay.calendar.day;progress.proposal=null;
  const archived=archiveEvidence(state,quest);if(!archived.ok)return archived;state=archived.value;
  const rewarded=grantQuestRewards(state,quest,progress.performerId,definitions);if(!rewarded.ok)return rewarded;state=handoffArticle(rewarded.value,quest,progress.performerId,definitions);
  return success({state,outcomes:[{type:'quest.completed',questId:quest.id,performerId:progress.performerId,evidenceIds:quest.defenseEvidence.map(card=>card.id),findingIds:quest.attackFindings.map(finding=>finding.id)}]});
 });
}
export function questCommand(current,command,definitions){
 const quest=definitions.quests.find(q=>q.id===command.questId);if(!quest)return bad('quest.unknown');
 let state=structuredClone(current),progress=state.gameplay.quests[quest.id];
 if(command.action==='quest.listen'){
  if(quest.type!=='general'||progress.status!=='available'||!questAvailable(state,quest))return bad('quest.listen.unavailable');
  const spent=spendEnergy(state,quest.delegation.listenCost);if(!spent.ok)return spent;state=spent.value;state.gameplay.quests[quest.id].status='listened';return success({state,outcomes:[{type:'quest.listened',questId:quest.id}]});
 }
 if(command.action==='quest.start'){
  if(command.performerId!==definitions.balance.playerId||progress.status!==(quest.type==='general'?'listened':'available')||!questAvailable(state,quest))return bad('quest.start.unavailable');
  progress.status='active';progress.performerId=command.performerId;progress.proposal=null;return success({state,outcomes:[{type:'quest.started',questId:quest.id}]});
 }
 if(command.action==='quest.collect'){
  const step=quest.steps.find(s=>s.id===command.stepId);if(!step)return bad('quest.step.unknown');
  if(progress.materialIds.includes(step.materialId))return success({state,outcomes:[]});
  if(progress.status!=='active'||progress.performerId!==definitions.balance.playerId||!questAvailable(state,quest)||quest.steps[progress.materialIds.length]?.id!==step.id)return bad('quest.step.unavailable');
  const schedule=definitions.schedules.find(s=>s.id===step.scheduleId),calendar=state.gameplay.calendar;
  if(!schedule||calendar.day<schedule.firstDay||calendar.day>schedule.lastDay||!schedule.daysOfWeek.includes(dayOfWeek(calendar.day,definitions.balance))||!schedule.periods.includes(calendar.period)||state.world.sceneId!==schedule.sceneId)return bad('quest.source.unavailable');
  const cost=actionEnergyCost(state,step.energyCost,progress.performerId,step.skillId,definitions,step.minEnergyCost),spent=spendEnergy(state,cost);if(!spent.ok)return spent;state=spent.value;state.gameplay.quests[quest.id].materialIds.push(step.materialId);
  if(quest.steps.every(s=>state.gameplay.quests[quest.id].materialIds.includes(s.materialId)))return completeQuest(state,quest,definitions);
  return success({state,outcomes:[{type:'quest.materialCollected',questId:quest.id,materialId:step.materialId}]});
 }
 return bad('command.unknown');
}
