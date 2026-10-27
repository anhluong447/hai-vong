import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {validAnimationState} from '../../contracts/PresentationSnapshot.js';
const bad=()=>failure(diagnostic('animation.state.invalid','animation','/'));
export class AnimationPlayer {
 constructor(catalog){this.catalog=catalog;this.state=null;this.disposed=false;}
 play(id){const clip=this.catalog.get('animations',id);if(this.disposed||!clip.ok)return bad();this.clip=clip.value;this.state={id,elapsed:0,paused:false,status:'playing'};return success(this.snapshot());}
 update(delta){if(!this.state||this.state.paused||this.state.status!=='playing'||!Number.isFinite(delta)||delta<0)return;
  const total=this.clip.frames.reduce((sum,f)=>sum+f.duration,0);this.state.elapsed+=delta;
  if(this.clip.loop)this.state.elapsed%=total;else if(this.state.elapsed>=total){this.state.elapsed=total;this.state.status='complete';}
 }
 frame(){if(!this.state)return null;let time=this.state.elapsed;for(const f of this.clip.frames){if(time<f.duration-1e-10)return f;time-=f.duration;}return this.clip.frames.at(-1);}
 seekDistance(travelled,cycleDistance){if(!this.state||!Number.isFinite(travelled)||travelled<0||!Number.isFinite(cycleDistance)||cycleDistance<=0)return bad();const total=this.clip.frames.reduce((sum,f)=>sum+f.duration,0);this.state.elapsed=(travelled%cycleDistance)/cycleDistance*total;return success(this.snapshot());}
 pause(){if(this.state)this.state.paused=true;}
 resume(){if(this.state)this.state.paused=false;}
 snapshot(){return structuredClone(this.state);}
 restore(state){if(this.disposed||!validAnimationState(state,this.catalog))return bad();this.clip=this.catalog.get('animations',state.id).value;this.state=structuredClone(state);return success(this.snapshot());}
 dispose(){this.disposed=true;this.state=null;this.clip=null;}
}
