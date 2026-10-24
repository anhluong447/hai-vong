import {test,assert,equal} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('independent pack documents load concurrently without reordering authored definitions',async()=>{
 const project=await(await fetch('/content/project.json')).json(),pack=await(await fetch(new URL(project.packs[0],new URL('/content/project.json',location.href)))).json(),packUrl=new URL(project.packs[0],new URL('/content/project.json',location.href)),urls=pack.documents.map(entry=>new URL(entry.path,packUrl).href);let active=0,peak=0;
 const fetcher=async url=>{const tracked=urls.includes(String(url));if(tracked){active++;peak=Math.max(peak,active);}try{const result=await fetch(url);if(tracked)await result.clone().text();return result;}finally{if(tracked)active--;}};
 const source=await loadProject('/content/project.json',fetcher);assert(peak>1,'pack document reads are unnecessarily serialized');equal(source.documents.map(doc=>doc.sourceId),urls.map(url=>new URL(url).pathname));assert(validateProject(source).ok);
});
test('player loading excludes authoring-only sources while retaining a valid playable content graph',async()=>{
 const requested=[],source=await loadProject('/content/project.json',url=>{requested.push(new URL(url).pathname);return fetch(url);},{includeAuthoring:false});assert(source.documents.every(doc=>!doc.authoringOnly),'player loaded authoring-only documents');assert(!requested.includes('/content/assets/imports.json'));assert(!requested.includes('/content/ui/authoring.json'));const checked=validateProject(source);assert(checked.ok,JSON.stringify(checked));assert(checked.value.catalog.get('scenes','scene.courtyard').ok);assert(checked.value.catalog.get('hearings','hearing.fixture.defense').ok);
});
