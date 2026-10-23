import {HEARING_ACTIONS} from '../../contracts/HearingActions.js';
import {hearingFailure} from './common.js';
import {defenseCommand} from './defense.js';
import {attackCommand} from './attack.js';
import {success} from '../../contracts/Diagnostic.js';
export function hearingCommand(state,command,context){
 if(!HEARING_ACTIONS.includes(command.action))return hearingFailure('hearing.command.unknown');
 if(command.action==='dismiss'&&state.gameplay.hearing?.status==='won'){const next=structuredClone(state);next.gameplay.hearing=null;return success({state:next,outcomes:[{type:'hearing.dismissed'}]});}
 return command.action==='defense.start'||state.gameplay.hearing?.phase==='defense'?defenseCommand(state,command,context):attackCommand(state,command,context);
}
