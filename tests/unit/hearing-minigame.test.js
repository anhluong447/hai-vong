import {test,assert,equal} from '/tests/harness.js';
import {hearingSession,hear,reachCrashout,tickFor} from '/tests/fixtures/hearings.js';
import {GameSession} from '/src/application/GameSession.js';
test('Normal deflect needs the correct lane and window while hits use independent mini HP',async()=>{
 const session=await hearingSession();reachCrashout(session);assert(hear(session,'advance').ok);equal(session.snapshot().gameplay.hearing.stage,'minigame');const calendar=session.snapshot().gameplay.calendar,energy=session.snapshot().gameplay.energy;assert(hear(session,'mini.block').ok);equal(session.snapshot().gameplay.hearing.mini.blocks,0);
 tickFor(session,2.8);assert(hear(session,'mini.move',{laneId:'lower'}).ok);assert(hear(session,'mini.block').ok);equal(session.snapshot().gameplay.hearing.mini.blocks,0);assert(hear(session,'mini.move',{laneId:'upper'}).ok);assert(hear(session,'mini.block').ok);equal(session.snapshot().gameplay.hearing.mini.blocks,1);tickFor(session,8.6);equal(session.snapshot().gameplay.hearing.mini.hp,80);equal(session.snapshot().gameplay.hearing.mini.hitIds,['projectile.fixture.2']);equal(session.snapshot().gameplay.hearing.hearts,5);equal(session.snapshot().gameplay.calendar,calendar);equal(session.snapshot().gameplay.energy,energy);
});
test('mini retry resets only the mini and Easy Final Shot succeeds even without taps',async()=>{
 const session=await hearingSession();reachCrashout(session);assert(hear(session,'advance').ok);tickFor(session,30);let h=session.snapshot().gameplay.hearing;equal(h.stage,'miniFailed');equal(h.hp,0);equal(h.solvedFlawIds.length,3);equal(h.hearts,5);
 assert(hear(session,'mini.mode',{modeId:'easy'}).ok);assert(hear(session,'mini.retry').ok);equal(session.snapshot().gameplay.hearing.mini.hp,100);equal(session.snapshot().gameplay.hearing.mini.elapsed,0);
 for(const [laneId,seconds]of [['upper',4],['lower',8],['upper',6],['lower',5],['upper',3.5],['lower',3.5]]){assert(hear(session,'mini.move',{laneId}).ok);tickFor(session,seconds);}
 h=session.snapshot().gameplay.hearing;equal(h.stage,'finalShot');equal(h.mini.blocks,6);equal(h.mini.hp,100);equal(h.finalShot.taps,0);tickFor(session,3);h=session.snapshot().gameplay.hearing;equal(h.status,'won');equal(h.finalShot.taps,0);assert(session.snapshot().gameplay.flags['flag.fixture.hearingWon']);assert(session.snapshot().executionLedger.includes('hearing.won/hearing.fixture.attack'));
 assert(hear(session,'dismiss').ok);equal(session.snapshot().gameplay.hearing,null);assert(!hear(session,'defense.start',{hearingId:'hearing.fixture.defense'}).ok);
});
test('collision boundary and saved projectile state are stable across tick cadence',async()=>{
 const first=await hearingSession();reachCrashout(first);assert(hear(first,'advance').ok);const second=new GameSession({bundle:first.bundle,initialState:first.snapshot()});
 tickFor(first,3.3,.1);tickFor(second,3.3,.05);equal(first.snapshot().gameplay.hearing.mini,second.snapshot().gameplay.hearing.mini);equal(first.snapshot().gameplay.hearing.mini.projectiles.length,1);assert(hear(first,'mini.block').ok);assert(hear(second,'mini.block').ok);equal(first.snapshot().gameplay.hearing.mini.blocks,1);equal(first.snapshot().gameplay.hearing.mini,second.snapshot().gameplay.hearing.mini);
});
