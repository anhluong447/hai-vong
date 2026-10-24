import {success} from '../../contracts/Diagnostic.js';
import {eligibleDefense} from '../gameplay/evidence.js';
import {resolveHearing,hearingAvailable,hearingFailure,setDefenseGauge} from './common.js';
import {startAttack} from './attack.js';
import {defenseMatch} from './defenseMatch.js';
const availableCards=state=>state.gameplay.hearing.eligibleEvidenceIds.filter(id=>!state.gameplay.evidence.defense[id].used);
function defeat(state,outcomes){const h=state.gameplay.hearing;h.status='defeat';h.stage='verdict';h.bailoutResume=null;outcomes.push({type:'hearing.defenseLost',gauge:h.gauge});return success({state,outcomes});}
function bottom(state,resume,balance,outcomes){
 const h=state.gameplay.hearing;if(h.gauge>balance.defense.minGauge)return false;
 if(h.bailoutUsed)defeat(state,outcomes);else{h.bailoutUsed=true;h.bailoutResume=resume;h.stage='bailout';outcomes.push({type:'hearing.bailoutStarted',resume});}return true;
}
function finishResponse(state,definition,balance,context,outcomes){
 const h=state.gameplay.hearing;if(h.questionIndex<definition.defense.questions.length-1){h.stage='result';return success({state,outcomes});}
 if(h.gauge<=0)return defeat(state,outcomes);
 const tier=balance.defense.heartTiers.find(tier=>h.gauge>=tier.min&&h.gauge<=tier.max);if(!tier)return hearingFailure('hearing.heartTier.invalid');
 const summary={definitionId:definition.id,gauge:h.gauge,bonusHearts:tier.bonus,atmosphereId:h.atmosphereId,bailoutUsed:h.bailoutUsed,discardedIds:structuredClone(h.discardedIds),history:structuredClone(h.history)},attacked=startAttack(state,definition.defense.attackId,summary,context);
 if(!attacked.ok)return attacked;attacked.value.outcomes.unshift(...outcomes,{type:'hearing.defenseWon',gauge:h.gauge,bonusHearts:tier.bonus});return attacked;
}
function respond(state,evidenceId,definition,balance,context,outcomes){
 const h=state.gameplay.hearing,question=definition.defense.questions[h.questionIndex];let card=null;
 if(evidenceId!==null){
  if(!availableCards(state).includes(evidenceId))return hearingFailure('hearing.evidence.unavailable');card=state.gameplay.evidence.defense[evidenceId];
 }
 const effect=defenseMatch(card,question,balance);if(!effect.ok)return effect;const {result,points}=effect.value;if(card){card.used=true;h.discardedIds.push(evidenceId);}
 h.history.at(-1).response={evidenceId,result,points};setDefenseGauge(state,h.gauge+points,balance,outcomes);outcomes.push({type:'hearing.responseCommitted',evidenceId,result,points});
 if(bottom(state,'result',balance,outcomes))return success({state,outcomes});return finishResponse(state,definition,balance,context,outcomes);
}
function enterQuestion(state,definition,balance,context,outcomes){
 const h=state.gameplay.hearing,question=definition.defense.questions[h.questionIndex];if(!question)return hearingFailure('hearing.question.invalid');
 const before=h.gauge;setDefenseGauge(state,before-question.damage,balance,outcomes);h.history.push({questionId:question.id,gaugeBefore:before,damage:question.damage,gaugeAfterDamage:h.gauge,response:null});outcomes.push({type:'hearing.accusationApplied',questionId:question.id,damage:question.damage});
 if(bottom(state,'response',balance,outcomes))return success({state,outcomes});h.stage='response';return availableCards(state).length?success({state,outcomes}):respond(state,null,definition,balance,context,outcomes);
}
export function defenseCommand(current,command,context){
 const {bundle}=context;let state=structuredClone(current),h=state.gameplay.hearing;const outcomes=[];
 if(command.action==='defense.start'){
  if(h||!['idle','end'].includes(state.story.waiting)||state.world.pending||state.gameplay.calendar.pending)return hearingFailure('hearing.busy');
  const resolved=resolveHearing(bundle,command.hearingId,'defense');if(!resolved.ok)return resolved;const {definition,balance}=resolved.value,available=hearingAvailable(state,definition,bundle);if(!available.ok)return available;
  const attack=resolveHearing(bundle,definition.defense.attackId,'attack');if(!attack.ok)return attack;const attackAvailable=hearingAvailable(state,attack.value.definition,bundle);if(!attackAvailable.ok)return attackAvailable;
  if(state.executionLedger.includes('hearing.won/'+definition.defense.attackId))return hearingFailure('hearing.alreadyWon');
  state.world.moving=false;state.gameplay.hearing={phase:'defense',definitionId:definition.id,balanceId:balance.id,status:'active',stage:'response',questionIndex:0,gauge:balance.defense.startGauge,bailoutUsed:false,bailoutResume:null,eligibleEvidenceIds:eligibleDefense(state,definition.defense.articleWindow).map(card=>card.id),discardedIds:[],history:[],atmosphereId:null};
  return enterQuestion(state,definition,balance,context,outcomes);
 }
 if(!h||h.phase!=='defense'||h.status!=='active')return hearingFailure('hearing.defense.unavailable');
 const resolved=resolveHearing(bundle,h.definitionId,'defense');if(!resolved.ok)return resolved;const {definition,balance}=resolved.value;
 if(command.action==='defense.respond'&&h.stage==='response')return respond(state,command.evidenceId,definition,balance,context,outcomes);
 if(command.action==='advance'&&h.stage==='result'){h.questionIndex++;return enterQuestion(state,definition,balance,context,outcomes);}
 if(command.action==='defense.bailout'&&h.stage==='bailout'){
  const choice=definition.defense.bailout.choices.find(choice=>choice.id===command.choiceId);if(!choice)return hearingFailure('hearing.bailout.choice.invalid');if(choice.id!==definition.defense.bailout.correctChoiceId)return defeat(state,outcomes);
  const resume=h.bailoutResume;h.bailoutResume=null;setDefenseGauge(state,balance.defense.minGauge+balance.defense.bailoutRecovery,balance,outcomes);
  if(resume==='result')return finishResponse(state,definition,balance,context,outcomes);h.stage='response';return availableCards(state).length?success({state,outcomes}):respond(state,null,definition,balance,context,outcomes);
 }
 return hearingFailure('hearing.intent.unavailable');
}
