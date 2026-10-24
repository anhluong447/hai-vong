import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {TextService} from '/src/domain/story/TextService.js';
import {projectSource} from '/tests/fixtures/project.js';
import {press} from '/tests/driver.js';
async function setup(id){const workspace=new Workspace({sources:await projectSource()}),doc=workspace.list().find(d=>(Array.isArray(d.data)?d.data.some(v=>v.id===id):d.data.id===id)),root=document.createElement('section');document.body.append(root);return {workspace,root,sourceId:doc.id,resourceId:id,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value};}
test('gameplay inspector previews edited action costs in an isolated fixture and rejects invalid schedules',async()=>{
 const {GameplayEditor}=await import('/tools/workspace/editors/GameplayEditor.js'),o=await setup('balance.foundation'),editor=new GameplayEditor(o.root,o);
 try{editor.render();const quests=o.workspace.list().find(doc=>doc.kind==='quests');assert(o.workspace.applyChange(quests.id,{type:'replace',path:'/0/steps/0/energyCost',value:4},quests.revision).ok);assert(editor.startPreview('playtest.fixture.gameplay').ok);const before=editor.preview.snapshot();assert(editor.executePreview({type:'gameplay.command',action:'quest.start',questId:'quest.fixture.main',performerId:'member.fixture.player'}).ok);assert(editor.executePreview({type:'gameplay.command',action:'quest.collect',questId:'quest.fixture.main',stepId:'interview'}).ok);equal(editor.preview.snapshot().gameplay.energy,before.gameplay.energy-4);
  const source=o.workspace.list().find(d=>d.kind==='schedules');const result=o.workspace.applyChange(source.id,{type:'replace',path:'/0/sceneId',value:'absent'},source.revision);assert(!result.ok);equal(result.errors.find(e=>e.sourceId===source.id).pointer,'/0/sceneId');
  const reopened=new Workspace({sources:o.workspace.exportSources()});equal(reopened.bundle.catalog.get('balance','balance.foundation').value.energy.nextDay.sleep,10);
 }finally{editor.dispose();o.root.remove();}
});
test('hearing editor reaches a selected accusation by authored commands and previews an actual rebuttal with quality scoring',async()=>{
 const {HearingEditor}=await import('/tools/workspace/editors/HearingEditor.js'),o=await setup('hearing.fixture.defense'),editor=new HearingEditor(o.root,o);
 try{editor.render();assert(editor.startSegment('playtest.fixture.hearing','defense.second').ok);equal(editor.preview.snapshot().gameplay.hearing.questionIndex,1);equal(editor.preview.snapshot().gameplay.hearing.gauge,-30);
  assert(editor.executePreview({type:'hearing.command',action:'defense.respond',evidenceId:'evidence.fixture.side'}).ok);equal(editor.preview.snapshot().gameplay.hearing.defenseResult.gauge,20);equal(editor.preview.snapshot().gameplay.hearing.phase,'attack');
  const before=o.workspace.get(o.sourceId);assert(!editor.set('/defense/questions/0/matches/0/evidenceId','finding.fixture.statement').ok);equal(o.workspace.get(o.sourceId),before);
 }finally{editor.dispose();o.root.remove();}
});
test('Attack segment preview uses earned Main findings and ordinary commands with fresh outcomes on each restart',async()=>{
 const {HearingEditor}=await import('/tools/workspace/editors/HearingEditor.js'),o=await setup('hearing.fixture.attack'),editor=new HearingEditor(o.root,o);
 try{editor.render();assert(editor.startSegment('playtest.fixture.hearing','attack.first').ok);equal(editor.preview.snapshot().gameplay.hearing.stage,'recap');assert(editor.executePreview({type:'hearing.command',action:'attack.word',wordId:'contradiction'}).ok);assert(editor.executePreview({type:'hearing.command',action:'attack.question',questionId:'question.correct'}).ok);equal(editor.preview.snapshot().gameplay.hearing.hp,60);assert(editor.startSegment('playtest.fixture.hearing','attack.first').ok);equal(editor.preview.snapshot().gameplay.hearing.hp,100);assert(!o.workspace.list().some(doc=>doc.dirty));
 }finally{editor.dispose();o.root.remove();}
});
test('bad preview preconditions fail at the exact authored command and retain the last successful isolated session',async()=>{
 const {PlaytestSession}=await import('/tools/workspace/PlaytestSession.js'),o=await setup('balance.foundation'),preview=new PlaytestSession();
 try{assert(preview.start(o.workspace.bundle,'playtest.fixture.hearing','defense.first').ok);const before=preview.snapshot();const fixture=o.workspace.bundle.catalog.get('playtests','playtest.fixture.hearing').value,broken=structuredClone(fixture);broken.commands[0]={type:'gameplay.command',action:'quest.collect',questId:'quest.fixture.main',stepId:'interview'};const result=preview.startDefinition(o.workspace.bundle,broken,'/broken.json');assert(!result.ok);equal(result.errors[0].sourceId,'/broken.json');equal(result.errors[0].pointer,'/commands/0');equal(preview.snapshot(),before);
 }finally{preview.stop();o.root.remove();}
});
test('actual hearing views accept native rebuttal and discard obsolete preview button ownership',async()=>{
 const {HearingEditor}=await import('/tools/workspace/editors/HearingEditor.js'),o=await setup('hearing.fixture.defense'),editor=new HearingEditor(o.root,o);
 try{editor.render();assert(editor.startSegment('playtest.fixture.hearing','defense.second').ok);const card=o.root.querySelector('[data-hearing-action="defense.respond"][data-id="evidence.fixture.side"]');assert(card,'actual Defense card view is missing');card.focus();await press({key:'Enter',code:'Enter',virtualKey:13});equal(editor.preview.snapshot().gameplay.hearing.phase,'attack');assert(editor.startSegment('playtest.fixture.hearing','defense.second').ok);const before=editor.preview.snapshot();card.click();equal(editor.preview.snapshot(),before);editor.preview.stop();editor.renderPreview();assert(!o.root.querySelector('[data-role=hearing-preview]'),'stopped preview remains visible');}
 finally{editor.dispose();o.root.remove();}
});
test('managed fixture failures identify the real document and array command pointer for workspace navigation',async()=>{
 const {HearingEditor}=await import('/tools/workspace/editors/HearingEditor.js'),o=await setup('hearing.fixture.defense'),editor=new HearingEditor(o.root,o);
 try{editor.render();assert(editor.startSegment('playtest.fixture.hearing','defense.first').ok);const before=editor.preview.snapshot(),doc=o.workspace.list().find(doc=>doc.kind==='playtests');assert(o.workspace.applyChange(doc.id,{type:'replace',path:'/1/commands/0',value:{type:'gameplay.command',action:'quest.collect',questId:'quest.fixture.main',stepId:'interview'}},doc.revision).ok);const result=editor.startSegment('playtest.fixture.hearing','defense.first');assert(!result.ok);equal(result.errors[0].sourceId,doc.id);equal(result.errors[0].pointer,'/1/commands/0');equal(editor.preview.snapshot(),before);}
 finally{editor.dispose();o.root.remove();}
});
