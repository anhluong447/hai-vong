import {element} from '../../src/presentation/ui/uiNodes.js';
import {ResourceIndex} from './resources/ResourceIndex.js';
import {StringsPanel} from './resources/StringsPanel.js';
import {AssetsPanel} from './resources/AssetsPanel.js';
import {AnimationPanel} from './resources/AnimationPanel.js';
import {AudioPanel} from './resources/AudioPanel.js';
import {EventsPanel} from './resources/EventsPanel.js';
import {SceneEditor} from './editors/SceneEditor.js';
import {LayoutEditor} from './editors/LayoutEditor.js';
import {BindingsEditor} from './editors/BindingsEditor.js';
import {Inspector} from './editors/Inspector.js';
import {StoryEditor} from './editors/StoryEditor.js';
import {QuestEditor} from './editors/QuestEditor.js';
import {GameplayEditor} from './editors/GameplayEditor.js';
import {HearingEditor} from './editors/HearingEditor.js';
import {PresentationEditor} from './editors/PresentationEditor.js';
/** One source selection, one inspector, and one disposable preview per workspace. */
export class EditorHost {
 constructor(root,{workspace,text,onSelect,onResult,rebuildAssets}){Object.assign(this,{root,workspace,text,onSelect,onResult,rebuildAssets});this.index=new ResourceIndex(workspace);this.query='';this.offset=0;this.viewStates=new Map();}
 label(key,params={}){const result=this.text.format(key,params);if(!result.ok)throw new Error(JSON.stringify(result));return result.value;}
 node(tag,attributes={},copy){const node=element(this.root,tag,attributes);if(copy!==undefined)node.textContent=copy;return node;}
 button(key,run,attributes={},signal=this.controller.signal){const node=this.node('button',attributes,this.label(key));node.addEventListener('click',run,{signal});return node;}
 render(sourceId){
  const field=this.root.ownerDocument.activeElement?.dataset.field,previousSource=this.sourceId,state=this.editor?.captureUI?.();if(state)this.viewStates.set(previousSource,state);this.controller?.abort();this.controller=new AbortController();void this.editor?.dispose();this.sourceId=sourceId;this.root.replaceChildren();
  const config=this.workspace.bundle.catalog.get('config','ui.workspace').value;this.ui=this.workspace.bundle.catalog.get('config',config.authoringId).value;for(const [key,value]of Object.entries(this.ui.tokens))this.root.style.setProperty(key,value);
  this.search=this.node('input',{'data-role':'resource-search','aria-label':this.label(this.ui.labels.search)});this.search.value=this.query;this.root.append(this.search);this.results=this.node('div',{'data-role':'resource-results'});this.root.append(this.results);this.search.addEventListener('input',()=>{this.query=this.search.value;this.offset=0;this.renderBrowser();},{signal:this.controller.signal});this.renderBrowser();
  const definitions=this.index.definitions().filter(item=>item.sourceId===sourceId),selected=definitions.find(item=>item.id===this.resourceId)??definitions[0];this.resourceId=selected?.id;
  const usage=this.node('div',{'data-role':'resource-usages'});this.root.append(this.node('h3',{},this.label(this.ui.labels.usages)),usage);
  if(selected){
   for(const ref of this.index.usedBy(selected.id)){const node=this.node('button',{'data-usage-source':ref.sourceId},this.label(this.ui.labels.usage,{source:ref.sourceId,pointer:ref.pointer}));node.disabled=ref.sourceId==='project';node.addEventListener('click',()=>{const owner=this.index.definitions().find(item=>item.sourceId===ref.sourceId&&(ref.pointer.startsWith(item.pointer+'/')||item.pointer===''));this.onSelect(ref.sourceId,ref.pointer,owner?.id);},{signal:this.controller.signal});usage.append(node);}
   const rename=this.node('input',{'aria-label':this.label(this.ui.labels.replaceId)});rename.value=selected.id;const renameButton=this.button(this.ui.labels.rename,()=>this.result(this.index.rename(selected.kind,selected.id,rename.value))),remove=this.button(this.ui.labels.remove,()=>this.result(this.index.remove(selected.kind,selected.id)));renameButton.disabled=remove.disabled=selected.readOnly;this.root.append(rename,renameButton,remove);
  }
  const inspector=this.node('div',{'data-role':'resource-inspector'});this.root.append(inspector);const doc=this.workspace.get(sourceId),classes={locale:StringsPanel,assets:AssetsPanel,animations:AnimationPanel,audio:AudioPanel,events:EventsPanel,scenes:SceneEditor,input:BindingsEditor,story:StoryEditor,quests:QuestEditor,balance:GameplayEditor,team:GameplayEditor,schedules:GameplayEditor,publication:GameplayEditor,progression:GameplayEditor,hearingBalance:GameplayEditor,hearings:HearingEditor,flags:GameplayEditor,playtests:GameplayEditor};
  const definitionKind=selected?.value?.kind??doc.data.kind,Editor=definitionKind==='asset-imports'?AssetsPanel:doc.kind==='config'&&['locomotion','scene-presentation','encounter-presentation'].includes(definitionKind)?PresentationEditor:doc.kind==='config'&&['world-ui','hearing-ui','player-navigation'].includes(definitionKind)?LayoutEditor:classes[doc.kind]??Inspector;
  this.editor=new Editor(inspector,{workspace:this.workspace,sourceId,resourceId:this.resourceId,text:this.text,ui:this.ui,onResult:result=>this.result(result),openSource:this.onSelect,rebuildAssets:this.rebuildAssets});this.editor.restoreUI?.(this.viewStates.get(sourceId));this.editor.render();
  if(previousSource===sourceId&&field)[...inspector.querySelectorAll('[data-field]')].find(node=>node.dataset.field===field&&!node.disabled)?.focus();
 }
 renderBrowser(){
  this.browserController?.abort();this.browserController=new AbortController();const signal=this.browserController.signal;this.results.replaceChildren();const matches=this.index.search(this.query).filter(item=>this.query.length||item.sourceId===this.sourceId),size=this.ui.browserPageSize;
  for(const item of matches.slice(this.offset,this.offset+size)){const node=this.node('button',{'data-resource-id':item.id},this.label(this.ui.labels.resource,{id:item.id,kind:item.kind,locale:item.locale??''}));node.addEventListener('click',()=>this.onSelect(item.sourceId,item.pointer,item.id),{signal});this.results.append(node);}
  if(this.offset>0)this.results.append(this.button(this.ui.labels.previous,()=>{this.offset=Math.max(0,this.offset-size);this.renderBrowser();},{},signal));
  if(this.offset+size<matches.length)this.results.append(this.button(this.ui.labels.next,()=>{this.offset+=size;this.renderBrowser();},{},signal));
 }
 result(result){const sourceId=this.sourceId;this.onResult(result);if(result.ok)void this.workspace.saveDraft(sourceId).then(saved=>{if(!this.disposed&&!saved.ok)this.onResult(saved);});return result;}
 async dispose(){this.disposed=true;this.controller?.abort();this.browserController?.abort();await this.editor?.dispose();this.viewStates.clear();}
}
