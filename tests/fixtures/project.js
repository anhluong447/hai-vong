import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
// One real I/O read per harness; each domain case receives independently mutable data.
// Loader/decoder and native browser suites continue to exercise their actual I/O.
const original=loadProject('/content/project.json');
export async function projectSource(){return structuredClone(await original);}

/** Small mechanics pack for synthetic traversal cases with hand-counted coverage. */
export async function mechanicsSource(){
 const source=await projectSource();source.documents=source.documents.filter(doc=>!doc.sourceId.startsWith('/content/dev/first-three-days/')&&doc.sourceId!=='/content/gameplay/migrations.json');
 const sceneIds=new Set(source.documents.filter(doc=>doc.kind==='scenes').flatMap(doc=>doc.data.map(scene=>scene.id)));source.documents=source.documents.filter(doc=>!(doc.kind==='config'&&['scene-presentation','encounter-presentation'].includes(doc.data.kind)&&doc.data.sceneId&&!sceneIds.has(doc.data.sceneId)));
 for(const doc of source.documents)if(doc.kind==='config'&&doc.data.kind==='runtime')delete doc.data.migrationConfigId;
 return source;
}
