import {test,assert,equal} from '/tests/harness.js';
import {gameplaySession,act} from '/tests/fixtures/gameplay.js';
test('night choices set exact 10 or 5 energy and never carry yesterday leftovers',async()=>{
 for(const energy of [0,2,6,10])for(const [choice,expected]of [['sleep',10],['study',5],['game',5]]){
  const session=await gameplaySession({period:'night',energy});assert(act(session,'calendar.endNight',{choice}).ok);equal(session.snapshot().gameplay.energy,expected);equal(session.snapshot().gameplay.calendar.day,2);equal(session.snapshot().gameplay.calendar.period,'morning');
 }
});
test('fast and walking home both require confirmation and remain available at zero energy',async()=>{
 for(const route of ['fast','walk']){
  const session=await gameplaySession({energy:0});assert(act(session,'calendar.requestHome',{route,requestId:'first'}).ok);equal(session.snapshot().gameplay.calendar.period,'afternoon');equal(session.snapshot().gameplay.calendar.pending.targetPeriod,'evening');
  assert(act(session,'calendar.cancelHome',{requestId:'first'}).ok);equal(session.snapshot().gameplay.calendar.period,'afternoon');assert(!act(session,'calendar.confirmHome',{requestId:'first'}).ok);
  assert(act(session,'calendar.requestHome',{route,requestId:'second'}).ok);assert(act(session,'calendar.confirmHome',{requestId:'second'}).ok);equal(session.snapshot().gameplay.calendar.period,'evening');equal(session.snapshot().gameplay.energy,0);
  assert(act(session,'calendar.requestHome',{route,requestId:'night'}).ok);assert(act(session,'calendar.confirmHome',{requestId:'night'}).ok);equal(session.snapshot().gameplay.calendar.period,'night');assert(act(session,'calendar.endNight',{choice:'sleep'}).ok);
 }
});
test('world movement and rejected night choices cannot advance calendar or spend shared energy',async()=>{
 const session=await gameplaySession({energy:0}),before=session.snapshot().gameplay;
 for(let i=0;i<10;i++)assert(session.execute({type:'world.move',axis:1,delta:.1}).ok);equal(session.snapshot().gameplay,before);assert(!act(session,'calendar.endNight',{choice:'sleep'}).ok);equal(session.snapshot().gameplay,before);
});
test('the 84-day fixture ends without producing a thirteenth week',async()=>{
 const session=await gameplaySession({day:84,period:'night'});assert(act(session,'calendar.endNight',{choice:'sleep'}).ok);equal(session.snapshot().gameplay.calendar.day,84);assert(session.snapshot().gameplay.calendar.finished);assert(!act(session,'calendar.endNight',{choice:'sleep'}).ok);
});
