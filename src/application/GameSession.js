import {immutableCopy} from '../contracts/Content.js';
import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
import {createRunState,validateRunState} from '../domain/story/RunState.js';
import {stepStory} from '../domain/story/stepStory.js';
import {applyEffect} from '../domain/story/applyEffect.js';
/** One owner of committed state. Failed transitions never assign a partial result. */
export class GameSession {
 #state; #bundle; #effects;
 constructor({bundle,initialState,effects={}}) {
  this.#bundle=bundle;this.#effects=Object.freeze({...effects});
  const result=this.replace(initialState??createRunState(bundle));if(!result.ok)throw new Error(JSON.stringify(result.errors));
 }
 get bundle(){return this.#bundle;}
 snapshot(){return this.#state;}
 validate(state){return validateRunState(state,this.#bundle);}
 replace(state){const checked=this.validate(state);if(!checked.ok)return checked;this.#state=immutableCopy(state);return success(this.#state);}
 execute(command) {
  try {
   const context={bundle:this.#bundle,effects:this.#effects};
   const result=command.type==='story.step'?stepStory(this.#state,command.intent,context):command.type==='effect.apply'?applyEffect(this.#state,command,context):failure(diagnostic('command.unknown','command','/type'));
   if(!result.ok)return result;
   const checked=this.replace(result.value.state);if(!checked.ok)return checked;
   return success({state:this.#state,outcomes:immutableCopy(result.value.outcomes??[])});
  } catch {return failure(diagnostic('command.interrupted','command','/'));}
 }
}
