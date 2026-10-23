import {GameplayEditor} from './GameplayEditor.js';
import {DefenseView} from '../../../src/presentation/ui/DefenseView.js';
import {AttackView} from '../../../src/presentation/ui/AttackView.js';
import {HearingMinigameView} from '../../../src/presentation/ui/HearingMinigameView.js';
const selectionField={'defense.respond':'evidenceId','defense.bailout':'choiceId','attack.word':'wordId','attack.question':'questionId','mini.mode':'modeId','mini.move':'laneId'};
export class HearingEditor extends GameplayEditor {
 render(){super.render();const fixtures=this.workspace.bundle.catalog.list('playtests').filter(def=>def.checkpoints.some(point=>point.hearingId===this.resourceId)),fixture=this.selectControl('fixture','hearing-fixture',fixtures.map(def=>def.id)),segment=this.selectControl('segment','hearing-segment',[]);const fill=()=>{segment.control.replaceChildren();const current=fixtures.find(def=>def.id===fixture.control.value);for(const point of current?.checkpoints??[])if(point.hearingId===this.resourceId)segment.control.append(this.node('option',{value:point.id},point.id));};fill();fixture.control.addEventListener('change',fill,{signal:this.controller.signal});this.previewRoot.insertBefore(fixture.label,this.commandInput);this.previewRoot.insertBefore(segment.label,this.commandInput);this.previewRoot.insertBefore(this.button(this.ui.labels.previewSegment,'hearing-preview',()=>this.startSegment(fixture.control.value,segment.control.value)),this.commandInput);}
 startSegment(fixtureId,segmentId){const result=this.preview.start(this.workspace.bundle,fixtureId,segmentId);if(!result.ok)this.notify(result);this.renderPreview();return result;}
 renderPreview(){
  super.renderPreview();this.hearingRoot?.remove();this.hearingRoot=null;const generation=this.controller.signal,state=this.preview.snapshot(),h=state?.gameplay.hearing;this.viewRevision=(this.viewRevision??0)+1;const revision=this.viewRevision;if(!h)return;
  const catalog=this.workspace.bundle.catalog,definition=catalog.get('hearings',h.definitionId).value,balance=catalog.get('hearingBalance',h.balanceId).value,ui=catalog.get('config',balance.uiId).value,root=this.node('div',{'data-role':'hearing-preview'});for(const [key,value]of Object.entries(ui.tokens))root.style.setProperty(key,value);this.previewRoot.insertBefore(root,this.previewOutput);this.hearingRoot?.remove();this.hearingRoot=root;
  const dispatch=(action,id)=>{if(generation.aborted||this.disposed||revision!==this.viewRevision)return;this.executePreview({type:'hearing.command',action,...(selectionField[action]?{[selectionField[action]]:id}:{})});};
  const View=['minigame','miniFailed','finalShot'].includes(h.stage)?HearingMinigameView:h.phase==='defense'?DefenseView:AttackView;
  new View(root,{format:(key,params)=>this.label(key,params),number:value=>new Intl.NumberFormat(this.workspace.bundle.project.defaultLocale).format(value),ui,dispatch,questName:id=>catalog.get('quests',id).value.nameKey}).render({hearing:h,definition,balance,gameplay:state.gameplay,hint:this.label(this.ui.labels.step)});
 }
}
