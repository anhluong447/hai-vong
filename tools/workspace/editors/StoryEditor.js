import {TypedInspector} from './TypedInspector.js';
import {PreviewSession} from '../PreviewSession.js';
import {DialoguePreview} from '../DialoguePreview.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class StoryEditor extends TypedInspector {
 setSpeaker(path,speakerId){
  const command=structuredClone(path.split('/').slice(1).reduce((value,key)=>value?.[key],this.story()));
  if(command?.op!=='say')return this.notify(failure(diagnostic('authoring.speaker.invalid',this.sourceId,path)));
  delete command.speakerId;delete command.expressionId;
  if(speakerId){const actor=this.workspace.bundle.catalog.get('actors',speakerId);if(!actor.ok)return this.notify(actor);command.speakerId=speakerId;if(actor.value.portraits)command.expressionId='neutral';}
  return this.set(path,command);
 }
 renderFields(value,path,doc){
  if(value?.op!=='say')return super.renderFields(value,path,doc);
  for(const [field,item]of Object.entries(value))if(!['speakerId','expressionId'].includes(field))super.renderFields(item,path+'/'+field,doc);
  const speaker=this.selectControl('speaker','speaker',this.references('speakerId')??this.workspace.bundle.catalog.list('actors').map(actor=>actor.id)),empty=this.node('option',{value:''},this.label(this.ui.labels.narration));speaker.control.prepend(empty);speaker.control.value=value.speakerId??'';speaker.control.dataset.field=path+'/speakerId';speaker.control.disabled=doc.readOnly;this.fields.append(speaker.label);
  speaker.control.addEventListener('change',()=>this.setSpeaker(path,speaker.control.value||null),{signal:this.fieldController.signal});
  const actor=value.speakerId?this.workspace.bundle.catalog.get('actors',value.speakerId).value:null;
  if(actor?.portraits){const expression=this.selectControl('expression','expression',Object.keys(actor.portraits));expression.control.value=value.expressionId??'neutral';expression.control.dataset.field=path+'/expressionId';expression.control.disabled=doc.readOnly;this.fields.append(expression.label);expression.control.addEventListener('change',()=>{const command=structuredClone(value);command.expressionId=expression.control.value;this.set(path,command,doc.revision);},{signal:this.fieldController.signal});}
 }
 constructor(...args){super(...args);this.preview=new PreviewSession();}
 story(){return this.workspace.get(this.sourceId).data;}
 captureUI(){return structuredClone({nodeId:this.nodeId,migrationDraft:this.migrationDraft,flagSourceId:this.flagSourceId});}
 restoreUI(state){if(state){this.nodeId=state.nodeId;this.migrationDraft=structuredClone(state.migrationDraft);this.flagSourceId=state.flagSourceId;}}
 references(field){return ['target','entryNodeId'].includes(field)?this.story().nodes.map(node=>node.id):super.references(field);}
 flow(){const story=this.story();return {nodes:story.nodes,edges:story.nodes.flatMap(node=>node.commands.flatMap(command=>command.op==='jump'?[{from:node.id,to:command.target,commandId:command.id}]:command.op==='choose'?command.choices.map(choice=>({from:node.id,to:choice.target,commandId:command.id,choiceId:choice.id})):[]))};}
 operation(operations){const doc=this.workspace.get(this.sourceId);return this.notify(this.workspace.applyChanges(operations.map(operation=>({id:doc.id,expectedRevision:doc.revision,operation}))));}
 addBranch({fromNodeId,commandId,choice,node}){const story=this.story(),i=story.nodes.findIndex(node=>node.id===fromNodeId),j=story.nodes[i]?.commands.findIndex(command=>command.id===commandId&&command.op==='choose');if(!(i>=0&&j>=0))return this.notify(failure(diagnostic('authoring.flow.source',this.sourceId,'/nodes')));return this.operation([{type:'add',path:'/nodes/-',value:node},{type:'add',path:`/nodes/${i}/commands/${j}/choices/-`,value:choice}]);}
 connectChoice(nodeId,commandId,choiceId,target){const story=this.story(),i=story.nodes.findIndex(node=>node.id===nodeId),j=story.nodes[i]?.commands.findIndex(command=>command.id===commandId),k=story.nodes[i]?.commands[j]?.choices?.findIndex(choice=>choice.id===choiceId);if(!(i>=0&&j>=0&&k>=0))return this.notify(failure(diagnostic('authoring.flow.source',this.sourceId,'/nodes')));return this.set(`/nodes/${i}/commands/${j}/choices/${k}/target`,target);}
 addCommand(nodeId,command,beforeId){const story=this.story(),i=story.nodes.findIndex(node=>node.id===nodeId),j=story.nodes[i]?.commands.findIndex(command=>command.id===beforeId);if(!(i>=0&&j>=0))return this.notify(failure(diagnostic('authoring.flow.source',this.sourceId,'/nodes')));return this.operation([{type:'add',path:`/nodes/${i}/commands/${j}`,value:command}]);}
 addFlag(flag){const documents=this.workspace.list().filter(doc=>doc.kind==='flags'),doc=documents.find(doc=>doc.id===this.flagSourceId)??(documents.length===1?documents[0]:null);if(!doc)return this.notify(failure(diagnostic('authoring.flags.ambiguous',this.sourceId,'/')));return this.notify(this.workspace.applyChange(doc.id,{type:'add',path:'/-',value:flag},doc.revision));}
 renameNode(id,nextId){
  const doc=this.workspace.get(this.sourceId),story=structuredClone(doc.data),node=story.nodes.find(node=>node.id===id);if(!node||id===nextId)return this.notify(failure(diagnostic('authoring.flow.source',this.sourceId,'/nodes')));
  const anchorMap=Object.fromEntries(node.commands.map(command=>[[story.id,id,command.id].join('/'),{chapterId:story.id,nodeId:nextId,commandId:command.id,stepId:command.id}]));
  node.id=nextId;if(story.entryNodeId===id)story.entryNodeId=nextId;for(const node of story.nodes)for(const command of node.commands){if(command.op==='jump'&&command.target===id)command.target=nextId;for(const choice of command.choices??[])if(choice.target===id)choice.target=nextId;}
  const result=this.workspace.applyChange(doc.id,{type:'replace',path:'',value:story},doc.revision);if(result.ok){this.migrationDraft={anchorMap};this.nodeId=nextId;}return this.notify(result);
 }
 showNode(id){this.nodeId=id;const story=this.story(),index=story.nodes.findIndex(node=>node.id===id);if(index<0)return false;this.replaceFields(story.nodes[index],'/nodes/'+index,this.workspace.get(this.sourceId));return true;}
 focusPointer(pointer){const index=Number(pointer.split('/')[2]);if(pointer.startsWith('/nodes/')&&this.story().nodes[index])this.showNode(this.story().nodes[index].id);return super.focusPointer(pointer);}
 render(){this.preview?.stop();this.dialoguePreview?.dispose();this.dialoguePreview=null;super.render();const story=this.story(),flow=this.node('nav',{'data-role':'story-flow','aria-label':this.label(this.ui.labels.flow)});this.root.insertBefore(flow,this.fields);
  for(const node of story.nodes){const button=this.node('button',{'data-story-node':node.id},this.label(this.ui.labels.node,{id:node.id}));button.addEventListener('click',()=>this.showNode(node.id),{signal:this.controller.signal});flow.append(button);}
  for(const edge of this.flow().edges)flow.append(this.node('p',{'data-story-edge':edge.choiceId??edge.commandId},this.label(this.ui.labels.edge,{from:edge.from,to:edge.to})));
  this.showNode(story.nodes.some(node=>node.id===this.nodeId)?this.nodeId:story.entryNodeId);
  const branches=story.nodes.flatMap(node=>node.commands.filter(command=>command.op==='choose').map(command=>({nodeId:node.id,commandId:command.id}))),from=this.selectControl('branchSource','branch-source',branches.map((_,index)=>String(index))),nodeId=this.inputControl('nodeId','branch-node'),choiceId=this.inputControl('choiceId','branch-choice'),textKey=this.selectControl('textKey','branch-text',Object.keys(this.workspace.bundle.locales[this.workspace.bundle.project.defaultLocale]).filter(key=>this.workspace.bundle.locales[this.workspace.bundle.project.defaultLocale][key].params.length===0));
  this.previewRoot.append(from.label,nodeId.label,choiceId.label,textKey.label,this.button(this.ui.labels.addBranch,'add-branch',()=>{const source=branches[Number(from.control.value)];if(!source)return;const node=structuredClone(this.ui.templates.terminalNode);node.id=nodeId.control.value;node.commands[0].id=node.id+'.end';this.addBranch({fromNodeId:source.nodeId,commandId:source.commandId,choice:{id:choiceId.control.value,textKey:textKey.control.value,target:node.id},node});}));
  const flagSources=this.selectControl('source','flag-source',this.workspace.list().filter(doc=>doc.kind==='flags'&&!doc.readOnly).map(doc=>doc.id));if([...flagSources.control.options].some(option=>option.value===this.flagSourceId))flagSources.control.value=this.flagSourceId;this.flagSourceId=flagSources.control.value;flagSources.control.addEventListener('change',()=>{this.flagSourceId=flagSources.control.value;},{signal:this.controller.signal});
  const flags=this.node('textarea',{'data-role':'flag-definition','aria-label':this.label(this.ui.labels.flag)});flags.value=JSON.stringify(this.ui.templates.flag,null,2);this.previewRoot.append(flagSources.label,flags,this.button(this.ui.labels.addFlag,'add-flag',()=>{try{this.addFlag(JSON.parse(flags.value));}catch{this.notify(failure(diagnostic('authoring.json.invalid',this.sourceId,'/flags')));}}));
  const renameFrom=this.selectControl('nodeSource','rename-node-source',story.nodes.map(node=>node.id)),renameTo=this.inputControl('nodeId','rename-node-target'),migration=this.node('textarea',{'data-role':'migration-candidate','aria-label':this.label(this.ui.labels.migrationCandidate)});migration.value=JSON.stringify(this.migrationDraft??{anchorMap:{}},null,2);migration.readOnly=true;
  this.previewRoot.append(renameFrom.label,renameTo.label,this.button(this.ui.labels.renameNode,'rename-node',()=>this.renameNode(renameFrom.control.value,renameTo.control.value)),migration);
  this.previewRoot.append(this.button(this.ui.labels.preview,'story-preview',()=>this.startPreview()),this.button(this.ui.labels.advance,'story-advance',()=>this.stepPreview({type:'advance'})));this.previewOutput=this.node('div',{'data-role':'story-preview'});this.previewRoot.append(this.previewOutput);
 }
 startPreview(){const result=this.preview.start(this.workspace.bundle,{chapterId:this.resourceId});if(!result.ok)this.notify(result);this.renderPreview();return result;}
 stepPreview(intent){const result=this.preview.step(intent);if(!result.ok)this.notify(result);this.renderPreview();return result;}
 renderPreview(){const state=this.preview.snapshot();this.previewOutput.replaceChildren();if(!state)return;
  if(!this.dialoguePreview){this.speakerRoot=this.node('div',{'data-role':'dialogue-speaker'});this.dialoguePreview=new DialoguePreview(this.speakerRoot,{bundle:this.workspace.bundle,format:key=>this.label(key),settings:this.ui.preview});}
  this.previewOutput.append(this.speakerRoot);this.dialogueReady=this.dialoguePreview.present(state).then(result=>{if(!this.disposed&&!result.ok&&result.errors[0]?.code!=='dialogue.load.stale')this.notify(result);return result;});
  this.previewOutput.append(this.node('p',{},state.presentation.dialogue?this.label(state.presentation.dialogue.textKey,state.presentation.dialogue.params):this.label(this.ui.labels.result,{value:state.story.waiting})));if(state.story.waiting==='choose'){const cursor=state.story.cursor,command=this.story().nodes.find(node=>node.id===cursor.nodeId).commands.find(command=>command.id===cursor.commandId);for(const choice of command.choices){const button=this.button(choice.textKey,'story-choice',()=>this.stepPreview({type:'choose',choiceId:choice.id}));button.dataset.choiceId=choice.id;button.disabled=!!choice.condition&&state.gameplay.flags[choice.condition.flag]!==choice.condition.equals;this.previewOutput.append(button);}}}
 dispose(){this.dialoguePreview?.dispose();this.preview.stop();super.dispose();}
}
