import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {gameplaySession,act,completeDirect} from '/tests/fixtures/gameplay.js';
test('shared content validation rejects broken provenance costs schedules and Main routes',async()=>{
 const mutations=[
  source=>source.documents.find(d=>d.kind==='quests').data[2].defenseEvidence=[],
  source=>source.documents.find(d=>d.kind==='quests').data[2].defenseEvidence[0].quality='high',
  source=>source.documents.find(d=>d.kind==='quests').data[0].prerequisites=['quest.fixture.side'],
  source=>source.documents.find(d=>d.kind==='quests').data[0].prerequisites=['quest.fixture.main'],
  source=>source.documents.find(d=>d.kind==='quests').data[1].steps[0].energyCost=0,
  source=>source.documents.find(d=>d.kind==='quests').data[1].defenseEvidence[0].materialId='material.never.collected',
  source=>source.documents.find(d=>d.kind==='quests').data[2].rewards.teamBond=5,
  source=>source.documents.find(d=>d.kind==='schedules').data[0].sceneId='missing',
  source=>source.documents.find(d=>d.kind==='schedules').data[0].periods=['unknown'],
  source=>source.documents.find(d=>d.kind==='team').data.members[0].stats.luck=3,
  source=>source.documents.find(d=>d.kind==='progression').data.activities.find(a=>a.kind==='work').teamBond=2,
  source=>{const quests=source.documents.find(d=>d.kind==='quests').data;quests[1].attackFindings=quests[0].attackFindings.map(f=>({...f,materialId:quests[1].steps[0].materialId}));quests[0].attackFindings=[];}
 ];
 for(const mutate of mutations){const source=await projectSource();mutate(source);const checked=validateProject(source);assert(!checked.ok,'invalid gameplay content was accepted');assert(checked.errors.every(error=>error.sourceId&&typeof error.pointer==='string'));}
 const source=await projectSource();source.documents.find(d=>d.kind==='quests').data[2].defenseEvidence[0].quality='high';const checked=validateProject(source);assert(checked.errors.some(error=>error.sourceId.endsWith('/gameplay/quests.json')&&error.pointer==='/2/defenseEvidence/0/quality'),JSON.stringify(checked));
});
test('gameplay snapshot replacement rejects malformed economy progression and work without changing live state',async()=>{
 const session=await gameplaySession(),before=session.snapshot(),mutations=[
  state=>state.gameplay.wallet=-1,
  state=>state.gameplay.members['member.fixture.player'].stats.documents=999,
  state=>state.gameplay.members['member.fixture.player'].skillXP.documents=-1,
  state=>state.gameplay.quests['quest.fixture.main'].status='completed',
  state=>state.gameplay.progression.teamBond=999,
  state=>state.gameplay.progression.inventory.unknown=1,
  state=>state.gameplay.progression.equipment['member.fixture.player']='item.fixture.recorder',
  state=>state.gameplay.delegation.jobs['quest.fixture.general']={memberId:'missing',status:'working',assignedDay:1,lastFeedbackDay:1,workDone:1,expectedDay:3},
  state=>state.gameplay.audience=999
 ];
 for(const mutate of mutations){const broken=structuredClone(before);mutate(broken);assert(!session.replace(broken).ok,'invalid gameplay snapshot was accepted');equal(session.snapshot(),before);}
});
test('completed evidence and publication stay linked to actual materials quest identity and the archive',async()=>{
 const session=await gameplaySession({day:4});completeDirect(session,'quest.fixture.side',['photo','verify']);const before=session.snapshot();
 for(const mutate of [state=>state.gameplay.evidence.defense['evidence.fixture.side'].sourceQuestId='quest.fixture.general',state=>state.gameplay.evidence.defense['evidence.fixture.side'].quality='standard',state=>state.gameplay.evidence.attack['evidence.fixture.side']=state.gameplay.evidence.defense['evidence.fixture.side'],state=>state.gameplay.publication.queued=[]]){
  const broken=structuredClone(before);mutate(broken);assert(!session.replace(broken).ok);equal(session.snapshot(),before);
 }
});
