import {test,assert,equal} from '/tests/harness.js';
import {gameplaySession,act,completeDirect} from '/tests/fixtures/gameplay.js';
import {effectiveStat} from '/src/domain/gameplay/progression.js';
import {gameplayDefinitions} from '/src/domain/gameplay/state.js';
import {SaveCodec} from '/src/infrastructure/storage/SaveCodec.js';
import {GameSession} from '/src/application/GameSession.js';
test('training equipment and derived skill levels survive saves without stacking base stats',async()=>{
 const session=await gameplaySession(),player='member.fixture.player';assert(act(session,'activity.perform',{activityId:'activity.fixture.train',identity:'training.1'}).ok);
 equal(session.snapshot().gameplay.members[player].stats.documents,3);equal(session.snapshot().gameplay.members[player].skillXP.documents,5);equal(effectiveStat(session.snapshot(),player,'documents',gameplayDefinitions(session.bundle)),4);
 const trained=session.snapshot();assert(act(session,'activity.perform',{activityId:'activity.fixture.train',identity:'training.1'}).ok);equal(session.snapshot(),trained);
 assert(act(session,'item.buy',{itemId:'item.fixture.recorder',identity:'buy.1'}).ok);equal(session.snapshot().gameplay.wallet,800);assert(act(session,'equipment.equip',{itemId:'item.fixture.recorder',memberId:player,identity:'equip.1'}).ok);equal(effectiveStat(session.snapshot(),player,'documents',gameplayDefinitions(session.bundle)),5);
 const saved=(await SaveCodec.encode(session.snapshot(),{buildId:'fixture',contentVersion:session.bundle.revision})).value,resumed=new GameSession({bundle:session.bundle,initialState:(await SaveCodec.decode(saved)).value});equal(effectiveStat(resumed.snapshot(),player,'documents',gameplayDefinitions(session.bundle)),5);
 assert(act(resumed,'equipment.unequip',{memberId:player,identity:'unequip.1'}).ok);equal(effectiveStat(resumed.snapshot(),player,'documents',gameplayDefinitions(session.bundle)),4);equal(resumed.snapshot().gameplay.members[player].stats.documents,3);
});
test('one wallet funds costs while personal hangouts and special events have distinct bond scopes',async()=>{
 const session=await gameplaySession();assert(act(session,'activity.perform',{activityId:'activity.fixture.work',identity:'work.1'}).ok);equal(session.snapshot().gameplay.wallet,1100);
 assert(act(session,'activity.perform',{activityId:'activity.fixture.hangout',memberId:'member.fixture.reporter',identity:'hangout.1'}).ok);equal(session.snapshot().gameplay.progression.bonds['member.fixture.reporter'],3);equal(session.snapshot().gameplay.progression.teamBond,0);
 assert(act(session,'activity.perform',{activityId:'activity.fixture.special',identity:'special.1'}).ok);equal(session.snapshot().gameplay.progression.teamBond,2);
 assert(act(session,'quest.listen',{questId:'quest.fixture.general'}).ok);completeDirect(session,'quest.fixture.general',['record']);equal(session.snapshot().gameplay.progression.teamBond,2);
 const before=session.snapshot();assert(!act(session,'activity.perform',{activityId:'activity.fixture.work',identity:''}).ok);assert(!act(session,'activity.perform',{activityId:'activity.fixture.hangout',memberId:'missing',identity:'invalid'}).ok);equal(session.snapshot(),before);
});
test('consumables cap shared energy and a repeated command cannot consume or reward twice',async()=>{
 const session=await gameplaySession();assert(act(session,'item.buy',{itemId:'item.fixture.tea',identity:'buy-tea'}).ok);equal(session.snapshot().gameplay.energy,9);assert(act(session,'item.use',{itemId:'item.fixture.tea',identity:'drink'}).ok);equal(session.snapshot().gameplay.energy,10);equal(session.snapshot().gameplay.progression.inventory['item.fixture.tea'],0);equal(session.snapshot().gameplay.wallet,950);
 const consumed=session.snapshot();assert(act(session,'item.use',{itemId:'item.fixture.tea',identity:'drink'}).ok);equal(session.snapshot(),consumed);assert(!act(session,'item.use',{itemId:'item.fixture.tea',identity:'drink-again'}).ok);equal(session.snapshot(),consumed);
});
test('registered story effects use the same data-driven activity and once-only ledger',async()=>{
 const session=await gameplaySession(),command={type:'effect.apply',effectId:'effect.fixture.activity',params:{activityId:'activity.fixture.train'},identity:'fixture/story/training'};
 const result=session.execute(command);assert(result.ok,JSON.stringify(result));equal(session.snapshot().gameplay.energy,8);equal(session.snapshot().gameplay.members['member.fixture.player'].skillXP.documents,5);const first=session.snapshot();assert(session.execute(command).ok);equal(session.snapshot(),first);
});
test('night study and game grant declared benefits even at zero energy then set next day to five',async()=>{
 for(const [choice,stat]of [['study','documents'],['game','courage']]){
  const session=await gameplaySession({period:'night',energy:0});assert(act(session,'calendar.endNight',{choice}).ok);equal(session.snapshot().gameplay.energy,5);equal(session.snapshot().gameplay.members['member.fixture.player'].stats[stat],3);equal(session.snapshot().gameplay.members['member.fixture.player'].skillXP[stat],2);
 }
});
test('skill cost discounts retain a positive action cost and Main remains a larger task',async()=>{
 const main=await gameplaySession();assert(act(main,'activity.perform',{activityId:'activity.fixture.trainInvestigation',identity:'train-main'}).ok);completeDirect(main,'quest.fixture.main',['interview','records']);equal(main.snapshot().gameplay.energy,4);
 const general=await gameplaySession();for(let i=0;i<3;i++)assert(act(general,'activity.perform',{activityId:'activity.fixture.train',identity:'training.'+i}).ok);assert(act(general,'quest.listen',{questId:'quest.fixture.general'}).ok);completeDirect(general,'quest.fixture.general',['record']);equal(general.snapshot().gameplay.energy,2);
 const expert=await gameplaySession();for(let i=0;i<3;i++)assert(act(expert,'activity.perform',{activityId:'activity.fixture.trainInvestigation',identity:'expert.'+i}).ok);completeDirect(expert,'quest.fixture.main',['interview','records']);equal(expert.snapshot().gameplay.energy,0);
});
