import {test,assert as a} from './harness.js';
import {t,eventText,registerLocale,setLocale,DEFAULT_LOCALE} from '../src/shared/text.js';
import {validateContent} from '../src/shared/validateContent.js';
import {GAME_CONTENT} from '../content/manifest.js';
import {GameSession} from '../src/application/GameSession.js';
import {createSession,transition} from '../src/gameplay/engine.js';
import {GameplaySaveService,validateGameplaySave,GAMEPLAY_SAVE_KEYS} from '../src/infrastructure/GameplaySaveService.js';
import {PixelInput} from '../src/world/PixelInput.js';

test('content: active pack validates; dangling maps and dialogue references fail',()=>{
 a.ok(validateContent(GAME_CONTENT));
 const mapPack=structuredClone(GAME_CONTENT);mapPack.maps.yard.portals[0].to='missing';a.throws(()=>validateContent(mapPack));
 const dialoguePack=structuredClone(GAME_CONTENT);dialoguePack.scenes.van.nodes.start.next='missing';a.throws(()=>validateContent(dialoguePack));
 const rosterPack=structuredClone(GAME_CONTENT);rosterPack.roster.push(rosterPack.roster[0]);a.throws(()=>validateContent(rosterPack));
});

test('text: parameters, fallback and historical log messages resolve without changing event data',()=>{
 const event={textKey:'journal.assignment',params:{title:'Case',name:'Writer'}};
 a.equal(eventText(event),'Giao Case cho Writer.');a.equal(eventText({message:'historical'}),'historical');
 registerLocale('test',{ 'journal.assignment':'{name}: {title}' });
 try{setLocale('test');a.equal(eventText(event),'Writer: Case');a.equal(t('ui.map_pixel'),'Map pixel');}
 finally{setLocale(DEFAULT_LOCALE);}
 a.equal(event.params.title,'Case');a.throws(()=>t('missing'));a.throws(()=>t('journal.assignment',{name:'Writer'}));
});

test('session: failed commands and invalid replacements leave the current state intact',()=>{
 const session=new GameSession();const before=JSON.stringify(session.snapshot());
 a.throws(()=>session.execute({type:'assign',id:'missing',person:'long'}));a.equal(JSON.stringify(session.snapshot()),before);
 const broken=session.snapshot();broken.people[0].stats.photo=NaN;
 a.throws(()=>session.replace(broken));a.equal(JSON.stringify(session.snapshot()),before);
 session.execute({type:'school'});a.equal(session.state.phase,'club');
 const snapshot=session.snapshot();snapshot.money=0;a.equal(session.state.money,300);
});

test('world input: routing respects blocking and releases every listener on disposal',()=>{
 const windowTarget=new EventTarget(),documentTarget=new EventTarget(),canvas=new EventTarget();
 let interactions=0,pointers=0;
 const world={canvas,keys:new Set(),path:[],target:null,blocked:false,interact(){interactions++;},click(){pointers++;},clearInput(){this.keys.clear();this.path=[];this.target=null;}};
 const input=new PixelInput(world,{windowTarget,documentTarget});
 const key=()=>Object.assign(new Event('keydown',{cancelable:true}),{key:'d',repeat:false});
 windowTarget.dispatchEvent(key());a.ok(world.keys.has('right'));
 windowTarget.dispatchEvent(new Event('blur'));a.equal(world.keys.size,0);
 world.blocked=true;windowTarget.dispatchEvent(key());a.equal(world.keys.size,0);world.blocked=false;
 windowTarget.dispatchEvent(Object.assign(new Event('keydown'),{key:'e',repeat:false}));a.equal(interactions,1);
 canvas.dispatchEvent(new Event('pointerdown'));a.equal(pointers,1);
 input.dispose();windowTarget.dispatchEvent(key());canvas.dispatchEvent(new Event('pointerdown'));
 a.equal(world.keys.size,0);a.equal(pointers,1);
});

test('saves: versioned roundtrip, v1 migration, isolated modes and storage failures',()=>{
 const records=new Map();const storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
 const gameplay=new GameplaySaveService({storage,clock:()=> '2026-10-09T00:00:00.000Z'});
 const pixel=new GameplaySaveService({storage,mode:'pixel'});
 let state=transition(createSession(),{type:'school'});
 state=transition(state,{type:'open',id:state.cases[0].id});state=transition(state,{type:'assign',id:state.cases[0].id,person:'long'});
 gameplay.save(state);a.equal(JSON.stringify(gameplay.load().state),JSON.stringify(state));
 const world={mapId:'home',x:9,y:12,direction:'down'};pixel.save(state,world);a.equal(pixel.load().world.mapId,'home');
 const legacy=structuredClone(state);legacy.version=1;legacy.people[1].skills=['hiệp đồng'];legacy.log=[{day:1,phase:'morning',message:'historical'}];
 records.set(GAMEPLAY_SAVE_KEYS.gameplay,JSON.stringify(legacy));
 const migrated=gameplay.load().state;a.equal(migrated.version,2);a.equal(migrated.people[1].skills[0],'synergy');a.equal(eventText(migrated.log[0]),'historical');
 records.set(GAMEPLAY_SAVE_KEYS.pixel,JSON.stringify({state:legacy,world}));a.equal(pixel.load().world.mapId,'home');
 const saved=JSON.parse(records.get(GAMEPLAY_SAVE_KEYS.pixel));saved.state.messages=[{id:'bad',caseId:'missing',kind:'progress',resolved:false,day:1}];
 records.set(GAMEPLAY_SAVE_KEYS.pixel,JSON.stringify(saved));a.throws(()=>pixel.load());
 const broken=structuredClone(state);broken.phase='unknown';a.throws(()=>validateGameplaySave(broken));
 const failure=new GameplaySaveService({storage:{setItem(){throw new Error('storage failed');}}});a.throws(()=>failure.save(state),/storage failed/);
});
