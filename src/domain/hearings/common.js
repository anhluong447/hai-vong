import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {gameplayDefinitions} from '../gameplay/state.js';
export const hearingFailure=code=>failure(diagnostic(code,'hearing','/command'));
export function resolveHearing(bundle,id,mode){
 const definition=bundle.catalog.get('hearings',id);if(!definition.ok||definition.value.mode!==mode)return hearingFailure('hearing.definition.invalid');
 const balance=bundle.catalog.get('hearingBalance',definition.value.balanceId);return balance.ok?success({definition:definition.value,balance:balance.value}):hearingFailure('hearing.balance.missing');
}
export function hearingAvailable(state,definition,bundle){
 const day=state.gameplay.calendar.day;if(day<definition.firstDay||day>definition.lastDay)return hearingFailure('hearing.schedule.unavailable');
 const route=gameplayDefinitions(bundle).balance.requiredRoutes.find(route=>route.id===definition.requiredMainRouteId);
 if(!route||route.mainQuestIds.some(id=>state.gameplay.quests[id]?.status!=='completed')||route.requiredFindingIds.some(id=>!state.gameplay.evidence.attack[id]))return hearingFailure('hearing.mainRoute.incomplete');
 return success(definition);
}
export function atmosphereAt(gauge,balance){return balance.atmosphere.find(band=>gauge>=band.min&&gauge<=band.max)?.id;}
export function setDefenseGauge(state,value,balance,outcomes){
 const hearing=state.gameplay.hearing;hearing.gauge=Math.max(balance.defense.minGauge,Math.min(balance.defense.maxGauge,value));const id=atmosphereAt(hearing.gauge,balance);
 if(hearing.atmosphereId!==id){hearing.atmosphereId=id;outcomes.push({type:'hearing.atmosphereChanged',atmosphereId:id});const cueId=balance.atmosphere.find(band=>band.id===id)?.cueId;if(cueId)outcomes.push({type:'presentation.cue',cueId});}
}
