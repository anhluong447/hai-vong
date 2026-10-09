const DEFAULT_KEYS = Object.freeze({w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'});

/** Browser input lifecycle, independent of movement and Canvas drawing. */
export class PixelInput {
  constructor(world,{keyMap=DEFAULT_KEYS,windowTarget=window,documentTarget=document}={}) {
    this.world=world;this.windowTarget=windowTarget;this.documentTarget=documentTarget;
    this.keydown=event=>{
      if(world.blocked||/INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName))return;
      const direction=keyMap[event.key]||keyMap[event.key.toLowerCase()];
      if(direction){event.preventDefault();world.keys.add(direction);world.path=[];world.target=null;}
      if(['e','E','Enter',' '].includes(event.key)&&!event.repeat){event.preventDefault();world.interact();}
    };
    this.keyup=event=>world.keys.delete(keyMap[event.key]||keyMap[event.key.toLowerCase()]);
    this.blur=()=>world.clearInput();
    this.pointerdown=event=>world.click(event);
    windowTarget.addEventListener('keydown',this.keydown);
    windowTarget.addEventListener('keyup',this.keyup);
    windowTarget.addEventListener('blur',this.blur);
    documentTarget.addEventListener('visibilitychange',this.blur);
    world.canvas.addEventListener('pointerdown',this.pointerdown);
  }
  dispose() {
    const {world,windowTarget,documentTarget}=this;
    windowTarget.removeEventListener('keydown',this.keydown);
    windowTarget.removeEventListener('keyup',this.keyup);
    windowTarget.removeEventListener('blur',this.blur);
    documentTarget.removeEventListener('visibilitychange',this.blur);
    world.canvas.removeEventListener('pointerdown',this.pointerdown);
    world.clearInput();
  }
}
