import {success} from '../contracts/Diagnostic.js';
export class StoryRunner {
 constructor(session){this.session=session;}
 step(intent){const result=this.session.execute({type:'story.step',intent});return result.ok?success(result.value.state):result;}
}
