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

/** Composition root: browser side effects are wired here, never in the domain. */
export async function createGame(root,{autoStart=true}={}){
 const source=await loadProject(root.dataset.project),validated=validateProject(source);if(!validated.ok)throw new Error(JSON.stringify(validated.errors));
 const bundle=validated.value,config=bundle.catalog.get('config',bundle.project.runtimeConfigId).value,ui=bundle.catalog.get('config',config.uiId).value;
 const text=new TextService(bundle.locales,bundle.project.defaultLocale),format=(key,params={})=>{const value=text.format(key,params);if(!value.ok)throw new Error(JSON.stringify(value.errors));return value.value;};
 const doc=root.ownerDocument,win=doc.defaultView,find=role=>root.querySelector(`[data-role="${role}"]`),button=action=>root.querySelector(`[data-action="${action}"]`),stage=find('stage'),canvas=root.querySelector('canvas');
 for(const [key,value]of Object.entries(ui.tokens))root.style.setProperty(key,value);root.style.setProperty('--viewport-ratio',ui.viewport.width+'/'+ui.viewport.height);
 // Body uses the same managed tokens; child content never invents defaults.
 for(const [key,value]of Object.entries(ui.tokens))doc.body.style.setProperty(key,value);
 for(const node of root.querySelectorAll('[data-text]'))node.textContent=format(node.dataset.text);
 for(const node of root.querySelectorAll('[data-label]'))node.setAttribute('aria-label',format(node.dataset.label));doc.title=format('world.title');
 const session=new GameSession({bundle}),decoder=new BrowserResourceDecoder(),assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)});
 const view=new CanvasAdapter(canvas,ui.viewport),world=new World2D({view,catalog:bundle.catalog,assets,revision:bundle.revision,playerActorId:config.playerActorId,reducedMotion:win.matchMedia('(prefers-reduced-motion: reduce)').matches});
 const audio=new AudioAdapter({catalog:bundle.catalog,assets,revision:bundle.revision,buses:config.audioBuses}),line=new TextView(find('line'),{text,speed:ui.textSpeed}),focus=new FocusRouter(win),lifecycle=new BrowserLifecycle({window:win,document:doc,maxDelta:ui.maxDelta});
 const sequence=new SequencePlayer(bundle.catalog.list('sequences'));
 const controller=new AbortController(),options={signal:controller.signal};let paused=false,loading=false,disposed=false,error=null,serial=0,dialogueSignature=null,choiceSignature=null,sequenceSceneStep=null;
 const input=new InputAdapter(win,bundle.catalog.get('input',config.inputId).value,{onGesture:()=>{if(!paused)void audio.unlock();},onAction:intent=>{if(intent.action==='fullscreen')void view.fullscreen();}});
 const resize=()=>{const bounds=stage.getBoundingClientRect();view.resize(bounds.width,bounds.height,win.devicePixelRatio);};const observer=new ResizeObserver(resize);observer.observe(stage);win.addEventListener('resize',resize,options);resize();
 const setError=result=>{if(!result.ok)error=result.errors?.[0]?.code??'runtime.failed';return result;};
 function run(command){const result=setError(session.execute(command));if(result.ok)for(const outcome of result.value.outcomes)if(outcome.type==='presentation.cue')void audio.play(outcome.cueId);sync();return result;}
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
 function pause(){if(paused)return;paused=true;input.clear();audio.pause();sequence.pause();find('menu').hidden=false;focus.push(find('menu'));sync();}
 function resume(){if(!paused)return;paused=false;focus.pop();find('menu').hidden=true;input.clear();lifecycle.previous=null;sequence.resume();void audio.unlock();sync();}
 function revealState(){const state=session.snapshot();if(state.story.waiting!=='say')return;const count=Math.floor(line.snapshot().revealed)-state.presentation.dialogue.revealed;if(count>0)run({type:'story.step',intent:{type:'reveal',count}});}
 function advance(){if(session.snapshot().story.waiting!=='say')return;if(!line.complete){line.reveal();revealState();}else{run({type:'story.step',intent:{type:'advance'}});canvas.focus();}}
 function interact(){error=null;run({type:'world.interact',requestId:String(++serial)});void loadPending();}
 async function loadPending(){
  if(loading||disposed)return;const state=session.snapshot(),pending=state.world.pending,storyPending=state.story.waiting==='transition'?state.story.pending:null;if(!pending&&!storyPending)return;
  loading=true;error=null;sync();const prepared=await world.prepare((pending??storyPending).sceneId);
  if(disposed)return;if(prepared.ok){const result=session.execute(pending?{type:'scene.commit',requestId:pending.requestId}:{type:'story.step',intent:{type:'loaded',sceneId:storyPending.sceneId}});
   if(result.ok){setError(world.commit(prepared.value));const scene=prepared.value.scene;
    if(sequenceSceneStep){if(sequence.snapshot().status==='waiting')sequence.ack(sequenceSceneStep);sequenceSceneStep=null;}else if(scene.sequenceId){sequence.play(scene.sequenceId);sequence.update(0);}
    if(scene.cueId&&!audio.snapshot().tracks.some(t=>t.cueId===scene.cueId))setError(await audio.play(scene.cueId));}else setError(result);
  }else setError(prepared);
  loading=false;sync();canvas.focus();world.render(session.snapshot().world,0);
 }
 function step(delta){
  if(disposed)return;for(const intent of input.drain()){
   if(intent.action==='menu')pause();else if(intent.action==='back')resume();else if(!paused&&!loading&&lifecycle.active){if(intent.action==='interact')interact();else if(intent.action==='advance')advance();}
  }
  const active=lifecycle.active&&!paused&&!loading,elapsed=active?Math.min(delta,ui.maxDelta):0,state=session.snapshot();
  if(active&&['idle','end'].includes(state.story.waiting)){const axis=Number(input.held('moveRight'))-Number(input.held('moveLeft'));if(axis||state.world.moving)run({type:'world.move',axis,delta:elapsed});}
  if(active&&state.story.waiting==='say'){line.update(elapsed);revealState();}
  if(active)for(const signal of sequence.update(elapsed)){if(signal.kind==='cue')void audio.play(signal.cueId);else if(signal.kind==='scene'){sequenceSceneStep=signal.id;run({type:'scene.request',sceneId:signal.sceneId,requestId:String(++serial)});}}
  world.render(session.snapshot().world,elapsed);sync();void loadPending();
 }
 button('pause').addEventListener('click',pause,options);button('resume').addEventListener('click',resume,options);button('advance').addEventListener('click',advance,options);button('interact').addEventListener('click',interact,options);button('retry').addEventListener('click',()=>{error=null;void loadPending();},options);button('audio').addEventListener('click',()=>void audio.unlock(),options);button('fullscreen').addEventListener('click',()=>void view.fullscreen(),options);
 lifecycle.subscribe(active=>{input.clear();if(!active)audio.pause();else if(!paused)void audio.unlock();});
 async function dispose(){if(disposed)return;disposed=true;controller.abort();observer.disconnect();lifecycle.dispose();input.dispose();focus.dispose();line.dispose();sequence.cancel();world.dispose();await audio.dispose();assets.dispose();view.dispose();}
 win.addEventListener('pagehide',()=>void dispose(),options);
 run({type:'scene.request',sceneId:config.startSceneId,spawnId:config.startSpawnId,requestId:String(++serial)});await loadPending();if(autoStart)lifecycle.start(step);
 return {session,world,assets,audio,sequence,input,step,pause,resume,dispose};
}
const shell=document.querySelector('[data-game]');if(shell)createGame(shell).catch(()=>location.assign(shell.dataset.failurePage));
