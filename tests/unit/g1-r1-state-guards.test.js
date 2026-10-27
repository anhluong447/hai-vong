import {test,assert} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {MigrationRegistry} from '/src/infrastructure/storage/MigrationRegistry.js';
import {schemaStepsFor,contentStepsFor} from '/src/application/SaveMigrationPolicy.js';
import {GameSession} from '/src/application/GameSession.js';
test('v4 content migration rejects corrupt intent fields before dropping a known fixture cue',async()=>{
 const checked=validateProject(await loadProject('/docs/art-direction/review-b-r1/c2/project.json'));assert(checked.ok);const bundle=checked.value,old=(await(await fetch('/tests/fixtures/g1-r1/exploration.json')).json()).envelope.payload;
 const schemaOnly=new MigrationRegistry({schemaVersion:4,contentVersion:'0.0.3',catalog:bundle.catalog,schemaSteps:schemaStepsFor(bundle)}).migrate(old,'0.0.3');assert(schemaOnly.ok);
 const corrupt=structuredClone(schemaOnly.value);corrupt.audio={intent:{cueId:'cue.fixture.sfx',offset:0},unexpected:'corrupt'};
 const registry=new MigrationRegistry({schemaVersion:4,contentVersion:bundle.revision,catalog:bundle.catalog,contentSteps:contentStepsFor(bundle)});assert(!registry.migrate(corrupt,'0.0.3').ok,'content patch silently discarded corrupt intent fields');
});
test('a valid encounter identifier cannot zoom an unrelated active story chapter',async()=>{
 const checked=validateProject(await loadProject('/docs/art-direction/review-b-r1/c2/project.json'));assert(checked.ok);const bundle=checked.value,old=(await(await fetch('/tests/fixtures/g1-r1/reveal.json')).json()).envelope.payload;
 const registry=new MigrationRegistry({schemaVersion:4,contentVersion:bundle.revision,catalog:bundle.catalog,schemaSteps:schemaStepsFor(bundle),contentSteps:contentStepsFor(bundle)}),result=registry.migrate(old,'0.0.3');assert(result.ok);
 const state=result.value,chapter=bundle.catalog.get('story','foundation.chapter').value,node=chapter.nodes.find(n=>n.id===chapter.entryNodeId),line=node.commands.find(c=>c.op==='say');
 state.story={...state.story,cursor:{chapterId:chapter.id,nodeId:node.id,commandId:line.id,stepId:line.id},waiting:'say',pending:null};state.presentation.dialogue={textKey:line.textKey,params:line.params??{},revealed:0};delete state.presentation.view;
 assert(!new GameSession({bundle}).validate(state).ok,'encounter accepted for a different active chapter');
});
