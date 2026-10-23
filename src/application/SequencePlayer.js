import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
import {validSequenceState} from '../contracts/PresentationSnapshot.js';
const bad=()=>failure(diagnostic('sequence.state.invalid','sequence','/'));
/** A serializable presentation timeline. Signals cannot grant gameplay rewards. */
export class SequencePlayer {
 constructor(definitions){this.definitions=definitions;this.state={id:null,index:0,elapsed:0,values:{},paused:false,status:'idle'};}
 play(id){const def=this.definitions.find(d=>d.id===id);if(!def||!Array.isArray(def.steps)||def.steps.some(s=>!['wait','tween','cue','scene'].includes(s.kind)||['wait','tween'].includes(s.kind)&&(!Number.isFinite(s.duration)||s.duration<0)))return bad();this.definition=def;this.state={id,index:0,elapsed:0,values:{},paused:false,status:'playing'};return success(this.snapshot());}
 update(delta){const output=[];if(this.state.paused||this.state.status!=='playing'||!Number.isFinite(delta)||delta<0)return output;
  for(let budget=0;budget<=this.definition.steps.length;budget++){
   const step=this.definition.steps[this.state.index];if(!step){this.state.status='complete';break;}
   if(step.kind==='cue'){output.push({...step});this.state.index++;continue;}
   if(step.kind==='scene'){output.push({...step});this.state.status='waiting';break;}
   const amount=Math.min(delta,step.duration-this.state.elapsed);this.state.elapsed+=amount;delta-=amount;
   if(step.kind==='tween')this.state.values[step.target]=step.from+(step.to-step.from)*(step.duration?this.state.elapsed/step.duration:1);
   if(this.state.elapsed<step.duration)break;this.state.index++;this.state.elapsed=0;
  }return output;
 }
 ack(stepId){if(this.state.status!=='waiting'||this.definition.steps[this.state.index]?.id!==stepId)return bad();this.state.index++;this.state.status='playing';return success(this.snapshot());}
 pause(){this.state.paused=true;}
 resume(){this.state.paused=false;}
 skip(){if(!['playing','waiting'].includes(this.state.status))return [];const signals=[];for(let i=this.state.index;i<this.definition.steps.length;i++){const step=this.definition.steps[i];if(step.kind==='tween')this.state.values[step.target]=step.to;else if(['cue','scene'].includes(step.kind)&&!(i===this.state.index&&this.state.status==='waiting'))signals.push({...step});}this.state.index=this.definition.steps.length;this.state.elapsed=0;this.state.status='complete';return signals;}
 cancel(){this.state.status='cancelled';}
 snapshot(){return structuredClone(this.state);}
 restore(state){
  if(!validSequenceState(state,this.definitions))return bad();this.definition=this.definitions.find(d=>d.id===state.id)??null;this.state=structuredClone(state);return success(this.snapshot());
 }
}
