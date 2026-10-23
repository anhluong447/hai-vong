import {success} from '../../contracts/Diagnostic.js';
import {resolveHearing,hearingAvailable,hearingFailure} from './common.js';
import {minigameCommand} from './minigame.js';
/** Attack starts only from a validated positive Defense verdict and authored Main facts. */
export function startAttack(current,id,defenseResult,{bundle}){
 const resolved=resolveHearing(bundle,id,'attack');if(!resolved.ok)return resolved;const {definition,balance}=resolved.value,available=hearingAvailable(current,definition,bundle);if(!available.ok)return available;
 const state=structuredClone(current),hearts=balance.attack.baseHearts+defenseResult.bonusHearts;
 state.gameplay.hearing={phase:'attack',definitionId:id,balanceId:balance.id,status:'active',stage:'narration',defenseResult:structuredClone(defenseResult),atmosphereId:defenseResult.atmosphereId,hp:definition.attack.maxHp,maxHp:definition.attack.maxHp,hearts,maxHearts:hearts,roundIndex:0,solvedFlawIds:[],selectedWordId:null,lockedQuestionIds:[],recoveryCount:0,confrontationShown:false,miniMode:balance.minigame.defaultMode,mini:null,finalShot:null};
 return success({state,outcomes:[{type:'hearing.attackStarted',definitionId:id,hearts}]});
}
function penalize(hearing,cost,balance,outcomes){
 hearing.hearts=Math.max(0,hearing.hearts-cost);outcomes.push({type:'hearing.mistake',cost});
 if(hearing.hearts<=0){hearing.hearts=Math.min(hearing.maxHearts,balance.attack.mercyHearts);hearing.recoveryCount++;hearing.selectedWordId=null;hearing.lockedQuestionIds=[];hearing.stage='recovery';outcomes.push({type:'hearing.recovered',roundIndex:hearing.roundIndex,hearts:hearing.hearts});}
}
export function attackCommand(current,command,{bundle}){
 const state=structuredClone(current),h=state.gameplay.hearing;if(!h||h.phase!=='attack'||h.status!=='active')return hearingFailure('hearing.attack.unavailable');
 const resolved=resolveHearing(bundle,h.definitionId,'attack');if(!resolved.ok)return resolved;const {definition,balance}=resolved.value,round=definition.attack.rounds[h.roundIndex],outcomes=[];
 if(['crashout','minigame','miniFailed','finalShot'].includes(h.stage))return minigameCommand(state,command,{bundle},definition,balance);
 if(!round)return hearingFailure('hearing.round.invalid');
 if(command.action==='advance'){
  if(h.stage==='narration'||h.stage==='recovery')h.stage='recap';
  else if(['result','confrontation'].includes(h.stage)){
   const next=definition.attack.rounds[h.roundIndex+1];if(!next||next.phase==='confrontation'&&!(h.hp<h.maxHp*balance.attack.confrontationRatio))return hearingFailure('hearing.scriptProgress.invalid');
   h.roundIndex++;h.selectedWordId=null;h.lockedQuestionIds=[];h.stage='narration';
  }else return hearingFailure('hearing.intent.unavailable');
  return success({state,outcomes});
 }
 if(command.action==='attack.word'&&h.stage==='recap'){
  const word=round.recap.find(piece=>piece.kind==='word'&&piece.id===command.wordId);if(!word)return hearingFailure('hearing.word.invalid');
  if(word.id!==round.correctWordId)penalize(h,balance.attack.wrongWord,balance,outcomes);else{h.selectedWordId=word.id;h.stage='question';}
  return success({state,outcomes});
 }
 if(command.action==='attack.question'&&h.stage==='question'){
  const question=round.questions.find(question=>question.id===command.questionId);if(!question||h.lockedQuestionIds.includes(question.id))return hearingFailure('hearing.question.unavailable');
  if(question.id!==round.correctQuestionId){h.lockedQuestionIds.push(question.id);penalize(h,balance.attack.wrongQuestion,balance,outcomes);return success({state,outcomes});}
  if(round.findingIds.some(id=>!state.gameplay.evidence.attack[id]))return hearingFailure('hearing.finding.missing');
  const nextHp=h.hp-round.damage,last=h.roundIndex===definition.attack.rounds.length-1;
  if(h.solvedFlawIds.includes(round.id)||nextHp<0||(nextHp===0)!==last)return hearingFailure('hearing.scriptProgress.invalid');
  h.hp=nextHp;h.solvedFlawIds.push(round.id);outcomes.push({type:'hearing.flawResolved',flawId:round.id,damage:round.damage,hp:h.hp});
  if(last)h.stage='crashout';else if(h.hp<h.maxHp*balance.attack.confrontationRatio&&!h.confrontationShown){h.confrontationShown=true;h.stage='confrontation';}else h.stage='result';
  return success({state,outcomes});
 }
 return hearingFailure('hearing.intent.unavailable');
}
