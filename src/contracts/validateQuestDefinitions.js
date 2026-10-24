/** Evidence provenance and mandatory route checks use the exact runtime definitions. */
export function validateQuestDefinitions({catalog,balance,progression,publication,add,label}){
 const quests=catalog.list('quests'),questMap=new Map(quests.map(quest=>[quest.id,quest])),skills=new Set(progression.skills.map(skill=>skill.id)),stats=new Set(progression.statIds),items=new Set(progression.items.map(item=>item.id)),outputs=new Set(),materials=new Set(),articles=new Set();
 for(const quest of quests){
  const bad=path=>add('quests',quest.id,'quest.invalid',path),materialIds=new Set(quest.steps.map(step=>step.materialId));
  if(!label(quest.nameKey)||quest.firstDay<1||quest.lastDay<quest.firstDay||quest.lastDay>balance.calendar.totalDays)bad('/');
  if(new Set(quest.steps.map(step=>step.id)).size!==quest.steps.length||materialIds.size!==quest.steps.length)bad('/steps');
  for(const [i,step]of quest.steps.entries()){
   if(!catalog.get('schedules',step.scheduleId).ok||!skills.has(step.skillId)||step.energyCost<balance.minActionCost||step.minEnergyCost<balance.minActionCost||step.minEnergyCost>step.energyCost)bad(`/steps/${i}`);
   if(materials.has(step.materialId))bad(`/steps/${i}/materialId`);materials.add(step.materialId);
  }
  if(quest.prerequisites.some(id=>!questMap.has(id)||quest.type==='main'&&questMap.get(id)?.type!=='main'))bad('/prerequisites');
  if(!skills.has(quest.rewards.skillId)||quest.rewards.items.some(id=>!items.has(id))||quest.rewards.teamBond>0&&quest.type!=='main')bad('/rewards');
  if(articles.has(quest.article.id))bad('/article/id');articles.add(quest.article.id);
  if(!stats.has(quest.article.surplusStat)||quest.article.attraction<1||quest.article.attraction>publication.attractionCap||quest.article.exploitation>1||quest.article.verification>1)bad('/article');
  if(quest.type==='main'?quest.defenseEvidence.length>0:quest.defenseEvidence.length<1)bad('/defenseEvidence');
  for(const [i,card]of quest.defenseEvidence.entries()){
   if(card.quality!==(quest.type==='side'?'high':'standard'))bad(`/defenseEvidence/${i}/quality`);
   if(!label(card.nameKey)||!materialIds.has(card.materialId)||outputs.has(card.id))bad(`/defenseEvidence/${i}`);outputs.add(card.id);
  }
  for(const [i,finding]of quest.attackFindings.entries()){if(!label(finding.nameKey)||!materialIds.has(finding.materialId)||outputs.has(finding.id))bad(`/attackFindings/${i}`);outputs.add(finding.id);}
  if(quest.type==='general'){
   const d=quest.delegation;if(!d){bad('/delegation');continue;}
   if(d.listenCost<balance.minActionCost||d.assignmentCost<balance.minActionCost||!(d.requiredWork>0)||!stats.has(d.statId)||d.speeds.some((speed,i)=>!(speed.work>0)||i>0&&speed.minimum<=d.speeds[i-1].minimum))bad('/delegation');
   const larger=quests.filter(q=>q.type!=='general').map(q=>q.steps.reduce((sum,step)=>sum+step.minEnergyCost,0));if(quest.steps.reduce((sum,step)=>sum+step.energyCost,0)+d.listenCost>=Math.min(...larger))bad('/steps');
  }else if(quest.delegation)bad('/delegation');
 }
 const visiting=new Set(),visited=new Set();
 const visit=id=>{if(visiting.has(id)){add('quests',id,'quest.prerequisite.cycle','/prerequisites');return;}if(visited.has(id)||!questMap.has(id))return;visiting.add(id);questMap.get(id).prerequisites.forEach(visit);visiting.delete(id);visited.add(id);};quests.forEach(quest=>visit(quest.id));
 for(const [i,route]of balance.requiredRoutes.entries()){
  const reached=new Set();const include=id=>{if(reached.has(id)||!questMap.has(id))return;reached.add(id);questMap.get(id).prerequisites.forEach(include);};route.mainQuestIds.forEach(include);
  if([...reached].some(id=>questMap.get(id)?.type!=='main')||route.mainQuestIds.some(id=>!questMap.has(id))||route.requiredFindingIds.some(id=>![...reached].some(questId=>questMap.get(questId).attackFindings.some(finding=>finding.id===id))))add('balance',balance.id,'quest.mainRoute.invalid',`/requiredRoutes/${i}`);
 }
}
