import {validateProject} from '/src/domain/story/validateProject.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
export async function runtimeBundle(change=()=>{}) {
 const source=await loadProject('/content/project.json');
 source.capabilities=['counter.add'];
 source.documents.find(d=>d.kind==='flags').data.push({id:'flag.count',type:'integer',default:0,scope:'run',min:0,max:10});
 source.documents.find(d=>d.kind==='events').data.push({id:'effect.count',handlerId:'counter.add',paramsSchema:{type:'object',properties:{amount:{type:'integer',minimum:1,maximum:2}},required:['amount'],additionalProperties:false}});
 const story=source.documents.find(d=>d.kind==='story').data;
 story.nodes[1].commands.splice(1,0,{id:'count',op:'emitEffect',effectId:'effect.count',params:{amount:1}});
 change(source);
 const result=validateProject(source);if(!result.ok)throw new Error(JSON.stringify(result));return result.value;
}
export const effects={'counter.add':(state,params)=>({ok:true,value:{state:{...state,gameplay:{...state.gameplay,flags:{...state.gameplay.flags,'flag.count':state.gameplay.flags['flag.count']+params.amount}}},outcomes:[{type:'counter.changed',params:{amount:params.amount}}]}})};
