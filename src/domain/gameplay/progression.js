import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {executeOnce} from '../story/executionLedger.js';
import {spendEnergy} from './energy.js';
import {gameplayDefinitions} from './state.js';
const bad=code=>failure(diagnostic(code,'gameplay','/progression'));
export function grantQuestRewards(current,quest,performerId,definitions){
 const state=structuredClone(current),{rewards}=quest,member=state.gameplay.members[performerId];
 if(!member||!Object.hasOwn(member.skillXP,rewards.skillId)||rewards.teamBond>0&&quest.type!=='main')return failure(diagnostic('progression.reward.invalid','gameplay','/rewards'));
 member.skillXP[rewards.skillId]+=rewards.xp;
 for(const id of rewards.items)state.gameplay.progression.inventory[id]=(state.gameplay.progression.inventory[id]??0)+1;
 state.gameplay.progression.teamBond=Math.min(definitions.progression.bondCap,state.gameplay.progression.teamBond+rewards.teamBond);
 return success(state);
}
export function effectiveStat(state,memberId,statId,definitions){
 const member=state.gameplay.members[memberId];if(!member)return 0;
 const item=definitions.progression.items.find(item=>item.id===state.gameplay.progression.equipment[memberId]),skillBonus=definitions.progression.skills.filter(skill=>skill.statId===statId).reduce((sum,skill)=>sum+skillLevel(member.skillXP[skill.id],skill)*skill.statBonusPerLevel,0);
 return Math.min(definitions.progression.statCap,(member.stats[statId]??0)+skillBonus+(item?.statModifiers[statId]??0));
}
export function skillLevel(xp,definition){return definition.thresholds.filter(threshold=>xp>=threshold).length-1;}
export function actionEnergyCost(state,baseCost,memberId,skillId,definitions,minimumCost=definitions.balance.minActionCost){const skill=definitions.progression.skills.find(s=>s.id===skillId),discount=skill?skillLevel(state.gameplay.members[memberId].skillXP[skillId],skill)*skill.costDiscountPerLevel:0;return Math.max(definitions.balance.minActionCost,minimumCost,baseCost-discount);}
export function performActivity(current,{activityId,memberId},definitions,{night=false}={}){
 const activity=definitions.progression.activities.find(a=>a.id===activityId);if(!activity||activity.kind==='night'&&!night||night&&activity.kind!=='night')return bad('activity.unavailable');
 const target=activity.target==='player'?definitions.balance.playerId:memberId,memberDefinition=definitions.team.members.find(m=>m.id===target),day=current.gameplay.calendar.day;
 if(!memberDefinition||day<memberDefinition.firstDay||day>memberDefinition.lastDay||activity.bond>0&&!Object.hasOwn(current.gameplay.progression.bonds,target)||activity.teamBond>0&&activity.kind!=='special')return bad('activity.target.invalid');
 if(current.gameplay.wallet<activity.walletCost)return bad('wallet.insufficient');const spent=spendEnergy(current,activity.energyCost);if(!spent.ok)return spent;const state=structuredClone(spent.value),member=state.gameplay.members[target];
 state.gameplay.wallet+=activity.walletGain-activity.walletCost;
 for(const [id,delta]of Object.entries(activity.stats))member.stats[id]=Math.min(definitions.progression.statCap,Math.max(0,member.stats[id]+delta));
 for(const [id,xp]of Object.entries(activity.xp))member.skillXP[id]+=xp;
 if(activity.bond)state.gameplay.progression.bonds[target]=Math.min(definitions.progression.bondCap,state.gameplay.progression.bonds[target]+activity.bond);
 state.gameplay.progression.teamBond=Math.min(definitions.progression.bondCap,state.gameplay.progression.teamBond+activity.teamBond);
 return success({state,outcomes:[{type:'progression.activityCompleted',activityId,targetId:target}]});
}
export function progressionCommand(current,command,definitions){
 if(typeof command.identity!=='string'||!command.identity)return bad('command.identity.invalid');
 return executeOnce(current,command.identity,()=>{
  if(command.action==='activity.perform')return performActivity(current,command,definitions);
  let state=structuredClone(current),progression=state.gameplay.progression;
  const itemId=command.action==='equipment.unequip'?progression.equipment[command.memberId]:command.itemId,item=definitions.progression.items.find(item=>item.id===itemId);if(!item)return bad('item.unknown');
  let cost;
  if(command.action==='item.buy'){
   if(state.gameplay.wallet<item.price)return bad('wallet.insufficient');if(item.kind==='equipment'&&(progression.inventory[item.id]??0)>0)return bad('item.alreadyOwned');cost=item.buyEnergyCost;
  }else if(command.action==='item.use'){
   if(item.kind!=='consumable'||!(progression.inventory[item.id]>0))return bad('item.unavailable');cost=item.useEnergyCost;
  }else{
   if(!state.gameplay.members[command.memberId]||item.kind!=='equipment'||!(progression.inventory[item.id]>0))return bad('equipment.unavailable');
   if(command.action==='equipment.equip'&&Object.entries(progression.equipment).filter(([memberId,id])=>memberId!==command.memberId&&id===item.id).length>=progression.inventory[item.id])return bad('equipment.inUse');cost=item.equipEnergyCost;
  }
  const spent=spendEnergy(state,cost);if(!spent.ok)return spent;state=spent.value;progression=state.gameplay.progression;
  if(command.action==='item.buy'){state.gameplay.wallet-=item.price;progression.inventory[item.id]=(progression.inventory[item.id]??0)+1;}
  else if(command.action==='item.use'){progression.inventory[item.id]--;state.gameplay.energy=Math.min(definitions.balance.energy.cap,state.gameplay.energy+item.energyRestore);}
  else if(command.action==='equipment.equip')progression.equipment[command.memberId]=item.id;
  else delete progression.equipment[command.memberId];
  return success({state,outcomes:[{type:'progression.itemChanged',itemId:item.id,action:command.action,memberId:command.memberId??null}]});
 });
}
export const gameplayEffects=Object.freeze({'gameplay.activity':(state,params,{bundle})=>performActivity(state,params,gameplayDefinitions(bundle))});
