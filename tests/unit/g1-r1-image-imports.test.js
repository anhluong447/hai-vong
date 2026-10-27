import {test,assert} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
test('shared image import contract accepts bounded blur and rejects malformed or audio recipes',async()=>{
 const source=await projectSource(),doc=source.documents.find(d=>d.data?.kind==='asset-imports'),image=doc.data.entries.find(e=>e.kind==='image');image.blur={radius:1.2};assert(validateProject(source).ok,'valid bounded blur rejected');
 for(const invalid of [{radius:-1},{radius:17},{radius:'2'},{radius:1,extra:true},null]){image.blur=invalid;assert(!validateProject(source).ok,'invalid blur accepted');}
 delete image.blur;doc.data.entries.find(e=>e.kind==='audio').blur={radius:1};assert(!validateProject(source).ok,'audio accepted image blur');
});
