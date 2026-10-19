import {t} from '../shared/text.js';
import {STAT_NAMES,QUEST_STEPS} from '../../content/gameplay/definitions.js';
import {mapPlaces} from '../../content/ui/menu-v2.js';
import {skillNodes,equipmentItems,slots} from '../../content/gameplay/coastal-progression.js';
import {coastalBalance as B} from '../../content/gameplay/coastal-v2.js';
import {coastalStat} from '../domain/coastalSession.js';
import {dossierQuestMedia,dossierCaseMedia} from '../../content/ui/dossier-media.js';
import {weekday} from '../domain/calendar.js';

export function coastalMenuModel(state){
  const main=state.people.find(p=>p.id==='khue'),active=['club','evening'].includes(state.phase)&&!state.ended;
  const progress=state.coastal;
  const photo=media=>media?{file:media.file,alt:t(media.altKey)}:null;
  const stats=person=>Object.keys(STAT_NAMES).map(id=>({id,name:STAT_NAMES[id],value:Math.round(coastalStat(state,person,id)*10)/10}));
  const quests=[...state.quests.map(q=>({id:q.id,kind:q.kind||'main',title:q.title,photo:photo(dossierQuestMedia[q.id]),
    description:t('menu.v2.questDescription'),
    history:q.steps.map(id=>QUEST_STEPS.find(([key])=>key===id)?.[1]),
    hint:q.written?t('menu.v2.completeHint'):QUEST_STEPS.find(([id])=>!q.steps.includes(id))?.[1],
    actions:[]
  })),...state.cases.filter(c=>!['expired','cancelled'].includes(c.status)).map(c=>({
    id:c.id,kind:'general',title:c.title,description:c.teaser,photo:photo(dossierCaseMedia[c.key]),
    history:state.messages.filter(m=>m.caseId===c.id).map(m=>t('menu.v2.feedback',{day:m.day,status:t(m.kind==='complete'?'menu.v2.done':'menu.v2.working')})),
    hint:t(c.status==='draft'?'menu.v2.completeHint':c.owner?'menu.v2.assignedHint':c.opened?'menu.v2.generalHint':'menu.v2.listenHint'),
    assignable:c.opened&&c.status==='available',
    actions:!c.opened?[{label:t('menu.v2.listen',{cost:B.openCost}),action:{type:'open',id:c.id},disabled:!active||state.energy<B.openCost}]:c.status==='available'?[{label:t('menu.v2.selfWork',{cost:B.generalCost}),action:{type:'generalWork',id:c.id},disabled:!active||state.energy<B.generalCost}]:[]
  }))];
  return {day:state.day,weekday:weekday(state.day),phase:state.phase,energy:state.energy,maxEnergy:10,money:state.money,
    phaseText:t(`menu.v2.${state.phase==='club'?'clubPhase':state.phase}`),quests,stats:stats(main),
    points:progress?.skillPoints||0,
    skills:skillNodes.map(n=>({...n,name:t('menu.v2.skillRank',{name:STAT_NAMES[n.stat],rank:n.rank}),
      description:t('menu.v2.skillBonus',{name:STAT_NAMES[n.stat],bonus:n.bonus}),branch:STAT_NAMES[n.stat],
      learned:progress?.learned.includes(n.id),locked:!progress||(n.prerequisite&&!progress.learned.includes(n.prerequisite)),
      disabled:state.ended||!progress||progress.learned.includes(n.id)||progress.skillPoints<n.cost||(n.prerequisite&&!progress.learned.includes(n.prerequisite))})),
    equipment:slots.map(id=>({id,item:progress?.equipment[id]||null})),
    items:equipmentItems.filter(i=>progress?.inventory.includes(i.id)).map(i=>({...i,name:t(`menu.v2.${i.id}`),statName:STAT_NAMES[i.stat]})),
    people:state.people.filter(p=>p.id!=='khue'&&p.joinDay<=state.day).map(p=>({id:p.id,name:p.name,bond:p.bond,
      nickname:t(p.id==='van'?'menu.v2.vanNickname':'menu.v2.teammate'),bio:t('menu.v2.noBio'),stats:stats(p),
      assignments:state.cases.filter(c=>c.owner===p.id).map(c=>({id:c.id,title:c.title,
        progress:t('menu.v2.progress',{name:p.name,done:c.progress,total:B.generalDays})})),
      busy:state.cases.some(c=>c.owner===p.id&&['working','blocked'].includes(c.status)),
      fee:p.joinDay>1?B.laterTeammateFee:0,finishDay:state.day+B.generalDays,
      canAssign:active&&state.energy>=B.assignCost&&state.money>=(p.joinDay>1?B.laterTeammateFee:0)})),
    assignCost:B.assignCost,ended:state.ended,
    places:mapPlaces.map(p=>({...p,name:t(`menu.v2.${p.id}`),marker:
      p.id==='school'&&state.quests.some(q=>!q.written&&['interview','photo','courage'].some(step=>!q.steps.includes(step)))?'quest':
      p.id==='club'&&(state.quests.some(q=>!q.written&&!q.steps.includes('documents'))||state.cases.some(c=>c.status==='available'))?'quest':
      p.marker==='bond'&&active?'bond':p.marker==='job'&&active?'job':null})),
    activityCosts:{train:B.trainingCost,hangout:B.hangoutCost,job:B.jobCost}
  };
}
