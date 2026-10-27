import {immutableCopy} from '../contracts/Content.js';
import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
import {createRunState,validateRunState} from '../domain/story/RunState.js';
import {stepStory} from '../domain/story/stepStory.js';
import {applyEffect} from '../domain/story/applyEffect.js';
import {worldCommand} from '../domain/world/worldCommands.js';
import {gameplayCommand} from '../domain/gameplay/commands.js';
import {gameplayEffects} from '../domain/gameplay/effects.js';
import {hearingCommand} from '../domain/hearings/commands.js';
/** One owner of committed state. Failed transitions never assign a partial result. */
export class GameSession {
 #state; #bundle; #effects;
 constructor({bundle,initialState,effects={}}) {
  this.#bundle=bundle;this.#effects=Object.freeze({...gameplayEffects,...effects});
  const result=this.replace(initialState??createRunState(bundle));if(!result.ok)throw new Error(JSON.stringify(result.errors));
 }
 get bundle(){return this.#bundle;}
 snapshot(){return this.#state;}
 validate(state){return validateRunState(state,this.#bundle);}
 replace(state){const checked=this.validate(state);if(!checked.ok)return checked;this.#state=immutableCopy(state);return success(this.#state);}
 execute(command) {
  try {
   if(this.#state.gameplay.hearing&&command.type!=='hearing.command')return failure(diagnostic('hearing.busy','command','/type'));
   const context={bundle:this.#bundle,effects:this.#effects};
   const result=command.type==='hearing.command'?hearingCommand(this.#state,command,context):command.type==='story.step'?stepStory(this.#state,command.intent,context):command.type==='effect.apply'?applyEffect(this.#state,command,context):command.type==='gameplay.command'?gameplayCommand(this.#state,command,context):['scene.request','scene.commit','scene.cancel','world.move','world.interact','world.stop'].includes(command.type)?worldCommand(this.#state,command,context):failure(diagnostic('command.unknown','command','/type'));
   if(!result.ok)return result;
   // Browser projections describe a saved checkpoint, not authoritative live frames.
   const next={...result.value.state,presentation:{...result.value.state.presentation}};delete next.presentation.view;
   if(['idle','end','transition'].includes(next.story.waiting))next.presentation.encounter=null;
   if(!['idle','end'].includes(next.story.waiting)||next.gameplay.hearing)next.world={...next.world,velocity:0,moving:false};
   const checked=this.replace(next);if(!checked.ok)return checked;
   return success({state:this.#state,outcomes:immutableCopy(result.value.outcomes??[])});
  } catch {return failure(diagnostic('command.interrupted','command','/'));}
 }
}
