/** Presentation-only animations; never schedules gameplay actions. */
export class MotionScope {
  constructor(node) {
    this.node=node;this.handles=new Set();this.media=matchMedia('(prefers-reduced-motion: reduce)');
    this.sync=()=>{
      node.dataset.motion=this.media.matches?'reduced':'full';
      node.dataset.hidden=String(document.hidden);
      for(const animation of this.handles){
        if(this.media.matches)animation.cancel();
        else if(document.hidden)animation.pause();else animation.play();
      }
    };
    this.media.addEventListener('change',this.sync);document.addEventListener('visibilitychange',this.sync);this.sync();
  }
  play(node,frames,{duration=260,...options}={}) {
    if(this.media.matches||document.hidden)return null;
    const animation=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)',...options});
    this.handles.add(animation);
    animation.finished.catch(()=>{}).finally(()=>this.handles.delete(animation));return animation;
  }
  cancel(){for(const animation of this.handles)animation.cancel();this.handles.clear();}
  dispose(){this.cancel();this.media.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);}
}
