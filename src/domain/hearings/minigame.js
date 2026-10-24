import {success} from '../../contracts/Diagnostic.js';
import {FlagStore} from '../story/FlagStore.js';
import {hearingFailure} from './common.js';
// Numeric normalization prevents cadence-dependent floating point boundary drift.
const seconds=value=>Math.round(value*1e9)/1e9;
export function createMini(balance,mode){return {mode,status:'playing',elapsed:0,hp:balance.minigame.hpMax,laneId:balance.minigame.lanes[0],spawnCursor:0,projectiles:[],resolvedIds:[],hitIds:[],blocks:0,hits:0};}
const inWindow=(projectile,definition,balance)=>projectile.age>=seconds(definition.travel-balance.minigame.hitWindow)&&projectile.age<=seconds(definition.travel+balance.minigame.hitWindow);
function resolveProjectile(mini,projectile,definition,blocked,outcomes){
 mini.projectiles=mini.projectiles.filter(item=>item.id!==projectile.id);mini.resolvedIds.push(projectile.id);
 if(blocked)mini.blocks++;else{mini.hits++;mini.hitIds.push(projectile.id);mini.hp=Math.max(0,mini.hp-definition.damage);}outcomes.push({type:blocked?'hearing.projectileBlocked':'hearing.projectileHit',projectileId:projectile.id});
}
function tickMini(hearing,delta,definition,balance,outcomes){
 const mini=hearing.mini,projectiles=definition.attack.projectiles;mini.elapsed=Math.min(balance.minigame.duration,seconds(mini.elapsed+delta));
 while(mini.spawnCursor<projectiles.length&&projectiles[mini.spawnCursor].at<=mini.elapsed){const projectile=projectiles[mini.spawnCursor++];mini.projectiles.push({id:projectile.id,laneId:projectile.laneId,age:seconds(mini.elapsed-projectile.at)});}
 for(const projectile of [...mini.projectiles]){
  const source=projectiles.find(item=>item.id===projectile.id);projectile.age=seconds(mini.elapsed-source.at);
  if(mini.mode==='easy'&&projectile.laneId===mini.laneId&&inWindow(projectile,source,balance))resolveProjectile(mini,projectile,source,true,outcomes);
  else if(projectile.age>seconds(source.travel+balance.minigame.hitWindow)||mini.elapsed>=balance.minigame.duration)resolveProjectile(mini,projectile,source,false,outcomes);
 }
 if(mini.hp<=0){mini.status='failed';hearing.stage='miniFailed';outcomes.push({type:'hearing.miniFailed'});}
 else if(mini.elapsed>=balance.minigame.duration){mini.status='complete';hearing.stage='finalShot';hearing.finalShot={elapsed:0,taps:0};outcomes.push({type:'hearing.finalShotStarted'});}
}
export function minigameCommand(current,command,{bundle},definition,balance){
 const state=structuredClone(current),h=state.gameplay.hearing,outcomes=[];
 if(command.action==='mini.mode'&&['crashout','miniFailed'].includes(h.stage)){
  if(!balance.minigame.modes.includes(command.modeId))return hearingFailure('hearing.mode.invalid');h.miniMode=command.modeId;return success({state,outcomes});
 }
 if(command.action==='advance'&&h.stage==='crashout'||command.action==='mini.retry'&&h.stage==='miniFailed'){
  h.mini=createMini(balance,h.miniMode);h.finalShot=null;h.stage='minigame';return success({state,outcomes:[{type:'hearing.miniStarted',mode:h.miniMode}]});
 }
 if(command.action==='tick'){
  if(!Number.isFinite(command.delta)||command.delta<0||command.delta>balance.minigame.maxDelta)return hearingFailure('hearing.delta.invalid');
  if(h.stage==='minigame')tickMini(h,command.delta,definition,balance,outcomes);
  else if(h.stage==='finalShot'){
   h.finalShot.elapsed=Math.min(balance.minigame.finalDuration,seconds(h.finalShot.elapsed+command.delta));
   if(h.finalShot.elapsed>=balance.minigame.finalDuration){
    if(h.hp!==0||h.solvedFlawIds.length!==definition.attack.rounds.length||h.mini.status!=='complete'||h.mini.hp<=0)return hearingFailure('hearing.progress.incomplete');
    const flag=bundle.catalog.get('flags',definition.attack.victoryFlagId);if(!flag.ok||flag.value.scope!=='run'||!FlagStore.accepts(flag.value,true))return hearingFailure('hearing.victoryFlag.invalid');
    const identity='hearing.won/'+definition.id;if(state.executionLedger.includes(identity))return hearingFailure('hearing.alreadyWon');state.executionLedger.push(identity);state.gameplay.flags[flag.value.id]=true;h.status='won';h.stage='verdict';outcomes.push({type:'hearing.won',definitionId:definition.id});
   }
  }else return hearingFailure('hearing.intent.unavailable');
  return success({state,outcomes});
 }
 if(command.action==='final.tap'&&h.stage==='finalShot'){h.finalShot.taps++;return success({state,outcomes});}
 if(h.stage!=='minigame')return hearingFailure('hearing.intent.unavailable');
 if(command.action==='mini.move'){
  if(!balance.minigame.lanes.includes(command.laneId))return hearingFailure('hearing.lane.invalid');h.mini.laneId=command.laneId;return success({state,outcomes});
 }
 if(command.action==='mini.block'&&h.mini.mode==='normal'){
  const candidates=h.mini.projectiles.filter(projectile=>projectile.laneId===h.mini.laneId&&inWindow(projectile,definition.attack.projectiles.find(item=>item.id===projectile.id),balance)).slice(0,balance.minigame.blockCapacity);
  for(const projectile of candidates)resolveProjectile(h.mini,projectile,definition.attack.projectiles.find(item=>item.id===projectile.id),true,outcomes);return success({state,outcomes});
 }
 return hearingFailure('hearing.intent.unavailable');
}
