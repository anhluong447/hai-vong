import {success} from '../../contracts/Diagnostic.js';
/** The transition and its idempotency marker are one immutable commit. */
export function executeOnce(state,identity,operation) {
 if(state.executionLedger.includes(identity)) return success({state,outcomes:[]});
 const result=operation();if(!result.ok)return result;
 return success({...result.value,state:{...result.value.state,executionLedger:[...result.value.state.executionLedger,identity]}});
}
