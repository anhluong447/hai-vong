import {test,assert,equal} from '/tests/harness.js';
import {Workspace} from '/tools/workspace/Workspace.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
const sources=await loadProject('/content/project.json');
const make=()=>new Workspace({sources,drafts:{put:async()=>{},get:async()=>null,remove:async()=>{}}});
const sourceId=locale=>sources.documents.find(doc=>doc.kind==='locale'&&doc.locale===locale).sourceId;
test('resource browser finds definitions and exact used-by paths while unsafe removal preserves sources',async()=>{
 const workspace=make(),{ResourceIndex}=await import('/tools/workspace/resources/ResourceIndex.js'),index=new ResourceIndex(workspace);
 assert(index.search('clip.fixture.walk').some(item=>item.kind==='animations'&&item.id==='clip.fixture.walk'));
 assert(index.usedBy('clip.fixture.walk').some(item=>item.sourceId==='/content/actors/foundation.json'&&item.pointer==='/0/walkClipId'));
 const before=workspace.exportSources(),result=index.remove('animations','clip.fixture.walk');assert(!result.ok);equal(workspace.exportSources(),before);assert(result.errors.some(error=>error.relatedIds.includes('clip.fixture.walk')));
});
test('cross-locale content transaction validates once and undoes as one group',()=>{
 const workspace=make(),ids=['vi','en-XA'].map(sourceId),before=ids.map(id=>workspace.get(id));
 const operation={type:'add',path:'/author.fixture.line',value:{value:'Fixture {name}',params:['name']}};
 const invalid=workspace.applyChanges([{id:ids[0],operation,expectedRevision:before[0].revision}]);assert(!invalid.ok);equal(ids.map(id=>workspace.get(id)),before);
 const applied=workspace.applyChanges(ids.map((id,i)=>({id,operation,expectedRevision:before[i].revision})));assert(applied.ok,JSON.stringify(applied));for(const id of ids)assert(workspace.get(id).data['author.fixture.line']);
 assert(workspace.undo(ids[1]).ok);for(const id of ids)assert(!workspace.get(id).data['author.fixture.line']);assert(workspace.redo(ids[0]).ok);for(const id of ids)assert(workspace.get(id).data['author.fixture.line']);
 const reopened=new Workspace({sources:workspace.exportSources()});assert(reopened.bundle.locales.vi['author.fixture.line']);
});
test('resource rename changes locale definitions and references atomically with grouped recovery',async()=>{
 const workspace=make(),{ResourceIndex}=await import('/tools/workspace/resources/ResourceIndex.js'),index=new ResourceIndex(workspace);
 const result=index.rename('locale','foundation.begin','author.fixture.begin');assert(result.ok,JSON.stringify(result));
 const story=workspace.bundle.catalog.get('story','foundation.chapter').value;equal(story.nodes[0].commands[0].textKey,'author.fixture.begin');assert(workspace.bundle.locales.vi['author.fixture.begin']);assert(workspace.bundle.locales['en-XA']['author.fixture.begin']);
 assert(workspace.undo(sourceId('vi')).ok);equal(workspace.bundle.catalog.get('story','foundation.chapter').value.nodes[0].commands[0].textKey,'foundation.begin');
 const stale=workspace.applyChanges([{id:sourceId('vi'),expectedRevision:'0',operation:{type:'remove',path:'/foundation.begin'}}]);assert(!stale.ok);assert(workspace.bundle.locales.vi['foundation.begin']);
});
test('multi-document resource drafts recover together and never overwrite a changed base',async()=>{
 const records=new Map(),drafts={put:async(id,value)=>records.set(id,structuredClone(value)),get:async id=>records.get(id),remove:async id=>records.delete(id)},workspace=new Workspace({sources,drafts});
 const {ResourceIndex}=await import('/tools/workspace/resources/ResourceIndex.js');assert(new ResourceIndex(workspace).rename('locale','foundation.begin','author.fixture.begin').ok);assert((await workspace.saveDraft(sourceId('vi'))).ok);
 const recovered=new Workspace({sources,drafts});assert((await recovered.recoverDraft(sourceId('vi'))).ok,'entire locale/reference group must recover');equal(recovered.bundle.catalog.get('story','foundation.chapter').value.nodes[0].commands[0].textKey,'author.fixture.begin');assert(recovered.bundle.locales['en-XA']['author.fixture.begin']);
 const changed=structuredClone(sources);changed.documents.find(doc=>doc.locale==='en-XA').sourceHash='changed-on-disk';const conflict=new Workspace({sources:changed,drafts}),before=conflict.exportSources();assert(!(await conflict.recoverDraft(sourceId('vi'))).ok);equal(conflict.exportSources(),before);
});
test('saving a grouped rename uses one batch and retains newer edits while the write is pending',async()=>{
 let release,request;const gate=new Promise(resolve=>{release=resolve;}),writer={save:()=>{throw new Error('partial write forbidden');},saveMany:async documents=>{request=documents;await gate;return {ok:true,value:Object.fromEntries(documents.map(document=>[document.documentId,'saved-hash']))};}};
 const records=new Map(),workspace=new Workspace({sources,writer,drafts:{put:async(id,value)=>records.set(id,value),get:async id=>records.get(id),remove:async id=>records.delete(id)}}),{ResourceIndex}=await import('/tools/workspace/resources/ResourceIndex.js');assert(new ResourceIndex(workspace).rename('locale','foundation.begin','author.fixture.begin').ok);
 const saving=workspace.save(sourceId('vi'));await Promise.resolve();assert(request?.length===3,'all three dirty documents must be written together');const doc=workspace.get(sourceId('vi'));assert(workspace.applyChange(doc.id,{type:'replace',path:'/author.fixture.begin/value',value:'A newer edit'},doc.revision).ok);release();assert((await saving).ok);assert(workspace.get(doc.id).dirty);equal(workspace.get(doc.id).sourceHash,'saved-hash');equal(workspace.exportSources().documents.find(document=>document.sourceId===doc.id).sourceHash,'saved-hash');
});
test('managed authoring preview definitions reject missing copy and invalid viewport state contracts',()=>{
 for(const change of [ui=>delete ui.labels.preview,ui=>ui.labels.property='authoring.preview',ui=>ui.preview.width=0,ui=>ui.states[0].id='unknown',ui=>ui.tokens=null,ui=>ui.browserPageSize=0,ui=>delete ui.labels.resource]){const source=structuredClone(sources);change(source.documents.find(doc=>doc.data?.id==='ui.authoring').data);assert(!validateProject(source).ok,'malformed authoring UI accepted');}
});
test('atlas edits target managed import recipes while invalid master paths preserve the last valid recipe',async()=>{
 const recipe=sources.documents.find(doc=>doc.data?.kind==='asset-imports');assert(recipe,'asset recipe must be a managed authored document');const workspace=make(),{AssetsPanel}=await import('/tools/workspace/resources/AssetsPanel.js'),{TextService}=await import('/src/domain/story/TextService.js'),root=document.createElement('section');document.body.append(root);
 const panel=new AssetsPanel(root,{workspace,sourceId:recipe.sourceId,resourceId:recipe.data.id,text:new TextService(workspace.bundle.locales,'vi'),ui:workspace.bundle.catalog.get('config','ui.authoring').value});try{panel.render();assert(root.querySelector('[data-role=asset-recipe]'));assert(panel.set('/atlases/0/padding',2).ok);const before=workspace.get(recipe.sourceId);assert(!panel.set('/entries/0/source','../../outside.png').ok);equal(workspace.get(recipe.sourceId),before);equal(workspace.bundle.catalog.get('assets','atlas.fixture.actor').value.frames[0].x,1);}finally{await panel.dispose();root.remove();}
});
test('asset rebuild blocks concurrent edits and only adopts a validated generated replacement',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;}),recipe=sources.documents.find(doc=>doc.data?.kind==='asset-imports'),manifest=sources.documents.find(doc=>doc.kind==='assets');assert(recipe,'managed recipe missing');
 const response={manifestDocumentId:manifest.sourceId,manifest:structuredClone(manifest.data),sourceHash:'a'.repeat(64),recipeHash:recipe.sourceHash},writer={rebuildAssets:async()=>{await gate;return {ok:true,value:response};}},workspace=new Workspace({sources,writer});
 const building=workspace.rebuildAssets(),before=workspace.get(recipe.sourceId);await Promise.resolve();assert(!workspace.applyChange(recipe.sourceId,{type:'replace',path:'/atlases/0/padding',value:2},before.revision).ok,'building must hold a coherent authoring revision');release();assert((await building).ok);equal(workspace.get(manifest.sourceId).sourceHash,'a'.repeat(64));assert(workspace.get(manifest.sourceId).readOnly);
 response.manifest[0].id='missing-atlas';const prior=workspace.exportSources();assert(!(await workspace.rebuildAssets()).ok);equal(workspace.exportSources(),prior);
});
