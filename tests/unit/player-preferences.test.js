import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {SequencePlayer} from '/src/application/SequencePlayer.js';
test('idle timelines restore but impossible timing and missing wait receipts do not',()=>{
 const player=new SequencePlayer([{id:'fixture',steps:[{id:'fade',kind:'tween',duration:1,target:'curtainOpacity',from:1,to:0}]}]);
 assert(player.restore({id:null,index:0,elapsed:0,values:{},paused:false,status:'idle'}).ok);
 assert(!player.restore({id:'fixture',index:0,elapsed:2,values:{},paused:false,status:'playing'}).ok);
 assert(!player.restore({id:'fixture',index:0,elapsed:0,values:{},paused:false,status:'waiting'}).ok);
});
test('shared save validation blocks unknown browser resource IDs and malformed UI before storage',async()=>{
 const {GameSession}=await import('/src/application/GameSession.js'),bundle=validateProject(await loadProject('/content/project.json')).value,session=new GameSession({bundle});
 const state=structuredClone(session.snapshot());state.presentation.view={world:{sceneId:null,elapsed:0,cameraX:0,actors:{}},text:null,ui:{paused:true,screen:'injected-screen'}};
 assert(!session.validate(state).ok);delete state.presentation.view;state.audio={paused:true,buses:{bgm:{gain:.8,muted:false}},tracks:[{cueId:'unknown',offset:0}]};assert(!session.validate(state).ok);
 state.audio={};state.sequence={id:'sequence.fixture.enter',index:0,elapsed:999,values:{},paused:false,status:'playing'};assert(!session.validate(state).ok);
});
test('managed preferences reject invalid locale tuning bindings and conflicts before applying',async()=>{
 const {validatePreferences,defaultPreferences,remapBinding}=await import('/src/contracts/PlayerPreferences.js');
 const bundle=validateProject(await loadProject('/content/project.json')).value,config=bundle.catalog.get('config','ui.navigation').value,input=bundle.catalog.get('input','input.default').value;
 const value=defaultPreferences(config,input,bundle.project.defaultLocale);assert(validatePreferences(value,{config,input,locales:bundle.locales}).ok);
 const conflict=remapBinding(value,0,'KeyD',{config,input,locales:bundle.locales});assert(!conflict.ok);equal(value.bindings[0].code,'ArrowLeft');
 const moved=remapBinding(value,0,'KeyJ',{config,input,locales:bundle.locales});assert(moved.ok);equal(moved.value.bindings[0].code,'KeyJ');
 for(const change of [{locale:'absent'},{textSpeed:-1},{textScale:99},{bindings:[{code:'KeyJ',action:'invented',contexts:['world']}]}])assert(!validatePreferences({...value,...change},{config,input,locales:bundle.locales}).ok);
});
