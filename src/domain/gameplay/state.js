import {diagnostic} from '../../contracts/Diagnostic.js';
import {validateGameplayDetails} from './validateState.js';
export function gameplayBalance(bundle){const runtime=bundle.catalog.get('config',bundle.project.runtimeConfigId).value;return runtime?.gameplayConfigId?bundle.catalog.get('balance',runtime.gameplayConfigId).value:null;}
export function gameplayDefinitions(bundle){const balance=gameplayBalance(bundle);return balance?{balance,team:bundle.catalog.get('team',balance.teamId).value,progression:bundle.catalog.get('progression',balance.progressionId).value,publication:bundle.catalog.get('publication',balance.publicationId).value,quests:bundle.catalog.list('quests'),schedules:bundle.catalog.list('schedules')}:null;}
export function createGameplayState(bundle){
 const definitions=gameplayDefinitions(bundle);if(!definitions)return {};const {balance,team,progression,quests}=definitions;
 return {calendar:{day:balance.calendar.initialDay,period:balance.calendar.initialPeriod,pending:null,finished:false},energy:balance.energy.cap,wallet:progression.initialWallet,audience:0,hearing:null,
  members:Object.fromEntries(team.members.map(member=>[member.id,{stats:structuredClone(member.stats),skillXP:Object.fromEntries(progression.skills.map(skill=>[skill.id,0]))}])),
  quests:Object.fromEntries(quests.map(quest=>[quest.id,{status:'available',performerId:null,materialIds:[],proposal:null,completedDay:null}])),
  delegation:{jobs:{},feedback:[]},publication:{queued:[],published:{}},evidence:{defense:{},attack:{}},
  progression:{inventory:{},equipment:{},bonds:Object.fromEntries(team.members.filter(member=>member.id!==balance.playerId).map(member=>[member.id,0])),teamBond:0}
 };
}
export function validateGameplayState(state,bundle){
 const balance=gameplayBalance(bundle),errors=[];if(!balance)return errors;
 const add=pointer=>errors.push(diagnostic('state.gameplay.invalid','snapshot','/gameplay/'+pointer)),{calendar,energy}=state.gameplay;
 if(!calendar||typeof calendar!=='object'||Array.isArray(calendar)){add('calendar');return errors;}
 if(!Number.isInteger(calendar.day)||calendar.day<1||calendar.day>balance.calendar.totalDays||!balance.calendar.periods.includes(calendar.period)||typeof calendar.finished!=='boolean'||calendar.finished&&calendar.day!==balance.calendar.totalDays)add('calendar');
 if(!Number.isFinite(energy)||energy<0||energy>balance.energy.cap)add('energy');
 if(calendar.pending){const pending=calendar.pending,index=balance.calendar.periods.indexOf(calendar.period);if(!['fast','walk'].includes(pending.route)||typeof pending.requestId!=='string'||!pending.requestId||pending.targetPeriod!==balance.calendar.periods[index+1])add('calendar/pending');}
 return [...errors,...validateGameplayDetails(state,gameplayDefinitions(bundle))];
}
