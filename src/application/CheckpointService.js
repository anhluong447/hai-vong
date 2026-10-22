import {success} from '../contracts/Diagnostic.js';
/** Synchronous domain transitions form atomic checkpoints, including pending presentation intents. */
export class CheckpointService {
 constructor(session){this.session=session;}
 capture(){const state=this.session.snapshot(),result=this.session.validate(state);return result.ok?success(state):result;}
 restore(state){return this.session.replace(state);}
}
