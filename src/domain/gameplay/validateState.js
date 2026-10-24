import {diagnostic} from '../../contracts/Diagnostic.js';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value),count=value=>Number.isSafeInteger(value)&&value>=0,bounded=(value,max)=>Number.isFinite(value)&&value>=0&&value<=max;
/** Saved gameplay is checked before assigning a live session or writing a slot. */
export function validateGameplayDetails(state,definitions){
 const gp=state.gameplay,{balance,team,progression,publication,quests}=definitions,errors=[],add=path=>errors.push(diagnostic('state.gameplay.invalid','snapshot','/gameplay/'+path));
 for(const key of ['members','quests','delegation','publication','evidence','progression'])if(!object(gp[key]))add(key);
 if(!count(gp.wallet))add('wallet');if(!count(gp.audience))add('audience');if(errors.length)return errors;
 const members=new Map(team.members.map(member=>[member.id,member])),questMap=new Map(quests.map(quest=>[quest.id,quest])),itemMap=new Map(progression.items.map(item=>[item.id,item]));
 const day=value=>Number.isInteger(value)&&value>=1&&value<=gp.calendar.day;
 if(Object.keys(gp.members).length!==members.size||Object.keys(gp.members).some(id=>!members.has(id)))add('members');
 for(const [id,member]of Object.entries(gp.members)){
  if(!object(member)||!object(member.stats)||!object(member.skillXP)){add('members/'+id);continue;}
  if(Object.keys(member.stats).length!==progression.statIds.length||progression.statIds.some(stat=>!bounded(member.stats[stat],progression.statCap))||Object.keys(member.skillXP).length!==progression.skills.length||progression.skills.some(skill=>!count(member.skillXP[skill.id])))add('members/'+id);
 }
 if(!object(gp.delegation.jobs)||!Array.isArray(gp.delegation.feedback))add('delegation');
 if(!Array.isArray(gp.publication.queued)||!object(gp.publication.published))add('publication');
 if(!object(gp.evidence.defense)||!object(gp.evidence.attack))add('evidence');
 for(const key of ['inventory','equipment','bonds'])if(!object(gp.progression[key]))add('progression/'+key);
 if(!bounded(gp.progression.teamBond,progression.bondCap))add('progression/teamBond');
 if(errors.length)return errors;
 const bonds=team.members.filter(member=>member.id!==balance.playerId);
 if(Object.keys(gp.progression.bonds).length!==bonds.length||bonds.some(member=>!bounded(gp.progression.bonds[member.id],progression.bondCap)))add('progression/bonds');
 for(const [id,quantity]of Object.entries(gp.progression.inventory))if(!itemMap.has(id)||!count(quantity))add('progression/inventory/'+id);
 for(const [memberId,itemId]of Object.entries(gp.progression.equipment))if(!members.has(memberId)||itemMap.get(itemId)?.kind!=='equipment'||!(gp.progression.inventory[itemId]>0)||Object.values(gp.progression.equipment).filter(id=>id===itemId).length>gp.progression.inventory[itemId])add('progression/equipment/'+memberId);
 if(Object.keys(gp.quests).length!==quests.length||Object.keys(gp.quests).some(id=>!questMap.has(id)))add('quests');
 for(const quest of quests){
  const saved=gp.quests[quest.id],path='quests/'+quest.id,completed=saved?.status==='completed';
  if(!object(saved)||!['available','listened','active','completed'].includes(saved.status)||!Array.isArray(saved.materialIds)){add(path);continue;}
  if(new Set(saved.materialIds).size!==saved.materialIds.length||saved.materialIds.some(id=>!quest.steps.some(step=>step.materialId===id)))add(path+'/materialIds');
  if(['active','completed'].includes(saved.status)){
   if(!members.has(saved.performerId)||quest.type!=='general'&&saved.performerId!==balance.playerId)add(path+'/performerId');
  }else if(saved.performerId!==null||saved.materialIds.length||saved.completedDay!==null)add(path);
  if(saved.status==='listened'&&quest.type!=='general')add(path+'/status');
  if(completed){
   if(!day(saved.completedDay)||quest.steps.some(step=>!saved.materialIds.includes(step.materialId))||!state.executionLedger.includes('quest.complete/'+quest.id))add(path);
  }else if(saved.completedDay!==null||state.executionLedger.includes('quest.complete/'+quest.id))add(path+'/completedDay');
  if(saved.proposal){const proposal=saved.proposal,member=members.get(proposal.memberId);if(saved.status!=='listened'||quest.type!=='general'||!member||proposal.memberId===balance.playerId||typeof proposal.id!=='string'||!proposal.id||proposal.energyCost!==quest.delegation.assignmentCost||proposal.feeAmount!==member.operatingFee.amount||proposal.feeMode!==member.operatingFee.mode||proposal.expectedDay!==null&&(!Number.isInteger(proposal.expectedDay)||proposal.expectedDay<1||proposal.expectedDay>balance.calendar.totalDays))add(path+'/proposal');}
  const articleQueued=gp.publication.queued.some(article=>article?.id===quest.article.id),articlePublished=!!gp.publication.published[quest.article.id];
  if(completed?articleQueued===articlePublished:articleQueued||articlePublished)add(path+'/article');
  for(const [phase,items]of [['defense',quest.defenseEvidence],['attack',quest.attackFindings]])for(const item of items)if(completed&&!gp.evidence[phase][item.id])add('evidence/'+phase+'/'+item.id);
  if(saved.performerId&&saved.performerId!==balance.playerId&&['active','completed'].includes(saved.status)&&gp.delegation.jobs[quest.id]?.memberId!==saved.performerId)add(path+'/performerId');
 }
 for(const [phase,field]of [['defense','defenseEvidence'],['attack','attackFindings']])for(const [id,item]of Object.entries(gp.evidence[phase])){
  const quest=quests.find(quest=>quest[field].some(def=>def.id===id)),definition=quest?.[field].find(def=>def.id===id);
  if(!quest||!object(item)||item.id!==id||item.phase!==phase||item.sourceQuestId!==quest.id||item.articleId!==quest.article.id||item.materialId!==definition.materialId||item.nameKey!==definition.nameKey||phase==='defense'&&(item.quality!==definition.quality||item.type!==definition.type)||gp.quests[quest.id]?.status!=='completed'||!gp.quests[quest.id].materialIds.includes(item.materialId)||!day(item.acquiredDay)||typeof item.used!=='boolean')add('evidence/'+phase+'/'+id);
 }
 const articles=[...gp.publication.queued,...Object.values(gp.publication.published)],articleIds=articles.map(article=>article?.id);if(new Set(articleIds).size!==articles.length)add('publication');
 let audience=0;
 for(const article of articles){
  const quest=questMap.get(article?.questId),published=!!gp.publication.published[article?.id];
  if(!quest||!object(article)||article.id!==quest.article.id||gp.quests[quest.id]?.status!=='completed'||article.performerId!==gp.quests[quest.id].performerId||!day(article.handedOffDay)||article.handedOffDay!==gp.quests[quest.id].completedDay||!balance.calendar.periods.includes(article.handedOffPeriod)||!bounded(article.attraction,publication.attractionCap)||article.attraction<1||!bounded(article.quality,1)){add('publication');continue;}
  if(published){if(!day(article.publishedDay)||article.publishedDay<article.handedOffDay||!count(article.score)||article.score>publication.scoreCap||!state.executionLedger.includes('article.publish/'+article.id))add('publication/published/'+article.id);audience+=article.score;}
  else if(state.executionLedger.includes('article.publish/'+article.id))add('publication/queued');
 }
 if(gp.audience!==audience)add('audience');
 for(const [questId,job]of Object.entries(gp.delegation.jobs)){
  const quest=questMap.get(questId),saved=gp.quests[questId];
  if(!object(job)||quest?.type!=='general'||!members.has(job.memberId)||job.memberId===balance.playerId||saved?.performerId!==job.memberId||!['active','completed'].includes(saved?.status)||!['working','completed'].includes(job.status)||job.status==='completed'!==(saved?.status==='completed')||!day(job.assignedDay)||!day(job.lastFeedbackDay)||job.lastFeedbackDay<job.assignedDay||!bounded(job.workDone,quest?.delegation.requiredWork??0)||job.expectedDay!==null&&(!Number.isInteger(job.expectedDay)||job.expectedDay<=job.assignedDay||job.expectedDay>balance.calendar.totalDays))add('delegation/jobs/'+questId);
 }
 if(gp.delegation.feedback.length>balance.feedbackLimit)add('delegation/feedback');
 for(const feedback of gp.delegation.feedback)if(!object(feedback)||!day(feedback.day)||!questMap.has(feedback.questId)||!members.has(feedback.memberId)||!Object.hasOwn(team.feedbackKeys,feedback.status)||feedback.messageKey!==team.feedbackKeys[feedback.status]||!Array.isArray(feedback.evidenceIds)||feedback.evidenceIds.some(id=>!questMap.get(feedback.questId).defenseEvidence.some(card=>card.id===id)))add('delegation/feedback');
 return errors;
}
