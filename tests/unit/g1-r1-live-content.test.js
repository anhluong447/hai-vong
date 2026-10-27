import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {GameSession} from '/src/application/GameSession.js';
test('normal First3 entry registers R1 without importing C2 scenario defaults or fixture tone',async()=>{
 const source=await loadProject('/content/first-three-days.project.json'),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked));const b=checked.value;
 equal(b.revision,'0.0.4');const r=b.catalog.get('config',b.project.runtimeConfigId).value,scene=b.catalog.get('scenes','scene.first3.room3').value;equal(r.startSceneId,'scene.first3.gate');equal(scene.spawns.find(s=>s.id==='entry').x,120);equal(r.movementSpeed,160);assert(r.locomotionConfigId);
 equal(scene.props.length,7);assert(scene.presentationId);assert(scene.interactions.find(i=>i.id==='van-recruit').presentationId);assert(b.catalog.get('animations','clip.first3.khue.walk').value.locomotion.plant);
 for(const s of b.catalog.list('scenes').filter(s=>s.id.startsWith('scene.first3.'))){assert(!s.cueId);equal(s.sequenceId,'sequence.first3.enter');}
 const state=new GameSession({bundle:b}).snapshot();equal(state.gameplay.calendar.period,'morning');equal(state.gameplay.flags['flag.first3.recruit'],false);equal(state.gameplay.quests['quest.first3.room3'].materialIds,[]);
 const fixture=b.catalog.get('config','runtime.foundation').value;assert(!fixture.locomotionConfigId);equal(b.catalog.get('scenes','scene.courtyard').value.sequenceId,'sequence.fixture.enter');
});
