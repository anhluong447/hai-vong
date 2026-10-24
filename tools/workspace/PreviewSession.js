import {GameSession} from '../../src/application/GameSession.js';
import {StoryRunner} from '../../src/application/StoryRunner.js';
import {diagnostic,failure} from '../../src/contracts/Diagnostic.js';
export class PreviewSession {
 start(bundle,fixture,effects={}){this.stop();this.session=new GameSession({bundle,effects,initialState:fixture.snapshot});this.runner=new StoryRunner(this.session);return fixture.snapshot?{ok:true,value:this.session.snapshot()}:this.step({type:'start',chapterId:fixture.chapterId});}
 step(intent){return this.runner?this.runner.step(intent):failure(diagnostic('preview.stopped','preview','/'));}
 snapshot(){return this.session?.snapshot()??null;}
 stop(){this.runner=null;this.session=null;}
}
