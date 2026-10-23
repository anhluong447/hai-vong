/** Shared semantic resource checks after structural schemas have succeeded. */
export function validateGameplayResources({catalog,balance,team,progression:p,publication:pub,add,label}){
 const c=balance.calendar,stats=new Set(p.statIds),skills=new Set(p.skills.map(skill=>skill.id)),activities=new Map(p.activities.map(activity=>[activity.id,activity])),members=new Set(team.members.map(member=>member.id));
 const unique=(values,kind,id,path)=>{if(new Set(values).size!==values.length)add(kind,id,'gameplay.id.duplicate',path);};
 const inTerm=entry=>entry.firstDay>=1&&entry.lastDay>=entry.firstDay&&entry.lastDay<=c.totalDays;
 const statValues=values=>Object.entries(values).every(([key,value])=>stats.has(key)&&Number.isFinite(value)&&value>=0&&value<=p.statCap);
 if(!members.has(balance.playerId))add('balance',balance.id,'team.player.missing','/playerId');
 unique(p.statIds,'progression',p.id,'/statIds');unique(team.members.map(member=>member.id),'team',team.id,'/members');
 if(!(p.statCap>0)||!(p.bondCap>0))add('progression',p.id,'progression.cap.invalid','/');
 for(const [i,member]of team.members.entries())if(!label(member.nameKey)||!inTerm(member)||Object.keys(member.stats).length!==stats.size||!statValues(member.stats))add('team',team.id,'team.member.invalid',`/members/${i}`);
 if(Object.values(team.feedbackKeys).some(key=>!label(key)))add('team',team.id,'text.key.missing','/feedbackKeys');
 unique(p.skills.map(skill=>skill.id),'progression',p.id,'/skills');
 for(const [i,skill]of p.skills.entries())if(!stats.has(skill.statId)||skill.thresholds[0]!==0||skill.thresholds.some((value,index)=>index>0&&value<=skill.thresholds[index-1]))add('progression',p.id,'skill.invalid',`/skills/${i}`);
 unique(p.items.map(item=>item.id),'progression',p.id,'/items');
 for(const [i,item]of p.items.entries())if(!label(item.nameKey)||!statValues(item.statModifiers)||[item.buyEnergyCost,item.useEnergyCost,item.equipEnergyCost].some(cost=>cost<balance.minActionCost))add('progression',p.id,'item.invalid',`/items/${i}`);
 unique(p.activities.map(activity=>activity.id),'progression',p.id,'/activities');
 for(const [i,activity]of p.activities.entries()){
  const validStats=Object.entries(activity.stats).every(([key,value])=>stats.has(key)&&Number.isFinite(value)&&Math.abs(value)<=p.statCap),validXP=Object.entries(activity.xp).every(([key,value])=>skills.has(key)&&Number.isInteger(value)&&value>=0);
  if(!label(activity.nameKey)||!validStats||!validXP||activity.teamBond>0&&activity.kind!=='special'||activity.bond>0&&activity.target!=='member'||(activity.kind==='night'?activity.energyCost!==0||activity.walletCost!==0||activity.target!=='player':activity.energyCost<balance.minActionCost))add('progression',p.id,'activity.invalid',`/activities/${i}`);
 }
 for(const id of Object.values(balance.energy.nightBenefits))if(activities.get(id)?.kind!=='night')add('balance',balance.id,'activity.night.invalid','/energy/nightBenefits');
 if(pub.weekday<1||pub.weekday>c.daysPerWeek||!c.periods.includes(pub.period)||!(pub.baseScore>0)||!(pub.scoreCap>0)||!(pub.attractionCap>0)||pub.packagingBonus>1)add('publication',pub.id,'publication.invalid','/');
 for(const schedule of catalog.list('schedules'))if(!members.has(schedule.memberId)||!catalog.get('scenes',schedule.sceneId).ok||!inTerm(schedule)||schedule.daysOfWeek.some(day=>day<1||day>c.daysPerWeek)||schedule.periods.some(period=>!c.periods.includes(period)))add('schedules',schedule.id,'schedule.invalid','/');
}
