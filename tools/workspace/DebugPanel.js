import {GameSession} from '../../src/application/GameSession.js';
import {DebugSession} from '../../src/application/DebugSession.js';
import {ReloadService} from '../../src/application/ReloadService.js';
import {MigrationRegistry} from '../../src/infrastructure/storage/MigrationRegistry.js';
import {CrashReporter} from '../../src/infrastructure/browser/CrashReporter.js';
import {diagnostic,failure,success} from '../../src/contracts/Diagnostic.js';
import {element} from '../../src/presentation/ui/uiNodes.js';
import {PlaytestSession} from './PlaytestSession.js';
import {RuntimePreview} from './RuntimePreview.js';
import {TracePanel} from './TracePanel.js';
import {TextService} from '../../src/domain/story/TextService.js';
import {TextView} from '../../src/presentation/ui/TextView.js';
const bad=code=>failure(diagnostic(code,'debug','/'));
async function fingerprint(sources){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(sources))))).map(value=>value.toString(16).padStart(2,'0')).join('');}
/** Development-only composition: no player storage/profile adapter is constructed. */
export class DebugPanel {
 constructor(root,{workspace,text,onResult,readRevision,loadSources,onSourceReload}){
  Object.assign(this,{root,workspace,text,onResult,readRevision,loadSources,onSourceReload});const config=workspace.bundle.catalog.get('config','ui.workspace').value;this.ui=workspace.bundle.catalog.get('config',config.debugId).value;const authoring=workspace.bundle.catalog.get('config',config.authoringId).value;this.settings=authoring.preview;for(const [key,value]of Object.entries(authoring.tokens))root.style.setProperty(key,value);this.controller=new AbortController();this.epoch=0;this.watchEpoch=0;
  this.reload=new ReloadService({cancellation:()=>new AbortController(),capture:()=>this.capture(),migrate:(snapshot,bundle,mapping)=>new MigrationRegistry({schemaVersion:snapshot.schemaVersion,contentVersion:bundle.revision,contentSteps:[mapping]}).migrate(snapshot,snapshot.contentRevision),prepare:({bundle,snapshot,signal})=>this.prepareOwner(bundle,snapshot,signal),commit:(token,meta)=>this.commitReload(token,meta),abort:token=>{token.preview.dispose();token.root.remove();}});
  this.render();this.crashes=new CrashReporter({window:root.ownerDocument.defaultView,limit:this.ui.limits.crashReports,context:()=>({fingerprint:this.fingerprint,snapshot:this.session?.snapshot(),trace:this.current?.debug.exportTrace()}),screenshot:()=>this.canvas?.toDataURL('image/png')});
 }
 label(key,params={}){const result=this.text.format(key,params);if(!result.ok)throw new Error(JSON.stringify(result));return result.value;}
 node(tag,attrs={},value){const node=element(this.root,tag,attrs);if(value!==undefined)node.textContent=value;return node;}
 button(key,action,run){const node=this.node('button',{'data-debug-action':action},this.label(this.ui.labels[key]));node.addEventListener('click',run,{signal:this.controller.signal});return node;}
 field(key,role,tag='input'){const label=this.node('label'),control=this.node(tag,{'data-role':role});label.append(this.node('span',{},this.label(this.ui.labels[key])),control);this.root.append(label);return control;}
 options(select,ids,preferred=select.value){select.replaceChildren();for(const id of ids)select.append(this.node('option',{value:id},id));if(ids.includes(preferred))select.value=preferred;}
 render(){
  this.root.append(this.node('h2',{},this.label(this.ui.labels.title)));this.fixture=this.field('fixture','debug-fixture','select');this.chapter=this.field('chapter','debug-chapter','select');this.nodeSelect=this.field('node','debug-node','select');this.flag=this.field('flag','debug-flag','select');this.flagValue=this.field('flagValue','debug-flag-value','textarea');this.refreshOptions();
  this.chapter.addEventListener('change',()=>this.refreshNodes(),{signal:this.controller.signal});this.flag.addEventListener('change',()=>{this.flagValue.value=JSON.stringify(this.workspace.bundle.catalog.get('flags',this.flag.value).value.default);},{signal:this.controller.signal});
  this.root.append(this.button('start','start',()=>void this.startFixture(this.fixture.value)),this.button('jump','jump',()=>this.jump()),this.button('setFlag','set-flag',()=>{try{this.report(this.current?.debug.setFlag(this.flag.value,JSON.parse(this.flagValue.value))??bad('debug.not-started'));this.renderState();}catch{this.report(bad('debug.value.invalid'));}}));
  this.command=this.field('command','debug-command','textarea');this.command.value=JSON.stringify(this.ui.initialCommand,null,2);this.root.append(this.button('execute','execute',()=>{try{this.execute(JSON.parse(this.command.value));}catch{this.report(bad('debug.command.invalid'));}}),this.button('skip','skip',()=>{this.report(this.current?.debug.skip(this.ui.limits.skipSteps)??bad('debug.not-started'));this.renderState();}));
  this.mapping=this.field('mapping','debug-mapping','textarea');this.root.append(this.button('applyWorking','apply-working',()=>void this.applyWorking()),this.button('restart','restart',()=>void this.applyWorking({mode:'restart'})));const saved=this.button('reloadSaved','reload-saved',()=>void this.applySaved());saved.disabled=!this.loadSources;this.root.append(saved);
  this.watch=this.field('watch','debug-watch');this.watch.type='checkbox';this.watch.disabled=!this.readRevision||!this.loadSources;this.watch.addEventListener('change',()=>this.setWatching(this.watch.checked),{signal:this.controller.signal});
  this.message=this.node('p',{'data-role':'debug-message',role:'status'});this.previewRoot=this.node('div',{'data-role':'debug-preview'});this.lineRoot=this.node('p',{'data-role':'debug-dialogue'});this.state=this.node('pre',{'data-role':'debug-state','aria-label':this.label(this.ui.labels.state)});this.root.append(this.message,this.previewRoot,this.lineRoot,this.state);
  const trace=this.node('div');this.root.append(trace);this.trace=new TracePanel(trace,{ui:this.ui,text:this.text,getOwner:()=>this.current,replace:(bundle,snapshot)=>this.replaceOwner(bundle,snapshot),report:result=>this.report(result)});
  this.crash=this.field('crash','debug-crash','textarea');this.crash.readOnly=true;this.root.append(this.button('exportCrash','export-crash',()=>{this.crash.value=this.crashes.exportLatest();}),this.button('stop','stop',()=>this.stop()));
 }
 refreshOptions(){const bundle=this.workspace.bundle;this.options(this.fixture,bundle.catalog.list('playtests').map(def=>def.id),this.fixture.value||this.ui.defaultFixtureId);this.options(this.chapter,bundle.catalog.list('story').map(def=>def.id));this.options(this.flag,bundle.catalog.list('flags').map(def=>def.id));this.flagValue.value=JSON.stringify(bundle.catalog.get('flags',this.flag.value).value?.default);this.refreshNodes();}
 refreshNodes(){const chapter=this.workspace.bundle.catalog.get('story',this.chapter.value).value;this.options(this.nodeSelect,chapter?.nodes.map(node=>node.id)??[]);}
 capture(){
  const snapshot=structuredClone(this.session.snapshot()),dialogue=snapshot.presentation.dialogue;
  snapshot.presentation.view={world:this.current.preview.world.snapshot(),text:dialogue?{key:dialogue.textKey,params:dialogue.params,revealed:dialogue.revealed}:null,ui:{paused:false}};
  return {bundle:this.current.bundle,snapshot,token:JSON.stringify(snapshot)};
 }
 get session(){return this.current?.debug.session??null;}
 get canvas(){return this.current?.preview.canvas??null;}
 report(result){if(this.disposed)return result;this.message.textContent=result.ok?'':result.errors.map(error=>this.label('workspace.diagnostic',{code:error.code,source:error.sourceId,pointer:error.pointer})).join('\n');if(!result.ok)this.onResult?.(result);return result;}
 renderState(){if(this.disposed)return;this.state.textContent=this.label('authoring.result',{value:JSON.stringify({fingerprint:this.fingerprint,state:this.session?.snapshot()??null})});this.current?.preview.step(0);this.line?.dispose();this.lineRoot.replaceChildren();const dialogue=this.session?.snapshot().presentation.dialogue;if(dialogue){const text=new TextService(this.current.bundle.locales,this.text.locale),runtime=this.current.bundle.catalog.get('config',this.current.bundle.project.runtimeConfigId).value,ui=this.current.bundle.catalog.get('config',runtime.uiId).value;this.line=new TextView(this.lineRoot,{text,speed:ui.textSpeed});this.line.show(dialogue.textKey,dialogue.params);this.line.reveal();}}
 async prepareOwner(bundle,snapshot,signal){
  const root=this.node('div');root.hidden=true;this.previewRoot.append(root);const preview=new RuntimePreview(root,this.settings);let session;
  try{
   session=new GameSession({bundle,initialState:snapshot});if(!session.snapshot().world.sceneId){if(session.snapshot().world.pending){preview.dispose();root.remove();return bad('debug.pending.restart-required');}const config=bundle.catalog.get('config',bundle.project.runtimeConfigId).value;for(const command of [{type:'scene.request',sceneId:config.startSceneId,spawnId:config.startSpawnId,requestId:'debug.restart'},{type:'scene.commit',requestId:'debug.restart'}]){const result=session.execute(command);if(!result.ok){preview.dispose();root.remove();return result;}}}
   const loaded=await preview.load(bundle,session.snapshot().world.sceneId,{session,signal,interactive:false});if(!loaded.ok){preview.dispose();root.remove();return loaded;}return success({bundle,root,preview,debug:new DebugSession({session,enabled:true,limit:this.ui.limits.traceEntries})});
  }catch{preview.dispose();root.remove();return bad('debug.preview.failed');}
 }
 adopt(owner){const previous=this.current;this.current=owner;owner.root.hidden=false;this.previewRoot.replaceChildren(owner.root);previous?.preview.dispose();this.renderState();}
 async replaceOwner(bundle,snapshot,{fingerprint=this.fingerprint}={}){this.reload.cancel();const epoch=++this.epoch;this.startController?.abort();this.startController=new AbortController();const result=await this.prepareOwner(bundle,snapshot,this.startController.signal);if(!result.ok)return this.report(result);if(this.disposed||epoch!==this.epoch){result.value.preview.dispose();result.value.root.remove();return bad('debug.stale');}this.fingerprint=fingerprint;this.adopt(result.value);return this.report(success(this.session.snapshot()));}
 async startFixture(id){const replay=new PlaytestSession(),result=replay.start(this.workspace.bundle,id);if(!result.ok)return this.report(result);const revision=await fingerprint(this.workspace.exportSources());return this.replaceOwner(this.workspace.bundle,replay.snapshot(),{fingerprint:revision});}
 execute(command){const result=this.current?.debug.execute(command)??bad('debug.not-started');this.report(result);this.renderState();return result;}
 jump(){const replay=new PlaytestSession(),prepared=replay.start(this.workspace.bundle,this.fixture.value);if(!prepared.ok)return this.report(prepared);const result=this.current?.debug.jump({chapterId:this.chapter.value,nodeId:this.nodeSelect.value,fixture:replay.snapshot()})??bad('debug.not-started');this.report(result);this.renderState();return result;}
 commitReload(token,{sources,fingerprint,context}){
  if(this.disposed)return bad('debug.disposed');if(context.watchEpoch!==undefined&&(!this.watching||context.watchEpoch!==this.watchEpoch))return bad('debug.watch.stale');if(this.workspace.revisionToken!==context.workspaceToken)return bad('authoring.reload.conflict');
  if(context.adoptSources){const replaced=this.workspace.reloadSources(sources,context.workspaceToken);if(!replaced.ok)return replaced;}
  this.fingerprint=fingerprint;this.adopt(token);return success(null);
 }
 async apply(sources,{mode='preserve',adoptSources=false,revision,watchEpoch}={}){
  if(!this.current)return this.report(bad('debug.not-started'));const workspaceToken=this.workspace.revisionToken;let mapping;
  try{if(this.mapping.value.trim())mapping=JSON.parse(this.mapping.value);}catch{return this.report(bad('debug.mapping.invalid'));}
  const result=await this.reload.apply(sources,{fingerprint:revision??await fingerprint(sources),mode,mapping,context:{workspaceToken,adoptSources,watchEpoch}});if(result.ok){this.text.locales=this.workspace.bundle.locales;const config=this.workspace.bundle.catalog.get('config','ui.workspace').value;this.ui=this.workspace.bundle.catalog.get('config',config.debugId).value;this.refreshOptions();if(adoptSources)this.onSourceReload?.();}this.renderState();return this.report(result);
 }
 applyWorking(options={}){return this.apply(this.workspace.exportSources(),options);}
 async applySaved(revision,watchEpoch){if(!this.loadSources)return this.report(bad('debug.reload.unavailable'));if(this.workspace.list().some(doc=>doc.dirty))return this.report(bad('authoring.reload.dirty'));try{const sources=await this.loadSources();if(watchEpoch!==undefined&&(!this.watching||watchEpoch!==this.watchEpoch))return bad('debug.watch.stale');return await this.apply(sources,{adoptSources:true,revision,watchEpoch});}catch{return this.report(bad('debug.reload.failed'));}}
 setWatching(value){this.watchEpoch++;clearTimeout(this.timer);this.watching=value;this.watch.checked=value;return value?this.pollOnce(this.watchEpoch):Promise.resolve();}
 async pollOnce(epoch=this.watchEpoch){
  if(this.disposed||!this.watching||epoch!==this.watchEpoch)return;try{const revision=await this.readRevision();if(this.disposed||!this.watching||epoch!==this.watchEpoch)return;if(!revision.ok){this.report(revision);this.setWatching(false);return;}if(this.disposed||!this.watching||epoch!==this.watchEpoch)return;if(revision.value.fingerprint!==this.watchedFingerprint){const result=await this.applySaved(revision.value.fingerprint,epoch);if(!result.ok){if(epoch===this.watchEpoch)this.setWatching(false);return;}this.watchedFingerprint=revision.value.fingerprint;}}
  catch{if(epoch===this.watchEpoch){this.report(bad('debug.watch.failed'));this.setWatching(false);}}finally{if(this.watching&&!this.disposed&&epoch===this.watchEpoch)this.timer=setTimeout(()=>void this.pollOnce(epoch),this.ui.limits.pollIntervalMs);}
 }
 stop(){this.reload.cancel();this.epoch++;this.startController?.abort();this.setWatching(false);this.current?.preview.dispose();this.current=null;this.previewRoot.replaceChildren();this.renderState();}
 async dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.controller.abort();this.reload.dispose();this.trace.dispose();this.crashes.dispose();this.line?.dispose();}
}
