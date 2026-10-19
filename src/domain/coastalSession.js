import {createSession} from './session.js';
import {person,effectiveStat} from './people.js';
import {note,pay,require} from './actions.js';
import {addCases,addQuest} from './journalism.js';
import {STAT_NAMES,QUEST_STEPS} from '../../content/gameplay/definitions.js';
import {coastalBalance as B} from '../../content/gameplay/coastal-v2.js';
import {slots,skillNodes,equipmentItems} from '../../content/gameplay/coastal-progression.js';
import {t} from '../shared/text.js';

const guard=value=>require(value,t('menu.v2.unavailable'));
export function migrateCoastal(state){
  const s=structuredClone(state);
  if(s.version===3)return s;
  s.version=3;
  s.coastal={skillPoints:B.startingSkillPoints,learned:[],inventory:equipmentItems.filter(i=>i.id!==B.rareItem).map(i=>i.id),
    equipment:Object.fromEntries(slots.map(slot=>[slot,null]))};
  s.energy=Math.min(B.energy,s.energy);
  if(['personal','weekend1','weekend2','investigation'].includes(s.phase))s.phase='club';
  s.messages.forEach(m=>m.resolved=true);
  s.quests.forEach(q=>q.kind='main');
  return s;
}
export function createCoastalSession(config={}){
  const s=migrateCoastal(createSession(config));s.energy=B.energy;
  s.quests.forEach((q,i)=>{q.id=`main-${i+1}`;q.title=t('menu.v2.mainTitle');});
  s.log=[];note(s,'menu.v2.start');
  return s;
}
export function coastalStat(s,p,stat){
  let value=effectiveStat(s,p,stat)+(p.tools.includes(stat)?B.toolBonus:0);
  if(p.id==='khue'&&s.coastal){
    value+=skillNodes.filter(n=>n.stat===stat&&s.coastal.learned.includes(n.id)).reduce((n,item)=>n+item.bonus,0);
    value+=equipmentItems.filter(i=>i.stat===stat&&Object.values(s.coastal.equipment).includes(i.id)).reduce((n,item)=>n+item.bonus,0);
  }
  return value;
}
function article(s,id,title,owner,stat,attraction,qualityOverride=null){
  if(s.drafts.some(d=>d.id===id))return;
  const quality=qualityOverride??Math.min(1,coastalStat(s,person(s,owner),stat)/B.statScale);
  const draft={id,title,branch:owner==='khue'?'khue':'team',author:owner,quality,attraction,readyDay:s.day,processed:true};
  s.drafts.push(draft);s.articles.push({...draft,score:Math.round(quality*attraction*B.audienceScale),selected:true,published:false});
  note(s,'menu.v2.completed',{title});
}
function completeGeneral(s,c){
  c.status='draft';c.progress=B.generalDays;c.quality=Math.min(1,coastalStat(s,person(s,c.owner),c.need)/B.statScale);
  person(s,c.owner).stats[c.need]+=B.generalGrowth;
  article(s,c.id,c.title,c.owner,c.need,c.attraction,c.quality);
  if(s.cases.filter(q=>q.status==='draft').length%B.rareItemEvery===0&&!s.coastal.inventory.includes(B.rareItem)){
    s.coastal.inventory.push(B.rareItem);note(s,'menu.v2.itemFound',{item:t(`menu.v2.${B.rareItem}`)});
  }
}
function finishDay(s,late){
  for(const draft of s.drafts.filter(d=>!s.articles.some(a=>a.id===d.id))){
    draft.processed=true;s.articles.push({...draft,score:Math.round(draft.quality*draft.attraction*B.audienceScale),selected:true,published:false});
  }
  for(const c of s.cases.filter(c=>c.status==='working'||c.status==='blocked')){
    c.status='working';c.progress++;
    if(c.progress>=B.generalDays)completeGeneral(s,c);
    s.messages.push({id:`${c.id}-${s.day}`,caseId:c.id,kind:c.status==='draft'?'complete':'progress',resolved:true,day:s.day});
  }
  if((s.day-1)%B.weekLength===B.publishWeekday){
    const ready=s.articles.filter(a=>!a.published);let score=0;
    ready.forEach(a=>{a.published=true;a.publishedDay=s.day;score+=a.score;});
    s.reputation+=Math.round(score/B.audienceScale);
    s.reports.push({day:s.day,week:Math.floor((s.day-1)/B.weekLength)+1,score,ids:ready.map(a=>a.id),reputation:s.reputation});
  }
  if(s.day===s.config.days){s.ended=true;return;}
  s.day++;s.phase='morning';s.energy=late?B.lateEnergy:B.energy;s.sleepPrepared=false;
  s.people.forEach(p=>p.fatigue=Math.max(0,p.fatigue-s.config.recovery));
  if((s.day-1)%B.weekLength===0){addCases(s);addQuest(s);const q=s.quests.at(-1);q.kind='main';q.id=`main-${Math.floor((s.day-1)/B.weekLength)+1}`;q.title=t('menu.v2.mainTitle');}
  note(s,'menu.v2.nextDay',{energy:s.energy});
}
/** Coastal gameplay revision; the legacy transition and its baselines stay intact. */
export function transitionCoastal(state,action){
  const s=structuredClone(state),p=person(s,'khue');guard(!s.ended);
  const active=()=>guard(['club','evening'].includes(s.phase));
  if(action.type==='school'){guard(s.phase==='morning');s.phase='club';}
  else if(action.type==='returnHome'){
    guard(['club','evening'].includes(s.phase));s.phase=s.phase==='club'?'evening':'bed';
  }else if(action.type==='sleep'||action.type==='stayUp'){
    guard(s.phase==='bed');
    if(action.type==='stayUp'){guard(['study','game'].includes(action.kind));p.stats[action.kind==='study'?'documents':'courage']+=B.lateGrowth;}
    finishDay(s,action.type==='stayUp');
  }else if(action.type==='open'){
    active();const c=s.cases.find(c=>c.id===action.id);guard(c&&c.status==='available'&&!c.opened);
    pay(s,B.openCost);c.opened=true;s.metrics.opened++;
  }else if(action.type==='assign'){
    active();const c=s.cases.find(c=>c.id===action.id),owner=person(s,action.person);
    guard(c&&c.opened&&c.status==='available'&&owner&&owner.id!=='khue'&&owner.joinDay<=s.day);
    guard(!s.cases.some(q=>q.owner===owner.id&&['working','blocked'].includes(q.status)));
    const fee=owner.joinDay>1?B.laterTeammateFee:0;guard(s.money>=fee);pay(s,B.assignCost);s.money-=fee;
    c.owner=owner.id;c.status='working';c.progress=0;c.attempts++;s.metrics.assigned++;
    note(s,'journal.assignment',{title:c.title,name:owner.name});
  }else if(action.type==='generalWork'){
    active();const c=s.cases.find(c=>c.id===action.id);guard(c&&c.opened&&c.status==='available');
    pay(s,B.generalCost);c.owner='khue';completeGeneral(s,c);
  }else if(action.type==='quest'){
    active();const q=s.quests.find(q=>q.id===action.id),step=QUEST_STEPS.find(([id])=>id===action.step);
    guard(q&&!q.written&&step&&!q.steps.includes(action.step));pay(s,B.questCost);
    q.steps.push(action.step);q.quality.push(Math.min(1,coastalStat(s,p,action.step)/B.statScale));p.stats[action.step]+=B.questGrowth;
    note(s,'journal.quest_step',{title:q.title,step:step[1]});
    if(q.steps.length===QUEST_STEPS.length){q.written=true;s.coastal.skillPoints+=B.skillPointsPerQuest;article(s,q.id,q.title,'khue','documents',B.questAttraction,q.quality.reduce((a,b)=>a+b,0)/q.quality.length);}
  }else if(action.type==='learnSkill'){
    const node=skillNodes.find(n=>n.id===action.id);guard(node&&!s.coastal.learned.includes(node.id));
    guard(!node.prerequisite||s.coastal.learned.includes(node.prerequisite));guard(s.coastal.skillPoints>=node.cost);
    s.coastal.skillPoints-=node.cost;s.coastal.learned.push(node.id);
    note(s,'menu.v2.skillLearned',{name:STAT_NAMES[node.stat],rank:node.rank});
  }else if(action.type==='equip'){
    guard(slots.includes(action.slot));const item=equipmentItems.find(i=>i.id===action.id);
    if(action.id!==null){guard(item&&s.coastal.inventory.includes(item.id));guard(item.slot===(action.slot.startsWith('accessory')?'accessory':action.slot));
      guard(!Object.entries(s.coastal.equipment).some(([slot,id])=>slot!==action.slot&&id===item.id));}
    s.coastal.equipment[action.slot]=action.id;
    note(s,'menu.v2.gearChanged',{slot:t(`menu.v2.${action.slot}`),item:t(action.id?`menu.v2.${action.id}`:'menu.v2.emptySlot')});
  }else if(action.type==='activity'){
    active();const target=person(s,action.person);
    if(action.kind==='train'){guard(Object.hasOwn(STAT_NAMES,action.stat));guard(s.money>=s.config.trainingCost);pay(s,B.trainingCost);s.money-=s.config.trainingCost;p.stats[action.stat]+=B.trainingGrowth;}
    else if(action.kind==='job'){pay(s,B.jobCost);s.money+=s.config.jobPay;s.metrics.jobs++;}
    else if(action.kind==='hangout'){guard(target&&target.id!=='khue'&&target.joinDay<=s.day);pay(s,B.hangoutCost);target.bond++;target.events++;s.metrics.hangouts++;}
    else if(action.kind==='rest'){pay(s,B.restCost);p.fatigue=Math.max(0,p.fatigue-B.restRecovery);}
    else guard(false);
  }else guard(false);
  return s;
}
