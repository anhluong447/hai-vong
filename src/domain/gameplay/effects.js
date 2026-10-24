import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {validateGameplayEffects} from '../../contracts/validateGameplayEffects.js';
import {gameplayCommand} from './commands.js';
import {gameplayEffects as progressionEffects} from './progression.js';

function scriptCommand(state,params,context){
 if(state.gameplay.hearing||!['ready','idle','end'].includes(state.story.waiting))return failure(diagnostic('gameplay.busy','command','/params'));
 // A registered story command is an explicit gameplay action. The pure gameplay
 // transition retains its guards/costs/schedules; only its dialogue-idle guard is
 // scoped to this command, then the exact story continuation is restored.
 const result=gameplayCommand({...state,story:{...state.story,waiting:'idle'}},{...params,type:'gameplay.command'},context);
 return result.ok?success({state:{...result.value.state,story:state.story},outcomes:result.value.outcomes}):result;
}
function checked(handlerId,operation){return (state,params,context)=>{
 const errors=validateGameplayEffects(handlerId,params,context.bundle.catalog);return errors.length?failure(errors):operation(state,params,context);
};}
export const gameplayEffects=Object.freeze({...progressionEffects,
 'gameplay.command':checked('gameplay.command',scriptCommand),
 'gameplay.assign':checked('gameplay.assign',(state,params,context)=>{
  const selected=scriptCommand(state,{action:'quest.selectAssignee',...params},context);if(!selected.ok)return selected;
  const quote=selected.value.state.gameplay.quests[params.questId].proposal;
  const confirmed=scriptCommand(selected.value.state,{action:'quest.confirmAssignment',questId:params.questId,quoteId:quote.id},context);
  return confirmed.ok?success({state:confirmed.value.state,outcomes:[...selected.value.outcomes,...confirmed.value.outcomes]}):confirmed;
 })
});
