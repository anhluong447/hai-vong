import {loadProject} from '../infrastructure/resources/ProjectLoader.js';
import {validateProject} from '../domain/story/validateProject.js';
import {TextService} from '../domain/story/TextService.js';
import {GameSession} from '../application/GameSession.js';
import {SequencePlayer} from '../application/SequencePlayer.js';
import {AssetCatalog} from '../infrastructure/resources/AssetCatalog.js';
import {AssetService} from '../infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '../infrastructure/resources/BrowserResourceDecoder.js';
import {CanvasAdapter} from '../infrastructure/browser/CanvasAdapter.js';
import {InputAdapter} from '../infrastructure/browser/InputAdapter.js';
import {AudioAdapter} from '../infrastructure/browser/AudioAdapter.js';
import {BrowserLifecycle} from '../infrastructure/browser/BrowserLifecycle.js';
import {World2D} from '../presentation/world/World2D.js';
import {resolveInteraction} from '../presentation/world/InteractionResolver.js';
import {TextView} from '../presentation/ui/TextView.js';
import {FocusRouter} from '../presentation/ui/FocusRouter.js';
import {SaveService} from '../application/SaveService.js';
import {SaveCodec} from '../infrastructure/storage/SaveCodec.js';
import {IndexedSaveRepository} from '../infrastructure/storage/IndexedSaveRepository.js';
import {MigrationRegistry} from '../infrastructure/storage/MigrationRegistry.js';
import {runtimeCheckpoint} from './RuntimeCheckpoint.js';
import {PlayerShell} from './PlayerShell.js';
import {PlayerProfile,validateProfile} from '../application/PlayerProfile.js';
import {PreferencesRepository} from '../infrastructure/storage/PreferencesRepository.js';
import {defaultPreferences,remapBinding} from '../contracts/PlayerPreferences.js';
import {createRunState} from '../domain/story/RunState.js';
import {DialogueControls} from '../presentation/ui/DialogueControls.js';
import {RUN_SCHEMA_VERSION} from '../contracts/RunSnapshot.js';
import {schemaStepsFor} from '../application/SaveMigrationPolicy.js';
import {diagnostic,failure} from '../contracts/Diagnostic.js';

/** Composition root: browser side effects are wired here, never in the domain. */
export async function createGame(root,{autoStart=true}={}){
 const source=await loadProject(root.dataset.project),validated=validateProject(source);if(!validated.ok)throw new Error(JSON.stringify(validated.errors));
 const bundle=validated.value,config=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,ui=bundle.catalog.get('config',config.uiId).value,navigation=bundle.catalog.get('config',config.navigationId).value,actions=bundle.catalog.get('config',config.actionLabelsId).value,inputDefinition=bundle.catalog.get('input',config.inputId).value;
 const text=new TextService(bundle.locales,bundle.project.defaultLocale),format=(key,params={})=>{const value=text.format(key,params);if(!value.ok)throw new Error(JSON.stringify(value.errors));return value.value;};
 const doc=root.ownerDocument,win=doc.defaultView,find=role=>root.querySelector(`[data-role="${role}"]`),button=action=>root.querySelector(`[data-action="${action}"]`),stage=find('stage'),canvas=root.querySelector('canvas');
 for(const [key,value]of Object.entries(ui.tokens))root.style.setProperty(key,value);root.style.setProperty('--viewport-ratio',ui.viewport.width+'/'+ui.viewport.height);
 // Body uses the same managed tokens; child content never invents defaults.
 for(const [key,value]of Object.entries(ui.tokens))doc.body.style.setProperty(key,value);
 for(const node of root.querySelectorAll('[data-text]'))node.textContent=format(node.dataset.text);
 for(const node of root.querySelectorAll('[data-label]'))node.setAttribute('aria-label',format(node.dataset.label));doc.title=format('world.title');
 const session=new GameSession({bundle}),decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)});
 const preferenceContract={bundle,config:navigation,input:inputDefinition,locales:bundle.locales};
 const preferenceRepository=new PreferencesRepository({name:bundle.project.id+'.player-preferences',validate:value=>validateProfile(value,preferenceContract)}),profile=new PlayerProfile({repository:preferenceRepository,...preferenceContract}),profileLoaded=await profile.load();
 let preferences=profile.value.preferences;for(const [id,value]of Object.entries(profile.value.profile.flags)){const initial=structuredClone(session.snapshot());initial.gameplay.flags[id]=value;session.replace(initial);}
 const view=new CanvasAdapter(canvas,ui.viewport),createPorts=()=>({world:new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:config.playerActorId,reducedMotion:win.matchMedia('(prefers-reduced-motion: reduce)').matches}),audio:new AudioAdapter({catalog:bundle.catalog,assets,revision:bundle.revision,buses:config.audioBuses}),sequence:new SequencePlayer(bundle.catalog.list('sequences'))});
 let {world,audio,sequence}=createPorts();
 const line=new TextView(find('line'),{text,speed:ui.textSpeed}),focus=new FocusRouter(win),lifecycle=new BrowserLifecycle({window:win,document:doc,maxDelta:ui.maxDelta});
 const controller=new AbortController(),options={signal:controller.signal};let paused=false,loading=false,disposed=false,error=profileLoaded.ok?null:profileLoaded.errors[0].code,serial=0,dialogueSignature=null,choiceSignature=null,sequenceSceneStep=null,frozen=false,loadEpoch=0,unfreeze=[],shell,playing=false,autoQueued=false;
 const input=new InputAdapter(win,{...inputDefinition,bindings:preferences.bindings},{onGesture:()=>{if(!paused&&!frozen)void audio.unlock();},onAction:intent=>{if(intent.action==='fullscreen')void view.fullscreen();}});
 const resize=()=>{const bounds=stage.getBoundingClientRect();view.resize(bounds.width,bounds.height,win.devicePixelRatio);};const observer=new ResizeObserver(resize);observer.observe(stage);win.addEventListener('resize',resize,options);resize();
 const setError=result=>{if(!result.ok)error=result.errors?.[0]?.code??'runtime.failed';return result;};
 function run(command){if(disposed||frozen)return failure(diagnostic(disposed?'runtime.disposed':'runtime.busy','runtime','/command'));const before=session.snapshot(),result=setError(session.execute(command));if(result.ok){for(const outcome of result.value.outcomes)if(outcome.type==='presentation.cue')void audio.play(outcome.cueId);if(command.type==='story.step'&&['advance','choose'].includes(command.intent.type))void profile.remember(session.snapshot()).then(setError);if(before.executionLedger.length!==session.snapshot().executionLedger.length||before.gameplay.calendar?.day!==session.snapshot().gameplay.calendar?.day||command.type==='story.step'&&command.intent.type==='choose'||command.type==='world.interact'&&before.story.waiting!==session.snapshot().story.waiting)queueAutosave();}sync();return result;}
 function sync(){
  if(disposed)return;const state=session.snapshot(),waiting=state.story.waiting,dialogue=['say','choose'].includes(waiting),scene=state.world.sceneId?bundle.catalog.get('scenes',state.world.sceneId).value:null;
  input.setContext(loading?'loading':paused?'menu':dialogue?'dialogue':'world');root.dataset.scene=state.world.sceneId??'';root.dataset.story=waiting;
  find('scene-name').textContent=scene?format(scene.nameKey):format('world.loading');find('dialogue').hidden=!dialogue;find('exploration').hidden=dialogue;
  const signature=waiting==='say'?JSON.stringify(state.story.cursor):null;
  if(signature!==dialogueSignature){dialogueSignature=signature;if(signature){line.show(state.presentation.dialogue.textKey,state.presentation.dialogue.params);line.restore({...line.snapshot(),revealed:state.presentation.dialogue.revealed});}}
  button('advance').hidden=waiting!=='say';
  const choiceKey=waiting==='choose'?JSON.stringify(state.story.cursor):null;
  if(choiceKey!==choiceSignature){choiceSignature=choiceKey;find('choices').replaceChildren();if(choiceKey){
   const story=bundle.catalog.get('story',state.story.cursor.chapterId).value,command=story.nodes.find(n=>n.id===state.story.cursor.nodeId).commands.find(c=>c.id===state.story.cursor.commandId);
   for(const choice of command.choices){const node=doc.createElement('button');node.textContent=format(choice.textKey);node.disabled=!!choice.condition&&state.gameplay.flags[choice.condition.flag]!==choice.condition.equals;node.addEventListener('click',()=>{run({type:'story.step',intent:{type:'choose',choiceId:choice.id}});canvas.focus();},options);find('choices').append(node);}
  }}
  const interaction=resolveInteraction(state.world,scene,state.gameplay.flags);button('interact').disabled=!interaction||paused||loading;button('interact').textContent=format(interaction?.nameKey??'world.interact');
  find('status').textContent=error?format('world.error',{code:error}):format(loading?'world.loading':paused?'world.paused':'world.ready');button('retry').hidden=!error;root.dataset.ready=String(!!scene&&!loading&&!error);
  const opacity=sequence.snapshot().values.curtainOpacity;find('curtain').hidden=!(opacity>0);if(opacity!==undefined)find('curtain').style.opacity=String(opacity);
 }
 function suspend(){paused=true;controls?.stop();input.cancelCapture();audio.pause();sequence.pause();sync();}
 function pause(){if(paused)return;suspend();void shell?.open('pause');}
 function resume(){shell?.close();paused=false;find('menu').hidden=true;input.cancelCapture();lifecycle.previous=null;sequence.resume();void audio.unlock();canvas.focus();if(!playing){playing=true;queueAutosave();}sync();}
 function revealState(){const state=session.snapshot();if(state.story.waiting!=='say')return;const count=Math.floor(line.snapshot().revealed)-state.presentation.dialogue.revealed;if(count>0)run({type:'story.step',intent:{type:'reveal',count}});}
 function advance(manual=true){if(manual)controls.stop();if(session.snapshot().story.waiting!=='say')return;if(!line.complete){line.reveal();revealState();}else{run({type:'story.step',intent:{type:'advance'}});canvas.focus();}}
 function interact(){error=null;run({type:'world.interact',requestId:String(++serial)});void loadPending();}
 const migrations=new MigrationRegistry({schemaVersion:RUN_SCHEMA_VERSION,contentVersion:bundle.revision,schemaSteps:schemaStepsFor(bundle)});
 const validateEnvelope=async envelope=>{const decoded=await SaveCodec.decode(envelope);if(!decoded.ok)return decoded;const migrated=migrations.migrate(decoded.value,envelope.contentVersion);return migrated.ok?session.validate(migrated.value):migrated;};
 const repository=new IndexedSaveRepository({name:bundle.project.id+'.player-saves',manualSlots:navigation.manualSlots,autoSlots:navigation.autoSlots,validate:validateEnvelope,integrity:SaveCodec.decode});
 const runtime=runtimeCheckpoint({
  read:()=>({world,audio,sequence}),create:createPorts,write:ports=>{({world,audio,sequence}=ports);loadEpoch++;loading=false;},
  freeze:({kind})=>{
   const guard={kind,audio,audioPaused:audio.paused,sequence,sequencePaused:sequence.snapshot().paused,focused:doc.activeElement,inert:root.inert};
   frozen=true;audio.pause();sequence.pause();if(kind==='restore'){input.clear();root.inert=true;}return guard;
  },
  thaw:guard=>{
   frozen=false;lifecycle.previous=null;if(!paused){if(guard.sequence===sequence&&!guard.sequencePaused)sequence.resume();if(!(guard.audio===audio?guard.audioPaused:audio.paused)&&lifecycle.active)void audio.unlock();}
   if(guard.kind==='restore'){root.inert=guard.inert;input.clear();if(guard.focused?.isConnected&&!guard.focused.closest('[hidden]'))guard.focused.focus();else if(paused)focus.items(find('menu'))[0]?.focus();else canvas.focus();}
   for(const done of unfreeze)done();unfreeze=[];sync();
  },
  captureUI:()=>({paused,...shell?.snapshot()}),restoreUI:(state,savedText)=>{paused=state.paused;dialogueSignature=null;choiceSignature=null;sync();if(savedText)line.restore(savedText);else line.dispose();shell?.restore(state.screen?state:{screen:paused?'pause':null});applyPreferences();},
  line,text,speed:ui.textSpeed,document:doc
 });
 const saves=new SaveService({session,runtime,repository,codec:SaveCodec,migrations,buildId:bundle.project.contentVersion,contentVersion:bundle.revision});
 function queueAutosave(){if(!playing||autoQueued||disposed)return;autoQueued=true;queueMicrotask(()=>{autoQueued=false;if(!disposed)void saves.autosave().then(setError);});}
 const controls=new DialogueControls({session,config:navigation,readAnchors:()=>[...new Set([...profile.value.profile.readAnchors,...(session.snapshot().story.readAnchors??[])])],complete:()=>line.complete,reveal:()=>{line.reveal();revealState();},advance:()=>advance(false)});
 function applyPreferences(){
  preferences=profile.value.preferences;text.locale=preferences.locale;doc.documentElement.lang=preferences.locale;line.configure({speed:preferences.textSpeed,locale:preferences.locale});
  root.style.setProperty('--text-size',`calc(${ui.tokens['--text-size']} * ${preferences.textScale})`);world.reducedMotion=preferences.reducedMotion;input.configure({...inputDefinition,bindings:preferences.bindings});for(const [id,gain]of Object.entries(preferences.audio))audio.setBus(id,{gain});
  if(session.snapshot().story.waiting==='say'&&line.snapshot()&&Math.floor(line.snapshot().revealed)!==session.snapshot().presentation.dialogue.revealed)session.execute({type:'story.step',intent:{type:'revealTo',count:Math.floor(line.snapshot().revealed)}});
  for(const node of root.querySelectorAll('[data-text]'))node.textContent=format(node.dataset.text);for(const node of root.querySelectorAll('[data-label]'))node.setAttribute('aria-label',format(node.dataset.label));doc.title=format('world.title');choiceSignature=null;sync();
  const hint=action=>preferences.bindings.filter(binding=>binding.action===action).map(binding=>binding.code).join(navigation.bindingSeparator);find('controls').textContent=format('world.controls',{left:hint('moveLeft'),right:hint('moveRight'),interact:hint('interact'),menu:hint('menu'),fullscreen:hint('fullscreen')});
 }
 async function changePreferences(value){const result=await profile.preferences(value);if(result.ok)applyPreferences();return result;}
 async function start(){
  const initial=createRunState(bundle);Object.assign(initial.gameplay.flags,profile.value.profile.flags);initial.world.pending={sceneId:config.startSceneId,spawnId:config.startSpawnId,requestId:String(++serial)};
  initial.presentation.view={world:{sceneId:null,elapsed:0,cameraX:0,actors:{}},text:null,ui:{paused:true,screen:'main'}};
  const envelope=await SaveCodec.encode(initial,{buildId:bundle.project.contentVersion,contentVersion:bundle.revision});if(!envelope.ok)return setError(envelope);const result=await saves.restore(envelope.value);if(result.ok)await loadPending();return setError(result);
 }
 shell=new PlayerShell({root:find('menu'),format,navigation,actions,focus,saves,repository,getPreferences:()=>preferences,
  changePreferences:(key,value)=>changePreferences({...preferences,[key]:value}),defaults:()=>changePreferences(defaultPreferences(navigation,inputDefinition,bundle.project.defaultLocale)),
  remap:(index,callback)=>input.captureNext(async code=>{if(code===null){callback({ok:true,value:preferences});return;}const result=remapBinding(preferences,index,code,preferenceContract);callback(result.ok?await changePreferences(result.value):result);},navigation.cancelCaptureCodes),
  history:()=>session.snapshot().story.history??[],start,resume,audio:()=>audio.unlock(),fullscreen:()=>view.fullscreen(),onPause:suspend
 });
 applyPreferences();
 async function loadPending(){
  if(loading||disposed||frozen)return;const state=session.snapshot(),pending=state.world.pending,storyPending=state.story.waiting==='transition'?state.story.pending:null;if(!pending&&!storyPending)return;
  const owner=world,epoch=++loadEpoch;loading=true;error=null;sync();const prepared=await owner.prepare((pending??storyPending).sceneId);
  if(frozen)await new Promise(resolve=>unfreeze.push(resolve));
  if(disposed||epoch!==loadEpoch||owner!==world)return;if(prepared.ok){const result=session.execute(pending?{type:'scene.commit',requestId:pending.requestId}:{type:'story.step',intent:{type:'loaded',sceneId:storyPending.sceneId}});
   if(result.ok){setError(world.commit(prepared.value));const scene=prepared.value.scene;
    if(sequenceSceneStep){if(sequence.snapshot().status==='waiting')sequence.ack(sequenceSceneStep);sequenceSceneStep=null;}else if(scene.sequenceId){sequence.play(scene.sequenceId);sequence.update(0);}
    if(scene.cueId&&!audio.snapshot().tracks.some(t=>t.cueId===scene.cueId))setError(await audio.play(scene.cueId));}else setError(result);
  }else setError(prepared);
  if(disposed||epoch!==loadEpoch)return;loading=false;sync();if(!paused)canvas.focus();world.render(session.snapshot().world,0);queueAutosave();
 }
 function step(delta){
  if(disposed||frozen)return;sync();for(const intent of input.drain()){
   if(intent.action==='menu')pause();else if(intent.action==='back')shell.back();else if(!paused&&!loading&&lifecycle.active){if(intent.action==='interact')interact();else if(intent.action==='advance')advance();}
  }
  const active=lifecycle.active&&!paused&&!loading,elapsed=active?Math.min(delta,ui.maxDelta):0,state=session.snapshot();
  if(active&&['idle','end'].includes(state.story.waiting)){const axis=Number(input.held('moveRight'))-Number(input.held('moveLeft'));if(axis||state.world.moving)run({type:'world.move',axis,delta:elapsed});}
  if(active&&state.story.waiting==='say'){line.update(elapsed);revealState();}
  if(active)controls.update(elapsed);
  if(active)for(const signal of sequence.update(elapsed)){if(signal.kind==='cue')void audio.play(signal.cueId);else if(signal.kind==='scene'){sequenceSceneStep=signal.id;run({type:'scene.request',sceneId:signal.sceneId,requestId:String(++serial)});}}
  world.render(session.snapshot().world,elapsed);sync();void loadPending();
 }
 button('pause').addEventListener('click',pause,options);button('advance').addEventListener('click',advance,options);button('interact').addEventListener('click',interact,options);button('retry').addEventListener('click',()=>{error=null;void loadPending();},options);
 for(const mode of ['auto','skip'])button(mode).addEventListener('click',()=>controls.toggle(mode),options);button('stop').addEventListener('click',()=>controls.stop(),options);
 lifecycle.subscribe(active=>{input.clear();if(!active)audio.pause();else if(!paused)void audio.unlock();});
 async function dispose(){if(disposed)return;disposed=true;for(const done of unfreeze)done();unfreeze=[];controller.abort();observer.disconnect();lifecycle.dispose();input.dispose();shell.dispose();focus.dispose();line.dispose();sequence.cancel();world.dispose();await audio.dispose();await profile.close();repository.close();assets.dispose();view.dispose();}
 win.addEventListener('pagehide',()=>void dispose(),options);
 run({type:'scene.request',sceneId:config.startSceneId,spawnId:config.startSpawnId,requestId:String(++serial)});await loadPending();await shell.open('main');if(autoStart)lifecycle.start(step);
 return {session,execute:run,get world(){return world;},assets,get audio(){return audio;},get sequence(){return sequence;},get preferences(){return preferences;},input,saves,step,pause,resume,dispose};
}
const shell=document.querySelector('[data-game]');if(shell)createGame(shell).catch(()=>location.assign(shell.dataset.failurePage));
