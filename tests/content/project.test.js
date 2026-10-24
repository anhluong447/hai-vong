import {test,assert} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('actual project manifests resolve and validate through shared contracts',async()=>{
 const source=await loadProject('/content/project.json');const result=validateProject(source);assert(result.ok,JSON.stringify(result));
 assert(result.value.catalog.list('story').length>0,'no chapter validated');
});
