import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
import {TextView} from '../presentation/ui/TextView.js';
const bad=()=>failure(diagnostic('save.presentation.invalid','snapshot','/presentation/view'));
/** Prepare replacement browser owners off-screen. Commit never awaits browser I/O. */
export function runtimeCheckpoint({read,write,create,freeze,thaw,captureUI,restoreUI,line,text,speed,document}){
 const dispose=async ports=>{ports.world.dispose();ports.sequence.cancel();await ports.audio.dispose();};
 return {
  pause:freeze,resume:thaw,
  capture(guard){const ports=read();return {
   presentation:{view:{world:ports.world.snapshot(),text:line.snapshot(),ui:captureUI()}},
   audio:{...ports.audio.snapshot(),paused:guard.audioPaused},sequence:{...ports.sequence.snapshot(),paused:guard.sequencePaused}
  };},
  async prepare(state){
   const next=create(),previous=read(),uiBefore=captureUI(),textBefore=line.snapshot();let ready=false;
   try{
    const saved=state.presentation.view,world=saved?.world??{sceneId:state.world.sceneId,elapsed:0,cameraX:0,actors:{}},ui=saved?.ui??{paused:false};
    if(!ui||typeof ui.paused!=='boolean'||world.sceneId!==state.world.sceneId)return bad();
    if(world.sceneId){const loaded=await next.world.restore(world);if(!loaded.ok)return loaded;}
    else if(world.elapsed!==0||world.cameraX!==0||Object.keys(world.actors??{}).length)return bad();
    const pending=state.world.pending??state.story.pending;
    if(pending){const loaded=await next.world.prepare(pending.sceneId);if(!loaded.ok)return loaded;}
    if(Object.keys(state.sequence).length){const restored=next.sequence.restore(state.sequence);if(!restored.ok)return restored;}
    if(state.audio.intent){next.audio.pause();const restored=await next.audio.play(state.audio.intent.cueId,{offset:state.audio.intent.offset});if(!restored.ok)return restored;}
    else if(Object.keys(state.audio).length){const restored=await next.audio.restore({...state.audio,paused:true});if(!restored.ok)return restored;}
    const dialogue=state.presentation.dialogue,viewText=saved?.text??(dialogue?{key:dialogue.textKey,params:dialogue.params,revealed:dialogue.revealed}:null);
    if(state.story.waiting==='say'&&(!viewText||viewText.key!==dialogue?.textKey||JSON.stringify(viewText.params)!==JSON.stringify(dialogue.params)||Math.floor(viewText.revealed)!==dialogue.revealed))return bad();
    if(viewText){const detached=new TextView(document.createElement('p'),{text,speed});const checked=detached.restore(viewText);detached.dispose();if(!checked.ok)return checked;}
    ready=true;return success({next,previous,ui,viewText,uiBefore,textBefore,audioPaused:state.audio.paused??false,sequencePaused:state.sequence.paused??false});
   }catch{return bad();}finally{if(!ready)await dispose(next);}
  },
  commit(token){token.next.audio.paused=token.audioPaused;write(token.next);restoreUI(token.ui,token.viewText);},
  rollback(token){write(token.previous);restoreUI(token.uiBefore,token.textBefore);},
  async finalize(token){await dispose(token.previous);},
  async abort(token){await dispose(token.next);}
 };
}
