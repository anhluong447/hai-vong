import {loadProject} from '../../src/infrastructure/resources/ProjectLoader.js';
import {TextService} from '../../src/domain/story/TextService.js';
import {Workspace} from './Workspace.js';
import {WorkspaceView} from './WorkspaceView.js';
import {DraftRepository} from './DraftRepository.js';
import {SourceWriter} from './SourceWriter.js';
const sources=await loadProject(document.body.dataset.project);let writer;
try{const response=await fetch('/_authoring/session');if(response.ok){const session=await response.json();if(session.ok)writer=new SourceWriter(session.value.token);}}catch{}
const drafts=new DraftRepository(sources.project.id+':authoring:v1');
const workspace=new Workspace({sources,drafts,writer}),text=new TextService(workspace.bundle.locales,sources.project.defaultLocale);
const config=workspace.bundle.catalog.get('config','ui.workspace').value;
for(const [key,value]of Object.entries(config.theme))document.documentElement.style.setProperty('--'+key,value);
document.title=text.format('workspace.title').value;
const view=new WorkspaceView(document.body,workspace,text,!!writer,{readRevision:writer?()=>writer.revision():undefined,loadSources:()=>loadProject(document.body.dataset.project)});
window.addEventListener('pagehide',()=>{view.dispose();drafts.close();},{once:true});
