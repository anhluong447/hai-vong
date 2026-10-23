import {diagnostic} from '../../contracts/Diagnostic.js';
import {eligibleDefense} from '../gameplay/evidence.js';
import {atmosphereAt,hearingAvailable} from './common.js';
import {defenseMatch} from './defenseMatch.js';
import {defenseCommand} from './defense.js';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value),unique=values=>Array.isArray(values)&&new Set(values).size===values.length,count=value=>Number.isSafeInteger(value)&&value>=0,bounded=(value,max)=>Number.isFinite(value)&&value>=0&&value<=max;
const sameSet=(a,b)=>a.length===b.length&&a.every(value=>b.includes(value)),seconds=value=>Math.round(value*1e9)/1e9;
const sameJSON=(a,b)=>a===b||object(a)&&object(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&sameJSON(a[key],b[key]))||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,index)=>sameJSON(value,b[index]));
/** Rebuild the bounded authored Defense history with the same pure transitions. */
function replayDefense(h,definition,state,bundle,summary=false){
 const minimum=bundle.catalog.get('hearingBalance',definition.balanceId).value.defense.minGauge;
 let replay=structuredClone(state);replay.gameplay.hearing=null;for(const id of h.discardedIds)replay.gameplay.evidence.defense[id].used=false;
 replay.executionLedger=replay.executionLedger.filter(id=>id!=='hearing.won/'+definition.defense.attackId);
 const run=command=>{const result=defenseCommand(replay,command,{bundle});if(!result.ok)return false;replay=result.value.state;return true;};
 if(!run({action:'defense.start',hearingId:definition.id}))return false;
 for(const [i,row]of h.history.entries()){
  const resolve=when=>{
   const current=replay.gameplay.hearing;if(current.phase!=='defense'||current.stage!=='bailout'||current.bailoutResume!==when)return true;
   const last=i===h.history.length-1;if(!summary&&last&&h.stage==='bailout'&&h.bailoutResume===when)return true;
   const failed=!summary&&last&&h.status==='defeat'&&h.gauge===minimum&&(when==='response'?row.response===null:row.response!==null),bailout=definition.defense.bailout;
   return run({action:'defense.bailout',choiceId:failed?bailout.choices.find(choice=>choice.id!==bailout.correctChoiceId).id:bailout.correctChoiceId});
  };
  if(!resolve('response'))return false;
  if(row.response!==null&&replay.gameplay.hearing.stage==='response'&&!run({action:'defense.respond',evidenceId:row.response.evidenceId}))return false;
  if(!resolve('result'))return false;
  if(i<h.history.length-1&&!run({action:'advance'}))return false;
 }
 const actual=summary?replay.gameplay.hearing.defenseResult:replay.gameplay.hearing;
 return sameJSON(actual,h);
}
function validDefense(h,definition,balance,state,summary=false){
 const d=definition.defense,index=summary?d.questions.length-1:h.questionIndex;
 if(!object(h)||!Number.isInteger(h.gauge)||h.gauge<balance.defense.minGauge||h.gauge>balance.defense.maxGauge||!Number.isInteger(index)||index<0||index>=d.questions.length||typeof h.bailoutUsed!=='boolean'||!unique(h.discardedIds)||!Array.isArray(h.history)||h.history.length!==index+1||h.atmosphereId!==atmosphereAt(h.gauge,balance))return false;
 const currentAvailable=eligibleDefense(state,d.articleWindow).map(card=>card.id),pool=summary?[...currentAvailable,...h.discardedIds]:h.eligibleEvidenceIds;
 if(!unique(pool)||!sameSet(pool,[...currentAvailable,...h.discardedIds])||h.discardedIds.some(id=>!pool.includes(id)||!state.gameplay.evidence.defense[id]?.used))return false;
 for(const id of pool){const card=state.gameplay.evidence.defense[id],article=card&&state.gameplay.publication.published[card.articleId];if(!card||card.phase!=='defense'||!article||article.publishedDay<d.articleWindow.fromDay||article.publishedDay>d.articleWindow.toDay)return false;}
 const used=[];
 for(const [i,row]of h.history.entries()){
  const question=d.questions[i];if(!object(row)||row.questionId!==question.id||row.damage!==question.damage||!Number.isInteger(row.gaugeBefore)||row.gaugeBefore<balance.defense.minGauge||row.gaugeBefore>balance.defense.maxGauge||i===0&&row.gaugeBefore!==balance.defense.startGauge||row.gaugeAfterDamage!==Math.max(balance.defense.minGauge,Math.min(balance.defense.maxGauge,row.gaugeBefore-row.damage)))return false;
  if(row.response===null){if(i!==index||summary)return false;continue;}
  const response=row.response;if(!object(response)||response.evidenceId!==null&&!pool.includes(response.evidenceId))return false;const effect=defenseMatch(response.evidenceId===null?null:state.gameplay.evidence.defense[response.evidenceId],question,balance);
  if(!effect.ok||effect.value.result!==response.result||effect.value.points!==response.points)return false;if(response.evidenceId!==null)used.push(response.evidenceId);
 }
 if(!unique(used)||!sameSet(used,h.discardedIds))return false;
 if(summary)return h.gauge>0;
 if(h.stage==='bailout')return h.status==='active'&&h.bailoutUsed&&h.gauge===balance.defense.minGauge&&['response','result'].includes(h.bailoutResume)&&(h.bailoutResume==='response')===(h.history.at(-1).response===null);
 if(h.bailoutResume!==null)return false;
 if(h.stage==='response')return h.status==='active'&&h.gauge>balance.defense.minGauge&&h.history.at(-1).response===null&&currentAvailable.length>0;
 if(h.stage==='result')return h.status==='active'&&h.gauge>balance.defense.minGauge&&index<d.questions.length-1&&h.history.at(-1).response!==null;
 return h.stage==='verdict'&&h.status==='defeat'&&h.gauge<=0;
}
function validMini(mini,h,definition,balance){
 const sources=definition.attack.projectiles,m=balance.minigame;
 if(!object(mini)||!m.modes.includes(mini.mode)||h.stage!=='miniFailed'&&mini.mode!==h.miniMode||!bounded(mini.elapsed,m.duration)||!bounded(mini.hp,m.hpMax)||!m.lanes.includes(mini.laneId)||!count(mini.spawnCursor)||mini.spawnCursor!==sources.filter(source=>source.at<=mini.elapsed).length||!Array.isArray(mini.projectiles)||mini.projectiles.some(projectile=>!object(projectile))||!unique(mini.projectiles.map(projectile=>projectile.id))||!unique(mini.resolvedIds)||!unique(mini.hitIds)||!count(mini.blocks)||!count(mini.hits)||mini.hits!==mini.hitIds.length||mini.blocks+mini.hits!==mini.resolvedIds.length||mini.hitIds.some(id=>!mini.resolvedIds.includes(id)))return false;
 const spawned=sources.slice(0,mini.spawnCursor).map(source=>source.id),owned=[...mini.projectiles.map(projectile=>projectile.id),...mini.resolvedIds];if(!unique(owned)||!sameSet(spawned,owned))return false;
 for(const projectile of mini.projectiles){const source=sources.find(source=>source.id===projectile.id);if(!object(projectile)||!source||projectile.laneId!==source.laneId||projectile.age!==seconds(mini.elapsed-source.at)||projectile.age<0||projectile.age>seconds(source.travel+m.hitWindow))return false;}
 for(const id of mini.resolvedIds){const source=sources.find(source=>source.id===id),hit=mini.hitIds.includes(id);if(hit?mini.elapsed<=seconds(source.at+source.travel+m.hitWindow)&&mini.elapsed<m.duration:mini.elapsed<seconds(source.at+source.travel-m.hitWindow))return false;}
 const damage=mini.hitIds.reduce((sum,id)=>sum+sources.find(source=>source.id===id).damage,0);if(mini.hp!==Math.max(0,m.hpMax-damage))return false;
 if(h.stage==='minigame')return mini.status==='playing'&&mini.hp>0&&mini.elapsed<m.duration;
 if(h.stage==='miniFailed')return mini.status==='failed'&&mini.hp===0;
 return mini.status==='complete'&&mini.hp>0&&mini.elapsed===m.duration&&mini.projectiles.length===0;
}
export function validateHearingState(state,bundle){
 const h=state.gameplay.hearing,runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,bad=()=>[diagnostic('state.hearing.invalid','snapshot','/gameplay/hearing')];
 if(h===undefined)return runtime?.hearingBalanceId?bad():[];if(h===null)return [];
 if(!object(h)||!['defense','attack'].includes(h.phase))return bad();
 const definition=bundle.catalog.get('hearings',h.definitionId).value,balance=bundle.catalog.get('hearingBalance',h.balanceId).value;
 if(!definition||!balance||definition.mode!==h.phase||definition.balanceId!==h.balanceId||!hearingAvailable(state,definition,bundle).ok||!['idle','end'].includes(state.story.waiting)||state.world.pending||state.gameplay.calendar.pending)return bad();
 if(h.phase==='defense')return validDefense(h,definition,balance,state)&&replayDefense(h,definition,state,bundle)?[]:bad();
 const a=definition.attack,summary=h.defenseResult,defense=summary&&bundle.catalog.get('hearings',summary.definitionId).value;
 if(!defense||defense.mode!=='defense'||defense.defense.attackId!==definition.id||!validDefense(summary,defense,balance,state,true)||!replayDefense(summary,defense,state,bundle,true))return bad();
 const tier=balance.defense.heartTiers.find(tier=>summary.gauge>=tier.min&&summary.gauge<=tier.max);
 if(!tier||summary.bonusHearts!==tier.bonus||h.atmosphereId!==summary.atmosphereId||h.maxHearts!==balance.attack.baseHearts+tier.bonus||!bounded(h.hearts,h.maxHearts)||h.hearts<=0||!count(h.recoveryCount)||typeof h.confrontationShown!=='boolean'||!count(h.roundIndex)||h.roundIndex>=a.rounds.length||!unique(h.solvedFlawIds)||h.solvedFlawIds.length>a.rounds.length||h.solvedFlawIds.some((id,index)=>id!==a.rounds[index].id)||h.maxHp!==a.maxHp||h.hp!==a.maxHp-a.rounds.slice(0,h.solvedFlawIds.length).reduce((sum,round)=>sum+round.damage,0)||!balance.minigame.modes.includes(h.miniMode))return bad();
 const early=['narration','recap','question','recovery'],later=['result','confrontation','crashout','minigame','miniFailed','finalShot','verdict'];
 if(![...early,...later].includes(h.stage)||h.roundIndex!==h.solvedFlawIds.length-(early.includes(h.stage)?0:1)||!unique(h.lockedQuestionIds))return bad();
 const round=a.rounds[h.roundIndex];if(h.lockedQuestionIds.some(id=>id===round.correctQuestionId||!round.questions.some(question=>question.id===id)))return bad();
 if(['narration','recap','recovery'].includes(h.stage)?h.selectedWordId!==null||h.lockedQuestionIds.length>0:h.selectedWordId!==round.correctWordId)return bad();
 let remaining=a.maxHp,crossed=false;for(const solved of a.rounds.slice(0,h.solvedFlawIds.length)){remaining-=solved.damage;if(remaining>0&&remaining<a.maxHp*balance.attack.confrontationRatio)crossed=true;}if(h.confrontationShown!==crossed)return bad();
 const timed=['minigame','miniFailed','finalShot','verdict'].includes(h.stage);if(timed?!validMini(h.mini,h,definition,balance):h.mini!==null)return bad();
 if(['crashout','minigame','miniFailed','finalShot','verdict'].includes(h.stage)&&(h.hp!==0||h.solvedFlawIds.length!==a.rounds.length))return bad();
 if(['finalShot','verdict'].includes(h.stage)){if(!object(h.finalShot)||!bounded(h.finalShot.elapsed,balance.minigame.finalDuration)||!count(h.finalShot.taps))return bad();}else if(h.finalShot!==null)return bad();
 const wonIdentity='hearing.won/'+definition.id;
 if(h.status==='won')return h.stage==='verdict'&&h.finalShot.elapsed===balance.minigame.finalDuration&&state.gameplay.flags[a.victoryFlagId]===true&&state.executionLedger.includes(wonIdentity)?[]:bad();
 return h.status==='active'&&h.stage!=='verdict'&&!state.executionLedger.includes(wonIdentity)?[]:bad();
}
