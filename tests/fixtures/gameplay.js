import {assert} from '/tests/harness.js';
import {GameSession} from '/src/application/GameSession.js';
import {runtimeBundle,effects} from './runtime.js';
const fixture=await(await fetch('/tests/fixtures/foundation/gameplay.json')).json();
export async function gameplaySession({day=fixture.initial.day,period=fixture.initial.period,energy=fixture.initial.energy,change=()=>{}}={}){
 const bundle=await runtimeBundle(change),session=new GameSession({bundle,effects});assert(session.snapshot().gameplay.calendar,'gameplay calendar is not implemented');
 const state=structuredClone(session.snapshot());Object.assign(state.gameplay.calendar,{day,period});state.gameplay.energy=energy;assert(session.replace(state).ok);
 assert(session.execute({type:'scene.request',sceneId:fixture.world.sceneId,spawnId:fixture.world.spawnId,requestId:'fixture-entry'}).ok);assert(session.execute({type:'scene.commit',requestId:'fixture-entry'}).ok);
 return session;
}
export const act=(session,action,params={})=>session.execute({type:'gameplay.command',action,...params});
export function nextDay(session){
 let receipt=0;while(session.snapshot().gameplay.calendar.period!=='night'){
  const calendar=session.snapshot().gameplay.calendar;if(calendar.period==='morning'&&(calendar.day-1)%7<5)assert(act(session,'calendar.finishSchool').ok);
  else{const requestId='fixture-home-'+(++receipt);assert(act(session,'calendar.requestHome',{route:'fast',requestId}).ok);assert(act(session,'calendar.confirmHome',{requestId}).ok);}
 }
 assert(act(session,'calendar.endNight',{choice:'sleep'}).ok);
}
export function completeDirect(session,questId,steps){assert(act(session,'quest.start',{questId,performerId:'member.fixture.player'}).ok);for(const stepId of steps)assert(act(session,'quest.collect',{questId,stepId}).ok);}
