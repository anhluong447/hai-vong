import {element as el} from '../dom.js';
import {menuMotion as config} from '../../../content/ui/coastal-menu-motion.js';

const art=name=>new URL(`../../../assets/ui/coastal/${name}`,import.meta.url).href;
const unit=value=>`${value/config.stage[0]*100}cqi`;
const tau=Math.PI*2;

/** One small presentation clock. Gameplay, saves and input never wait on it. */
export class MenuEffects {
  constructor(root){
    this.root=root;this.time=0;this.visible=false;this.frozen=false;this.manualReduced=false;
    this.disposed=false;this.handle=null;this.last=null;this.frames=[];this.transitions=new Set();
    this.media=matchMedia('(prefers-reduced-motion: reduce)');
    this.waveRoot=root.querySelector('.menu-plane-wave');
    this.waveRoot.style.inset='auto 0 0';this.waveRoot.style.height=unit(config.stage[1]-config.waveTop);
    this.waveRoot.firstElementChild.classList.add('menu-wave-static');
    this.layers=config.waves.map(layer=>{
      const drift=el('div',{class:'menu-wave-drift'});
      drift.style.backgroundImage=`url("${art(`menu-wave-${layer.id}-tile.png`)}")`;
      const node=el('div',{class:'menu-wave-layer','data-layer':layer.id},drift);
      node.style.maskImage=`url("${art(`menu-wave-${layer.id}-mask.png`)}")`;
      node.style.height=unit(config.stage[1]-config.waveTop);
      drift.style.backgroundSize=`${unit(config.tile[0])} ${unit(config.tile[1])}`;
      let sparkle=null;
      if(layer.id==='foam'){
        sparkle=drift.cloneNode();sparkle.classList.add('menu-wave-sparkle');node.append(sparkle);
      }
      this.waveRoot.append(node);return {node,drift,sparkle,definition:layer};
    });
    this.canopy=el('div',{class:'menu-top-foliage','aria-hidden':'true'},el('img',{src:art('menu-top-leaves-context.png'),alt:''}));
    const [canopyX,canopyY,canopyW,canopyH]=config.canopyBox;
    this.canopy.style.left=unit(canopyX);this.canopy.style.top=unit(canopyY);this.canopy.style.width=unit(canopyW);this.canopy.style.height=unit(canopyH);
    root.append(this.canopy);
    this.foliage=config.foliage.map(item=>({definition:item,
      node:item.id==='flowers'?root.querySelector('.menu-foreground-flowers'):this.canopy.firstElementChild}));
    for(const {node,definition} of this.foliage)node.style.transformOrigin=definition.origin;
    this.lightRoot=el('div',{class:'menu-ambient-light','aria-hidden':'true'});
    this.sprites=config.sprites.map((definition,index)=>{
      const node=el('i',{class:`menu-ambient-sprite menu-${definition.kind}`,'data-sprite':String(index)});
      node.style.left=`${definition.x/config.stage[0]*100}%`;
      node.style.top=`${definition.y/config.stage[1]*100}%`;
      node.style.width=unit(definition.size);node.style.height=unit(definition.size);
      this.lightRoot.append(node);return {node,definition,index};
    });
    root.querySelector('.menu-plane-scene').after(this.lightRoot);
    this.sync=()=>{
      root.dataset.menuReduced=String(this.reduced);
      this.onReduced?.(this.reduced);
      if(this.reduced||document.hidden||!this.visible||this.frozen)this.stop();else this.start();
      if(this.reduced)this.paint(0);
    };
    this.media.addEventListener('change',this.sync);document.addEventListener('visibilitychange',this.sync);
    this.observer=new IntersectionObserver(entries=>{
      this.visible=entries.at(-1).isIntersecting;this.sync();
    });this.observer.observe(root);
    const files=['menu-wave-safe-mask.png','menu-top-leaves-mask.png','menu-top-leaves-context.png',...config.waves.flatMap(item=>[
      `menu-wave-${item.id}-mask.png`,`menu-wave-${item.id}-tile.png`])];
    this.ready=Promise.all(files.map(async name=>{const image=new Image();image.src=art(name);await image.decode();})).then(()=>{
      if(this.disposed)return;this.loaded=true;root.dataset.effectsReady='true';this.paint(0);this.sync();
    });
    this.sync();
  }
  get reduced(){return this.captureReduced??(this.manualReduced||this.media.matches);}
  setReduced(value){this.manualReduced=Boolean(value);this.captureReduced=null;this.sync();}
  start(){
    if(this.handle!==null||!this.loaded||this.disposed)return;
    this.last=null;
    const tick=now=>{
      this.handle=null;
      if(this.disposed||this.reduced||this.frozen||document.hidden||!this.visible)return;
      if(this.last!==null){const delta=now-this.last;this.frames.push(delta);if(this.frames.length>720)this.frames.shift();this.time+=Math.min(delta,64);}
      this.last=now;this.paint(this.time);this.handle=requestAnimationFrame(tick);
    };
    this.handle=requestAnimationFrame(tick);
  }
  stop(){if(this.handle!==null)cancelAnimationFrame(this.handle);this.handle=null;this.last=null;}
  freeze(time,{reduced=false}={}){
    this.frozen=true;this.captureReduced=reduced;this.stop();this.time=time;
    this.root.dataset.menuReduced=String(this.reduced);this.cancelFeedback();this.paint(time);
    return this.snapshot();
  }
  resume(){this.frozen=false;this.captureReduced=null;this.sync();}
  paint(time){
    const reduced=this.reduced;
    const minimumDy=config.rightLimit.y-config.rightLimit.nativeAlphaTop+1;
    this.wavePositions=[];
    for(const {node,drift,sparkle,definition:d} of this.layers){
      const phase=tau*time/d.periodMs+d.phase;
      const y=reduced?0:Math.max(minimumDy,Math.min(d.amplitudeY,Math.sin(phase)*d.amplitudeY));
      const x=reduced?0:Math.sin(phase+d.phase)*d.amplitudeX;
      node.style.transform=`translateY(${unit(y)})`;
      drift.style.transform=`translateX(${unit(x)})`;
      if(sparkle){sparkle.style.transform=drift.style.transform;sparkle.style.opacity=reduced?'0':String(.045+.035*(.5+.5*Math.sin(tau*time/9300)));}
      this.wavePositions.push({id:d.id,x,y});
    }
    for(const {node,definition:d} of this.foliage){
      const angle=reduced?0:Math.sin(tau*time/d.periodMs+d.phase)*d.degrees;
      node.style.transform=`rotate(${angle}deg)`;
    }
    for(const {node,definition:d,index} of this.sprites){
      const phase=tau*time/d.periodMs+d.phase;
      // Independent seeded placements / pulse phases; the fixed pool is reused.
      const pulse=Math.max(0,Math.sin(phase));
      const random=Math.sin((Math.floor(phase/tau)*23+index*17+19)*12.9898)*43758.5453;
      const strength=.65+.35*(random-Math.floor(random));
      node.style.opacity=reduced?'0':String(d.kind==='glint'?Math.pow(pulse,9)*.48*strength:pulse*.24);
      const x=d.kind==='glint'?Math.sin(phase)*2:Math.sin(phase)*7;
      const y=d.kind==='glint'?0:Math.cos(phase)*12;
      node.style.transform=`translate(${unit(x)},${unit(y)})`;
    }
  }
  selectFeedback(button,glider){
    this.cancelFeedback();
    const d=config.feedback,duration=this.reduced?d.reducedDurationMs:d.durationMs;
    const play=(node,frames)=>{
      const animation=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});
      this.transitions.add(animation);animation.finished.catch(()=>{}).finally(()=>this.transitions.delete(animation));
    };
    if(this.reduced){play(glider.firstElementChild,[{opacity:.5},{opacity:1}]);return;}
    play(glider.firstElementChild,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}]);
    play(button.querySelector('.menu-nav-label'),[{transform:`translateX(${unit(-d.textTravelPx)})`},{transform:'translateX(0)'}]);
    play(button.querySelector('.menu-nav-tab-icon'),[{transform:'scale(1)'},{transform:`scale(${d.iconScale})`,offset:.45},{transform:'scale(1)'}]);
  }
  cancelFeedback(){for(const handle of this.transitions)handle.cancel();this.transitions.clear();}
  snapshot(){return {timeMs:this.time,reduced:this.reduced,visible:this.visible,running:this.handle!==null,
    waves:this.wavePositions,spriteCount:this.sprites.length,longestPeriodMs:config.longestPeriodMs,
    rightLimit:config.rightLimit,fixedSafeMask:true};}
  performanceSummary(){
    const samples=[...this.frames].sort((a,b)=>a-b);
    const percentile=p=>samples[Math.min(samples.length-1,Math.floor(samples.length*p))]||0;
    const mean=samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length);
    return {samples:samples.length,meanFrameMs:mean,p95FrameMs:percentile(.95),estimatedFps:mean?1000/mean:0};
  }
  dispose(){
    this.disposed=true;this.stop();this.cancelFeedback();this.observer.disconnect();
    this.media.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);
  }
}
