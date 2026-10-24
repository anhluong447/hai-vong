import {diagnostic,failure} from '../../contracts/Diagnostic.js';
import {GAMEPLAY_ACTIONS} from '../../contracts/GameplayActions.js';
import {gameplayDefinitions} from './state.js';
import {calendarCommand} from './calendar.js';
import {questCommand} from './quests.js';
import {delegationCommand,advanceDelegation} from './delegation.js';
import {publishDue} from './publication.js';
import {progressionCommand} from './progression.js';
export function gameplayCommand(state,command,{bundle}){
 const definitions=gameplayDefinitions(bundle);
 if(!definitions||!state.gameplay.calendar)return failure(diagnostic('gameplay.unavailable','command','/action'));
 if(!GAMEPLAY_ACTIONS.includes(command.action))return failure(diagnostic('command.unknown','command','/action'));
 if(!['idle','end'].includes(state.story.waiting)||state.world.pending)return failure(diagnostic('gameplay.busy','command','/action'));
 let result=command.action.startsWith('calendar.')?calendarCommand(state,command,definitions):['quest.selectAssignee','quest.confirmAssignment'].includes(command.action)?delegationCommand(state,command,definitions):command.action.startsWith('quest.')?questCommand(state,command,definitions):progressionCommand(state,command,definitions);
 if(!result.ok)return result;let next=result.value.state;const outcomes=[...result.value.outcomes];
 if(next.gameplay.calendar.day!==state.gameplay.calendar.day){const advanced=advanceDelegation(next,definitions);if(!advanced.ok)return advanced;next=advanced.value.state;outcomes.push(...advanced.value.outcomes);}
 const published=publishDue(next,definitions);if(!published.ok)return published;published.value.outcomes.unshift(...outcomes);return published;
}
