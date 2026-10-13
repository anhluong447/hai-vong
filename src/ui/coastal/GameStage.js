import {element as el} from '../dom.js';

/** One design plane for the world and every player-facing overlay. */
export class GameStage {
  constructor(app) {
    document.documentElement.classList.add('game-page');
    app.classList.add('single-screen');
    this.node=el('div',{class:'game-stage'});
    this.viewport=el('div',{class:'game-viewport'},this.node);
    app.append(this.viewport);
    this.resize=()=>{
      const vw=window.innerWidth||this.viewport.clientWidth||1672;
      const vh=window.innerHeight||this.viewport.clientHeight||941;
      const scale=Math.min(vw/1672,vh/941);
      this.node.style.setProperty('--stage-scale',scale);
    };
    this.observer=new ResizeObserver(this.resize);
    this.observer.observe(this.viewport);
    window.addEventListener('resize',this.resize);
    this.interval=setInterval(this.resize,30);
    this.resize();
  }
  dispose(){
    clearInterval(this.interval);
    window.removeEventListener('resize',this.resize);
    this.observer.disconnect();
    this.viewport.remove();
    document.documentElement.classList.remove('game-page');
  }
}
