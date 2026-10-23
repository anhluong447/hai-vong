import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {HOME_ROUTES,NIGHT_CHOICES} from '../../contracts/GameplayActions.js';
import {performActivity} from './progression.js';
const bad=code=>failure(diagnostic(code,'gameplay','/calendar'));
export const dayOfWeek=(day,balance)=>(day-1)%balance.calendar.daysPerWeek+1;
export const isWorkingDay=(day,balance)=>balance.calendar.workDays.includes(dayOfWeek(day,balance));
export function calendarCommand(current,command,definitions){
 const {balance}=definitions;let state=structuredClone(current);const periods=balance.calendar.periods,index=periods.indexOf(state.gameplay.calendar.period),outcomes=[];let calendar=state.gameplay.calendar;
 if(calendar.finished)return bad('calendar.finished');
 if(command.action==='calendar.requestHome'){
  if(!HOME_ROUTES.includes(command.route)||typeof command.requestId!=='string'||!command.requestId||index<0||index===periods.length-1||index===0&&isWorkingDay(calendar.day,balance))return bad('calendar.return.unavailable');
  calendar.pending={route:command.route,requestId:command.requestId,targetPeriod:periods[index+1]};outcomes.push({type:'calendar.confirmationRequested',...calendar.pending});
 }else if(['calendar.confirmHome','calendar.cancelHome'].includes(command.action)){
  if(!calendar.pending||calendar.pending.requestId!==command.requestId)return bad('calendar.confirmation.stale');
  if(command.action==='calendar.confirmHome'){calendar.period=calendar.pending.targetPeriod;outcomes.push({type:'calendar.periodChanged',day:calendar.day,period:calendar.period});}calendar.pending=null;
 }else if(command.action==='calendar.finishSchool'){
  if(index!==0||!isWorkingDay(calendar.day,balance))return bad('calendar.school.unavailable');calendar.period=periods[index+1];outcomes.push({type:'calendar.periodChanged',day:calendar.day,period:calendar.period});
 }else if(command.action==='calendar.endNight'){
  if(index!==periods.length-1||!NIGHT_CHOICES.includes(command.choice))return bad('calendar.night.unavailable');
  const activityId=balance.energy.nightBenefits[command.choice];if(activityId){const benefited=performActivity(state,{activityId},definitions,{night:true});if(!benefited.ok)return benefited;state=benefited.value.state;calendar=state.gameplay.calendar;outcomes.push(...benefited.value.outcomes);}
  calendar.pending=null;if(calendar.day===balance.calendar.totalDays){calendar.finished=true;outcomes.push({type:'calendar.finished'});}
  else{calendar.day++;calendar.period=periods[0];state.gameplay.energy=balance.energy.nextDay[command.choice];outcomes.push({type:'calendar.dayStarted',day:calendar.day,choice:command.choice});}
 }else return bad('command.unknown');
 return success({state,outcomes});
}
