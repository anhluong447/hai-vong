import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {isWorkingDay} from './calendar.js';
import {spendEnergy} from './energy.js';
import {effectiveStat} from './progression.js';
import {questAvailable,completeQuest} from './quests.js';
const bad=code=>failure(diagnostic(code,'gameplay','/delegation'));
const rate=(state,quest,memberId,defs)=>quest.delegation.speeds.filter(speed=>effectiveStat(state,memberId,quest.delegation.statId,defs)>=speed.minimum).at(-1)?.work??0;
function finishDay(day,remaining,work,quest,member,defs){
 if(remaining<=0)return day;if(work<=0)return null;
 for(let date=day+1;date<=Math.min(defs.balance.calendar.totalDays,member.lastDay,quest.lastDay);date++)if(date>=member.firstDay&&isWorkingDay(date,defs.balance)){remaining-=work;if(remaining<=0)return date;}
 return null;
}
export function assignmentQuote(state,quest,memberId,defs){
 const member=defs.team.members.find(m=>m.id===memberId),{day,period}=state.gameplay.calendar;
 if(!member||memberId===defs.balance.playerId||day<member.firstDay||day>member.lastDay)return bad('delegation.member.unavailable');
 const work=rate(state,quest,memberId,defs),expectedDay=finishDay(day,quest.delegation.requiredWork,work,quest,member,defs);
 return success({id:JSON.stringify([quest.id,memberId,day,period,quest.delegation.assignmentCost,member.operatingFee.amount,expectedDay]),memberId,energyCost:quest.delegation.assignmentCost,feeAmount:member.operatingFee.amount,feeMode:member.operatingFee.mode,expectedDay});
}
export function delegationCommand(current,command,defs){
 const quest=defs.quests.find(q=>q.id===command.questId);if(!quest||quest.type!=='general'||!questAvailable(current,quest))return bad('delegation.quest.unavailable');
 let state=structuredClone(current),progress=state.gameplay.quests[quest.id];if(progress.status!=='listened')return bad('delegation.listen.required');
 if(command.action==='quest.selectAssignee'){
  const quoted=assignmentQuote(state,quest,command.memberId,defs);if(!quoted.ok)return quoted;progress.proposal=quoted.value;return success({state,outcomes:[{type:'delegation.quoted',questId:quest.id,...quoted.value}]});
 }
 if(command.action!=='quest.confirmAssignment'||!progress.proposal||progress.proposal.id!==command.quoteId)return bad('delegation.quote.stale');
 const quoted=assignmentQuote(state,quest,progress.proposal.memberId,defs);if(!quoted.ok||quoted.value.id!==command.quoteId)return bad('delegation.quote.stale');const quote=quoted.value;
 if(state.gameplay.wallet<quote.feeAmount)return bad('wallet.insufficient');const spent=spendEnergy(state,quote.energyCost);if(!spent.ok)return spent;state=spent.value;progress=state.gameplay.quests[quest.id];
 state.gameplay.wallet-=quote.feeAmount;progress.status='active';progress.performerId=quote.memberId;progress.proposal=null;state.gameplay.delegation.jobs[quest.id]={memberId:quote.memberId,status:'working',assignedDay:state.gameplay.calendar.day,lastFeedbackDay:state.gameplay.calendar.day,workDone:0,expectedDay:quote.expectedDay};
 return success({state,outcomes:[{type:'delegation.assigned',questId:quest.id,memberId:quote.memberId,expectedDay:quote.expectedDay}]});
}
export function advanceDelegation(current,defs){
 let state=structuredClone(current);const outcomes=[],day=state.gameplay.calendar.day;
 for(const [questId,original]of Object.entries(state.gameplay.delegation.jobs)){
  if(original.status==='completed'||original.lastFeedbackDay>=day)continue;const quest=defs.quests.find(q=>q.id===questId),job=state.gameplay.delegation.jobs[questId],member=defs.team.members.find(m=>m.id===job.memberId),work=rate(state,quest,job.memberId,defs);
  let status=!isWorkingDay(day,defs.balance)?'resting':work<=0||day<member.firstDay||day>member.lastDay||day>quest.lastDay?'blocked':'working';job.lastFeedbackDay=day;
  if(status==='working'){job.workDone=Math.min(quest.delegation.requiredWork,job.workDone+work);if(job.workDone>=quest.delegation.requiredWork){job.status='completed';job.expectedDay=day;status='completed';state.gameplay.quests[questId].materialIds=quest.steps.map(step=>step.materialId);const completed=completeQuest(state,quest,defs);if(!completed.ok)return completed;state=completed.value.state;outcomes.push(...completed.value.outcomes);}}
  const updated=state.gameplay.delegation.jobs[questId];updated.expectedDay=finishDay(day,quest.delegation.requiredWork-updated.workDone,work,quest,member,defs);
  const feedback={day,questId,memberId:job.memberId,status,messageKey:defs.team.feedbackKeys[status],expectedDay:updated.expectedDay,evidenceIds:status==='completed'?quest.defenseEvidence.map(card=>card.id):[]};state.gameplay.delegation.feedback.push(feedback);state.gameplay.delegation.feedback=state.gameplay.delegation.feedback.slice(-defs.balance.feedbackLimit);outcomes.push({type:'delegation.feedback',...feedback});
 }
 return success({state,outcomes});
}
