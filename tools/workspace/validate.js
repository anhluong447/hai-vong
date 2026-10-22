import {validateProject} from '../../src/domain/story/validateProject.js';
const params=new URLSearchParams(location.search);
try{
 const sources=await(await fetch(params.get('input'))).json();const result=validateProject(sources);
 await fetch(params.get('result'),{method:'POST',body:JSON.stringify(result.ok?{ok:true}:{ok:false,errors:result.errors})});
}catch(error){await fetch(params.get('result'),{method:'POST',body:JSON.stringify({ok:false,errors:[{code:'authoring.validation.failed',sourceId:'validator',pointer:'',relatedIds:[]}]})});}
