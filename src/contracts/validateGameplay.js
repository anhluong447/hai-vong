import {diagnostic} from './Diagnostic.js';
import {validateGameplayResources} from './validateGameplayResources.js';
import {validateQuestDefinitions} from './validateQuestDefinitions.js';
export function validateGameplay({catalog,project,locales,sourceFor,pointerFor=()=>''}){
 const errors=[],add=(kind,id,code,pointer)=>errors.push(diagnostic(code,sourceFor(kind,id),pointerFor(kind,id)+pointer,[id]));
 for(const config of catalog.list('config'))if(config.kind==='runtime'&&config.gameplayConfigId&&!catalog.get('balance',config.gameplayConfigId).ok)errors.push(diagnostic('gameplay.config.missing',sourceFor('config',config.id),'/gameplayConfigId',[config.gameplayConfigId]));
 for(const balance of catalog.list('balance')){
  const c=balance.calendar,e=balance.energy;
  if(c.totalDays%c.daysPerWeek||new Set(c.periods).size!==c.periods.length||c.periods[0]!=='morning'||c.periods.at(-1)!=='night'||!c.periods.includes(c.initialPeriod)||c.initialDay>c.totalDays||c.workDays.some(day=>day<1||day>c.daysPerWeek)||Object.values(e.nextDay).some(value=>value<0||value>e.cap))errors.push(diagnostic('gameplay.balance.invalid',sourceFor('balance',balance.id),'/',[balance.id]));
  const team=catalog.get('team',balance.teamId),progression=catalog.get('progression',balance.progressionId),publication=catalog.get('publication',balance.publicationId);
  if(!team.ok||!progression.ok||!publication.ok){add('balance',balance.id,'gameplay.reference.missing','/');continue;}
  if(!(balance.minActionCost>0)||balance.feedbackLimit<1)add('balance',balance.id,'gameplay.balance.invalid','/minActionCost');
  const context={catalog,balance,team:team.value,progression:progression.value,publication:publication.value,add,label:key=>typeof key==='string'&&locales[project.defaultLocale]?.[key]?.params.length===0};
  validateGameplayResources(context);validateQuestDefinitions(context);
 }
 return errors;
}
