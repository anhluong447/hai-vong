import {test,assert} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
test('repeat full managed project load with native network diagnostics',async()=>{
 const failures=[];for(let i=0;i<3;i++){try{await Promise.race([loadProject('/content/project.json'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('load exceeded 5s')),5000))]);}catch(error){failures.push({iteration:i,error:String(error)});}}
 assert(!failures.length,JSON.stringify(failures));return {loads:3};
});
