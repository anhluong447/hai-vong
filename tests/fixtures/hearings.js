import {assert} from '/tests/harness.js';
import {gameplaySession,act,nextDay,completeDirect} from './gameplay.js';
/** Explicit isolated week-three fixture; all facts/cards are earned by real commands. */
export async function hearingSession({change=()=>{},withoutCards=false}={}){
 const session=await gameplaySession({day:3,change});prepareHearing(session,{withoutCards});return session;
}
export function prepareHearing(session,{withoutCards=false}={}){
 const initial=structuredClone(session.snapshot());Object.assign(initial.gameplay.calendar,{day:3,period:'afternoon'});assert(session.replace(initial).ok);completeDirect(session,'quest.fixture.main',['interview','records']);
 nextDay(session);assert(act(session,'calendar.finishSchool').ok);
 if(!withoutCards){completeDirect(session,'quest.fixture.side',['photo','verify']);assert(act(session,'quest.listen',{questId:'quest.fixture.general'}).ok);completeDirect(session,'quest.fixture.general',['record']);}
 nextDay(session);assert(act(session,'calendar.finishSchool').ok);const state=structuredClone(session.snapshot());state.gameplay.calendar.day=19;assert(session.replace(state).ok);return session;
}
export const hear=(session,action,params={})=>session.execute({type:'hearing.command',action,...params});
export function changeHearing(source,change){const defense=source.documents.find(d=>d.kind==='hearings'&&d.data.mode==='defense'),balance=source.documents.find(d=>d.kind==='hearingBalance');assert(defense&&balance,'hearing definitions are missing');change(defense.data,balance.data);}
export function enterAttack(session){assert(hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.general'}).ok);assert(hear(session,'advance').ok);assert(hear(session,'defense.respond',{evidenceId:'evidence.fixture.side'}).ok);}
export function solveRound(session){assert(hear(session,'advance').ok);assert(hear(session,'attack.word',{wordId:'contradiction'}).ok);assert(hear(session,'attack.question',{questionId:'question.correct'}).ok);}
export function reachCrashout(session){enterAttack(session);for(let index=0;index<3;index++){solveRound(session);if(index<2)assert(hear(session,'advance').ok);}}
export function tickFor(session,duration,step=.1){for(let remaining=duration;remaining>1e-8;remaining-=Math.min(step,remaining)){const stage=session.snapshot().gameplay.hearing.stage;if(!['minigame','finalShot'].includes(stage))break;assert(hear(session,'tick',{delta:Math.min(step,remaining)}).ok);}}
