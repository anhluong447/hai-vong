import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {SequencePlayer} from '/src/application/SequencePlayer.js';
test('idle timelines restore but impossible timing and missing wait receipts do not',()=>{
 const player=new SequencePlayer([{id:'fixture',steps:[{id:'fade',kind:'tween',duration:1,target:'curtainOpacity',from:1,to:0}]}]);
 assert(player.restore({id:null,index:0,elapsed:0,values:{},paused:false,status:'idle'}).ok);
 assert(!player.restore({id:'fixture',index:0,elapsed:2,values:{},paused:false,status:'playing'}).ok);
 assert(!player.restore({id:'fixture',index:0,elapsed:0,values:{},paused:false,status:'waiting'}).ok);
});
test('shared save validation blocks unknown browser resource IDs and malformed UI before storage',async()=>{
 const {GameSession}=await import('/src/application/GameSession.js'),bundle=validateProject(await projectSource()).value,session=new GameSession({bundle});
 const state=structuredClone(session.snapshot());state.presentation.view={world:{sceneId:null,elapsed:0,camera:{x:0,y:0,zoom:1},actors:{}},text:null,ui:{paused:true,screen:'injected-screen'}};
 assert(!session.validate(state).ok);delete state.presentation.view;state.audio={paused:true,buses:{bgm:{gain:.8,muted:false}},tracks:[{cueId:'unknown',offset:0}]};assert(!session.validate(state).ok);
 state.audio={};state.sequence={id:'sequence.fixture.enter',index:0,elapsed:999,values:{},paused:false,status:'playing'};assert(!session.validate(state).ok);
});
test('managed preferences reject invalid locale tuning bindings and conflicts before applying',async()=>{
 const {validatePreferences,defaultPreferences,remapBinding}=await import('/src/contracts/PlayerPreferences.js');
 const bundle=validateProject(await projectSource()).value,config=bundle.catalog.get('config','ui.navigation').value,input=bundle.catalog.get('input','input.default').value;
 const value=defaultPreferences(config,input,bundle.project.defaultLocale);assert(validatePreferences(value,{config,input,locales:bundle.locales}).ok);
 const conflict=remapBinding(value,0,'KeyD',{config,input,locales:bundle.locales});assert(!conflict.ok);equal(value.bindings[0].code,'ArrowLeft');
 const moved=remapBinding(value,0,'KeyJ',{config,input,locales:bundle.locales});assert(moved.ok);equal(moved.value.bindings[0].code,'KeyJ');
 for(const change of [{locale:'absent'},{textSpeed:-1},{textScale:99},{bindings:[{code:'KeyJ',action:'invented',contexts:['world']}]}])assert(!validatePreferences({...value,...change},{config,input,locales:bundle.locales}).ok);
});
test('known binding prefix extends old profiles while preserving remaps and rejecting ambiguous layouts',async()=>{
 const {PlayerProfile}=await import('/src/application/PlayerProfile.js'),{defaultPreferences}=await import('/src/contracts/PlayerPreferences.js');
 const bundle=validateProject(await projectSource()).value,config=bundle.catalog.get('config','ui.navigation').value,input=bundle.catalog.get('input','input.default').value;
 const preferences=defaultPreferences(config,input,'vi');preferences.bindings=preferences.bindings.slice(0,11);preferences.bindings[0].code='KeyJ';
 const record={schemaVersion:1,preferences,profile:{flags:{},readAnchors:[]}};let stored;
 const repository={get:async()=>({ok:true,value:record}),put:async value=>{stored=value;return {ok:true,value};},close(){}};
 const profile=new PlayerProfile({repository,bundle,config,input,locales:bundle.locales});assert((await profile.load()).ok);assert(profile.value.preferences.bindings.length>11,'new hearing controls must be appended');equal(profile.value.preferences.bindings[0].code,'KeyJ');assert(stored,'explicit extension must be persisted');
 record.preferences.bindings[0].contexts=['dialogue'];const invalid=new PlayerProfile({repository,bundle,config,input,locales:bundle.locales});assert(!(await invalid.load()).ok);
});
